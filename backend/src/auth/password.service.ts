import { Injectable, BadRequestException, UnauthorizedException, ConflictException, Logger, ServiceUnavailableException } from '@nestjs/common';
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthSecurityService } from './auth-security.service';
import { OtpMailService } from './otp-mail.service';
import { OtpSmsService } from './otp-sms.service';

const ttl = 600_000;
@Injectable()
export class PasswordService {
  private logger = new Logger(PasswordService.name);
  constructor(private db: PrismaService, private security: AuthSecurityService, private mail: OtpMailService, private sms: OtpSmsService) {}
  private tokenHash(value: string) { return createHash('sha256').update(value).digest('hex'); }
  private codeHash(id: string, purpose: string, code: string) {
    const key = process.env.MFA_ENCRYPTION_KEY || '';
    if (!/^[a-f0-9]{64}$/i.test(key)) throw new Error('Falta configurar la clave de seguridad.');
    return createHmac('sha256', Buffer.from(key, 'hex')).update(`${purpose}:${id}:${code}`).digest('hex');
  }
  private validHash(a: string, b: string | null) { return !!b && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b)); }
  private validatePassword(value: string) {
    if (value.length < 8 || Buffer.byteLength(value, 'utf8') > 72) throw new BadRequestException('Usa al menos 8 caracteres y un máximo de 72 bytes para la nueva contraseña.');
  }
  options() { return { smsAvailable: this.sms.available, smsPreview: this.sms.preview }; }
  async request(email: string, channel: 'email' | 'sms') {
    if (channel === 'sms' && !this.sms.available) throw new ServiceUnavailableException('Los SMS todavía no están disponibles. Usa el correo electrónico.');
    if (channel === 'email') this.mail.ensureReady();
    const token = randomBytes(32).toString('hex'), code = String(randomInt(1_000_000)).padStart(6, '0');
    const result = await this.db.withTransaction(async tx => {
      const user = await tx.user.findUnique({ where: { email: email.trim().toLowerCase() } });
      if (!user) return null;
      const state = await tx.accountSecurity.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
      if (state.recoveryLockedUntil && state.recoveryLockedUntil > new Date()) return null;
      const destination = channel === 'email' ? user.email : state.phoneVerifiedAt ? state.verifiedPhone : null;
      if (!destination) return null;
      const purpose = 'reset-' + channel;
      const previous = await tx.authChallenge.findFirst({ where: { userId: user.id, purpose: { in: ['reset-email', 'reset-sms'] }, sentAt: { gt: new Date(Date.now()-60_000) } } });
      if (previous) return null;
      // Requesting a new code never invalidates an already proven reset grant.
      await tx.authChallenge.deleteMany({ where: { userId: user.id, purpose: { in: ['reset-email', 'reset-sms'] } } });
      await tx.authChallenge.create({ data: { userId: user.id, purpose, tokenHash: this.tokenHash(token), codeHash: this.codeHash(user.id, purpose, code), destination, sessionVersion: state.sessionVersion, expiresAt: new Date(Date.now()+ttl) } });
      return { userId: user.id, destination };
    });
    if (result) {
      // Queue delivery independently of the response so account existence isn't revealed by SMTP timing.
      const delivery = channel === 'email' ? this.mail.sendCode(result.destination, code, 'password') : this.sms.sendCode(result.destination, code);
      void delivery.catch(async () => {
        this.logger.warn('No se pudo entregar un código de recuperación.');
        await this.db.authChallenge.deleteMany({ where: { tokenHash: this.tokenHash(token) } }).catch(() => undefined);
      });
    }
    return { challengeToken: token, expiresIn: 600, resendAfter: 60, delivery: channel === 'email' ? this.mail.preview ? 'preview' : 'email' : this.sms.preview ? 'preview' : 'sms', message: 'Si existe una cuenta con ese correo y tiene habilitado el canal elegido, recibirás un código de verificación.' };
  }
  async verify(token: string, code: string) {
    const resetToken = randomBytes(32).toString('hex');
    const result = await this.db.withTransaction(async tx => {
      const c = await tx.authChallenge.findUnique({ where: { tokenHash: this.tokenHash(token) } });
      if (!c || !['reset-email', 'reset-sms'].includes(c.purpose) || c.attempts >= 5 || c.expiresAt <= new Date()) return null;
      const state = await tx.accountSecurity.findUniqueOrThrow({ where: { userId: c.userId } });
      const user = await tx.user.findUniqueOrThrow({ where: { id: c.userId } });
      if (state.sessionVersion !== c.sessionVersion || (state.recoveryLockedUntil && state.recoveryLockedUntil > new Date())) return null;
      if (c.destination !== (c.purpose === 'reset-email' ? user.email : state.phoneVerifiedAt ? state.verifiedPhone : null)) return null;
      await tx.authChallenge.update({ where: { id: c.id }, data: { attempts: { increment: 1 } } });
      if (!this.validHash(this.codeHash(c.userId, c.purpose, code), c.codeHash)) {
        const attempts = state.recoveryLockedUntil && state.recoveryLockedUntil <= new Date() ? 1 : state.recoveryAttempts + 1;
        await tx.accountSecurity.update({ where: { userId: c.userId }, data: { recoveryAttempts: attempts, recoveryLockedUntil: attempts >= 5 ? new Date(Date.now()+300_000) : null } });
        return null;
      }
      await tx.accountSecurity.update({ where: { userId: c.userId }, data: { recoveryAttempts: 0, recoveryLockedUntil: null } });
      await tx.authChallenge.deleteMany({ where: { userId: c.userId, purpose: { in: ['grant-email', 'grant-sms'] } } });
      await tx.authChallenge.update({ where: { id: c.id }, data: { purpose: c.purpose.replace('reset-', 'grant-'), tokenHash: this.tokenHash(resetToken), codeHash: null, attempts: 0, expiresAt: new Date(Date.now()+ttl) } });
      return { requiresTwoFactor: state.twoFactorEnabled };
    });
    if (!result) throw new UnauthorizedException('Código incorrecto, usado o vencido. Después de cinco intentos espera cinco minutos y solicita otro.');
    return { resetToken, requiresTwoFactor: result.requiresTwoFactor };
  }
  async reset(token: string, newPassword: string, secondFactor = '') {
    this.validatePassword(newPassword);
    const hash = await bcrypt.hash(newPassword, 12);
    const ok = await this.db.withTransaction(async tx => {
      const c = await tx.authChallenge.findUnique({ where: { tokenHash: this.tokenHash(token) } });
      if (!c || !['grant-email', 'grant-sms'].includes(c.purpose) || c.attempts >= 5 || c.expiresAt <= new Date()) return false;
      const state = await tx.accountSecurity.findUniqueOrThrow({ where: { userId: c.userId } });
      if (state.sessionVersion !== c.sessionVersion) return false;
      const user = await tx.user.findUniqueOrThrow({ where: { id: c.userId } });
      if (c.destination !== (c.purpose === 'grant-email' ? user.email : state.phoneVerifiedAt ? state.verifiedPhone : null)) return false;
      if (await bcrypt.compare(newPassword, user.passwordHash)) throw new BadRequestException('Elige una contraseña diferente a la actual.');
      await tx.authChallenge.update({ where: { id: c.id }, data: { attempts: { increment: 1 } } });
      if (state.twoFactorEnabled && !await this.security.consumeSecondFactor(tx, state, secondFactor)) return false;
      await tx.user.update({ where: { id: c.userId }, data: { passwordHash: hash } });
      await tx.accountSecurity.update({ where: { userId: c.userId }, data: { sessionVersion: { increment: 1 }, pendingSecret: null, pendingExpiresAt: null, ...(c.purpose === 'grant-email' ? { emailVerifiedAt: new Date() } : {}) } });
      await tx.authChallenge.deleteMany({ where: { userId: c.userId } }); return true;
    });
    if (!ok) throw new UnauthorizedException('La verificación venció o el código de 2FA es incorrecto. Solicita otra recuperación si agotaste los intentos.');
    return { message: 'Contraseña restablecida. Inicia sesión con tu nueva contraseña.' };
  }
  async change(userId: string, currentPassword: string, newPassword: string) {
    this.validatePassword(newPassword);
    const user = await this.security.checkPassword(userId, currentPassword);
    if (await bcrypt.compare(newPassword, user.passwordHash)) throw new BadRequestException('Elige una contraseña diferente a la actual.');
    const hash = await bcrypt.hash(newPassword, 12);
    await this.db.withTransaction(async tx => {
      const changed = await tx.user.updateMany({ where: { id: userId, passwordHash: user.passwordHash }, data: { passwordHash: hash } });
      if (changed.count !== 1) throw new ConflictException('La contraseña cambió mientras la actualizabas. Inicia sesión de nuevo.');
      await tx.accountSecurity.upsert({ where: { userId }, create: { userId, sessionVersion: 1 }, update: { sessionVersion: { increment: 1 }, pendingSecret: null, pendingExpiresAt: null } });
      await tx.authChallenge.deleteMany({ where: { userId } });
    });
    return { message: 'Contraseña actualizada. Inicia sesión de nuevo.' };
  }
  async startPhone(userId: string, phone: string, password: string, secondFactor = '') {
    if (!this.sms.available) throw new ServiceUnavailableException('La verificación por SMS todavía no está disponible.');
    const user = await this.security.checkPassword(userId, password);
    const token = randomBytes(32).toString('hex'), code = String(randomInt(1_000_000)).padStart(6, '0');
    const ok = await this.db.withTransaction(async tx => {
      const current = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      if (current.passwordHash !== user.passwordHash) return false;
      const state = await tx.accountSecurity.upsert({ where: { userId }, create: { userId }, update: {} });
      const previous = await tx.authChallenge.findUnique({ where: { userId_purpose: { userId, purpose: 'phone-verify' } } });
      if (previous && Date.now()-previous.sentAt.getTime() < 60_000) throw new BadRequestException('Espera un minuto antes de solicitar otro SMS.');
      if (state.twoFactorEnabled && !await this.security.consumeSecondFactor(tx, state, secondFactor)) return false;
      await tx.authChallenge.upsert({ where: { userId_purpose: { userId, purpose: 'phone-verify' } }, create: { userId, purpose: 'phone-verify', tokenHash: this.tokenHash(token), codeHash: this.codeHash(userId, 'phone-verify', code), destination: phone, sessionVersion: state.sessionVersion, expiresAt: new Date(Date.now()+ttl) }, update: { tokenHash: this.tokenHash(token), codeHash: this.codeHash(userId, 'phone-verify', code), destination: phone, sessionVersion: state.sessionVersion, attempts: 0, sentAt: new Date(), expiresAt: new Date(Date.now()+ttl) } });
      return true;
    });
    if (!ok) throw new UnauthorizedException('Confirma tu contraseña y el segundo factor.');
    try { await this.sms.sendCode(phone, code); }
    catch (error) { await this.db.authChallenge.deleteMany({ where: { tokenHash: this.tokenHash(token) } }); throw error; }
    return { challengeToken: token, delivery: this.sms.preview ? 'preview' : 'sms' };
  }
  async verifyPhone(userId: string, token: string, code: string) {
    const ok = await this.db.withTransaction(async tx => {
      const c = await tx.authChallenge.findUnique({ where: { tokenHash: this.tokenHash(token) } });
      if (!c || c.userId !== userId || c.purpose !== 'phone-verify' || !c.destination || c.expiresAt <= new Date() || c.attempts >= 5) return false;
      const state = await tx.accountSecurity.findUniqueOrThrow({ where: { userId } });
      if (state.sessionVersion !== c.sessionVersion) return false;
      await tx.authChallenge.update({ where: { id: c.id }, data: { attempts: { increment: 1 } } });
      if (!this.validHash(this.codeHash(userId, c.purpose, code), c.codeHash)) return false;
      await tx.accountSecurity.update({ where: { userId }, data: { verifiedPhone: c.destination, phoneVerifiedAt: new Date(), sessionVersion: { increment: 1 } } });
      await tx.authChallenge.deleteMany({ where: { userId } }); return true;
    });
    if (!ok) throw new UnauthorizedException('Código SMS incorrecto, utilizado o vencido.');
    return { message: 'Teléfono verificado. Inicia sesión de nuevo.' };
  }
}
