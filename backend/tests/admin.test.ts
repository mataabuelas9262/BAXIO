import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { ForbiddenException } from '@nestjs/common';
import { ReportStatus, Role } from '@prisma/client';
import { AdminService } from '../src/admin/admin.service';

test('admin reports reject regular users and allow moderators without exposing passwords', async () => {
  const calls: unknown[] = [];
  const prisma = { messageReport: { findMany: async (input: unknown) => { calls.push(input); return []; }, updateMany: async () => ({ count: 1 }), findUniqueOrThrow: async () => ({ id: 'report-1', status: ReportStatus.REVIEWED }) } } as any;
  const service = new AdminService(prisma);
  await assert.rejects(service.listReports(Role.USER), ForbiddenException);
  assert.deepEqual(await service.listReports(Role.MODERATOR, ReportStatus.PENDING), []);
  assert.equal((calls[0] as { where: { status: ReportStatus } }).where.status, ReportStatus.PENDING);
  assert.equal((await service.updateReport(Role.ADMIN, 'report-1', ReportStatus.REVIEWED)).status, ReportStatus.REVIEWED);
});
