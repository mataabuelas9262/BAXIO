import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// Additive migration for installations imported from SQL, without resetting data.
const prisma = new PrismaClient();
async function main() {
  for (const table of ['ServiceImage', 'JobRequestImage']) {
    const columns = await prisma.$queryRaw<Array<{ n: bigint }>>`SELECT COUNT(*) AS n FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER(${table}) AND COLUMN_NAME = 'isIllustrative'`;
    if (Number(columns[0].n) === 0) {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`${table}\` ADD COLUMN \`isIllustrative\` BOOLEAN NOT NULL DEFAULT false`);
      console.log(`${table}: campo de imagen ilustrativa añadido.`);
    }
  }
}
main().catch(() => { console.error('No se pudo aplicar la migración de imágenes. Revisa la conexión y los permisos de la base.'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
