import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  async create(
    @CurrentUser('id') authorId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(authorId, dto);
  }

  @Public()
  @Get('user/:userId')
  async getReviewsByUser(@Param('userId') userId: string) {
    return this.reviewsService.getReviewsByUser(userId);
  }

  @Get('work-order/:workOrderId')
  async getReviewsByWorkOrder(@Param('workOrderId') workOrderId: string) {
    return this.reviewsService.getReviewsByWorkOrder(workOrderId);
  }
}
