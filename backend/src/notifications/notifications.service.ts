import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, type: NotificationType, title: string, message: string, data?: Prisma.InputJsonValue) {
    return this.prisma.notification.create({ data: { userId, type, title, message, ...(data === undefined ? {} : { data }) } });
  }

  async list(userId: string) {
    const [items, unread] = await this.prisma.$transaction([
      this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50, select: { id: true, type: true, title: true, message: true, data: true, isRead: true, createdAt: true } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { items, unread };
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
    return { message: 'Notificación marcada como leída.' };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    return { message: 'Notificaciones marcadas como leídas.' };
  }
}
