import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProposalDto } from './dto/create-proposal.dto';

@Injectable()
export class ProposalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByJobRequestIdAndWorkerId(jobRequestId: string, workerId: string) {
    return this.prisma.proposal.findUnique({
      where: {
        jobRequestId_workerId: {
          jobRequestId,
          workerId,
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.proposal.findUnique({
      where: { id },
      include: {
        jobRequest: {
          include: {
            user: true,
          },
        },
        worker: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            workerRatingAvg: true,
            workerRatingCnt: true,
          },
        },
      },
    });
  }

  async create(workerId: string, dto: CreateProposalDto) {
    return this.prisma.withTransaction(async tx => {
      const request = await tx.jobRequest.findUnique({ where: { id: dto.jobRequestId } });
      if (!request || request.status !== 'OPEN' || request.userId === workerId) {
        throw new ConflictException('La solicitud ya no permite esta propuesta.');
      }
      const proposal = await tx.proposal.create({
      data: {
        workerId,
        jobRequestId: dto.jobRequestId,
        price: dto.price,
        message: dto.message,
        estimatedDays: dto.estimatedDays,
      },
      include: {
        worker: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            workerRatingAvg: true,
            workerRatingCnt: true,
          },
        },
      },
      });
      await tx.notification.create({ data: { userId: request.userId, type: 'NEW_PROPOSAL', title: 'Nueva propuesta recibida', message: 'Un profesional envió una propuesta para tu solicitud.', data: { jobRequestId: request.id, proposalId: proposal.id } } });
      return proposal;
    });
  }

  async findMyProposals(workerId: string) {
    return this.prisma.proposal.findMany({
      where: { workerId },
      include: {
        jobRequest: {
          include: {
            category: true,
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        workOrder: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Transacción atómica de Prisma para aceptar propuesta y formalizar WorkOrder:
   * 1. Proposal -> ACCEPTED
   * 2. JobRequest -> ASSIGNED
   * 3. WorkOrder -> CREATE
   * 4. Otras Proposal -> REJECTED
   */
  async acceptProposalTransaction(
    proposalId: string,
    jobRequestId: string,
    clientId: string,
    workerId: string,
    agreedPrice: number,
  ) {
    return this.prisma.withTransaction(async (tx) => {
      const claimed = await tx.jobRequest.updateMany({
        where: { id: jobRequestId, userId: clientId, status: 'OPEN' },
        data: { status: 'ASSIGNED' },
      });
      if (claimed.count !== 1) throw new ConflictException('Esta solicitud ya fue asignada o cerrada.');
      const accepted = await tx.proposal.updateMany({
        where: { id: proposalId, jobRequestId, workerId, status: 'PENDING' },
        data: { status: 'ACCEPTED' },
      });
      if (accepted.count !== 1) throw new ConflictException('Esta propuesta ya no está pendiente.');
      const acceptedProposal = await tx.proposal.findUniqueOrThrow({ where: { id: proposalId } });

      // 3. Crear la WorkOrder vinculando cliente, trabajador, solicitud y propuesta
      const workOrder = await tx.workOrder.create({
        data: {
          jobRequestId,
          proposalId,
          clientId,
          workerId,
          agreedPrice,
          status: 'IN_PROGRESS',
        },
        include: {
          client: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          worker: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          jobRequest: true,
        },
      });

      // 4. Rechazar automáticamente las demás propuestas de esta solicitud
      await tx.proposal.updateMany({
        where: {
          jobRequestId,
          id: { not: proposalId },
          status: 'PENDING',
        },
        data: { status: 'REJECTED' },
      });

      // 5. Generar notificación para el trabajador ganador
      await tx.notification.create({
        data: {
          userId: workerId,
          type: 'PROPOSAL_ACCEPTED',
          title: '¡Tu propuesta fue aceptada!',
          message: `El cliente ha aceptado tu propuesta. Se ha generado la orden de trabajo.`,
          data: { workOrderId: workOrder.id, jobRequestId },
        },
      });

      return {
        proposal: acceptedProposal,
        workOrder,
      };
    });
  }
}
