import { expect, test } from '@playwright/test';

test.describe('autenticación y accesos protegidos', () => {
  test('muestra un error con credenciales inválidas', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/correo electrónico/i).fill('nadie@baxio.test');
    await page.getByLabel(/^contraseña$/i).fill('clave-inválida');
    await page.getByRole('button', { name: /entrar a mi cuenta/i }).click();

    await expect(page.getByText(/credenciales inválidas|usuario no encontrado/i)).toBeVisible();
  });

  test('permite iniciar sesión con la cuenta demo sin modificar datos', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/correo electrónico/i).fill('kevin@baxio.com');
    await page.getByLabel(/^contraseña$/i).fill('password123');
    await page.getByRole('button', { name: /entrar a mi cuenta/i }).click();

    await expect(page).toHaveURL('/');
  });

  test('valida la longitud mínima de contraseña durante el registro', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByLabel(/nombre completo/i).fill('Cuenta de prueba');
    await page.getByLabel(/correo electrónico/i).fill('registro@baxio.test');
    await page.getByLabel(/contraseña/i).fill('12345');
    await page.getByRole('button', { name: /crear mi cuenta gratis/i }).click();

    await expect(page.getByText(/contraseña debe tener al menos 6 caracteres/i)).toBeVisible();
  });

  test('protege los trabajos contratados para visitantes', async ({ page }) => {
    await page.goto('/my-orders');

    await expect(page.getByText('Inicia sesión para ver tus trabajos contratados')).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();
  });
});
