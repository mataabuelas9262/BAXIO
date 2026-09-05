import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  Patch,
} from '@nestjs/common';
import { JobRequestsService } from './job-requests.service';
import { CreateJobRequestDto } from './dto/create-job-request.dto';
import { FilterJobRequestsDto } from './dto/filter-job-requests.dto';
import { UpdateJobRequestDto } from './dto/update-job-request.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('job-requests')
export class JobRequestsController {
  constructor(private readonly jobRequestsService: JobRequestsService) {}

  @Public()
  @Get()
  async getAll(@Query() filter: FilterJobRequestsDto) {
    return this.jobRequestsService.getAllJobRequests(filter);
  }

  @Get('mine/:id')
  async getForEditing(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.jobRequestsService.getJobRequestForEditing(id, userId);
  }

  @Public()
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.jobRequestsService.getJobRequestById(id);
  }

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateJobRequestDto,
  ) {
    return this.jobRequestsService.createJobRequest(userId, dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateJobRequestDto,
  ) {
    return this.jobRequestsService.updateJobRequest(id, userId, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.jobRequestsService.deleteJobRequest(id, userId);
  }
}
