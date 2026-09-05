import { Module } from '@nestjs/common';
import { JobRequestsController } from './job-requests.controller';
import { JobRequestsService } from './job-requests.service';
import { JobRequestsRepository } from './job-requests.repository';

@Module({
  controllers: [JobRequestsController],
  providers: [JobRequestsService, JobRequestsRepository],
  exports: [JobRequestsService, JobRequestsRepository],
})
export class JobRequestsModule {}
