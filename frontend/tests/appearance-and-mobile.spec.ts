import { expect, test } from '@playwright/test';

test('el modo oscuro se guarda al cambiarlo', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Activar modo oscuro' }).click();

  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByRole('button', { name: 'Activar modo claro' })).toBeVisible();
});

test('la navegación móvil está disponible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.getByText('Inicio', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('Explorar', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('Trabajos', { exact: true }).last()).toBeVisible();
});
