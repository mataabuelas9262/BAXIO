import { expect, test } from '@playwright/test';

test.describe('rutas públicas', () => {
  test('el marketplace muestra la pantalla de exploración', async ({ page }) => {
    await page.goto('/explore');

    await expect(page.getByRole('heading', { name: 'Explorar BAXIO' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Servicios Publicados', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /solicitudes/i })).toBeVisible();
  });

  test('el tablero de solicitudes está disponible', async ({ page }) => {
    await page.goto('/job-requests');

    await expect(page.getByRole('heading', { name: 'Tablero de Solicitudes' })).toBeVisible();
    await expect(page.getByRole('link', { name: /publicar una solicitud/i })).toBeVisible();
  });

  test('el inicio de sesión muestra sus campos requeridos', async ({ page }) => {
    await page.goto('/auth/login');

    await expect(page.getByRole('heading', { name: 'Iniciar Sesión' })).toBeVisible();
    await expect(page.getByLabel(/correo electrónico/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
  });

  test('el registro muestra sus campos requeridos', async ({ page }) => {
    await page.goto('/auth/register');

    await expect(page.getByRole('heading', { name: 'Crear Cuenta en BAXIO' })).toBeVisible();
    await expect(page.getByLabel(/nombre completo/i)).toBeVisible();
    await expect(page.getByLabel(/correo electrónico/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
  });
});
