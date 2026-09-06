import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthSecurityService } from './auth-security.service';
import { OtpMailService } from './otp-mail.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private security: AuthSecurityService,
    private mail: OtpMailService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { accountSecurity: { select: { sessionVersion: true } } },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe una cuenta con este correo electrónico');
    }

    this.mail.ensureReady();
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        accountSecurity: { create: { emailRequired: true } },
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        location: dto.location,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        location: true,
        serviceArea: true,
        experienceYears: true,
        role: true,
        workerRatingAvg: true,
        workerRatingCnt: true,
        clientRatingAvg: true,
        clientRatingCnt: true,
        createdAt: true,
      },
    });

    return this.security.createChallenge(user.id, 'email');
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { accountSecurity: { select: { sessionVersion: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas. Verifica tu correo o contraseña.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas. Verifica tu correo o contraseña.');
    }

    return (await this.security.afterPassword(user.id, user.accountSecurity?.sessionVersion || 0)) || this.issueSession(user.id, user.accountSecurity?.sessionVersion || 0);
  }

  async verifyChallenge(token: string, code: string) {
    const verified = await this.security.verifyChallenge(token, code);
    if (verified.purpose === 'email') return (await this.security.afterPassword(verified.userId, verified.sessionVersion)) || this.issueSession(verified.userId, verified.sessionVersion);
    return this.issueSession(verified.userId, verified.sessionVersion);
  }

  async issueSession(userId: string, verifiedVersion?: number) {
    const state = await this.prisma.accountSecurity.findUnique({ where: { userId } });
    const version = state?.sessionVersion || 0;
    if ((state?.emailRequired && !state.emailVerifiedAt) || (state?.twoFactorEnabled && verifiedVersion === undefined) || (verifiedVersion !== undefined && verifiedVersion !== version)) {
      throw new UnauthorizedException('Vuelve a iniciar sesión para completar la verificación.');
    }
    const user = await this.getMe(userId);
    return { user, token: this.jwtService.sign({ sub: user.id, email: user.email, sessionVersion: version }, { expiresIn: '7d' }) };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        location: true,
        serviceArea: true,
        experienceYears: true,
        role: true,
        workerRatingAvg: true,
        workerRatingCnt: true,
        clientRatingAvg: true,
        clientRatingCnt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return user;
  }

}
