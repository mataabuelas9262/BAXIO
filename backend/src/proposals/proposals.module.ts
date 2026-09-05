import { Module } from '@nestjs/common';
import { ProposalsController } from './proposals.controller';
import { ProposalsService } from './proposals.service';
import { ProposalsRepository } from './proposals.repository';

@Module({
  controllers: [ProposalsController],
  providers: [ProposalsService, ProposalsRepository],
  exports: [ProposalsService, ProposalsRepository],
})
export class ProposalsModule {}
