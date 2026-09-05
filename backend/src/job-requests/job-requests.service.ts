import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JobRequestsRepository } from './job-requests.repository';
import { CreateJobRequestDto } from './dto/create-job-request.dto';
import { FilterJobRequestsDto } from './dto/filter-job-requests.dto';
import { UpdateJobRequestDto } from './dto/update-job-request.dto';

@Injectable()
export class JobRequestsService {
  constructor(private readonly jobRequestsRepo: JobRequestsRepository) {}

  private normalizeRequiredText(value: string, field: string) {
    const normalized = value.trim();
    if (!normalized) {
      throw new BadRequestException(`${field} no puede estar vacío`);
    }
    return normalized;
  }

  private validateBudgetRange(budgetMin?: number, budgetMax?: number) {
    if (
      budgetMin !== undefined &&
      budgetMax !== undefined &&
      budgetMin > budgetMax
    ) {
      throw new BadRequestException(
        'El presupuesto mínimo no puede ser mayor al presupuesto máximo',
      );
    }
  }

  async getAllJobRequests(filter: FilterJobRequestsDto) {
    return this.jobRequestsRepo.findAll(filter);
  }

  async getJobRequestById(id: string) {
    const jobRequest = await this.jobRequestsRepo.findById(id);
    if (!jobRequest) {
      throw new NotFoundException('Solicitud de trabajo no encontrada');
    }
    const { exactAddress, ...publicJobRequest } = jobRequest;
    return publicJobRequest;
  }

  async getJobRequestForEditing(id: string, userId: string) {
    const jobRequest = await this.jobRequestsRepo.findById(id);
    if (!jobRequest) throw new NotFoundException('Solicitud de trabajo no encontrada');
    if (jobRequest.userId !== userId) {
      throw new ForbiddenException('Solo puedes editar tus propias solicitudes');
    }
    return jobRequest;
  }

  async createJobRequest(userId: string, dto: CreateJobRequestDto) {
    const normalizedDto: CreateJobRequestDto = {
      ...dto,
      title: this.normalizeRequiredText(dto.title, 'El título'),
      description: this.normalizeRequiredText(dto.description, 'La descripción'),
      categoryId: this.normalizeRequiredText(dto.categoryId, 'La categoría'),
      location: this.normalizeRequiredText(dto.location, 'La ubicación'),
      exactAddress: dto.exactAddress?.trim() || undefined,
    };
    this.validateBudgetRange(normalizedDto.budgetMin, normalizedDto.budgetMax);
    return this.jobRequestsRepo.create(userId, normalizedDto);
  }

  async updateJobRequest(id: string, userId: string, dto: UpdateJobRequestDto) {
    const jobRequest = await this.jobRequestsRepo.findById(id);
    if (!jobRequest) throw new NotFoundException('Solicitud de trabajo no encontrada');
    if (jobRequest.userId !== userId) {
      throw new ForbiddenException('Solo puedes editar tus propias solicitudes');
    }
    if (
      jobRequest.status !== 'OPEN' ||
      jobRequest.workOrder ||
      jobRequest.proposals.some((proposal) => proposal.status === 'ACCEPTED')
    ) {
      throw new BadRequestException('No puedes editar una solicitud que ya tiene una contratación');
    }
    const normalizedDto: UpdateJobRequestDto = {
      ...dto,
      ...(dto.title !== undefined
        ? { title: this.normalizeRequiredText(dto.title, 'El título') }
        : {}),
      ...(dto.description !== undefined
        ? { description: this.normalizeRequiredText(dto.description, 'La descripción') }
        : {}),
      ...(dto.categoryId !== undefined
        ? { categoryId: this.normalizeRequiredText(dto.categoryId, 'La categoría') }
        : {}),
      ...(dto.location !== undefined
        ? { location: this.normalizeRequiredText(dto.location, 'La ubicación') }
        : {}),
      ...(dto.exactAddress !== undefined ? { exactAddress: dto.exactAddress.trim() } : {}),
    };
    this.validateBudgetRange(
      normalizedDto.budgetMin ?? (jobRequest.budgetMin === null ? undefined : Number(jobRequest.budgetMin)),
      normalizedDto.budgetMax ?? (jobRequest.budgetMax === null ? undefined : Number(jobRequest.budgetMax)),
    );
    return this.jobRequestsRepo.update(id, normalizedDto);
  }

  async deleteJobRequest(id: string, userId: string) {
    const jobRequest = await this.jobRequestsRepo.findById(id);
    if (!jobRequest) throw new NotFoundException('Solicitud de trabajo no encontrada');
    if (jobRequest.userId !== userId) throw new ForbiddenException('Solo puedes eliminar tus propias solicitudes');
    if (jobRequest.status !== 'OPEN' || jobRequest.workOrder || jobRequest.proposals.some((proposal) => proposal.status === 'ACCEPTED')) {
      throw new BadRequestException('No puedes eliminar una solicitud que ya tiene una contratación o propuesta aceptada');
    }
    await this.jobRequestsRepo.delete(id);
    return { message: 'Solicitud eliminada' };
  }
}
