import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { IsEnum, IsOptional } from 'class-validator';
import { ReportStatus, Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';

class ReportQueryDto {
  @IsOptional() @IsEnum(ReportStatus) status?: ReportStatus;
}

class UpdateReportDto {
  @IsEnum(ReportStatus) status: ReportStatus;
}

@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('reports')
  listReports(@CurrentUser('role') role: Role, @Query() query: ReportQueryDto) {
    return this.admin.listReports(role, query.status);
  }

  @Patch('reports/:id')
  updateReport(@CurrentUser('role') role: Role, @Param('id') id: string, @Body() dto: UpdateReportDto) {
    return this.admin.updateReport(role, id, dto.status);
  }
}
