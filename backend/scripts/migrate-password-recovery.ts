import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const columns = [
    ['AccountSecurity', 'verifiedPhone', 'VARCHAR(16) NULL'],
    ['AccountSecurity', 'phoneVerifiedAt', 'DATETIME(3) NULL'],
    ['AccountSecurity', 'recoveryAttempts', 'INTEGER NOT NULL DEFAULT 0'],
    ['AccountSecurity', 'recoveryLockedUntil', 'DATETIME(3) NULL'],
    ['AuthChallenge', 'destination', 'VARCHAR(191) NULL'],
  ];
  for (const [table, column, definition] of columns) {
    const rows = await db.$queryRaw<Array<{ n: bigint }>>`SELECT COUNT(*) n FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=${table} AND COLUMN_NAME=${column}`;
    if (Number(rows[0].n) === 0) await db.$executeRawUnsafe(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
  console.log('Recuperación de contraseña preparada sin modificar cuentas.');
}
main().catch(() => { console.error('No se pudo aplicar la migración de recuperación.'); process.exitCode=1; }).finally(() => db.$disconnect());
