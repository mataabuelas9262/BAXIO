import { Injectable } from '@nestjs/common';
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
    return this.prisma.proposal.create({
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
    return this.prisma.$transaction(async (tx) => {
      // 1. Aceptar la propuesta ganadora
      const acceptedProposal = await tx.proposal.update({
        where: { id: proposalId },
        data: { status: 'ACCEPTED' },
      });

      // 2. Cerrar la solicitud y marcarla como asignada
      await tx.jobRequest.update({
        where: { id: jobRequestId },
        data: { status: 'ASSIGNED' },
      });

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
