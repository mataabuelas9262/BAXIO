import { expect, test, type APIRequestContext } from '@playwright/test';

const apiBaseUrl = process.env.PLAYWRIGHT_API_URL || 'http://localhost:4001/api';

type Session = { token: string; user: { id: string } };

const unwrap = <T>(body: { data?: T } | T): T =>
  typeof body === 'object' && body !== null && 'data' in body
    ? (body as { data: T }).data
    : (body as T);

async function login(request: APIRequestContext, email: string): Promise<Session> {
  const response = await request.post(`${apiBaseUrl}/auth/login`, {
    headers: { Cookie: '' },
    data: { email, password: 'password123' },
  });
  expect(response.ok()).toBeTruthy();
  return unwrap<Session>(await response.json());
}

// La API prioriza la cookie sobre Authorization. Las pruebas usan tokens por
// usuario y vacían la cookie compartida para poder representar dos cuentas.
const auth = (session: Session) => ({
  Authorization: `Bearer ${session.token}`,
  Cookie: '',
});

async function firstCategoryId(request: APIRequestContext) {
  const response = await request.get(`${apiBaseUrl}/categories`);
  expect(response.ok()).toBeTruthy();
  const categories = unwrap<Array<{ id: string }>>(await response.json());
  expect(categories.length).toBeGreaterThan(0);
  return categories[0].id;
}

