import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CredentialsRepository } from './credentials.repository';
import { CreateCredentialDto } from './dto/create-credential.dto';

@Injectable()
export class CredentialsService {
  constructor(private readonly credentialsRepository: CredentialsRepository) {}

  async create(userId: string, dto: CreateCredentialDto) {
    return this.credentialsRepository.create(userId, dto);
  }

  async getMyCredentials(userId: string) {
    return this.credentialsRepository.findByUserId(userId);
  }

  async delete(userId: string, id: string) {
    const credential = await this.credentialsRepository.findById(id);
    if (!credential) {
      throw new NotFoundException('Credencial no encontrada');
    }
    if (credential.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para eliminar esta credencial');
    }
    return this.credentialsRepository.delete(id);
  }
}
