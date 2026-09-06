export function validateJwtSecret(secret: string | undefined) {
  if (!secret || secret.length < 48 || /baxio|default|change|example|replace|secret|test/i.test(secret)) {
    throw new Error('JWT_SECRET debe ser privado y aleatorio, de al menos 48 caracteres. No uses valores de ejemplo.');
  }
}
