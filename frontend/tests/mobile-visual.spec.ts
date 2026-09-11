import { expect, test } from '@playwright/test';
for (const theme of ['light', 'dark']) {
  test(`rutas móviles sin desbordamiento y capturas en modo ${theme}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(value => localStorage.setItem('baxio-theme', value), theme);
    for (const route of ['/', '/explore', '/job-requests', '/auth/login', '/auth/register']) {
      await page.goto(route);
      await expect(page.locator('h1:visible').first()).toBeVisible();
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await testInfo.attach(`${route.replace(/\W/g, '-') || 'home'}-${theme}`, { body: await page.screenshot({ fullPage: true, animations: 'disabled' }), contentType: 'image/png' });
    }
  });
}
