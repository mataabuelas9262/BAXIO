import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import * as express from 'express';
import { once } from 'node:events';
import { getE2eEnvironment } from '../scripts/e2e-database';
import { PrismaService, pooledDatabaseUrl } from '../src/prisma/prisma.service';
import { ProposalsRepository } from '../src/proposals/proposals.repository';
import { ReviewsRepository } from '../src/reviews/reviews.repository';
import { WorkOrdersRepository } from '../src/work-orders/work-orders.repository';
import { WorkOrdersService } from '../src/work-orders/work-orders.service';
import { createApiLimiters } from '../src/common/api-rate-limit';

// Never reset the development database; fixtures and cleanup are scoped to generated IDs.
test('concurrency protection against a real isolated MySQL database', async t => {
  const env = getE2eEnvironment();
  assert.equal(new URL(env.DATABASE_URL).pathname, '/baxio_e2e');
  Object.assign(process.env, env);
  const db = new PrismaService();
  const userIds: string[] = [], jobIds: string[] = [];
  try {
    const category = await db.category.findFirstOrThrow();
    for (let i = 0; i < 4; i++) {
      const u = await db.user.create({ data: { email: `concurrency-${randomUUID()}@example.invalid`, fullName: 'Concurrency fixture', passwordHash: 'not-a-login-hash' } });
      userIds.push(u.id);
    }
    const [client, client2, worker, worker2] = userIds;
    const proposals = new ProposalsRepository(db);
    const orders = new WorkOrdersRepository(db);
    async function job(owner = client) {
      const row = await db.jobRequest.create({ data: { userId: owner, categoryId: category.id, title: 'Concurrency fixture', description: 'Test only', location: 'QA' } });
      jobIds.push(row.id); return row;
    }
    async function proposal(jobRequestId: string, workerId: string) {
      return proposals.create(workerId, { jobRequestId, price: 100, message: 'QA' });
    }
    await t.test('two acceptances produce exactly one order and one accepted proposal', async () => {
      const j = await job();
      const pair = await Promise.all([proposal(j.id, worker), proposal(j.id, worker2)]);
      const results = await Promise.allSettled(pair.map(p => proposals.acceptProposalTransaction(p.id, j.id, client, p.workerId, 100)));
      assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
      assert.equal(await db.workOrder.count({ where: { jobRequestId: j.id } }), 1);
      assert.equal(await db.proposal.count({ where: { jobRequestId: j.id, status: 'ACCEPTED' } }), 1);
      assert.equal(await db.proposal.count({ where: { jobRequestId: j.id, status: 'REJECTED' } }), 1);
      const order = await db.workOrder.findUniqueOrThrow({ where: { jobRequestId: j.id } });
      assert.equal(await db.notification.count({ where: { userId: order.workerId, type: 'PROPOSAL_ACCEPTED' } }), 1);
      const writes = await Promise.allSettled([
        orders.updateStatus(order.id, 'CANCELLED', 'IN_PROGRESS'),
        orders.updateStatus(order.id, 'COMPLETION_PENDING', 'IN_PROGRESS'),
      ]);
      assert.equal(writes.filter(r => r.status === 'fulfilled').length, 1);
      await db.workOrder.update({ where: { id: order.id }, data: { status: 'COMPLETED' } });
      await assert.rejects(new WorkOrdersService(orders).updateStatus(order.id, client, 'IN_PROGRESS'));
    });
    await t.test('concurrent reviews retain both ratings and prevent duplicate submissions', async () => {
      const completed = [];
      for (const owner of [client, client2]) {
        const j = await job(owner); const p = await proposal(j.id, worker);
        const { workOrder } = await proposals.acceptProposalTransaction(p.id, j.id, owner, worker, 100);
        completed.push(await db.workOrder.update({ where: { id: workOrder.id }, data: { status: 'COMPLETED' } }));
      }
      const reviews = new ReviewsRepository(db);
      await Promise.all(completed.map((o, i) => reviews.create(o.clientId, { workOrderId: o.id, rating: i ? 5 : 1 })));
      const target = await db.user.findUniqueOrThrow({ where: { id: worker } });
      assert.equal(target.workerRatingCnt, 2); assert.equal(Number(target.workerRatingAvg), 3);
      const j = await job(); const p = await proposal(j.id, worker);
      const { workOrder } = await proposals.acceptProposalTransaction(p.id, j.id, client, worker, 100);
      await db.workOrder.update({ where: { id: workOrder.id }, data: { status: 'COMPLETED' } });
      const duplicates = await Promise.allSettled([1, 2].map(() => reviews.create(client, { workOrderId: workOrder.id, rating: 3 })));
      assert.equal(duplicates.filter(r => r.status === 'fulfilled').length, 1);
      assert.equal(await db.review.count({ where: { workOrderId: workOrder.id, authorId: client } }), 1);
    });
    await t.test('HTTP burst is limited before SQL; admitted queries complete with a bounded pool', async () => {
      const app = express(); const limiters = createApiLimiters({ ...process.env, API_RATE_LIMIT: '240', AUTH_RATE_LIMIT: '15' });
      app.use('/api', limiters.api); app.use('/api/auth/login', limiters.auth);
      app.post('/api/auth/login', (_req, res) => res.sendStatus(401));
      let sqlQueries = 0;
      app.get('/api/categories', async (_req, res) => {
        try { sqlQueries++; res.json(await db.category.findMany()); } catch { res.sendStatus(500); }
      });
      const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
      const port = (server.address() as { port: number }).port;
      const durations: number[] = [], statuses: number[] = [];
      try {
        let next = 0;
        await Promise.all(Array.from({ length: 20 }, async () => {
          while (next++ < 300) {
            const start = performance.now();
            const response = await fetch(`http://127.0.0.1:${port}/api/categories`, { headers: { 'X-Forwarded-For': `192.0.2.${next % 250}` } });
            await response.text(); durations.push(performance.now() - start); statuses.push(response.status);
            if (response.status === 429) assert.ok(Number(response.headers.get('retry-after')) > 0);
          }
        }));
        assert.equal(statuses.filter(s => s === 200).length, 240);
        assert.equal(statuses.filter(s => s === 429).length, 60);
        assert.equal(sqlQueries, 240);
        durations.sort((a, b) => a - b);
        console.log(JSON.stringify({ requests: statuses.length, concurrency: 20, admitted: 240, rejected: 60, errors500: statuses.filter(s => s >= 500).length, p95Ms: Math.round(durations[Math.floor(durations.length * .95)]) }));
      } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
      const authApp = express(); authApp.use(createApiLimiters().auth); authApp.post('/', (_req, res) => res.sendStatus(401));
      const authServer = authApp.listen(0, '127.0.0.1'); await once(authServer, 'listening');
      try {
        const statuses = await Promise.all(Array.from({ length: 20 }, async () => (await fetch(`http://127.0.0.1:${(authServer.address() as { port: number }).port}/`, { method: 'POST' })).status));
        assert.equal(statuses.filter(s => s === 401).length, 15); assert.equal(statuses.filter(s => s === 429).length, 5);
      } finally { authServer.closeAllConnections(); await new Promise<void>(resolve => authServer.close(() => resolve())); }
    });
  } finally {
    await db.review.deleteMany({ where: { workOrder: { jobRequestId: { in: jobIds } } } });
    await db.notification.deleteMany({ where: { userId: { in: userIds } } });
    await db.workOrder.deleteMany({ where: { jobRequestId: { in: jobIds } } });
    await db.proposal.deleteMany({ where: { jobRequestId: { in: jobIds } } });
    await db.jobRequest.deleteMany({ where: { id: { in: jobIds } } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.$disconnect();
  }
});

test('connection pool has finite validated defaults', () => {
  const url = new URL(pooledDatabaseUrl('mysql://test:test@localhost/baxio_e2e'));
  assert.equal(url.searchParams.get('connection_limit'), '10');
  assert.equal(url.searchParams.get('pool_timeout'), '10');
  assert.throws(() => pooledDatabaseUrl('mysql://test:test@localhost/db?pool_timeout=0'));
});

test('transaction retries are bounded and only retry write conflicts', async () => {
  const { Prisma } = await import('@prisma/client');
  const db = new PrismaService();
  let attempts = 0;
  const conflict = () => new Prisma.PrismaClientKnownRequestError('test conflict', { code: 'P2034', clientVersion: '5.22.0' });
  (db as any).$transaction = async () => { attempts++; if (attempts < 3) throw conflict(); return 'ok'; };
  assert.equal(await db.withTransaction(async () => 'unused'), 'ok'); assert.equal(attempts, 3);
  attempts = 0;
  (db as any).$transaction = async () => { attempts++; throw conflict(); };
  await assert.rejects(db.withTransaction(async () => null), /Otra operación/); assert.equal(attempts, 3);
  attempts = 0;
  (db as any).$transaction = async () => { attempts++; throw new Error('not retryable'); };
  await assert.rejects(db.withTransaction(async () => null), /not retryable/); assert.equal(attempts, 1);
  await db.$disconnect();
});
