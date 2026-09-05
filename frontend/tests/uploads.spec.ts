import { expect, test, type APIRequestContext } from '@playwright/test';
const sharp = require('../../backend/node_modules/sharp');
const api = 'http://localhost:4001/api';
const image = () => sharp({ create: { width: 96, height: 64, channels: 3, background: '#238888' } }).png().toBuffer();
async function login(request: APIRequestContext, email = 'kevin@baxio.com') {
  const response = await request.post(`${api}/auth/login`, { data: { email, password: 'password123' } });
  expect(response.ok()).toBeTruthy();
  return (await response.json()).data;
}

test('las subidas requieren sesión y rechazan contenido falso, exceso de tamaño y dimensiones inválidas', async ({ request }) => {
  const file = { name: 'foto.png', mimeType: 'image/png', buffer: await image() };
  expect((await request.post(`${api}/uploads/image`, { multipart: { file } })).status()).toBe(401);
  await login(request);
  for (const invalid of [
    { ...file, buffer: Buffer.from('<script>alert(1)</script>') },
    { ...file, mimeType: 'image/jpeg' },
    { ...file, buffer: Buffer.alloc(5 * 1024 * 1024 + 1) },
    { ...file, buffer: await sharp({ create: { width: 1, height: 1, channels: 3, background: '#ffffff' } }).png().toBuffer() },
    { ...file, buffer: await sharp({ create: { width: 8100, height: 32, channels: 3, background: '#ffffff' } }).png().toBuffer() },
  ]) expect([400, 413]).toContain((await request.post(`${api}/uploads/image`, { multipart: { file: invalid } })).status());
  expect((await request.post(`${api}/uploads/evidence`, { multipart: { file: { name: 'falso.pdf', mimeType: 'application/pdf', buffer: Buffer.from('not a pdf') } } })).status()).toBe(400);
});

test('las fotos se convierten a WebP y solo su dueño puede usarlas en nuevas publicaciones', async ({ request }) => {
  await login(request);
  const uploaded = await request.post(`${api}/uploads/image`, { multipart: { file: { name: 'foto.png', mimeType: 'image/png', buffer: await image() } } });
  expect(uploaded.ok()).toBeTruthy();
  const photo = (await uploaded.json()).data;
  const fileResponse = await request.get(`http://localhost:4001${photo.url}`);
  expect(fileResponse.headers()['content-type']).toContain('image/webp');
  const metadata = await sharp(await fileResponse.body()).metadata();
  expect(metadata.exif).toBeUndefined();
  expect(metadata.width).toBe(96);
  const categories = (await (await request.get(`${api}/categories`)).json()).data;
  const payload = { title: 'Servicio de prueba con fotografía', description: 'Descripción de prueba', categoryId: categories[0].id, location: 'Monterrey', pricingType: 'FIXED', price: 100, images: [{ imageUrl: photo.url, isIllustrative: true }] };
  const created = await request.post(`${api}/services`, { data: payload });
  expect(created.ok()).toBeTruthy();
  const service = (await created.json()).data;
  expect(service.images[0].isIllustrative).toBe(true);
  const update = await request.patch(`${api}/services/${service.id}`, { data: { title: 'Servicio actualizado' } });
  expect((await update.json()).data.images[0].isIllustrative).toBe(true);
  const jobResponse = await request.post(`${api}/job-requests`, { data: {
    title: 'Solicitud con foto ilustrativa', description: 'Descripción de prueba', categoryId: categories[0].id, location: 'Monterrey', images: payload.images,
  } });
  expect(jobResponse.ok()).toBeTruthy();
  const job = (await jobResponse.json()).data;
  expect(job.images[0].isIllustrative).toBe(true);
  const jobEdit = await request.patch(`${api}/job-requests/${job.id}`, { data: { images: [] } });
  expect((await jobEdit.json()).data.images).toHaveLength(0);
  await request.delete(`${api}/job-requests/${job.id}`);
  await login(request, 'juan.electricista@baxio.com');
  expect((await request.post(`${api}/services`, { data: payload })).status()).toBe(400);
  await login(request);
  const cleared = await request.patch(`${api}/services/${service.id}`, { data: { images: [] } });
  expect((await cleared.json()).data.images).toHaveLength(0);
  await request.delete(`${api}/services/${service.id}`);
});

test('publica una foto ilustrativa desde el formulario y puede quitarla al editar', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('baxio-theme', 'dark'));
  await login(page.request);
  await page.goto('/services/new');
  await page.getByLabel('Título del Servicio *', { exact: true }).fill('Galería de prueba E2E');
  await page.getByLabel('Descripción Detallada *', { exact: true }).fill('Trabajo de prueba con fotografía subida');
  await page.getByLabel('Ubicación Base *', { exact: true }).fill('Monterrey');
  await page.getByLabel('Añadir fotografías', { exact: true }).setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: await image() });
  await page.getByLabel('Imagen ilustrativa (IA o referencia)').check();
  await testInfo.attach('galeria-movil-oscuro', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  await page.getByRole('button', { name: 'Publicar Servicio en BAXIO' }).click();
  await expect(page).toHaveURL(/\/services\/(?!new)[^/]+$/);
  await expect(page.getByText('Imagen ilustrativa', { exact: true })).toBeVisible();
  const id = page.url().split('/').pop();
  await page.goto(`/services/new?edit=${id}`);
  await expect(page.getByLabel('Imagen ilustrativa (IA o referencia)')).toBeChecked();
  await page.getByRole('button', { name: 'Guardar Cambios' }).click();
  await expect(page).toHaveURL(new RegExp(`/services/${id}$`));
  await expect(page.getByText('Imagen ilustrativa', { exact: true })).toBeVisible();
  await page.goto(`/services/new?edit=${id}`);
  await expect(page.getByLabel('Imagen ilustrativa (IA o referencia)')).toBeChecked();
  await page.getByRole('button', { name: 'Eliminar fotografía 1' }).click();
  await page.getByRole('button', { name: 'Guardar Cambios' }).click();
  await expect(page).toHaveURL(new RegExp(`/services/${id}$`));
  const result = await page.request.get(`${api}/services/${id}`);
  expect((await result.json()).data.images).toHaveLength(0);
  await page.request.delete(`${api}/services/${id}`);
});

test('el perfil informa una subida fallida sin crear una credencial ficticia', async ({ page }) => {
  await login(page.request);
  await page.goto('/profile');
  let writes = 0;
  await page.route('**/api/credentials', async route => {
    if (route.request().method() === 'POST') writes++;
    await route.continue();
  });
  await page.route('**/api/uploads/evidence', route => route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'No se pudo subir la evidencia' }) }));
  await page.getByRole('button', { name: 'Agregar Credencial' }).click();
  await page.getByLabel('Nombre de la credencial *', { exact: true }).fill('Certificado de prueba');
  await page.getByLabel('Institución Emisora *', { exact: true }).fill('Institución de prueba');
  await page.getByLabel('Archivo de evidencia', { exact: true }).setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: await image() });
  await page.getByRole('button', { name: 'Registrar Credencial', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'No se pudo subir la evidencia' })).toHaveText('No se pudo subir la evidencia');
  await page.getByRole('button', { name: 'Entendido', exact: true }).click();
  await expect(page.getByLabel('Nombre de la credencial *', { exact: true })).toHaveValue('Certificado de prueba');
  expect(writes).toBe(0);
});
