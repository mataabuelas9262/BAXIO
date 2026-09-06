import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(authorId: string, dto: CreateReviewDto) {
    return this.prisma.withTransaction(async (tx) => {
    // 1. Obtener la orden de trabajo
    const workOrder = await tx.workOrder.findUnique({
      where: { id: dto.workOrderId },
      include: {
        jobRequest: true,
      },
    });

    if (!workOrder) {
      throw new NotFoundException('Orden de trabajo no encontrada');
    }

    if (workOrder.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Solo se pueden emitir reseñas sobre trabajos finalizados y confirmados (COMPLETED)',
      );
    }

    // 2. Validar que el autor pertenezca a la orden
    const isClient = workOrder.clientId === authorId;
    const isWorker = workOrder.workerId === authorId;

    if (!isClient && !isWorker) {
      throw new ForbiddenException(
        'No tienes permiso para calificar esta orden de trabajo',
      );
    }

    const targetUserId = isClient ? workOrder.workerId : workOrder.clientId;
    const targetRole = isClient ? 'WORKER' : 'CLIENT';

    // 3. Validar unicidad (que no haya calificado ya)
    const existing = await tx.review.findUnique({
      where: {
        workOrderId_authorId: {
          workOrderId: dto.workOrderId,
          authorId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Ya has emitido una reseña para este trabajo');
    }

    // 4. Transacción Atómica: Guardar reseña y recalcular promedios

      const review = await tx.review.create({
        data: {
          workOrderId: dto.workOrderId,
          authorId,
          targetUserId,
          rating: dto.rating,
          comment: dto.comment?.trim() || null,
        },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Recalcular promedios para el targetUser
      // Todas las reseñas donde targetUser fue evaluado en este rol
      const targetUserOrdersAsWorker = await tx.workOrder.findMany({
        where: {
          workerId: targetUserId,
          status: 'COMPLETED',
        },
        select: { id: true },
      });

      const workerOrderIds = targetUserOrdersAsWorker.map((o) => o.id);

      const targetUserOrdersAsClient = await tx.workOrder.findMany({
        where: {
          clientId: targetUserId,
          status: 'COMPLETED',
        },
        select: { id: true },
      });

      const clientOrderIds = targetUserOrdersAsClient.map((o) => o.id);

      if (targetRole === 'WORKER') {
        const workerReviews = await tx.review.findMany({
          where: {
            targetUserId,
            workOrderId: { in: workerOrderIds },
          },
          select: { rating: true },
        });

        const count = workerReviews.length;
        const sum = workerReviews.reduce((acc, curr) => acc + curr.rating, 0);
        const avg = count > 0 ? Number((sum / count).toFixed(1)) : 0;

        await tx.user.update({
          where: { id: targetUserId },
          data: {
            workerRatingAvg: avg,
            workerRatingCnt: count,
          },
        });
      } else {
        const clientReviews = await tx.review.findMany({
          where: {
            targetUserId,
            workOrderId: { in: clientOrderIds },
          },
          select: { rating: true },
        });

        const count = clientReviews.length;
        const sum = clientReviews.reduce((acc, curr) => acc + curr.rating, 0);
        const avg = count > 0 ? Number((sum / count).toFixed(1)) : 0;

        await tx.user.update({
          where: { id: targetUserId },
          data: {
            clientRatingAvg: avg,
            clientRatingCnt: count,
          },
        });
      }

      // Notificación al receptor de la reseña
      await tx.notification.create({
        data: {
          userId: targetUserId,
          type: 'NEW_REVIEW',
          title: '¡Recibiste una nueva calificación!',
          message: `Te han calificado con ${dto.rating} estrellas por el trabajo "${workOrder.jobRequest?.title || 'Servicio'}"`,
          data: JSON.stringify({
            workOrderId: dto.workOrderId,
            rating: dto.rating,
          }),
        },
      });

      return review;
    });
  }

  async findByTargetUserId(targetUserId: string) {
    return this.prisma.review.findMany({
      where: { targetUserId },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        workOrder: {
          include: {
            jobRequest: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByWorkOrderId(workOrderId: string) {
    return this.prisma.review.findMany({
      where: { workOrderId },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }
}
