import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesRepository } from './messages.repository';
import { MessagesService } from './messages.service';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [MessagesController],
  imports: [AuthModule],
  providers: [MessagesService, MessagesRepository, ChatGateway],
})
export class MessagesModule {}
