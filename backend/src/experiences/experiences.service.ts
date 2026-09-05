import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ExperiencesRepository } from './experiences.repository';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';

@Injectable()
export class ExperiencesService {
  constructor(private readonly experiencesRepository: ExperiencesRepository) {}

  async create(userId: string, dto: CreateExperienceDto) {
    return this.experiencesRepository.create(userId, dto);
  }

  async getMyExperiences(userId: string) {
    return this.experiencesRepository.findByUserId(userId);
  }

  async update(userId: string, id: string, dto: UpdateExperienceDto) {
    const experience = await this.experiencesRepository.findById(id);
    if (!experience) {
      throw new NotFoundException('Experiencia no encontrada');
    }
    if (experience.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para modificar esta experiencia');
    }
    return this.experiencesRepository.update(id, dto);
  }

  async delete(userId: string, id: string) {
    const experience = await this.experiencesRepository.findById(id);
    if (!experience) {
      throw new NotFoundException('Experiencia no encontrada');
    }
    if (experience.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para eliminar esta experiencia');
    }
    return this.experiencesRepository.delete(id);
  }
}
