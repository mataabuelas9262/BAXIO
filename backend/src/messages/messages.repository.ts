import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findWorkOrderForParticipant(workOrderId: string, userId: string) {
    return this.prisma.workOrder.findFirst({
      where: {
        id: workOrderId,
        OR: [{ clientId: userId }, { workerId: userId }],
      },
      select: {
        id: true,
        clientId: true,
        workerId: true,
      },
    });
  }

  async findDirectConversation(userIds: [string, string]) {
    return this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: userIds[0] } } },
          { participants: { some: { userId: userIds[1] } } },
          { participants: { every: { userId: { in: userIds } } } },
        ],
      },
      select: { id: true },
    });
  }

  async findBlockBetween(userIds: [string, string]) {
    return this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userIds[0], blockedId: userIds[1] },
          { blockerId: userIds[1], blockedId: userIds[0] },
        ],
      },
    });
  }

  async createDirectConversation(userIds: [string, string]) {
    return this.prisma.conversation.create({
      data: {
        participants: {
          create: userIds.map((userId) => ({ userId })),
        },
      },
      select: { id: true },
    });
  }

  async markIncomingMessagesAsRead(conversationId: string, userId: string) {
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async getConversation(conversationId: string) {
    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            isRead: true,
            createdAt: true,
            updatedAt: true,
            senderId: true,
            sender: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async createMessage(conversationId: string, senderId: string, content: string) {
    return this.prisma.message.create({
      data: { conversationId, senderId, content },
      select: {
        id: true,
        content: true,
        isRead: true,
        createdAt: true,
        updatedAt: true,
        senderId: true,
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async findMessageById(messageId: string) {
    return this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: { select: { participants: { select: { userId: true } } } },
      },
    });
  }

  async updateMessage(messageId: string, content: string) {
    return this.prisma.message.update({
      where: { id: messageId },
      data: { content },
      select: {
        id: true, content: true, isRead: true, createdAt: true, updatedAt: true, senderId: true,
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  }

  async deleteMessage(messageId: string) {
    return this.prisma.message.delete({ where: { id: messageId } });
  }

  async createBlock(blockerId: string, blockedId: string) {
    return this.prisma.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    });
  }

  async removeBlock(blockerId: string, blockedId: string) {
    return this.prisma.userBlock.deleteMany({ where: { blockerId, blockedId } });
  }

  async areConversationParticipants(userIds: [string, string]) {
    return this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: userIds[0] } } },
          { participants: { some: { userId: userIds[1] } } },
        ],
      },
      select: { id: true },
    });
  }

  async createReport(data: { reporterId: string; reportedUserId: string; messageId?: string; reason: string; details?: string }) {
    return this.prisma.messageReport.create({ data });
  }
}
