import { expect, test } from '@playwright/test';

test('la página principal carga la navegación esencial de BAXIO', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/BAXIO/i);
  await expect(page.getByRole('link', { name: /BAXIO/i }).first()).toBeVisible();
  await expect(page.getByText('Conseguir Chamba', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Explorar marketplace/i).first()).toBeVisible();
});
