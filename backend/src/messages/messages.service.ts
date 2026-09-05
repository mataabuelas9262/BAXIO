import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MessagesRepository } from './messages.repository';

@Injectable()
export class MessagesService {
  constructor(private readonly messagesRepository: MessagesRepository) {}

  private async getConversationIdForWorkOrder(workOrderId: string, userId: string) {
    const order = await this.messagesRepository.findWorkOrderForParticipant(workOrderId, userId);

    if (!order) {
      throw new ForbiddenException('Solo los participantes de la orden pueden acceder a esta conversación');
    }

    if (order.clientId === order.workerId) {
      throw new NotFoundException('No fue posible identificar a los participantes de la conversación');
    }

    const participantIds: [string, string] = [order.clientId, order.workerId];
    if (await this.messagesRepository.findBlockBetween(participantIds)) {
      throw new ForbiddenException('La conversación no está disponible porque uno de los usuarios bloqueó el contacto');
    }
    const existingConversation = await this.messagesRepository.findDirectConversation(participantIds);
    const conversation = existingConversation || await this.messagesRepository.createDirectConversation(participantIds);

    return conversation.id;
  }

  async getConversationForWorkOrder(workOrderId: string, userId: string) {
    const conversationId = await this.getConversationIdForWorkOrder(workOrderId, userId);
    await this.messagesRepository.markIncomingMessagesAsRead(conversationId, userId);
    return this.messagesRepository.getConversation(conversationId);
  }

  async sendMessage(workOrderId: string, userId: string, content: string) {
    const conversationId = await this.getConversationIdForWorkOrder(workOrderId, userId);
    return this.messagesRepository.createMessage(conversationId, userId, content.trim());
  }

  async updateMessage(messageId: string, userId: string, content: string) {
    const message = await this.messagesRepository.findMessageById(messageId);
    if (!message) throw new NotFoundException('Mensaje no encontrado');
    if (message.senderId !== userId) throw new ForbiddenException('Solo puedes editar tus propios mensajes');
    return this.messagesRepository.updateMessage(messageId, content.trim());
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.messagesRepository.findMessageById(messageId);
    if (!message) throw new NotFoundException('Mensaje no encontrado');
    if (message.senderId !== userId) throw new ForbiddenException('Solo puedes eliminar tus propios mensajes');
    await this.messagesRepository.deleteMessage(messageId);
    return { message: 'Mensaje eliminado' };
  }

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) throw new BadRequestException('No puedes bloquearte a ti mismo');
    const sharedConversation = await this.messagesRepository.areConversationParticipants([blockerId, blockedId]);
    if (!sharedConversation) throw new ForbiddenException('Solo puedes bloquear a un usuario con quien tienes una conversación');
    await this.messagesRepository.createBlock(blockerId, blockedId);
    return { message: 'Usuario bloqueado. Ya no podrán enviarse mensajes.' };
  }

  async unblockUser(blockerId: string, blockedId: string) {
    await this.messagesRepository.removeBlock(blockerId, blockedId);
    return { message: 'Usuario desbloqueado' };
  }

  async createReport(userId: string, dto: { messageId?: string; reportedUserId?: string; reason: string; details?: string }) {
    if (Boolean(dto.messageId) === Boolean(dto.reportedUserId)) throw new BadRequestException('Selecciona un mensaje o un usuario para reportar');
    if (dto.reason === 'Otro' && !dto.details?.trim()) throw new BadRequestException('Explica brevemente el motivo del reporte');
    let reportedUserId = dto.reportedUserId;
    if (dto.messageId) {
      const message = await this.messagesRepository.findMessageById(dto.messageId);
      if (!message) throw new NotFoundException('Mensaje no encontrado');
      if (!message.conversation.participants.some((participant) => participant.userId === userId)) {
        throw new ForbiddenException('No puedes reportar un mensaje ajeno');
      }
      reportedUserId = message.senderId;
    }
    if (!reportedUserId) throw new BadRequestException('Selecciona el mensaje o usuario que deseas reportar');
    if (reportedUserId === userId) throw new BadRequestException('No puedes reportarte a ti mismo');
    if (!await this.messagesRepository.areConversationParticipants([userId, reportedUserId])) {
      throw new ForbiddenException('Solo puedes reportar a un contacto con quien compartes conversación');
    }
    return this.messagesRepository.createReport({ ...dto, reporterId: userId, reportedUserId });
  }
}
