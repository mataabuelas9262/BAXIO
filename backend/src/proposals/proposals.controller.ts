import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Patch,
} from '@nestjs/common';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Post()
  async create(
    @CurrentUser('id') workerId: string,
    @Body() dto: CreateProposalDto,
  ) {
    return this.proposalsService.createProposal(workerId, dto);
  }

  @Get('my-proposals')
  async getMyProposals(@CurrentUser('id') workerId: string) {
    return this.proposalsService.getMyProposals(workerId);
  }

  @Patch(':id/accept')
  async acceptProposal(
    @Param('id') proposalId: string,
    @CurrentUser('id') clientId: string,
  ) {
    return this.proposalsService.acceptProposal(proposalId, clientId);
  }
}
