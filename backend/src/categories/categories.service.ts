import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepo: CategoriesRepository) {}

  async getAllCategories() {
    return this.categoriesRepo.findAll();
  }

  async getCategoryBySlug(slug: string) {
    const category = await this.categoriesRepo.findBySlug(slug);
    if (!category) {
      throw new NotFoundException(`Categoría '${slug}' no encontrada`);
    }
    return category;
  }

  async createCategory(dto: CreateCategoryDto) {
    return this.categoriesRepo.create(dto);
  }
}
