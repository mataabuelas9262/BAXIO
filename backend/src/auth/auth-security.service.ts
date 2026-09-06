import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { AccountSecurity, Prisma } from '@prisma/client';
import { createHash, createHmac, randomBytes, randomInt, createCipheriv, createDecipheriv, timingSafeEqual } from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as OTPAuth from 'otpauth';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { OtpMailService } from './otp-mail.service';

const ttl = 10 * 60_000;
export interface AuthStep { step: 'email' | 'two-factor'; challengeToken: string; maskedEmail: string; expiresIn: number; resendAfter: number; delivery?: 'preview' | 'email'; }
@Injectable()
export class AuthSecurityService {
  constructor(private db: PrismaService, private mail: OtpMailService) {}
  private key() {
    const key = process.env.MFA_ENCRYPTION_KEY || '';
    if (!/^[a-f0-9]{64}$/i.test(key)) throw new Error('MFA_ENCRYPTION_KEY debe contener 32 bytes aleatorios en hexadecimal.');
    return Buffer.from(key, 'hex');
  }
  private hash(value: string) { return createHash('sha256').update(value).digest('hex'); }
  private codeHash(userId: string, code: string) { return createHmac('sha256', this.key()).update(`${userId}:${code}`).digest('hex'); }
  private encrypt(secret: string, userId: string) {
    const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    cipher.setAAD(Buffer.from(userId));
    const data = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), data].map(b => b.toString('base64')).join('.');
  }
  private decrypt(value: string, userId: string) {
    const [iv, tag, data] = value.split('.').map(v => Buffer.from(v, 'base64'));
    const cipher = createDecipheriv('aes-256-gcm', this.key(), iv); cipher.setAAD(Buffer.from(userId)); cipher.setAuthTag(tag);
    return Buffer.concat([cipher.update(data), cipher.final()]).toString('utf8');
  }
  private totp(secret: string, email = '') { return new OTPAuth.TOTP({ issuer: 'BAXIO', label: email, algorithm: 'SHA1', digits: 6, period: 30, secret }); }
  async status(userId: string) {
    const s = await this.db.accountSecurity.findUnique({ where: { userId } });
    return { verifiedPhone: s?.phoneVerifiedAt ? s.verifiedPhone : null, emailVerified: !!s?.emailVerifiedAt, twoFactorEnabled: !!s?.twoFactorEnabled, recoveryCodesRemaining: Array.isArray(s?.recoveryHashes) ? s.recoveryHashes.length : 0 };
  }
  async checkPassword(userId: string, password: string) {
    const u = await this.db.user.findUniqueOrThrow({ where: { id: userId } });
    if (!await bcrypt.compare(password, u.passwordHash)) throw new UnauthorizedException('Contraseña incorrecta.');
    return u;
  }
  async afterPassword(userId: string, expectedVersion?: number): Promise<AuthStep | null> {
    const s = await this.db.accountSecurity.findUnique({ where: { userId } });
    if (expectedVersion !== undefined && expectedVersion !== (s?.sessionVersion || 0)) throw new UnauthorizedException('La contraseña o seguridad cambió. Vuelve a iniciar sesión.');
    if (s?.emailRequired && !s.emailVerifiedAt) return this.createChallenge(userId, 'email', expectedVersion);
    if (s?.twoFactorEnabled) return this.createChallenge(userId, 'two-factor', expectedVersion);
    return null;
  }
  async createChallenge(userId: string, purpose: 'email' | 'two-factor', expectedVersion?: number): Promise<AuthStep> {
    if (purpose === 'email') this.mail.ensureReady();
    const user = await this.db.user.findUniqueOrThrow({ where: { id: userId } });
    const token = randomBytes(32).toString('hex'), tokenHash = this.hash(token);
    const code = String(randomInt(1_000_000)).padStart(6, '0');
    const result = await this.db.withTransaction(async tx => {
      const s = await tx.accountSecurity.upsert({ where: { userId }, create: { userId }, update: {} });
      if (expectedVersion !== undefined && s.sessionVersion !== expectedVersion) throw new UnauthorizedException('La seguridad cambió. Vuelve a iniciar sesión.');
      if (s.lockedUntil && s.lockedUntil > new Date()) return false;
      const existing = await tx.authChallenge.findUnique({ where: { userId_purpose: { userId, purpose } } });
      if (purpose === 'email' && existing && Date.now() - existing.sentAt.getTime() < 60_000) throw new BadRequestException('Espera un minuto antes de solicitar otro código.');
      await tx.authChallenge.upsert({ where: { userId_purpose: { userId, purpose } }, create: { userId, purpose, tokenHash, codeHash: purpose === 'email' ? this.codeHash(userId, code) : null, sessionVersion: s.sessionVersion, expiresAt: new Date(Date.now() + ttl) }, update: { tokenHash, codeHash: purpose === 'email' ? this.codeHash(userId, code) : null, sessionVersion: s.sessionVersion, attempts: 0, expiresAt: new Date(Date.now() + ttl), sentAt: new Date() } });
      return true;
    });
    if (!result) throw new UnauthorizedException('Demasiados intentos. Espera cinco minutos.');
    if (purpose === 'email') {
      try { await this.mail.sendCode(user.email, code); }
      catch (error) { await this.db.authChallenge.deleteMany({ where: { tokenHash } }); throw error; }
    }
    return { step: purpose, challengeToken: token, maskedEmail: user.email.replace(/^(.).*(@.*)$/, '$1•••$2'), expiresIn: 600, resendAfter: 60, ...(purpose === 'email' ? { delivery: this.mail.preview ? 'preview' as const : 'email' as const } : {}) };
  }
  async resend(token: string) {
    const c = await this.db.authChallenge.findUnique({ where: { tokenHash: this.hash(token) } });
    if (!c || c.purpose !== 'email' || c.expiresAt.getTime() + ttl < Date.now()) throw new UnauthorizedException('Vuelve a iniciar sesión para solicitar otro código.');
    return this.createChallenge(c.userId, 'email');
  }
  private async failure(tx: Prisma.TransactionClient, s: AccountSecurity) {
    const count = s.lockedUntil && s.lockedUntil <= new Date() ? 1 : s.failedAttempts + 1;
    await tx.accountSecurity.update({ where: { userId: s.userId }, data: { failedAttempts: count, lockedUntil: count >= 5 ? new Date(Date.now() + 300_000) : null } });
  }
  async consumeSecondFactor(tx: Prisma.TransactionClient, s: AccountSecurity, code: string) {
    if (!s.twoFactorEnabled || !s.totpSecret || (s.lockedUntil && s.lockedUntil > new Date())) return false;
    if (/^\d{6}$/.test(code)) {
      const timestamp = Date.now();
      const delta = this.totp(this.decrypt(s.totpSecret, s.userId)).validate({ token: code, window: 1, timestamp });
      const step = BigInt(Math.floor(timestamp / 30_000) + (delta ?? 0));
      if (delta !== null && step > s.lastTotpStep) {
        await tx.accountSecurity.update({ where: { userId: s.userId }, data: { lastTotpStep: step, failedAttempts: 0, lockedUntil: null } });
        return true;
      }
    } else {
      const normalized = code.replace(/[-\s]/g, '').toUpperCase();
      const hashes = Array.isArray(s.recoveryHashes) ? s.recoveryHashes as string[] : [];
      const hash = this.codeHash(s.userId, normalized);
      if (hashes.includes(hash)) {
        await tx.accountSecurity.update({ where: { userId: s.userId }, data: { recoveryHashes: hashes.filter(h => h !== hash), failedAttempts: 0, lockedUntil: null } });
        return true;
      }
    }
    await this.failure(tx, s); return false;
  }
  async verifyChallenge(token: string, code: string) {
    const result = await this.db.withTransaction(async tx => {
      const c = await tx.authChallenge.findUnique({ where: { tokenHash: this.hash(token) } });
      if (!c || c.expiresAt <= new Date() || c.attempts >= 5) return null;
      const s = await tx.accountSecurity.findUniqueOrThrow({ where: { userId: c.userId } });
      if (s.sessionVersion !== c.sessionVersion || (s.lockedUntil && s.lockedUntil > new Date())) return null;
      await tx.authChallenge.update({ where: { id: c.id }, data: { attempts: { increment: 1 } } });
      if (c.purpose === 'email') {
        const hash = this.codeHash(c.userId, code);
        if (!c.codeHash || !timingSafeEqual(Buffer.from(hash), Buffer.from(c.codeHash))) { await this.failure(tx, s); return null; }
        await tx.accountSecurity.update({ where: { userId: c.userId }, data: { emailVerifiedAt: new Date(), failedAttempts: 0, lockedUntil: null } });
      } else if (c.purpose !== 'two-factor' || !await this.consumeSecondFactor(tx, s, code)) return null;
      await tx.authChallenge.delete({ where: { id: c.id } });
      return { userId: c.userId, purpose: c.purpose, sessionVersion: s.sessionVersion };
    });
    if (!result) throw new UnauthorizedException('Código incorrecto, utilizado o vencido. Tras cinco intentos debes esperar cinco minutos.');
    return result;
  }
  async startSetup(userId: string, password: string) {
    const user = await this.checkPassword(userId, password);
    const secret = new OTPAuth.Secret({ size: 20 }).base32;
    await this.db.withTransaction(async tx => {
      const current = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      if (current.passwordHash !== user.passwordHash) throw new ConflictException("La contraseña cambió. Vuelve a iniciar sesión.");
      const s = await tx.accountSecurity.upsert({ where: { userId }, create: { userId }, update: {} });
      if (s.twoFactorEnabled) throw new ConflictException('El 2FA ya está activado.');
      await tx.accountSecurity.update({ where: { userId }, data: { pendingSecret: this.encrypt(secret, userId), pendingExpiresAt: new Date(Date.now() + ttl) } });
    });
    return { secret, qrCode: await QRCode.toDataURL(this.totp(secret, user.email).toString(), { width: 224, margin: 2 }), expiresIn: 600 };
  }
  async confirmSetup(userId: string, password: string, code: string) {
    const user = await this.checkPassword(userId, password);
    const recoveryCodes = Array.from({ length: 8 }, () => randomBytes(10).toString('hex').toUpperCase());
    const ok = await this.db.withTransaction(async tx => {
      const current = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      if (current.passwordHash !== user.passwordHash) throw new ConflictException("La contraseña cambió. Vuelve a iniciar sesión.");
      const s = await tx.accountSecurity.findUnique({ where: { userId } });
      if (!s || s.twoFactorEnabled || !s.pendingSecret || !s.pendingExpiresAt || s.pendingExpiresAt <= new Date() || (s.lockedUntil && s.lockedUntil > new Date())) return false;
      const timestamp = Date.now();
      const delta = this.totp(this.decrypt(s.pendingSecret, userId)).validate({ token: code, window: 1, timestamp });
      if (delta === null) { await this.failure(tx, s); return false; }
      await tx.accountSecurity.update({ where: { userId }, data: { totpSecret: s.pendingSecret, pendingSecret: null, pendingExpiresAt: null, twoFactorEnabled: true, lastTotpStep: BigInt(Math.floor(timestamp / 30_000) + delta), recoveryHashes: recoveryCodes.map(c => this.codeHash(userId, c)), sessionVersion: { increment: 1 }, failedAttempts: 0, lockedUntil: null } });
      await tx.authChallenge.deleteMany({ where: { userId } }); return { sessionVersion: s.sessionVersion + 1 };
    });
    if (!ok) throw new BadRequestException('Código incorrecto, configuración vencida o demasiados intentos.');
    return { recoveryCodes, sessionVersion: ok.sessionVersion };
  }
  async disable(userId: string, password: string, code: string) {
    const user = await this.checkPassword(userId, password);
    const ok = await this.db.withTransaction(async tx => {
      const current = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      if (current.passwordHash !== user.passwordHash) throw new ConflictException("La contraseña cambió. Vuelve a iniciar sesión.");
      const s = await tx.accountSecurity.findUnique({ where: { userId } });
      if (!s || !await this.consumeSecondFactor(tx, s, code)) return false;
      await tx.accountSecurity.update({ where: { userId }, data: { twoFactorEnabled: false, totpSecret: null, pendingSecret: null, pendingExpiresAt: null, recoveryHashes: Prisma.DbNull, lastTotpStep: -1, sessionVersion: { increment: 1 } } });
      await tx.authChallenge.deleteMany({ where: { userId } }); return { sessionVersion: s.sessionVersion + 1 };
    });
    if (!ok) throw new UnauthorizedException('Código incorrecto, utilizado o demasiados intentos.');
    return { message: 'Verificación en dos pasos desactivada.', sessionVersion: ok.sessionVersion };
  }
}
