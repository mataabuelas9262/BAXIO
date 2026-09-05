import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        _count: {
          select: {
            services: { where: { status: 'ACTIVE' } },
            jobRequests: { where: { status: 'OPEN' } },
          },
        },
      },
      // La popularidad se basa en actividad real del marketplace: más servicios primero.
      orderBy: [
        { services: { _count: 'desc' } },
        { jobRequests: { _count: 'desc' } },
        { name: 'asc' },
      ],
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            services: { where: { status: 'ACTIVE' } },
            jobRequests: { where: { status: 'OPEN' } },
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
    });
  }

  async create(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: dto,
    });
  }
}
