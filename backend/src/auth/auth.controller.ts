import {
  Controller,
  Post,
  Body,
  Get,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthSecurityService } from './auth-security.service';
import { ChallengeTokenDto, VerifyChallengeDto, SecurityPasswordDto, SecurityCodeDto } from './dto/security.dto';
import { PasswordService } from './password.service';
import { PasswordRequestDto, PasswordOtpDto, PasswordResetDto, PasswordChangeDto, PhoneStartDto } from './dto/password.dto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly security: AuthSecurityService, private readonly passwords: PasswordService) {}

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    res.setHeader('Cache-Control', 'no-store');
    res.clearCookie('access_token', { path: '/' });
    return result;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);

    res.setHeader('Cache-Control', 'no-store');
    if (!('token' in result)) {
      res.clearCookie('access_token', { path: '/' });
      return result;
    }
    // Cookie HttpOnly segura
    res.cookie('access_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    return {
      user: result.user,
      token: result.token,
    };
  }

  private sessionCookie(res: Response, token: string) {
    res.setHeader('Cache-Control', 'no-store');
    res.cookie('access_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 });
  }

  @Public() @Post('verify') @HttpCode(200)
  async verify(@Body() dto: VerifyChallengeDto, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    const result = await this.authService.verifyChallenge(dto.challengeToken, dto.code);
    if ('token' in result) this.sessionCookie(res, result.token);
    return result;
  }
  @Public() @Post('resend') @HttpCode(200)
  async resend(@Body() dto: ChallengeTokenDto, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    return this.security.resend(dto.challengeToken);
  }
  @Get('security')
  async securityStatus(@CurrentUser('id') id: string, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store'); return this.security.status(id);
  }
  @Post('email-verification') @HttpCode(200)
  async sendVerification(@CurrentUser('id') id: string, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store'); return this.security.createChallenge(id, 'email');
  }
  @Post('2fa/setup') @HttpCode(200)
  async setup(@CurrentUser('id') id: string, @Body() dto: SecurityPasswordDto, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store'); return this.security.startSetup(id, dto.password);
  }
  @Post('2fa/confirm') @HttpCode(200)
  async confirm(@CurrentUser('id') id: string, @Body() dto: SecurityCodeDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.security.confirmSetup(id, dto.password, dto.code);
    const session = await this.authService.issueSession(id, result.sessionVersion);
    this.sessionCookie(res, session.token); return { recoveryCodes: result.recoveryCodes };
  }
  @Post('2fa/disable') @HttpCode(200)
  async disable(@CurrentUser('id') id: string, @Body() dto: SecurityCodeDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.security.disable(id, dto.password, dto.code);
    const session = await this.authService.issueSession(id, result.sessionVersion);
    this.sessionCookie(res, session.token); return { message: result.message };
  }

  @Public() @Get('password/options')
  recoveryOptions(@Res({ passthrough: true }) res: Response) { res.setHeader('Cache-Control', 'no-store'); return this.passwords.options(); }
  @Public() @Post('password/request') @HttpCode(200)
  requestPassword(@Body() dto: PasswordRequestDto, @Res({ passthrough: true }) res: Response) { res.setHeader('Cache-Control', 'no-store'); return this.passwords.request(dto.email, dto.channel); }
  @Public() @Post('password/verify') @HttpCode(200)
  verifyPassword(@Body() dto: PasswordOtpDto, @Res({ passthrough: true }) res: Response) { res.setHeader('Cache-Control', 'no-store'); return this.passwords.verify(dto.challengeToken, dto.code); }
  @Public() @Post('password/reset') @HttpCode(200)
  async resetPassword(@Body() dto: PasswordResetDto, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store'); const result = await this.passwords.reset(dto.resetToken, dto.newPassword, dto.secondFactor); res.clearCookie('access_token', { path: '/' }); return result;
  }
  @Post('password/change') @HttpCode(200)
  async changePassword(@CurrentUser('id') id: string, @Body() dto: PasswordChangeDto, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store'); const result = await this.passwords.change(id, dto.currentPassword, dto.newPassword); res.clearCookie('access_token', { path: '/' }); return result;
  }
  @Post('phone/request') @HttpCode(200)
  requestPhone(@CurrentUser('id') id: string, @Body() dto: PhoneStartDto, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store'); return this.passwords.startPhone(id, dto.phone, dto.password, dto.secondFactor);
  }
  @Post('phone/verify') @HttpCode(200)
  async verifyPhone(@CurrentUser('id') id: string, @Body() dto: PasswordOtpDto, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store'); const result = await this.passwords.verifyPhone(id, dto.challengeToken, dto.code); res.clearCookie('access_token', { path: '/' }); return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return { message: 'Sesión cerrada correctamente' };
  }

  @Get('me')
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }
}
