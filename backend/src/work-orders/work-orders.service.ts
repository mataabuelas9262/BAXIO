import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { WorkOrdersRepository } from './work-orders.repository';
import { WorkOrderStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WorkOrdersService {
  constructor(private readonly workOrdersRepo: WorkOrdersRepository, private readonly notifications?: NotificationsService) {}

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
      const updated = await this.workOrdersRepo.updateStatus(workOrder.id, 'COMPLETION_PENDING', workOrder.status);
      await this.notifications?.create(workOrder.clientId, 'WORK_ORDER_COMPLETED', 'Finalización solicitada', 'El profesional marcó el trabajo como terminado. Confirma si todo quedó bien.', { workOrderId: id });
      return updated;
    }

    // El cliente puede confirmar finalización directamente a COMPLETED
    if (isClient && (status === 'COMPLETED' || status === 'COMPLETION_PENDING')) {
      const updated = await this.workOrdersRepo.updateStatus(workOrder.id, 'COMPLETED', workOrder.status);
      await this.notifications?.create(workOrder.workerId, 'WORK_ORDER_COMPLETED', 'Trabajo confirmado', 'El cliente confirmó que el trabajo fue finalizado.', { workOrderId: id });
      return updated;
    }

    const updated = await this.workOrdersRepo.updateStatus(workOrder.id, status, workOrder.status);
    const recipientId = isClient ? workOrder.workerId : workOrder.clientId;
    await this.notifications?.create(recipientId, 'WORK_ORDER_COMPLETED', 'Estado del trabajo actualizado', `El estado del trabajo cambió a ${status}.`, { workOrderId: id });
    return updated;
  }
}
