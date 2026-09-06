import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS AccountSecurity (
    userId VARCHAR(191) NOT NULL PRIMARY KEY,
    emailVerifiedAt DATETIME(3) NULL, emailRequired BOOLEAN NOT NULL DEFAULT false,
    totpSecret TEXT NULL, pendingSecret TEXT NULL, pendingExpiresAt DATETIME(3) NULL,
    twoFactorEnabled BOOLEAN NOT NULL DEFAULT false, lastTotpStep BIGINT NOT NULL DEFAULT -1,
    recoveryHashes JSON NULL, sessionVersion INTEGER NOT NULL DEFAULT 0,
    failedAttempts INTEGER NOT NULL DEFAULT 0, lockedUntil DATETIME(3) NULL,
    CONSTRAINT AccountSecurity_userId_fkey FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS AuthChallenge (
    id VARCHAR(191) NOT NULL PRIMARY KEY, userId VARCHAR(191) NOT NULL,
    purpose VARCHAR(32) NOT NULL, tokenHash VARCHAR(64) NOT NULL, codeHash VARCHAR(64) NULL,
    sessionVersion INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
    expiresAt DATETIME(3) NOT NULL, sentAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX AuthChallenge_tokenHash_key(tokenHash), UNIQUE INDEX AuthChallenge_userId_purpose_key(userId,purpose),
    INDEX AuthChallenge_expiresAt_idx(expiresAt),
    CONSTRAINT AuthChallenge_userId_fkey FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log('Tablas OTP/2FA listas; cuentas existentes conservadas.');
}
main().catch(() => { console.error('No se pudo aplicar la migración OTP/2FA.'); process.exitCode=1; }).finally(() => db.$disconnect());
