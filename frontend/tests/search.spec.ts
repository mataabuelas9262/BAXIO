import { test, expect } from '@playwright/test';

for (const mode of ['hire', 'work'] as const) {
  test(`search navigation follows ${mode} mode and updates an existing results page`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem('baxio_user_mode', value), mode);
    const endpoint = mode === 'hire' ? 'services' : 'job-requests';
    await page.route(new RegExp(`/api/${endpoint}(\\?|$)`), route => route.fulfill({
      json: { success: true, data: [] },
    }));
    await page.goto('/');
    const hero = page.getByPlaceholder(mode === 'hire'
      ? '¿Qué servicio buscas? ej. Plomero, Electricista, Pintor...'
      : 'Buscar trabajos para postularte ej. Reparar minisplit, Instalar lámparas...');
    await hero.fill('  instalación & climas  ');
    await hero.press('Enter');
    const destination = mode === 'hire' ? '/explore' : '/job-requests';
    await expect(page).toHaveURL(url => url.pathname === destination && url.searchParams.get('query') === 'instalación & climas');
    const field = page.getByPlaceholder(mode === 'hire'
      ? 'Buscar por título, oficio, ubicación o descripción...'
      : 'Buscar solicitudes por oficio, problema o ubicación...').first();
    await expect(field).toHaveValue('instalación & climas');
    const navbar = page.getByRole('searchbox', { name: mode === 'hire' ? 'Buscar servicios' : 'Buscar chamba', exact: true });
    const request = page.waitForRequest(req => {
      const url = new URL(req.url());
      return url.pathname.endsWith(`/api/${endpoint}`) && url.searchParams.get('query') === 'plomería';
    });
    await navbar.fill('plomería');
    await navbar.press('Enter');
    await request;
    await expect(field).toHaveValue('plomería');
    await page.goBack();
    await expect(field).toHaveValue('instalación & climas');
    await page.reload();
    await expect(field).toHaveValue('instalación & climas');
    const unfiltered = page.waitForRequest(req => {
      const url = new URL(req.url());
      return url.pathname.endsWith(`/api/${endpoint}`) && !url.searchParams.has('query');
    });
    await field.fill('');
    await unfiltered;
    const sent: string[] = [];
    page.on('request', req => {
      const url = new URL(req.url());
      if (url.pathname.endsWith(`/api/${endpoint}`) && url.searchParams.has('query')) sent.push(url.searchParams.get('query')!);
    });
    await field.pressSequentially('minisplit', { delay: 30 });
    await expect.poll(() => sent).toEqual(['minisplit']);
    await page.waitForTimeout(450);
    expect(sent).toEqual(['minisplit']);
  });
}
