import { isAbsolute } from 'path';

export function validateProduction(env: NodeJS.ProcessEnv) {
  if (env.NODE_ENV !== 'production') return;
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 48 || /baxio|default|change|example/i.test(env.JWT_SECRET)) {
    throw new Error('Producción requiere un JWT_SECRET aleatorio de al menos 48 caracteres.');
  }
  if (!/^[a-f0-9]{64}$/i.test(env.MFA_ENCRYPTION_KEY || '')) throw new Error('Define MFA_ENCRYPTION_KEY como 32 bytes aleatorios en hexadecimal.');
  if (env.MAIL_MODE !== 'smtp' || !env.SMTP_HOST || !env.SMTP_FROM) throw new Error('Producción requiere SMTP para verificar correos; preview está prohibido.');
  if (env.SMS_MODE === 'preview') throw new Error('SMS preview está prohibido en producción.');
  let database: URL;
  try { database = new URL(env.DATABASE_URL || ''); } catch { throw new Error('DATABASE_URL no es válida.'); }
  if (database.protocol !== 'mysql:' || decodeURIComponent(database.username).toLowerCase() === 'root' || !database.password) {
    throw new Error('Usa un usuario MySQL específico con contraseña, distinto de root.');
  }
  const origins = (env.FRONTEND_URL || '').split(',').map(value => value.trim());
  if (!origins.length || origins.some(value => {
    try { const url = new URL(value); return url.protocol !== 'https:' || url.origin !== value || Boolean(url.username || url.password) || ['localhost', '127.0.0.1'].includes(url.hostname); }
    catch { return true; }
  })) throw new Error('FRONTEND_URL debe contener orígenes HTTPS reales, separados por comas.');
  if (!env.UPLOADS_DIR || !isAbsolute(env.UPLOADS_DIR)) throw new Error('Define UPLOADS_DIR como ruta absoluta a un volumen persistente.');
}
