import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

function positiveLimit(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new Error('Los límites de peticiones deben ser enteros positivos');
  return parsed;
}

// One backend process: the in-memory stores expire entries automatically.
// Multiple replicas require a shared store and a reviewed reverse-proxy setup.
export function createApiLimiters(env = process.env) {
  const common = {
    windowMs: 60_000,
    // The backend currently trusts no forwarding headers. Use the actual peer;
    // a proxy deployment must explicitly review client IP forwarding first.
    keyGenerator: (req: { socket: { remoteAddress?: string } }) => ipKeyGenerator(req.socket.remoteAddress || '127.0.0.1'),
    standardHeaders: 'draft-8' as const,
    legacyHeaders: false,
    skip: (req: { method: string }) => req.method === 'OPTIONS',
    message: { success: false, statusCode: 429, message: 'Has realizado demasiadas solicitudes. Espera un momento e inténtalo de nuevo.' },
  };
  return {
    api: rateLimit({ ...common, limit: positiveLimit(env.API_RATE_LIMIT, 240) }),
    auth: rateLimit({ ...common, limit: positiveLimit(env.AUTH_RATE_LIMIT, 15) }),
  };
}
