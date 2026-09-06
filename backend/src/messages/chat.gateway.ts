import { ConfigService } from '@nestjs/config';
import { ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: true, credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly onlineUsers = new Map<string, Set<string>>();

  constructor(private readonly jwt: JwtService, private readonly config: ConfigService, private readonly prisma: PrismaService) {}

  private userId(client: Socket) { return client.data.userId as string | undefined; }
  private isOnline(userId: string) { return (this.onlineUsers.get(userId)?.size || 0) > 0; }

  async handleConnection(client: Socket) {
    try {
      const frontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map((origin) => origin.trim()).filter(Boolean);
      const allowedOrigins = process.env.NODE_ENV === 'production' ? frontendOrigins : [...frontendOrigins, 'http://localhost:3000', 'http://127.0.0.1:3000'];
      if (!client.handshake.headers.origin || !allowedOrigins.includes(client.handshake.headers.origin)) throw new Error('origin not allowed');
      const rawCookie = client.handshake.headers.cookie || '';
      const match = rawCookie.match(/(?:^|;\s*)access_token=([^;]+)/);
      if (!match) throw new Error('missing token');
      const payload = await this.jwt.verifyAsync<{ sub: string; sessionVersion?: number }>(decodeURIComponent(match[1]), { secret: this.config.getOrThrow<string>('jwt.secret') });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, accountSecurity: { select: { sessionVersion: true } } } });
      if (!user || (payload.sessionVersion || 0) !== (user.accountSecurity?.sessionVersion || 0)) throw new Error('expired session');
      client.data.userId = user.id;
      client.join(`user:${user.id}`);
      const sockets = this.onlineUsers.get(user.id) || new Set<string>();
      sockets.add(client.id);
      this.onlineUsers.set(user.id, sockets);
      this.server.to(`watch:${user.id}`).emit('chat:presence', { userId: user.id, online: true });
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = this.userId(client);
    if (!userId) return;
    const sockets = this.onlineUsers.get(userId);
    sockets?.delete(client.id);
    if (sockets?.size) return;
    this.onlineUsers.delete(userId);
    const lastSeenAt = new Date();
    await this.prisma.user.update({ where: { id: userId }, data: { lastSeenAt } }).catch(() => undefined);
    this.server.to(`watch:${userId}`).emit('chat:presence', { userId, online: false, lastSeenAt: lastSeenAt.toISOString() });
  }

  @SubscribeMessage('chat:watch')
  watch(@ConnectedSocket() client: Socket, payload: { userId?: string }) {
    if (!payload?.userId || !this.userId(client)) return;
    client.join(`watch:${payload.userId}`);
    client.emit('chat:presence', { userId: payload.userId, online: this.isOnline(payload.userId) });
  }

  @SubscribeMessage('chat:typing')
  typing(@ConnectedSocket() client: Socket, payload: { counterpartId?: string; isTyping?: boolean }) {
    const userId = this.userId(client);
    if (!userId || !payload?.counterpartId || payload.counterpartId === userId) return;
    this.server.to(`user:${payload.counterpartId}`).emit('chat:typing', { userId, isTyping: Boolean(payload.isTyping) });
  }

  emitDirectMessage(senderId: string, recipientId: string, message: unknown) {
    this.server.to(`user:${senderId}`).emit('chat:message', { kind: 'direct', counterpartId: recipientId, message });
    this.server.to(`user:${recipientId}`).emit('chat:message', { kind: 'direct', counterpartId: senderId, message });
  }

  emitWorkOrderMessage(participantIds: string[], workOrderId: string, message: unknown) {
    participantIds.forEach((userId) => this.server.to(`user:${userId}`).emit('chat:message', { kind: 'work-order', workOrderId, message }));
  }
}
