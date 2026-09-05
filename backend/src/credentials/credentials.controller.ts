import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('credentials')
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCredentialDto,
  ) {
    return this.credentialsService.create(userId, dto);
  }

  @Get('my')
  async getMyCredentials(@CurrentUser('id') userId: string) {
    return this.credentialsService.getMyCredentials(userId);
  }

  @Delete(':id')
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.credentialsService.delete(userId, id);
  }
}
