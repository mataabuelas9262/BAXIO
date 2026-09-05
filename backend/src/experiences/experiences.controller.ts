import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ExperiencesService } from './experiences.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('experiences')
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateExperienceDto,
  ) {
    return this.experiencesService.create(userId, dto);
  }

  @Get('my')
  async getMyExperiences(@CurrentUser('id') userId: string) {
    return this.experiencesService.getMyExperiences(userId);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExperienceDto,
  ) {
    return this.experiencesService.update(userId, id, dto);
  }

  @Delete(':id')
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.experiencesService.delete(userId, id);
  }
}
