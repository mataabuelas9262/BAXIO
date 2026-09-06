import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as OTPAuth from 'otpauth';
import { getE2eEnvironment } from '../scripts/e2e-database';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';
import { AuthSecurityService } from '../src/auth/auth-security.service';
import { OtpMailService } from '../src/auth/otp-mail.service';
import { OtpSmsService } from '../src/auth/otp-sms.service';
import { PasswordService } from '../src/auth/password.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';

test('password recovery and change protections', async t => {
  Object.assign(process.env, getE2eEnvironment());
  assert.equal(new URL(process.env.DATABASE_URL!).pathname, '/baxio_e2e');
  const db = new PrismaService(), sent = new Map<string,string>();
  const mail = new OtpMailService(); mail.sendCode = async (address, code) => { sent.set(address, code); };
  const sms = new OtpSmsService(); sms.sendCode = async (address, code) => { sent.set(address, code); };
  const security = new AuthSecurityService(db, mail), jwt = new JwtService({ secret: 'password-tests-only' });
  const auth = new AuthService(db, jwt, security, mail), passwords = new PasswordService(db, security, mail, sms);
  const strategy = new JwtStrategy(new ConfigService({ jwt: { secret: 'password-tests-only' } }), db);
  const ids: string[] = [], password = 'Original-password-927!', next = 'Changed-password-428!';
  async function account() {
    const email = `password-${randomUUID()}@example.invalid`;
    const c = await auth.register({ email, password, fullName: 'Password test' });
    const user = await db.user.findUniqueOrThrow({ where: { email } }); ids.push(user.id);
    const session = await auth.verifyChallenge(c.challengeToken, sent.get(email)!); assert.ok('token' in session);
    return { email, user, claims: jwt.decode(session.token) as any };
  }
  async function grant(email: string) { const c = await passwords.request(email, 'email'); return passwords.verify(c.challengeToken, sent.get(email)!); }
  try {
    await t.test('current password required; all sessions and stale login proofs revoked', async () => {
      const a = await account();
      await assert.rejects(passwords.change(a.user.id, 'wrong', next));
      await assert.rejects(passwords.change(a.user.id, password, password));
      await assert.rejects(passwords.change(a.user.id, password, 'short'));
      await passwords.change(a.user.id, password, next);
      await assert.rejects(strategy.validate(a.claims));
      await assert.rejects(auth.login({ email: a.email, password }));
      assert.ok('token' in await auth.login({ email: a.email, password: next }));
      await assert.rejects(security.afterPassword(a.user.id, 0));
      await assert.rejects(security.createChallenge(a.user.id, 'email', 0));
    });
    await t.test('generic requests, cooldown, single-use OTP, reset grant and simultaneous reset', async () => {
      const a = await account();
      const c = await passwords.request(a.email, 'email');
      const unknown = await passwords.request('missing@example.invalid', 'email');
      assert.equal(c.message, unknown.message); assert.equal(c.challengeToken.length, unknown.challengeToken.length);
      await assert.rejects(passwords.verify(unknown.challengeToken, '000000'));
      const code = sent.get(a.email)!;
      const cooldown = await passwords.request(a.email, 'email');
      await assert.rejects(passwords.verify(cooldown.challengeToken, code));
      const g = await passwords.verify(c.challengeToken, code);
      await assert.rejects(passwords.verify(c.challengeToken, code));
      await assert.rejects(auth.verifyChallenge(g.resetToken, code));
      const results = await Promise.allSettled([1,2].map(() => passwords.reset(g.resetToken, next)));
      assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
      await assert.rejects(passwords.reset(g.resetToken, 'Another-password-123'));
      await assert.rejects(strategy.validate(a.claims));
      await assert.rejects(auth.login({ email: a.email, password }));
      assert.ok('token' in await auth.login({ email: a.email, password: next }));
    });
    await t.test('attempt cap and expiration; registration codes cannot reset a password', async () => {
      const a = await account(), c = await passwords.request(a.email, 'email');
      const correct = sent.get(a.email)!, wrong = correct === '000000' ? '111111' : '000000';
      for (let i=0;i<5;i++) await assert.rejects(passwords.verify(c.challengeToken, wrong));
      await assert.rejects(passwords.verify(c.challengeToken, correct));
      assert.ok((await db.accountSecurity.findUniqueOrThrow({ where: { userId: a.user.id } })).recoveryLockedUntil! > new Date());
      assert.ok('token' in await auth.login({ email: a.email, password }));
      const b = await account(), expired = await passwords.request(b.email, 'email');
      await db.authChallenge.updateMany({ where: { userId: b.user.id }, data: { expiresAt: new Date(0) } });
      await assert.rejects(passwords.verify(expired.challengeToken, sent.get(b.email)!));
      const registration = await security.createChallenge(b.user.id, 'email');
      await assert.rejects(passwords.verify(registration.challengeToken, sent.get(b.email)!));
    });
    await t.test('recovery keeps 2FA enabled and requires an unused second factor', async () => {
      const a = await account(), setup = await security.startSetup(a.user.id, password);
      const activated = await security.confirmSetup(a.user.id, password, new OTPAuth.TOTP({ secret: setup.secret }).generate());
      const g = await grant(a.email); assert.equal(g.requiresTwoFactor, true);
      await assert.rejects(passwords.reset(g.resetToken, next));
      await passwords.reset(g.resetToken, next, activated.recoveryCodes[0]);
      const status = await security.status(a.user.id); assert.equal(status.twoFactorEnabled, true); assert.equal(status.recoveryCodesRemaining, 7);
      const login = await auth.login({ email: a.email, password: next }); assert.ok('step' in login);
      await assert.rejects(auth.verifyChallenge(login.challengeToken, activated.recoveryCodes[0]));
      assert.ok('token' in await auth.verifyChallenge(login.challengeToken, activated.recoveryCodes[1]));
    });
    await t.test('SMS disabled without provider; only verified bound phone can recover', async () => {
      const a = await account(); process.env.SMS_MODE = 'disabled';
      assert.equal(passwords.options().smsAvailable, false);
      await assert.rejects(passwords.request(a.email, 'sms'));
      process.env.SMS_MODE = 'preview';
      await passwords.request(a.email, 'sms'); assert.equal(sent.has('+15555550101'), false);
      const c = await passwords.startPhone(a.user.id, '+15555550101', password);
      await assert.rejects(passwords.verifyPhone('wrong-owner', c.challengeToken, sent.get('+15555550101')!));
      await passwords.verifyPhone(a.user.id, c.challengeToken, sent.get('+15555550101')!);
      await assert.rejects(strategy.validate(a.claims));
      const r = await passwords.request(a.email, 'sms');
      const g = await passwords.verify(r.challengeToken, sent.get('+15555550101')!);
      await passwords.reset(g.resetToken, next);
      assert.ok('token' in await auth.login({ email: a.email, password: next }));
    });
  } finally { delete process.env.SMS_MODE; await db.user.deleteMany({ where: { id: { in: ids } } }); await db.$disconnect(); }
});
