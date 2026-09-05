import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { FilterServicesDto } from './dto/filter-services.dto';
import { Prisma } from '@prisma/client';
import { calculateDistanceKm } from '../common/utils/geo.utils';

@Injectable()
export class ServicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: FilterServicesDto) {
    const where: Prisma.ServiceWhereInput = {
      status: 'ACTIVE',
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
        ? {
            OR: [
              { location: { contains: filter.location } },
              { serviceArea: { contains: filter.location } },
            ],
          }
        : {}),
    };

    let orderBy: Prisma.ServiceOrderByWithRelationInput = { createdAt: 'desc' };
    if (filter.sortBy === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (filter.sortBy === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (filter.sortBy === 'rating') {
      orderBy = { user: { workerRatingAvg: 'desc' } };
    }

    const services = await this.prisma.service.findMany({
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
            baseLatitude: true,
            baseLongitude: true,
            workerRatingAvg: true,
            workerRatingCnt: true,
            experienceYears: true,
          },
        },
      },
      orderBy,
    });

    let list = services.map((svc) => {
      // Usar coordenadas del servicio o coordenadas base aproximadas del profesional
      const itemLat = svc.latitude || svc.user.baseLatitude;
      const itemLng = svc.longitude || svc.user.baseLongitude;

      const distanceKm =
        filter.userLat && filter.userLng && itemLat && itemLng
          ? calculateDistanceKm(filter.userLat, filter.userLng, itemLat, itemLng)
          : undefined;

      return {
        ...svc,
        distanceKm,
      };
    });

    if (filter.userLat && filter.userLng && filter.sortBy === 'distance') {
      const maxRadius = filter.maxRadiusKm;
      if (maxRadius) {
        list = list.filter(
          (s) => s.distanceKm !== undefined && s.distanceKm <= maxRadius,
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
    return this.prisma.service.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
        portfolioItems: true,
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            bio: true,
            location: true,
            serviceArea: true,
            workerRatingAvg: true,
            workerRatingCnt: true,
            experienceYears: true,
            createdAt: true,
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
              take: 5,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });
  }

  async create(userId: string, dto: CreateServiceDto) {
    const { imageUrls, images, ...data } = dto;
    return this.prisma.service.create({
      data: {
        ...data,
        userId,
        images: images?.length ? { create: images.map((image, order) => ({ ...image, order })) } : undefined,
      },
      include: {
        category: true,
        images: true,
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.service.delete({ where: { id } });
  }

  async update(id: string, dto: UpdateServiceDto) {
    const { imageUrls, images, ...data } = dto;
    return this.prisma.service.update({
      where: { id },
      data: {
        ...data,
        ...(images !== undefined
          ? { images: { deleteMany: {}, create: images.map((image, order) => ({ ...image, order })) } }
          : {}),
      },
      include: { category: true, images: true, user: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
  }
}
