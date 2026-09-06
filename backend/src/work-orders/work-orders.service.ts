import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { WorkOrdersRepository } from './work-orders.repository';
import { WorkOrderStatus } from '@prisma/client';

@Injectable()
export class WorkOrdersService {
  constructor(private readonly workOrdersRepo: WorkOrdersRepository) {}

  async getMyWorkOrders(userId: string) {
    return this.workOrdersRepo.findMyWorkOrders(userId);
  }

  async getWorkOrderById(id: string, userId: string) {
    const workOrder = await this.workOrdersRepo.findById(id);
    if (!workOrder) {
      throw new NotFoundException('Orden de trabajo no encontrada');
    }
    if (workOrder.clientId !== userId && workOrder.workerId !== userId) {
      throw new ForbiddenException('No tienes acceso a esta orden de trabajo');
    }
    return workOrder;
  }

  async updateStatus(id: string, userId: string, status: WorkOrderStatus) {
    const workOrder = await this.getWorkOrderById(id, userId);

    if (workOrder.status === 'COMPLETED' || workOrder.status === 'CANCELLED') {
      if (status === workOrder.status) return workOrder;
      throw new ConflictException('Esta orden ya está finalizada o cancelada.');
    }
    const isClient = workOrder.clientId === userId;
    const isWorker = workOrder.workerId === userId;

    // Regla de negocio: El trabajador solicita finalización (COMPLETION_PENDING)
    if (isWorker && status === 'COMPLETED') {
      return this.workOrdersRepo.updateStatus(workOrder.id, 'COMPLETION_PENDING', workOrder.status);
    }

    // El cliente puede confirmar finalización directamente a COMPLETED
    if (isClient && (status === 'COMPLETED' || status === 'COMPLETION_PENDING')) {
      return this.workOrdersRepo.updateStatus(workOrder.id, 'COMPLETED', workOrder.status);
    }

    return this.workOrdersRepo.updateStatus(workOrder.id, status, workOrder.status);
  }
}
