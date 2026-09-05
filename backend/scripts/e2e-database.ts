import { execFileSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const backendRoot = join(__dirname, '..');

function getDevelopmentDatabaseUrl() {
  const envPath = join(backendRoot, '.env');
  if (!existsSync(envPath)) {
    throw new Error('Falta backend/.env; no se puede preparar la base E2E.');
  }

  const match = readFileSync(envPath, 'utf8').match(/^DATABASE_URL\s*=\s*["']?([^\r\n"']+)/m);
  if (!match) {
    throw new Error('DATABASE_URL no está definida en backend/.env.');
  }

  return match[1].trim();
}

export function getE2eEnvironment() {
  const databaseUrl = new URL(getDevelopmentDatabaseUrl());
  databaseUrl.pathname = '/baxio_e2e';

  if (databaseUrl.pathname !== '/baxio_e2e') {
    throw new Error('La base E2E debe llamarse exactamente baxio_e2e.');
  }

  return {
    ...process.env,
    DATABASE_URL: databaseUrl.toString(),
    NODE_ENV: 'test',
    PORT: '4001',
    FRONTEND_URL: 'http://localhost:3001',
    UPLOADS_DIR: join(backendRoot, 'uploads-e2e'),
  };
}

export function resetE2eDatabase() {
  const env = getE2eEnvironment();
  console.log('Preparando base de datos aislada para E2E…');

  execFileSync(process.execPath, [require.resolve('prisma/build/index.js'), 'db', 'push', '--force-reset', '--skip-generate'], {
    cwd: backendRoot,
    env,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [require.resolve('ts-node/dist/bin.js'), 'prisma/seed.ts'], {
    cwd: backendRoot,
    env,
    stdio: 'inherit',
  });
}
