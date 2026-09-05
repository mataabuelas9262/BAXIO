import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobRequestDto } from './dto/create-job-request.dto';
import { FilterJobRequestsDto } from './dto/filter-job-requests.dto';
import { UpdateJobRequestDto } from './dto/update-job-request.dto';
import { Prisma } from '@prisma/client';
import { calculateDistanceKm } from '../common/utils/geo.utils';

@Injectable()
export class JobRequestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: FilterJobRequestsDto) {
    const where: Prisma.JobRequestWhereInput = {
      status: 'OPEN',
      ...(filter.categorySlug
        ? { category: { slug: filter.categorySlug } }
        : {}),
      ...(filter.query
        ? {
            OR: [
              { title: { contains: filter.query } },
              { description: { contains: filter.query } },
            ],
          }
        : {}),
      ...(filter.location
        ? { location: { contains: filter.location } }
        : {}),
    };

    const requests = await this.prisma.jobRequest.findMany({
      where,
      include: {
        category: true,
        images: true,
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            location: true,
            clientRatingAvg: true,
            clientRatingCnt: true,
          },
        },
        _count: {
          select: {
            proposals: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Sanitizar exactAddress para protección de privacidad
    let list = requests.map((jr) => {
      const { exactAddress, ...publicData } = jr;
      const distanceKm =
        filter.userLat && filter.userLng && jr.latitude && jr.longitude
          ? calculateDistanceKm(
              filter.userLat,
              filter.userLng,
              jr.latitude,
              jr.longitude,
            )
          : undefined;

      return {
        ...publicData,
        distanceKm,
      };
    });

    if (filter.userLat && filter.userLng) {
      const maxRadius = filter.maxRadiusKm;
      if (maxRadius) {
        list = list.filter(
          (jr) => jr.distanceKm !== undefined && jr.distanceKm <= maxRadius,
        );
      }
      list.sort((a, b) => {
        if (a.distanceKm === undefined) return 1;
        if (b.distanceKm === undefined) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    return list;
  }

  async findById(id: string) {
    return this.prisma.jobRequest.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            location: true,
            clientRatingAvg: true,
            clientRatingCnt: true,
            createdAt: true,
          },
        },
        proposals: {
          include: {
            worker: {
              select: {
                id: true,
                fullName: true,
                professionalHeadline: true,
                avatarUrl: true,
                workerRatingAvg: true,
                workerRatingCnt: true,
                experienceYears: true,
                credentials: {
                  where: { status: 'VERIFIED' },
                  select: {
                    id: true,
                    title: true,
                    type: true,
                    status: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        workOrder: {
          include: {
            worker: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async create(userId: string, dto: CreateJobRequestDto) {
    const { imageUrls, ...data } = dto;
    return this.prisma.jobRequest.create({
      data: {
        ...data,
        userId,
        images: imageUrls && imageUrls.length > 0
          ? {
              create: imageUrls.map((url) => ({
                imageUrl: url,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        images: true,
      },
    });
  }

  async update(id: string, dto: UpdateJobRequestDto) {
    const { imageUrls, ...data } = dto;
    return this.prisma.jobRequest.update({
      where: { id },
      data: {
        ...data,
        ...(imageUrls !== undefined
          ? {
              images: {
                deleteMany: {},
                ...(imageUrls.length > 0
                  ? { create: imageUrls.map((imageUrl) => ({ imageUrl })) }
                  : {}),
              },
            }
          : {}),
      },
      include: { category: true, images: true },
    });
  }

  async delete(id: string) {
    return this.prisma.jobRequest.delete({ where: { id } });
  }
}
