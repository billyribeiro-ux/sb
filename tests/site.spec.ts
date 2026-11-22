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
  await page.goto('/');
  const trigger = page.getByRole('link', { name: 'Watch performance' });
  const dialog = page.getByRole('dialog', { name: 'Happy People 7/4' });
  await trigger.click();
  await expect(dialog).toBeVisible();
  const clip = dialog.locator('video');
  await expect(clip).toHaveAttribute('src', /sergio-notes-between/);
  await expect(clip).toHaveJSProperty('muted', true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
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
  await expect(page.locator('[data-hero-sequence]')).not.toHaveAttribute('data-cinematic', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await menu.click();
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Education' }).click();
  await expect(page).toHaveURL('/education/');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
});

test('the inline opening runs on reload with navigation and Watch performance enabled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const opening = page.getByText('The Notes Between', { exact: true }).locator('..');
  await expect(opening).toHaveAttribute('data-opening-motion', 'active');
  await expect(page.getByRole('link', { name: 'Watch performance' })).toBeEnabled();
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  await page.reload();
  await expect(opening).toHaveAttribute('data-opening-motion', 'active');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('hero reveals nine chapters, plays the uncropped film, and reverses', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const hero = page.locator('[data-hero-sequence]');
  const poster = hero.locator('[data-hero-poster]');
  const chapters = hero.locator('[data-hero-chapter]');
  const activeShot = chapters.and(hero.locator('[data-shot-active=true]'));
  const discovery = hero.locator('[data-hero-chapter=discovery]');
  const film = hero.locator('[data-hero-finale]');
  const video = film.locator('video');
  const sound = hero.getByRole('button', { name: 'Unmute film' });
  const seek = (progress: number) => hero.evaluate((element, p) => {
    const stage = element.querySelector('[data-hero-stage]')!;
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (element.clientHeight - stage.clientHeight) * p, behavior: 'instant' });
  }, progress);

  await expect(hero).toHaveAttribute('data-scene', 'portrait');
  await expect(poster).toHaveCSS('opacity', '1');
  await expect(hero.locator('.hero-plate img')).toHaveCSS('object-fit', 'cover');
  await expect(hero.locator('.hero-plate img')).toHaveCSS('object-position', '50% 0%');
  await expect(chapters).toHaveCount(7);
  await expect(activeShot).toHaveCount(0);
  await expect(discovery).toBeHidden();
  await page.evaluate(() => document.fonts.ready.then(() => {}));
  const nameRight = await hero.locator('.hero-name-last').evaluate((element) => element.getBoundingClientRect().right);
  expect(nameRight).toBeLessThan(720);

  await seek(.10);
  await expect(poster).toHaveCSS('opacity', '1');

  for (const [position, scene, title] of [
    [.18, 'groove', 'Groove'],
    [.27, 'control', 'Control'],
    [.37, 'technique', 'Technique'],
    [.47, 'flow', 'Flow'],
    [.57, 'musicality', 'Musicality'],
    [.67, 'anticipation', 'Before the hit'],
  ] as const) {
    await seek(position);
    await expect(hero).toHaveAttribute('data-scene', scene);
    await expect(activeShot).toHaveCount(1);
    await expect(activeShot).toHaveAttribute('data-hero-chapter', scene);
    await expect(discovery).toBeHidden();
    await expect(hero.getByRole('heading', { name: title })).toBeVisible();
  }
  await expect(hero.locator('[data-hero-chapter="anticipation"] img'))
    .toHaveAttribute('src', /sergio-notes-between-poster\.webp/);
  await expect(video).toHaveAttribute('src', /sergio-notes-between-4k/);
  await expect(video).toHaveJSProperty('paused', true);
  await expect(sound).toHaveCount(0);

  await seek(.92);
  await expect(hero).toHaveAttribute('data-scene', 'film');
  await expect(discovery).toBeHidden();
  await expect(film).toHaveCSS('clip-path', 'none');
  await expect(video).toHaveCSS('object-fit', 'contain');
  await expect(sound).toBeVisible();
  await expect(hero.getByRole('button', { name: 'Switch to HD playback' })).toBeVisible();
  await expect(video).toHaveJSProperty('videoWidth', 3840);
  await sound.click();
  await expect(video).toHaveJSProperty('muted', false);

  await seek(.99);
  await expect(hero).toHaveAttribute('data-scene', 'discovery');
  await expect(activeShot).toHaveAttribute('data-hero-chapter', 'discovery');
  await expect(hero.getByRole('link', { name: 'Try the ghost-note comparison' })).toBeVisible();

  await seek(0);
  await expect(hero).toHaveAttribute('data-scene', 'portrait');
  await expect(poster).toHaveCSS('opacity', '1');
  await expect(discovery).toBeHidden();
  await expect(film).toHaveAttribute('inert', '');
  await expect(video).toHaveJSProperty('paused', true);
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
