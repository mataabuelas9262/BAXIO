import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      // Un perfil público debe seleccionar explícitamente sus campos: `include`
      // devolvería también teléfono y redes sociales del profesional.
      select: {
        id: true,
        fullName: true,
        professionalHeadline: true,
        avatarUrl: true,
        bio: true,
        location: true,
        serviceArea: true,
        experienceYears: true,
        workerRatingAvg: true,
        workerRatingCnt: true,
        clientRatingAvg: true,
        clientRatingCnt: true,
        createdAt: true,
        credentials: {
          select: {
            id: true,
            type: true,
            title: true,
            issuer: true,
            issueDate: true,
            expiryDate: true,
            credentialId: true,
            status: true,
            verifiedAt: true,
            createdAt: true,
            // evidenceUrl se omite explícitamente para proteger la privacidad documental
          },
          orderBy: { createdAt: 'desc' },
        },
        experiences: {
          orderBy: { startYear: 'desc' },
        },
        services: {
          where: { status: 'ACTIVE' },
          include: {
            category: true,
            images: true,
          },
        },
        portfolioItems: true,
        receivedReviews: {
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async findWorkers(query?: string, location?: string) {
    return this.prisma.user.findMany({
      where: {
        services: {
          some: {
            status: 'ACTIVE',
            ...(query
              ? {
                  OR: [
                    { title: { contains: query } },
                    { description: { contains: query } },
                  ],
                }
              : {}),
          },
        },
        ...(location
          ? {
              OR: [
                { location: { contains: location } },
                { serviceArea: { contains: location } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        fullName: true,
        professionalHeadline: true,
        avatarUrl: true,
        bio: true,
        location: true,
        serviceArea: true,
        experienceYears: true,
        workerRatingAvg: true,
        workerRatingCnt: true,
        credentials: {
          where: { status: 'VERIFIED' },
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
          },
        },
        services: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            title: true,
            pricingType: true,
            price: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { workerRatingAvg: 'desc' },
      take: 20,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        fullName: true,
        professionalHeadline: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        location: true,
        serviceArea: true,
        experienceYears: true,
        role: true,
        workerRatingAvg: true,
        workerRatingCnt: true,
        clientRatingAvg: true,
        clientRatingCnt: true,
        updatedAt: true,
      },
    });
  }
}
