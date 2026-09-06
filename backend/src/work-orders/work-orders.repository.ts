import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkOrderStatus } from '@prisma/client';

@Injectable()
export class WorkOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMyWorkOrders(userId: string) {
    return this.prisma.workOrder.findMany({
      where: {
        OR: [{ clientId: userId }, { workerId: userId }],
      },
      include: {
        jobRequest: {
          include: {
            category: true,
          },
        },
        client: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            phone: true,
            whatsapp: true,
            telegram: true,
            instagram: true,
            facebook: true,
            clientRatingAvg: true,
          },
        },
        worker: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            phone: true,
            whatsapp: true,
            telegram: true,
            instagram: true,
            facebook: true,
            workerRatingAvg: true,
          },
        },
        reviews: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.workOrder.findUnique({
      where: { id },
      include: {
        jobRequest: {
          include: {
            category: true,
          },
        },
        client: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            phone: true,
            whatsapp: true,
            telegram: true,
            instagram: true,
            facebook: true,
            location: true,
          },
        },
        worker: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            phone: true,
            whatsapp: true,
            telegram: true,
            instagram: true,
            facebook: true,
            location: true,
          },
        },
        reviews: {
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: WorkOrderStatus, expectedStatus: WorkOrderStatus) {
    const changed = await this.prisma.workOrder.updateMany({
      where: { id, status: expectedStatus },
      data: {
        status,
        ...(status === 'COMPLETION_PENDING' && { completionRequestedAt: new Date() }),
        ...(status === 'COMPLETED' && { completedDate: new Date() }),
      },
    });
    if (changed.count !== 1) throw new ConflictException('La orden cambió mientras la actualizabas. Recarga para ver su estado.');
    return this.findById(id);
  }
}
