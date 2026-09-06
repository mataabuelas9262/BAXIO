import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { randomBytes } from 'crypto';
import { validateJwtSecret } from '../src/config/validate-jwt-secret';
test('JWT refuses missing, short and example secrets even outside production', () => {
  for (const secret of [undefined, '', 'short', 'baxio_default_secret_key_2026', 'REPLACE_WITH_A_RANDOM_SECRET'.repeat(3)]) assert.throws(() => validateJwtSecret(secret));
  assert.doesNotThrow(() => validateJwtSecret(randomBytes(64).toString('hex')));
});
