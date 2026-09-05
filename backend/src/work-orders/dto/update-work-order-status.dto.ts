import { IsEnum, IsNotEmpty } from 'class-validator';
import { WorkOrderStatus } from '@prisma/client';

export class UpdateWorkOrderStatusDto {
  @IsEnum(WorkOrderStatus, { message: 'Estado de orden de trabajo no válido' })
  @IsNotEmpty()
  status: WorkOrderStatus;
}
