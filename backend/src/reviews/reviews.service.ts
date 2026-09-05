import { Injectable } from '@nestjs/common';
import { ReviewsRepository } from './reviews.repository';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly reviewsRepository: ReviewsRepository) {}

  async create(authorId: string, dto: CreateReviewDto) {
    return this.reviewsRepository.create(authorId, dto);
  }

  async getReviewsByUser(userId: string) {
    return this.reviewsRepository.findByTargetUserId(userId);
  }

  async getReviewsByWorkOrder(workOrderId: string) {
    return this.reviewsRepository.findByWorkOrderId(workOrderId);
  }
}
