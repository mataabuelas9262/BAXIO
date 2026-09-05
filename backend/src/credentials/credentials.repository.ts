import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCredentialDto } from './dto/create-credential.dto';

@Injectable()
export class CredentialsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCredentialDto) {
    return this.prisma.credential.create({
      data: {
        userId,
        type: dto.type,
        title: dto.title,
        issuer: dto.issuer,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        credentialId: dto.credentialId,
        evidenceUrl: dto.evidenceUrl,
        status: 'PENDING', // Siempre inicia como PENDING hasta verificación de BAXIO
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.credential.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.credential.findUnique({
      where: { id },
    });
  }

  async delete(id: string) {
    return this.prisma.credential.delete({
      where: { id },
    });
  }
}
