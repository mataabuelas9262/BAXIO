import { test, expect } from '@playwright/test';
import { readdir, readFile } from 'fs/promises';
import { resolve } from 'path';
import { randomUUID } from 'crypto';

async function localCode(email: string) {
  const dir = resolve('../backend/.mail-preview-e2e');
  const files = (await readdir(dir)).filter(f => f.endsWith('.eml')).sort().reverse();
  for (const file of files) {
    const mail = await readFile(resolve(dir, file), 'utf8');
    if (mail.includes(`To: ${email}\n`)) return mail.match(/BAXIO es (\d{6})/)![1];
  }
  throw new Error('Falta el correo de prueba');
}

test('email OTP and optional 2FA work end to end on mobile and desktop', async ({ page }, testInfo) => {
  const email = `otp-${randomUUID()}@example.invalid`, password = 'Test-password-927!';
  await page.addInitScript(() => localStorage.setItem('baxio-theme', 'dark'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/auth/register');
  await page.getByLabel(/nombre completo/i).fill('Prueba OTP');
  await page.getByLabel(/correo electrónico/i).fill(email);
  await page.getByLabel(/contraseña/i).fill(password);
  await page.getByRole('button', { name: /crear mi cuenta/i }).click();
  await expect(page.getByRole('heading', { name: 'Verifica tu correo' })).toBeVisible();
  await expect(page.getByText(/no se envió un correo real/i)).toBeVisible();
  expect((await page.context().cookies()).find(c => c.name === 'access_token')).toBeUndefined();
  await page.screenshot({ path: testInfo.outputPath('otp-mobile.png') });
  await page.getByLabel('Código de verificación de 6 dígitos').fill(await localCode(email));
  await page.getByRole('button', { name: 'Verificar y continuar' }).click();
  await expect(page).toHaveURL('/');
  await page.goto('/profile/security');
  await expect(page.getByText('Correo verificado', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Activar 2FA', exact: true }).click();
  await page.getByLabel('Contraseña actual').fill(password);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByAltText('Código QR para vincular tu autenticador con BAXIO')).toBeVisible();
  await page.getByText('No puedo escanear el QR').click();
  const secret = await page.locator('details code').innerText();
  const OTPAuth = require('../../backend/node_modules/otpauth');
  const otp = new OTPAuth.TOTP({ secret, algorithm: 'SHA1', digits: 6, period: 30 });
  await page.getByLabel('Código de verificación de 6 dígitos').fill(otp.generate());
  await page.getByRole('button', { name: 'Confirmar y activar 2FA' }).click();
  await expect(page.getByRole('heading', { name: '2FA activado: guarda tus códigos' })).toBeVisible();
  const codes = await page.locator('code').allTextContents(); expect(codes).toHaveLength(8);
  await expect(page.getByRole('button', { name: 'Terminar', exact: true })).toBeDisabled();
  await page.getByLabel('Guardé mis códigos en un lugar seguro.').check();
  await page.getByRole('button', { name: 'Terminar', exact: true }).click();
  await expect(page.getByText(/Activada · 8 códigos/)).toBeVisible();
  await page.context().clearCookies();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/auth/login');
  await page.getByLabel(/correo electrónico/i).fill(email);
  await page.getByLabel(/^contraseña$/i).fill(password);
  await page.getByRole('button', { name: /entrar a mi cuenta/i }).click();
  await expect(page.getByRole('heading', { name: 'Verificación en dos pasos' })).toBeVisible();
  expect((await page.context().cookies()).find(c => c.name === 'access_token')).toBeUndefined();
  await page.getByRole('button', { name: 'Usar un código de recuperación' }).click();
  await page.getByLabel('Código de recuperación', { exact: true }).fill(codes[0]);
  await page.getByRole('button', { name: 'Verificar y continuar' }).click();
  await expect(page).toHaveURL('/');
  await page.goto('/profile/security');
  await expect(page.getByText(/Activada · 7 códigos/)).toBeVisible();
  await page.getByRole('button', { name: 'Desactivar 2FA', exact: true }).click();
  await page.getByLabel('Contraseña actual').fill(password);
  await page.getByRole('button', { name: 'Usar código de recuperación', exact: true }).click();
  await page.getByLabel('Código de recuperación', { exact: true }).fill(codes[1]);
  await page.getByRole('button', { name: 'Confirmar desactivación' }).click();
  await expect(page.getByText('Desactivada', { exact: true })).toBeVisible();
});
