import { test, expect } from '@playwright/test';

test('opening uses the site red and can be dismissed with the keyboard', async ({ page }) => {
  await page.goto('/');
  const opening = page.getByRole('dialog', { name: 'Abertura do illke' });
  await expect(opening).toBeVisible();
  await expect(opening.locator('.shell-top path')).toHaveAttribute('fill', '#ff6971');
  await page.keyboard.press('Escape');
  await expect(opening).toHaveCount(0);
  await expect(page.locator('.app')).not.toHaveAttribute('inert', '');
  const dex = page.locator('nav[aria-label="Principal"] a[href="/pokedex"]');
  await expect(dex.locator('svg.pokedex-icon')).toHaveCount(1);
  await dex.click();
  await expect(page).toHaveURL(/\/pokedex$/);
});

test('game artwork loads within equal frames at desktop and mobile sizes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/jogos');
  await page.locator('.game-cover img').evaluateAll(images => images.forEach(image => image.loading = 'eager'));
  await expect.poll(() => page.locator('.game-cover img').evaluateAll(images => images.length > 0 && images.every(image => image.complete && image.naturalWidth > 0)), { timeout: 30000 }).toBe(true);
  await expect(page.locator('.game-cover.unavailable')).toHaveCount(0);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const frames = await page.locator('.game-cover').evaluateAll(elements => elements.map(element => ({ width: Math.round(element.getBoundingClientRect().width), height: element.getBoundingClientRect().height })));
    expect(new Set(frames.map(frame => frame.height)).size).toBe(1);
    expect(Math.max(...frames.map(frame => frame.width)) - Math.min(...frames.map(frame => frame.width))).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole('button', { name: 'Ativar tema claro' }).click();
  await expect(page.locator('.app')).toHaveClass(/light/);
  await expect(page.locator('.game-cover').first()).toBeVisible();
});

test('abilities filter the complete catalogue and keep filters through pagination', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/habilidades?game=emerald');
  await expect(page.locator('.ability-card')).toHaveCount(24);
  await expect(page.locator('.category-nav a')).toHaveCount(8);
  const symbols = await page.locator('.ability-symbol svg').evaluateAll(icons => icons.map(icon => icon.innerHTML));
  expect(new Set(symbols).size).toBeGreaterThan(5);
  await page.locator('.category-nav a[href*="category=weather"]').click();
  await expect(page).toHaveURL(/category=weather/);
  await expect(page.locator('.results-heading h2')).toHaveText('Clima e terreno');
  await expect(page.locator('.ability-card [data-category]:not([data-category="weather"])')).toHaveCount(0);
  const next = page.getByRole('link', { name: 'Próxima', exact: true });
  if (await next.count()) {
    await next.click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page).toHaveURL(/category=weather/);
    await expect(page).toHaveURL(/game=emerald/);
  }
  await page.goto('/habilidades?q=Drizzle');
  await expect(page.locator('.ability-card')).toHaveCount(1);
  await expect(page.locator('.ability-card h3')).toHaveText('Drizzle');
  await page.locator('.ability-card').click();
  await expect(page).toHaveURL(/\/habilidade\/drizzle/);
  await expect(page.locator('h1')).toHaveText('Drizzle');
  await page.goto('/habilidades?q=uma-habilidade-inexistente');
  await expect(page.getByRole('heading', { name: 'Nenhuma habilidade encontrada' })).toBeVisible();
  await page.locator('.ability-empty').getByRole('link', { name: /Limpar filtros/ }).click();
  await expect(page.locator('.ability-card')).toHaveCount(24);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.screenshot({ path: '.runtime/habilidades-mobile-updated.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: '.runtime/habilidades-desktop-updated.png', fullPage: true });
  expect(errors).toEqual([]);
});
