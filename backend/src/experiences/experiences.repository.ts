import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';

@Injectable()
export class ExperiencesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateExperienceDto) {
    return this.prisma.experience.create({
      data: {
        userId,
        roleTitle: dto.roleTitle,
        companyName: dto.isFreelance ? null : dto.companyName,
        isFreelance: dto.isFreelance || false,
        startYear: dto.startYear,
        endYear: dto.isCurrent ? null : dto.endYear,
        isCurrent: dto.isCurrent || false,
        description: dto.description,
      },
    });
  }

  async update(id: string, dto: UpdateExperienceDto) {
    return this.prisma.experience.update({
      where: { id },
      data: {
        ...(dto.roleTitle !== undefined && { roleTitle: dto.roleTitle }),
        ...(dto.isFreelance !== undefined && {
          isFreelance: dto.isFreelance,
          companyName: dto.isFreelance ? null : dto.companyName,
        }),
        ...(dto.companyName !== undefined && !dto.isFreelance && { companyName: dto.companyName }),
        ...(dto.startYear !== undefined && { startYear: dto.startYear }),
        ...(dto.isCurrent !== undefined && {
          isCurrent: dto.isCurrent,
          endYear: dto.isCurrent ? null : dto.endYear,
        }),
        ...(dto.endYear !== undefined && !dto.isCurrent && { endYear: dto.endYear }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.experience.findMany({
      where: { userId },
      orderBy: { startYear: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.experience.findUnique({
      where: { id },
    });
  }

  async delete(id: string) {
    return this.prisma.experience.delete({
      where: { id },
    });
  }
}
