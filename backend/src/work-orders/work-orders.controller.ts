import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
} from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get('my-orders')
  async getMyOrders(@CurrentUser('id') userId: string) {
    return this.workOrdersService.getMyWorkOrders(userId);
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workOrdersService.getWorkOrderById(id, userId);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateWorkOrderStatusDto,
  ) {
    return this.workOrdersService.updateStatus(id, userId, dto.status);
  }
}
