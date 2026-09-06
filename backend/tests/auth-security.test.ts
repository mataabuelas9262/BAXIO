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
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';

test('OTP and 2FA resist bypass, replay and concurrent recovery-code reuse', async t => {
  Object.assign(process.env, getE2eEnvironment());
  assert.equal(new URL(process.env.DATABASE_URL!).pathname, '/baxio_e2e');
  const db = new PrismaService(), sent = new Map<string, string>();
  const mail = new OtpMailService(); mail.sendCode = async (email, code) => { sent.set(email, code); };
  const security = new AuthSecurityService(db, mail);
  const jwt = new JwtService({ secret: 'auth-security-tests-only-not-a-production-key' });
  const auth = new AuthService(db, jwt, security, mail);
  const strategy = new JwtStrategy(new ConfigService({ jwt: { secret: 'auth-security-tests-only-not-a-production-key' } }), db);
  const ids: string[] = [], password = 'Test-password-927!';
  async function register() {
    const email = `security-${randomUUID()}@example.invalid`;
    const challenge = await auth.register({ email, password, fullName: 'Security test' });
    const user = await db.user.findUniqueOrThrow({ where: { email } }); ids.push(user.id);
    return { email, challenge, user };
  }
  try {
    await t.test('registration creates no session; OTP expires and has a persistent attempt cap', async () => {
      const { email, user, challenge } = await register();
      assert.equal(challenge.step, 'email'); assert.ok(!('token' in challenge));
      await assert.rejects(auth.issueSession(user.id));
      await assert.rejects(strategy.validate({ sub: user.id, email }));
      await assert.rejects(security.resend(challenge.challengeToken), /minuto/);
      const code = sent.get(email)!;
      const wrong = code === '000000' ? '111111' : '000000';
      for (let i=0; i<5; i++) await assert.rejects(auth.verifyChallenge(challenge.challengeToken, wrong));
      await assert.rejects(auth.verifyChallenge(challenge.challengeToken, code));
      const state = await db.accountSecurity.findUniqueOrThrow({ where: { userId: user.id } });
      assert.equal(state.failedAttempts, 5); assert.ok(state.lockedUntil! > new Date());
      const other = await register();
      await db.authChallenge.updateMany({ where: { userId: other.user.id }, data: { expiresAt: new Date(Date.now()-1000) } });
      await assert.rejects(auth.verifyChallenge(other.challenge.challengeToken, sent.get(other.email)!));
    });
    await t.test('resend invalidates the previous challenge; enabled 2FA cannot be bypassed by passwords or old sessions', async () => {
      const { email, user, challenge } = await register();
      await db.authChallenge.updateMany({ where: { userId: user.id }, data: { sentAt: new Date(Date.now()-61_000) } });
      const next = await security.resend(challenge.challengeToken);
      await assert.rejects(auth.verifyChallenge(challenge.challengeToken, sent.get(email)!));
      const logged = await auth.verifyChallenge(next.challengeToken, sent.get(email)!); assert.ok('token' in logged);
      await assert.rejects(auth.verifyChallenge(next.challengeToken, sent.get(email)!));
      const oldClaims = jwt.decode(logged.token) as { sub: string; email: string; sessionVersion: number };
      assert.ok(await strategy.validate(oldClaims));
      await assert.rejects(security.startSetup(user.id, 'wrong-password'));
      const setup = await security.startSetup(user.id, password);
      const otp = new OTPAuth.TOTP({ secret: setup.secret });
      const before = await auth.login({ email, password }); assert.ok('token' in before);
      const enabled = await security.confirmSetup(user.id, password, otp.generate());
      assert.equal(enabled.recoveryCodes.length, 8);
      await assert.rejects(strategy.validate(oldClaims));
      await assert.rejects(auth.issueSession(user.id));
      const login = await auth.login({ email, password }); assert.ok('step' in login); assert.equal(login.step, 'two-factor');
      await assert.rejects(auth.verifyChallenge(login.challengeToken, otp.generate())); // setup step cannot be reused
      const attempts = await Promise.allSettled([1,2].map(() => auth.verifyChallenge(login.challengeToken, enabled.recoveryCodes[0])));
      assert.equal(attempts.filter(r => r.status === 'fulfilled').length, 1);
      const later = await auth.login({ email, password }); assert.ok('step' in later);
      await assert.rejects(auth.verifyChallenge(later.challengeToken, enabled.recoveryCodes[0]));
      // A new time step works once. Move only the stored replay marker, not the system clock.
      await db.accountSecurity.update({ where: { userId: user.id }, data: { lastTotpStep: -1 } });
      const verified = await auth.verifyChallenge(later.challengeToken, otp.generate()); assert.ok('token' in verified);
      const newest = await auth.login({ email, password }); assert.ok('step' in newest);
      await assert.rejects(auth.verifyChallenge(newest.challengeToken, otp.generate()));
      const state = await db.accountSecurity.findUniqueOrThrow({ where: { userId: user.id } });
      assert.ok(!state.totpSecret!.includes(setup.secret));
      assert.ok(!JSON.stringify(state.recoveryHashes).includes(enabled.recoveryCodes[1]));
      await assert.rejects(security.disable(user.id, 'wrong', enabled.recoveryCodes[1]));
      const disabled = await security.disable(user.id, password, enabled.recoveryCodes[1]);
      await assert.rejects(strategy.validate(jwt.decode(verified.token) as any));
      assert.ok('token' in await auth.issueSession(user.id, disabled.sessionVersion));
      assert.equal((await security.status(user.id)).twoFactorEnabled, false);
    });
  } finally { await db.user.deleteMany({ where: { id: { in: ids } } }); await db.$disconnect(); }
});
