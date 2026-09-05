import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ProposalsRepository } from './proposals.repository';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProposalDto } from './dto/create-proposal.dto';

@Injectable()
export class ProposalsService {
  constructor(
    private readonly proposalsRepo: ProposalsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async createProposal(workerId: string, dto: CreateProposalDto) {
    const jobRequest = await this.prisma.jobRequest.findUnique({
      where: { id: dto.jobRequestId },
    });

    if (!jobRequest) {
      throw new NotFoundException('La solicitud de trabajo no existe');
    }

    if (jobRequest.status !== 'OPEN') {
      throw new BadRequestException('Esta solicitud de trabajo ya no está recibiendo propuestas');
    }

    if (jobRequest.userId === workerId) {
      throw new BadRequestException('No puedes postularte a tu propia solicitud de trabajo');
    }

    const existingProposal = await this.proposalsRepo.findByJobRequestIdAndWorkerId(
      dto.jobRequestId,
      workerId,
    );

    if (existingProposal) {
      throw new ConflictException('Ya has enviado una propuesta a esta solicitud de trabajo');
    }

    return this.proposalsRepo.create(workerId, dto);
  }

  async getMyProposals(workerId: string) {
    return this.proposalsRepo.findMyProposals(workerId);
  }

  async acceptProposal(proposalId: string, clientId: string) {
    const proposal = await this.proposalsRepo.findById(proposalId);

    if (!proposal) {
      throw new NotFoundException('Propuesta no encontrada');
    }

    if (proposal.jobRequest.userId !== clientId) {
      throw new ForbiddenException('Solo el cliente creador de la solicitud puede aceptar propuestas');
    }

    if (proposal.jobRequest.status !== 'OPEN') {
      throw new BadRequestException('Esta solicitud ya fue asignada o no está abierta');
    }

    if (proposal.status !== 'PENDING') {
      throw new BadRequestException('Solo se pueden aceptar propuestas en estado pendiente');
    }

    return this.proposalsRepo.acceptProposalTransaction(
      proposal.id,
      proposal.jobRequestId,
      clientId,
      proposal.workerId,
      Number(proposal.price),
    );
  }
}
