import { expect, test } from '@playwright/test';

test('loads all five editorial pages with working navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Sergio Bellotti');
  const nav = page.getByRole('navigation', { name: 'Primary' });
  const routes = [
    { link: 'About', path: '/about/', heading: /From Bari.*to Boston/ },
    { link: 'Music', path: '/work/', heading: /Music in motion/ },
    { link: 'Education', path: '/education/', heading: /Make it groove/ },
    { link: 'Get in touch', path: '/contact/', heading: /Let’s make.*something move/ },
  ];
  for (const route of routes) {
    await nav.getByRole('link', { name: route.link }).click();
    await expect(page).toHaveURL(route.path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(route.heading);
  }
  await expect(page.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', 'https://wa.me/16173127090');
});

test('opens, navigates, and closes the gallery with the keyboard', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('link', { name: 'Enlarge photograph: On the kit' });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('On the kit')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(dialog.getByText('Live on stage')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('activates video on demand and restores focus', async ({ page }) => {
  await page.route('https://www.youtube-nocookie.com/**', (route) => route.fulfill({ body: '' }));
  await page.goto('/');
  const iframe = page.locator('iframe[src*="youtube-nocookie"]');
  await expect(iframe).toHaveCount(0);
  const trigger = page.getByRole('link', { name: 'Watch performance' });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(iframe).toHaveAttribute('src', /D4CExKKmFZE/);
  await page.keyboard.press('Escape');
  await expect(iframe).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('mobile menu works and reduced-motion layout stays within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'Open menu' });
  await menu.click();
  const shown = page.getByRole('button', { name: 'Close menu' });
  await expect(shown).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await menu.click();
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Education' }).click();
  await expect(page).toHaveURL('/education/');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
});

test('hero holds the opening still, dissolves, then reveals the UHD film', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const hero = page.locator('[data-hero-sequence]');
  const poster = hero.locator('[data-hero-poster]');
  await expect(hero).toHaveAttribute('data-scene', 'portrait');
  await expect(poster).toHaveCSS('opacity', '1');

  await page.mouse.move(720, 410);
  await page.mouse.wheel(0, 1080);
  await expect(hero).toHaveAttribute('data-scene', 'dissolve');
  await expect(poster).toHaveCSS('transform', 'none');
  await expect.poll(() => poster.evaluate((element) => Number(getComputedStyle(element).opacity)))
    .toBeLessThan(0.5);

  await page.mouse.wheel(0, 685);
  await expect(hero).toHaveAttribute('data-scene', 'film');
  await expect(hero.getByRole('button', { name: 'Switch to HD playback' })).toBeVisible();
  await expect.poll(() => hero.locator('video').evaluate((video) => video instanceof HTMLVideoElement ? video.videoWidth : 0))
    .toBe(3840);
});

test('cymbal responds to a keyboard strike with the graphical fallback available', async ({ page }) => {
  await page.goto('/');
  const strike = page.getByRole('button', { name: 'Strike the cymbal' });
  await strike.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.strike-effects.front')).toHaveCount(1);
});

test('film sound is opt-in on both performance reels', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const path of ['/', '/work/']) {
    await page.goto(path);
    const film = page.locator('main video:not([data-hero-video] video)');
    await expect(film).toHaveJSProperty('muted', true);
    await expect(film).toHaveJSProperty('paused', true);
    await page.getByRole('button', { name: 'Unmute film' }).click();
    await expect(film).toHaveJSProperty('muted', false);
    await expect(page.getByRole('button', { name: 'Mute film' })).toBeVisible();
    await page.getByRole('button', { name: 'Mute film' }).click();
    await expect(film).toHaveJSProperty('muted', true);
  }
});