test.describe('flujos E2E con base aislada', () => {
  test('crea, edita y elimina servicios y solicitudes respetando permisos', async ({ request }) => {
    const client = await login(request, 'kevin@baxio.com');
    const worker = await login(request, 'juan.electricista@baxio.com');
    const categoryId = await firstCategoryId(request);
    const suffix = Date.now();

    const createdService = await request.post(`${apiBaseUrl}/services`, {
      headers: auth(client),
      data: {
        title: `Servicio E2E ${suffix}`,
        description: 'Servicio temporal creado automáticamente por Playwright.',
        categoryId,
        pricingType: 'FIXED',
        price: 350,
        location: 'Monterrey, NL',
      },
    });
    expect(createdService.status()).toBe(201);
    const service = unwrap<{ id: string }>(await createdService.json());

    const forbiddenServiceEdit = await request.patch(`${apiBaseUrl}/services/${service.id}`, {
      headers: auth(worker),
      data: { title: 'Intento ajeno' },
    });
    expect(forbiddenServiceEdit.status()).toBe(403);

    const updatedService = await request.patch(`${apiBaseUrl}/services/${service.id}`, {
      headers: auth(client),
      data: { title: `Servicio E2E editado ${suffix}` },
    });
    expect(updatedService.ok()).toBeTruthy();
    expect(unwrap<{ title: string }>(await updatedService.json()).title).toContain('editado');

    const deletedService = await request.delete(`${apiBaseUrl}/services/${service.id}`, {
      headers: auth(client),
    });
    expect(deletedService.ok()).toBeTruthy();

    const createdJob = await request.post(`${apiBaseUrl}/job-requests`, {
      headers: auth(client),
      data: {
        title: `Solicitud E2E ${suffix}`,
        description: 'Solicitud temporal para validar privacidad y permisos.',
        categoryId,
        location: 'Monterrey Centro',
        exactAddress: 'Dirección privada exclusiva de E2E',
        budgetMin: 500,
        budgetMax: 900,
      },
    });
    expect(createdJob.status()).toBe(201);
    const job = unwrap<{ id: string }>(await createdJob.json());

    const publicJob = await request.get(`${apiBaseUrl}/job-requests/${job.id}`);
    expect(publicJob.ok()).toBeTruthy();
    expect(unwrap<Record<string, unknown>>(await publicJob.json()).exactAddress).toBeUndefined();

    const forbiddenJobEdit = await request.patch(`${apiBaseUrl}/job-requests/${job.id}`, {
      headers: auth(worker),
      data: { title: 'Intento ajeno' },
    });
    expect(forbiddenJobEdit.status()).toBe(403);

    const updatedJob = await request.patch(`${apiBaseUrl}/job-requests/${job.id}`, {
      headers: auth(client),
      data: { title: `Solicitud E2E editada ${suffix}` },
    });
    expect(updatedJob.ok()).toBeTruthy();

    const deletedJob = await request.delete(`${apiBaseUrl}/job-requests/${job.id}`, {
      headers: auth(client),
    });
    expect(deletedJob.ok()).toBeTruthy();
  });

  test('completa contratación, mensajería, bloqueo, reporte y reseña', async ({ request }) => {
    const client = await login(request, 'kevin@baxio.com');
    const worker = await login(request, 'juan.electricista@baxio.com');
    const categoryId = await firstCategoryId(request);
    const suffix = Date.now();

    const jobResponse = await request.post(`${apiBaseUrl}/job-requests`, {
      headers: auth(client),
      data: {
        title: `Flujo E2E ${suffix}`,
        description: 'Solicitud temporal para validar el ciclo completo.',
        categoryId,
        location: 'Monterrey Centro',
        budgetMin: 800,
        budgetMax: 1200,
      },
    });
    const job = unwrap<{ id: string }>(await jobResponse.json());

    const proposalResponse = await request.post(`${apiBaseUrl}/proposals`, {
      headers: auth(worker),
      data: {
        jobRequestId: job.id,
        price: 950,
        message: 'Propuesta temporal de Playwright.',
        estimatedDays: 1,
      },
    });
    expect(proposalResponse.status()).toBe(201);
    const proposal = unwrap<{ id: string }>(await proposalResponse.json());

    const acceptedResponse = await request.patch(`${apiBaseUrl}/proposals/${proposal.id}/accept`, {
      headers: auth(client),
    });
    expect(acceptedResponse.ok()).toBeTruthy();
    const acceptance = unwrap<{ workOrder: { id: string } }>(await acceptedResponse.json());
    const workOrderId = acceptance.workOrder.id;

    const messageResponse = await request.post(`${apiBaseUrl}/messages/work-orders/${workOrderId}`, {
      headers: auth(client),
      data: { content: 'Mensaje E2E original' },
    });
    expect(messageResponse.status()).toBe(201);
    const message = unwrap<{ id: string; content: string }>(await messageResponse.json());

    const forbiddenMessageEdit = await request.patch(`${apiBaseUrl}/messages/${message.id}`, {
      headers: auth(worker),
      data: { content: 'Intento ajeno' },
    });
    expect(forbiddenMessageEdit.status()).toBe(403);

    const updatedMessage = await request.patch(`${apiBaseUrl}/messages/${message.id}`, {
      headers: auth(client),
      data: { content: 'Mensaje E2E editado' },
    });
    expect(updatedMessage.ok()).toBeTruthy();

    const reportedMessage = await request.post(`${apiBaseUrl}/messages/reports`, {
      headers: auth(worker),
      data: { messageId: message.id, reason: 'Otro', details: 'Prueba automatizada' },
    });
    expect(reportedMessage.status()).toBe(201);

    const blockResponse = await request.post(`${apiBaseUrl}/messages/blocks/${client.user.id}`, {
      headers: auth(worker),
    });
    expect(blockResponse.status()).toBe(201);

    const blockedMessage = await request.post(`${apiBaseUrl}/messages/work-orders/${workOrderId}`, {
      headers: auth(client),
      data: { content: 'No debe enviarse' },
    });
    expect(blockedMessage.status()).toBe(403);

    const unblockResponse = await request.delete(`${apiBaseUrl}/messages/blocks/${client.user.id}`, {
      headers: auth(worker),
    });
    expect(unblockResponse.ok()).toBeTruthy();

    const deletedMessage = await request.delete(`${apiBaseUrl}/messages/${message.id}`, {
      headers: auth(client),
    });
    expect(deletedMessage.ok()).toBeTruthy();

    const completionRequested = await request.patch(`${apiBaseUrl}/work-orders/${workOrderId}/status`, {
      headers: auth(worker),
      data: { status: 'COMPLETED' },
    });
    expect(completionRequested.ok()).toBeTruthy();
    expect(unwrap<{ status: string }>(await completionRequested.json()).status).toBe('COMPLETION_PENDING');

    const completed = await request.patch(`${apiBaseUrl}/work-orders/${workOrderId}/status`, {
      headers: auth(client),
      data: { status: 'COMPLETED' },
    });
    expect(completed.ok()).toBeTruthy();
    expect(unwrap<{ status: string }>(await completed.json()).status).toBe('COMPLETED');

    const reviewResponse = await request.post(`${apiBaseUrl}/reviews`, {
      headers: auth(client),
      data: { workOrderId, rating: 5, comment: 'Reseña temporal E2E.' },
    });
    expect(reviewResponse.status()).toBe(201);
  });
});
