import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async getUserProfile(id: string) {
    const user = await this.usersRepo.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    const { passwordHash, ...safeUser } = user as any;
    return safeUser;
  }

  async getWorkers(query?: string, location?: string) {
    return this.usersRepo.findWorkers(query, location);
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    return this.usersRepo.update(userId, dto);
  }
}
