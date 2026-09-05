import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateReportDto } from './dto/create-report.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('work-orders/:workOrderId')
  getConversation(
    @Param('workOrderId') workOrderId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.getConversationForWorkOrder(workOrderId, userId);
  }

  @Post('work-orders/:workOrderId')
  sendMessage(
    @Param('workOrderId') workOrderId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(workOrderId, userId, dto.content);
  }

  @Patch(':messageId')
  updateMessage(@Param('messageId') messageId: string, @CurrentUser('id') userId: string, @Body() dto: UpdateMessageDto) {
    return this.messagesService.updateMessage(messageId, userId, dto.content);
  }

  @Delete(':messageId')
  deleteMessage(@Param('messageId') messageId: string, @CurrentUser('id') userId: string) {
    return this.messagesService.deleteMessage(messageId, userId);
  }

  @Post('reports')
  createReport(@CurrentUser('id') userId: string, @Body() dto: CreateReportDto) {
    return this.messagesService.createReport(userId, dto);
  }

  @Post('blocks/:userId')
  blockUser(@Param('userId') blockedId: string, @CurrentUser('id') userId: string) {
    return this.messagesService.blockUser(userId, blockedId);
  }

  @Delete('blocks/:userId')
  unblockUser(@Param('userId') blockedId: string, @CurrentUser('id') userId: string) {
    return this.messagesService.unblockUser(userId, blockedId);
  }
}
