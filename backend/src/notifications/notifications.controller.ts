import { Controller, Get, Param, Patch } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser('id') userId: string) { return this.notifications.list(userId); }

  @Patch('read-all')
  markAllRead(@CurrentUser('id') userId: string) { return this.notifications.markAllRead(userId); }

  @Patch(':id/read')
  markRead(@CurrentUser('id') userId: string, @Param('id') id: string) { return this.notifications.markRead(userId, id); }
}
