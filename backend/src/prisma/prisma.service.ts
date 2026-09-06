import { Injectable, OnModuleInit, OnModuleDestroy, ConflictException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

export function pooledDatabaseUrl(raw: string): string {
  const url = new URL(raw);
  for (const [key, fallback] of [['connection_limit', '10'], ['pool_timeout', '10']]) {
    const value = url.searchParams.get(key) ?? fallback;
    if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 100) {
      throw new Error(`Configuración inválida de ${key}: debe estar entre 1 y 100`);
    }
    url.searchParams.set(key, value);
  }
  return url.toString();
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super(process.env.DATABASE_URL ? { datasources: { db: { url: pooledDatabaseUrl(process.env.DATABASE_URL) } } } : undefined);
  }

  // Retry the entire DB-only transaction; never put external side effects here.
  async withTransaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.$transaction(operation, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5_000,
          timeout: 10_000,
        });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2034') throw error;
        if (attempt >= 2) throw new ConflictException('Otra operación modificó estos datos. Actualiza e inténtalo de nuevo.');
        await new Promise(resolve => setTimeout(resolve, 40 * (attempt + 1) + Math.random() * 50));
      }
    }
  }

  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
