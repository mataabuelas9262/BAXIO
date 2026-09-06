import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { validateProduction } from '../src/config/validate-production';
import { resolve } from 'path';
const valid = { MFA_ENCRYPTION_KEY: 'ab'.repeat(32), MAIL_MODE: 'smtp', SMTP_HOST: 'smtp.example.com', SMTP_FROM: 'BAXIO <auth@example.com>', NODE_ENV: 'production', JWT_SECRET: '9e8f1a'.repeat(12), DATABASE_URL: 'mysql://baxio_app:test-password@db:3306/baxio', FRONTEND_URL: 'https://baxio.example', UPLOADS_DIR: resolve('persistent-uploads') };
test('acepta una configuración de producción completa', () => assert.doesNotThrow(() => validateProduction(valid)));
test('rechaza secretos débiles, root, CORS abierto y almacenamiento no persistente', () => {
  for (const change of [{ MFA_ENCRYPTION_KEY: '' }, { MAIL_MODE: 'preview' }, { SMTP_HOST: '' }, { JWT_SECRET: 'short' }, { DATABASE_URL: 'mysql://root:password@db/baxio' }, { FRONTEND_URL: '*' }, { FRONTEND_URL: 'http://localhost:3000' }, { UPLOADS_DIR: 'uploads' }]) {
    assert.throws(() => validateProduction({ ...valid, ...change }));
  }
});
test('mantiene disponible el entorno local', () => assert.doesNotThrow(() => validateProduction({ NODE_ENV: 'development' })));
