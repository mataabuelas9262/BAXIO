import { expect, test } from '@playwright/test';
const api = 'http://localhost:4001/api';

test('reporta usuarios y mensajes con motivo, detalles y reintento sin perder el formulario', async ({ request, page }, testInfo) => {
  const login = async (email: string) => {
    const response = await request.post(`${api}/auth/login`, { data: { email, password: 'password123' } });
    expect(response.ok()).toBeTruthy();
    return (await response.json()).data;
  };
  const client = await login('kevin@baxio.com');
  const worker = await login('juan.electricista@baxio.com');
  const auth = (session: { token: string }) => ({ Cookie: '', Authorization: `Bearer ${session.token}` });
  const categories = (await (await request.get(`${api}/categories`)).json()).data;
  const title = `Seguimiento para reportes ${Date.now()}`;
  const job = (await (await request.post(`${api}/job-requests`, { headers: auth(client), data: { title, description: 'Solicitud temporal de prueba.', categoryId: categories[0].id, location: 'Monterrey' } })).json()).data;
  const proposal = (await (await request.post(`${api}/proposals`, { headers: auth(worker), data: { jobRequestId: job.id, price: 100, message: 'Propuesta de prueba.' } })).json()).data;
  const acceptance = (await (await request.patch(`${api}/proposals/${proposal.id}/accept`, { headers: auth(client) })).json()).data;
  const content = `Mensaje de prueba para reporte ${Date.now()}`;
  const message = (await (await request.post(`${api}/messages/work-orders/${acceptance.workOrder.id}`, { headers: auth(client), data: { content } })).json()).data;

  for (const data of [
    { reportedUserId: client.user.id, reason: 'Inventado' },
    { reportedUserId: client.user.id, reason: 'Otro', details: '   ' },
    { reportedUserId: client.user.id, reason: 'Acoso o amenazas', details: 'x'.repeat(1001) },
    { messageId: message.id, reportedUserId: client.user.id, reason: 'Contenido inapropiado' },
  ]) expect((await request.post(`${api}/messages/reports`, { headers: auth(worker), data })).status()).toBe(400);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('baxio-theme', 'dark'));
  await page.request.post(`${api}/auth/login`, { data: { email: 'juan.electricista@baxio.com', password: 'password123' } });
  await page.goto('/my-orders');
  const card = page.locator('div').filter({ has: page.getByText(title, { exact: true }) }).filter({ has: page.getByRole('button', { name: 'Ver conversación', exact: true }) }).last();
  await card.getByRole('button', { name: 'Ver conversación', exact: true }).click();
  await page.getByRole('button', { name: 'Reportar usuario', exact: true }).click();
  let modal = page.getByRole('dialog', { name: 'Reportar usuario', exact: true });
  await expect(modal.getByRole('radio')).toHaveCount(5);
  await modal.getByRole('button', { name: 'Enviar reporte', exact: true }).click();
  await expect(modal.getByRole('alert')).toContainText('Selecciona un motivo');
  await modal.getByRole('radio', { name: 'Otro', exact: true }).check();
  await modal.getByRole('button', { name: 'Enviar reporte', exact: true }).click();
  await expect(modal.getByRole('alert')).toContainText('Explica brevemente');
  await modal.getByLabel('Cuéntanos qué ocurrió *', { exact: true }).fill('  Detalles de la prueba de reporte  ');
  await page.route('**/api/messages/reports', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Servicio temporalmente no disponible' }) }), { times: 1 });
  await modal.getByRole('button', { name: 'Enviar reporte', exact: true }).click();
  await expect(modal.getByRole('alert')).toContainText('temporalmente');
  await expect(modal.getByLabel('Cuéntanos qué ocurrió *', { exact: true })).toHaveValue('  Detalles de la prueba de reporte  ');
  const userResponse = page.waitForResponse(response => response.url().endsWith('/messages/reports') && response.status() === 201);
  await modal.getByRole('button', { name: 'Enviar reporte', exact: true }).click();
  const saved = (await (await userResponse).json()).data;
  expect(saved).toMatchObject({ reporterId: worker.user.id, reportedUserId: client.user.id, reason: 'Otro', details: 'Detalles de la prueba de reporte', status: 'PENDING' });
  await expect(page.getByRole('status').filter({ hasText: 'Reporte enviado' })).toBeVisible();

  await page.getByText(content, { exact: true }).locator('..').getByRole('button', { name: 'Reportar mensaje', exact: true }).click();
  modal = page.getByRole('dialog', { name: 'Reportar mensaje', exact: true });
  await expect(modal.getByText(content, { exact: true })).toBeVisible();
  await expect(modal.getByRole('radio', { name: 'Otro', exact: true })).not.toBeChecked();
  await modal.getByRole('radio', { name: 'Intento de estafa', exact: true }).check();
  await testInfo.attach('reporte-movil-oscuro', { body: await modal.screenshot(), contentType: 'image/png' });
  const messageResponse = page.waitForResponse(response => response.url().endsWith('/messages/reports') && response.status() === 201);
  await modal.getByRole('button', { name: 'Enviar reporte', exact: true }).click();
  expect((await (await messageResponse).json()).data).toMatchObject({ messageId: message.id, reportedUserId: client.user.id, reason: 'Intento de estafa' });
  await expect(page.getByRole('status').filter({ hasText: 'Reporte enviado' })).toBeVisible();
});
