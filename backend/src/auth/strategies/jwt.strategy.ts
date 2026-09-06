import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          if (request?.cookies?.access_token) {
            return request.cookies.access_token;
          }
          return null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
    });
  }

  async validate(payload: { sub: string; email: string; sessionVersion?: number }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        accountSecurity: { select: { sessionVersion: true, emailRequired: true, emailVerifiedAt: true } },
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
      throw new UnauthorizedException('Usuario no encontrado o sesión expirada.');
    }

    if ((payload.sessionVersion || 0) !== (user.accountSecurity?.sessionVersion || 0) || (user.accountSecurity?.emailRequired && !user.accountSecurity.emailVerifiedAt)) {
      throw new UnauthorizedException('La seguridad de tu cuenta cambió. Vuelve a iniciar sesión.');
    }
    const { accountSecurity, ...publicUser } = user;
    return publicUser;
  }
}
