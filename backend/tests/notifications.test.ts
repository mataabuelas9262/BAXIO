import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { NotificationsService } from '../src/notifications/notifications.service';

test('notifications are always scoped to the current user', async () => {
  const calls: Array<{ kind: string; input: any }> = [];
  const prisma = {
    notification: {
      findMany: (input: any) => { calls.push({ kind: 'find', input }); return input; },
      count: (input: any) => { calls.push({ kind: 'count', input }); return input; },
      updateMany: async (input: any) => { calls.push({ kind: 'update', input }); return { count: 1 }; },
      create: async (input: any) => input.data,
    },
    $transaction: async (queries: any[]) => [queries[0], 3],
  } as any;
  const service = new NotificationsService(prisma);
  const result = await service.list('user-a');
  assert.equal(result.unread, 3);
  assert.equal(calls[0].input.where.userId, 'user-a');
  assert.equal(calls[1].input.where.userId, 'user-a');
  await service.markRead('user-a', 'notification-1');
  assert.deepEqual(calls[2].input.where, { id: 'notification-1', userId: 'user-a' });
});
