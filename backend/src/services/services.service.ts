import { normalizeImages } from '../uploads/uploads.storage';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ServicesRepository } from './services.repository';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { FilterServicesDto } from './dto/filter-services.dto';
import { Role } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private readonly servicesRepo: ServicesRepository) {}

  private normalizeRequiredText(value: string, field: string) {
    const normalized = value.trim();
    if (!normalized) throw new BadRequestException(`${field} no puede estar vacío`);
    return normalized;
  }

  async getAllServices(filter: FilterServicesDto) {
    return this.servicesRepo.findAll(filter);
  }

  async getServiceById(id: string) {
    const service = await this.servicesRepo.findById(id);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return service;
  }

  async createService(userId: string, dto: CreateServiceDto) {
    const images = await normalizeImages(userId, dto);
    return this.servicesRepo.create(userId, {
      ...dto,
      imageUrls: undefined,
      images,
      title: this.normalizeRequiredText(dto.title, 'El título'),
      description: this.normalizeRequiredText(dto.description, 'La descripción'),
      categoryId: this.normalizeRequiredText(dto.categoryId, 'La categoría'),
      location: this.normalizeRequiredText(dto.location, 'La ubicación'),
      serviceArea: dto.serviceArea?.trim() || undefined,
    });
  }

  async updateService(id: string, userId: string, dto: UpdateServiceDto) {
    const service = await this.servicesRepo.findById(id);
    if (!service) throw new NotFoundException('Servicio no encontrado');
    if (service.userId !== userId) throw new ForbiddenException('Solo puedes editar tus propios servicios');
    const images = await normalizeImages(userId, dto, service.images);
    return this.servicesRepo.update(id, {
      ...dto,
      imageUrls: undefined,
      images,
      ...(dto.title !== undefined ? { title: this.normalizeRequiredText(dto.title, 'El título') } : {}),
      ...(dto.description !== undefined ? { description: this.normalizeRequiredText(dto.description, 'La descripción') } : {}),
      ...(dto.categoryId !== undefined ? { categoryId: this.normalizeRequiredText(dto.categoryId, 'La categoría') } : {}),
      ...(dto.location !== undefined ? { location: this.normalizeRequiredText(dto.location, 'La ubicación') } : {}),
      ...(dto.serviceArea !== undefined ? { serviceArea: dto.serviceArea.trim() } : {}),
    });
  }

  async deleteService(id: string, userId: string, role: Role) {
    const service = await this.servicesRepo.findById(id);
    if (!service) throw new NotFoundException('Servicio no encontrado');
    const canModerate = role === Role.ADMIN || role === Role.MODERATOR;
    if (service.userId !== userId && !canModerate) throw new ForbiddenException('Solo puedes eliminar tus propios servicios');
    await this.servicesRepo.delete(id);
    return { message: canModerate && service.userId !== userId ? 'Servicio retirado por moderación' : 'Servicio eliminado' };
  }
}
