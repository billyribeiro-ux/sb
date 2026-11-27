import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { heroSession } from '../src/lib/hero/hero-chapters';

async function waitForCinematicHero(page: Page) {
  await expect(page.locator('[data-hero-sequence]')).toHaveAttribute('data-cinematic', 'true');
  await expect(page.locator('[data-hero-soundtrack]')).toHaveJSProperty('paused', true);
}

async function seekHero(hero: Locator, progress: number) {
  await hero.evaluate((element, position) => {
    const stage = element.querySelector('[data-hero-stage]')!;
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: top + (element.clientHeight - stage.clientHeight) * position,
      behavior: 'instant',
    });
  }, progress);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Cover the browser path that requires an explicit gesture for this soundtrack.
    const play = HTMLMediaElement.prototype.play;
    let receivedClick = false;
    document.addEventListener('click', (event) => { receivedClick ||= event.isTrusted; }, { capture: true });
    HTMLMediaElement.prototype.play = function () {
      if (this.matches('[data-hero-soundtrack]') && !receivedClick) {
        return Promise.reject(new DOMException('A user gesture is required.', 'NotAllowedError'));
      }
      return play.call(this);
    };
  });
});

test('loads all six editorial pages with working navigation', async ({ page }) => {
  await page.goto('/');
  await waitForCinematicHero(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Sergio Bellotti');
  const nav = page.getByRole('navigation', { name: 'Primary' });
  const routes = [
    { link: 'About', path: '/about/', heading: /From Bari.*to Boston/ },
    { link: 'Music', path: '/work/', heading: /Music in motion/ },
    { link: 'Education', path: '/education/', heading: /Make it groove/ },
    { link: 'Workshops & Clinics', path: '/workshops/', heading: 'Workshops & Clinics.' },
    { link: 'Get in touch', path: '/contact/', heading: /Let’s make.*something move/ },
  ];
  for (const route of routes) {
    await nav.getByRole('link', { name: route.link }).click();
    await expect(page).toHaveURL(route.path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(route.heading);
  }
  await expect(page.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', 'https://wa.me/16173127090');
});

test('selects a workshop format and opens the matching clinic information', async ({ page }) => {
  await page.goto('/workshops/');
  const workshops = page.getByRole('radio', { name: 'Group workshops' });
  const clinics = page.getByRole('radio', { name: 'Technique clinics' });
  await expect(workshops).toBeChecked();
  await workshops.press('ArrowRight');
  await expect(clinics).toBeChecked();
  await expect(page.getByRole('heading', { name: 'Explore the hidden pulse.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Read Berklee’s clinic notes' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Contact Sergio about a workshop' })).toHaveAttribute('href', '/contact/');
});

test('replays the Bari to Boston route and shows it statically with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/about/');
  const journey = page.getByRole('region', { name: 'Across the Atlantic.' });
  const map = journey.locator('[data-journey-map]');
  const replay = journey.getByRole('button', { name: 'Replay route' });
  await expect(journey).toBeVisible();
  await map.scrollIntoViewIfNeeded();
  await expect(map).toHaveAttribute('data-map-state', 'complete');
  await replay.press('Enter');
  await expect(map).toHaveAttribute('data-map-state', 'playing');
  await expect(map).toHaveAttribute('data-map-state', 'complete');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(map).toHaveAttribute('data-map-state', 'static');
  await expect(replay).toHaveCount(0);
  await expect(map.getByText('Bari', { exact: true }).first()).toBeVisible();
  await expect(map.getByText('Boston', { exact: true }).first()).toBeVisible();
});

test('opens, navigates, and closes the gallery with the keyboard', async ({ page }) => {
  await page.goto('/');
  await waitForCinematicHero(page);
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
  await waitForCinematicHero(page);
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
  await expect(page.locator('[data-artist-loader]')).toHaveCount(0);
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

test('the homepage reveals the performance automatically and repeats the opening on reload', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const hero = page.locator('[data-hero-sequence]');
  const poster = hero.locator('[data-hero-poster]');
  const picture = hero.locator('[data-hero-session-picture]');
  await expect(hero).toHaveAttribute('data-preview-reveal', 'holding');
  await expect(poster).toBeVisible();
  await expect(page.locator('[data-artist-loader]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Watch performance' })).toBeEnabled();
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();

  await expect(hero).toHaveAttribute('data-preview-reveal', 'playing', { timeout: 12000 });
  await expect(hero.locator('.hero-session-frame')).toHaveCSS('animation-duration', '3.4s');
  await expect(hero).toHaveAttribute('data-preview-reveal', 'complete', { timeout: 12000 });
  await expect(poster).toBeHidden();
  await expect(picture).toHaveAttribute('src', heroSession.picture);
  await expect(picture).toHaveJSProperty('paused', false);
  await expect(hero.locator('[data-hero-soundtrack]')).toHaveJSProperty('paused', true);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(hero).toHaveAttribute('data-preview-reveal', 'holding');
  await expect(poster).toBeVisible();
});

test('the homepage soundtrack starts on request and stays synchronized', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const hero = page.locator('[data-hero-sequence]');
  const picture = hero.locator('[data-hero-session-picture]');
  const soundtrack = hero.locator('[data-hero-soundtrack]');
  await expect(hero).toHaveAttribute('data-preview-reveal', 'playing', { timeout: 12000 });
  await expect(soundtrack).toHaveJSProperty('paused', true);
  await hero.getByRole('button', { name: 'Play soundtrack' }).click();
  await expect(soundtrack).toHaveJSProperty('paused', false);
  await expect(picture).toHaveJSProperty('muted', true);
  await expect.poll(() => hero.evaluate((element) => {
    const video = element.querySelector<HTMLVideoElement>('[data-hero-session-picture]')!;
    const audio = element.querySelector<HTMLAudioElement>('[data-hero-soundtrack]')!;
    return Math.abs(video.currentTime - audio.currentTime);
  })).toBeLessThanOrEqual(.45);
  await hero.getByRole('button', { name: 'Mute soundtrack' }).click();
  await expect(soundtrack).toHaveJSProperty('paused', true);
});

test('switching to reduced motion settles the reveal and keeps the poster visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const hero = page.locator('[data-hero-sequence]');
  await expect(hero).toHaveAttribute('data-preview-reveal', 'playing', { timeout: 12000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(hero).not.toHaveAttribute('data-cinematic', 'true');
  await expect(hero).toHaveAttribute('data-preview-reveal', 'complete');
  await expect(hero.locator('[data-hero-poster]')).toBeVisible();
  await expect(hero.locator('[data-hero-session-picture]')).toHaveJSProperty('paused', true);
  await expect(hero.getByRole('button', { name: 'Play soundtrack' })).toBeVisible();
});

test('a direct link reaches the homepage comparison with the soundtrack off', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#hear-the-difference');
  const hero = page.locator('[data-hero-sequence]');
  await expect(hero).toHaveAttribute('data-cinematic', 'true');
  await expect(page.locator('#hear-the-difference')).toBeInViewport();
  await expect(page.locator('[data-artist-loader]')).toHaveCount(0);
  await expect(hero.locator('[data-hero-soundtrack]')).toHaveJSProperty('paused', true);
});

test('mouse wheel scrolling keeps the hero controls readable and in place', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await waitForCinematicHero(page);
  await page.evaluate(() => document.fonts.ready.then(() => {}));

  const actions = page.locator('.hero-actions');
  const positions = () => actions.locator('button, a').evaluateAll((controls) => controls.map((control) => {
    const { x, y, width, height } = control.getBoundingClientRect();
    return { x, y, width, height };
  }));
  const before = await positions();
  await actions.evaluate((element) => {
    const labels = element.textContent;
    const observer = new MutationObserver(() => {
      if (element.textContent !== labels) element.setAttribute('data-labels-shifted', 'true');
    });
    observer.observe(element, { childList: true, characterData: true, subtree: true });
  });

  const watch = before[2];
  await page.mouse.move(watch.x + watch.width / 2, watch.y + watch.height / 2);
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(480);
  await expect(actions).not.toHaveAttribute('data-labels-shifted', 'true');
  await expect(actions.getByRole('button', { name: 'Strike cymbal' })).toHaveText('Strike cymbal');
  await expect(actions.getByRole('link', { name: 'Watch performance' })).toHaveText('Watch performance');
  expect(await positions()).toEqual(before);
});

test('drag resizing preserves the current hero chapter and picture playback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await waitForCinematicHero(page);

  const hero = page.locator('[data-hero-sequence]');
  const picture = hero.locator('[data-hero-session-picture]');
  await seekHero(hero, .55);
  await expect(hero).toHaveAttribute('data-scene', 'flow');
  await expect(picture).toHaveJSProperty('paused', false);
  const initialTime = await picture.evaluate((video: HTMLVideoElement) => video.currentTime);
  const initialScroll = await page.evaluate(() => scrollY);

  for (const [width, height] of [[1200, 690], [900, 580], [800, 540], [765, 550], [1080, 620], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await expect(hero).toHaveAttribute('data-cinematic', 'true');
    await expect(hero).toHaveAttribute('data-scene', 'flow');
    await expect(picture).toHaveJSProperty('paused', false);
  }

  await expect(picture).toHaveJSProperty('paused', false);
  expect(await picture.evaluate((video: HTMLVideoElement) => video.currentTime)).toBeGreaterThan(initialTime);
  expect(Math.abs(await page.evaluate(() => scrollY) - initialScroll)).toBeLessThanOrEqual(1);
});

test('hero keeps the session playing across chapters and holds the quiet notes before reversing', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await waitForCinematicHero(page);
  const hero = page.locator('[data-hero-sequence]');
  const poster = hero.locator('[data-hero-poster]');
  const chapters = hero.locator('[data-hero-chapter]');
  const activeShot = chapters.and(hero.locator('[data-shot-active=true]'));
  const discovery = hero.locator('[data-hero-chapter=discovery]');
  const film = hero.locator('[data-hero-finale]');
  const picture = hero.locator('[data-hero-session-picture]');
  const flowPicture = hero.locator('[data-hero-flow-picture]');
  const soundtrack = hero.locator('[data-hero-soundtrack]');
  const sound = hero.getByRole('button', { name: /^(Play|Mute) soundtrack$/ });
  const playSound = hero.getByRole('button', { name: 'Play soundtrack' });
  const muteSound = hero.getByRole('button', { name: 'Mute soundtrack' });
  const pictureTime = () => picture.evaluate((video: HTMLVideoElement) => video.currentTime);
  const visitChapter = async (position: number, scene: string, title: string) => {
    await seekHero(hero, position);
    await expect(hero).toHaveAttribute('data-scene', scene);
    await expect(activeShot).toHaveCount(1);
    await expect(activeShot).toHaveAttribute('data-hero-chapter', scene);
    await expect(discovery).toBeHidden();
    await expect(hero.getByRole('heading', { name: title })).toBeVisible();
  };

  await expect(hero).toHaveAttribute('data-scene', 'portrait');
  await expect(hero).toHaveAttribute('data-opening-edit', 'true');
  await expect(hero).toHaveAttribute('data-preview-reveal', 'complete', { timeout: 12000 });
  await expect(poster).toBeHidden();
  await expect(hero.locator('.hero-plate img')).toHaveCSS('object-fit', 'cover');
  await expect(hero.locator('.hero-plate img')).toHaveCSS('object-position', '50% 0%');
  await expect(chapters).toHaveCount(7);
  await expect(activeShot).toHaveCount(0);
  await expect(discovery).toBeHidden();
  await expect(hero.getByRole('button', { name: 'Next scene' })).toHaveCount(0);
  await expect(hero.getByRole('navigation', { name: 'Film chapters' })).toHaveCount(0);
  await expect(picture).toHaveAttribute('src', heroSession.picture);
  await expect(hero.locator('.hero-opening-credits [data-hero-type]')).toHaveCount(1);
  await expect(soundtrack).toHaveAttribute('src', '/videos/sergio-hero-soundtrack.m4a');
  await expect(picture).toHaveJSProperty('paused', false);
  await expect(picture).toHaveJSProperty('muted', true);
  await expect(picture).toHaveJSProperty('loop', false);
  await expect(flowPicture).toHaveCount(0);
  await expect(soundtrack).toHaveJSProperty('loop', true);
  await expect(sound).toBeVisible();
  await page.evaluate(() => document.fonts.ready.then(() => {}));
  const nameRight = await hero.locator('.hero-name-last').evaluate((element) => element.getBoundingClientRect().right);
  expect(nameRight).toBeLessThan(720);
  const sponsorScenes = hero.locator('[data-hero-sponsor-scene]');
  const sabian = hero.locator('[data-hero-sponsor-scene="sabian"]');
  const yamaha = hero.locator('[data-hero-sponsor-scene="yamaha"]');
  await expect(sponsorScenes).toHaveCount(4);
  await expect(sabian).toBeHidden();
  await expect(yamaha).toBeHidden();
  await expect.poll(() => sponsorScenes.locator('img').evaluateAll((logos) =>
    logos.every((logo) => (logo as HTMLImageElement).complete && (logo as HTMLImageElement).naturalWidth > 0)
  )).toBe(true);

  await seekHero(hero, .12);
  await expect(sabian).toBeVisible();
  await expect(yamaha).toBeHidden();

  await seekHero(hero, .18);
  await expect(sabian).toBeHidden();
  await expect(hero).toHaveAttribute('data-scene', 'portrait');
  await expect(poster).toBeHidden();
  await expect(hero.locator('[data-hero-session]')).toBeVisible();
  await expect(picture).toHaveJSProperty('paused', false);

  await seekHero(hero, .32);
  await expect(yamaha).toBeVisible();
  await expect(sabian).toBeHidden();

  await visitChapter(.34, 'groove', 'Groove');
  await expect(picture).toHaveCSS('opacity', '1');
  await expect(picture).toHaveJSProperty('paused', false);
  await expect.poll(pictureTime).toBeGreaterThan(.8);
  await playSound.click();
  await expect(muteSound).toBeVisible();
  await expect(soundtrack).toHaveJSProperty('paused', false);
  const sessionPicture = await picture.elementHandle();
  let lastPosition = await pictureTime();

  for (const [position, scene, title] of [
    [.41, 'control', 'Control'],
    [.49, 'technique', 'Technique'],
    [.57, 'flow', 'Flow'],
    [.65, 'musicality', 'Musicality'],
    [.73, 'anticipation', 'Before the hit'],
  ] as const) {
    await visitChapter(position, scene, title);
    if (scene === 'control') await expect(yamaha).toBeHidden();
    if (scene === 'flow') {
      await expect(flowPicture).toHaveCount(0);
      await expect(soundtrack).toHaveJSProperty('paused', false);
    }
    await expect(picture).toHaveJSProperty('paused', false);
    expect(await picture.evaluate((video, original) => video === original, sessionPicture)).toBe(true);
    const positionInFilm = await pictureTime();
    expect(positionInFilm).toBeGreaterThanOrEqual(lastPosition - .35);
    lastPosition = positionInFilm;
  }

  await seekHero(hero, .81);
  await expect(hero).toHaveAttribute('data-scene', 'film');
  await expect(film).toHaveAttribute('aria-hidden', 'false');
  await expect(discovery).toBeHidden();
  await expect(picture).toHaveCSS('object-fit', 'cover');
  await expect(picture).toHaveJSProperty('paused', false);
  expect(await picture.evaluate((video, original) => video === original, sessionPicture)).toBe(true);
  expect(await pictureTime()).toBeGreaterThanOrEqual(lastPosition - .35);

  await expect(soundtrack).toHaveJSProperty('paused', false);
  await expect(picture).toHaveJSProperty('muted', true);
  await expect.poll(() => hero.evaluate((element) => {
    const video = element.querySelector<HTMLVideoElement>('[data-hero-session-picture]')!;
    const audio = element.querySelector<HTMLAudioElement>('[data-hero-soundtrack]')!;
    const duration = video.duration;
    const drift = Math.abs(video.currentTime - (audio.currentTime % duration));
    return Math.min(drift, duration - drift);
  })).toBeLessThanOrEqual(.45);
  await muteSound.click();
  await expect(playSound).toBeVisible();
  await expect(soundtrack).toHaveJSProperty('paused', true);

  for (const position of [.94, .98]) {
    await seekHero(hero, position);
    // The scene name is already set during this hold. Let the scrubbed frame catch up.
    if (position === .98) await page.waitForTimeout(750);
    await expect(hero).toHaveAttribute('data-scene', 'discovery');
    await expect(activeShot).toHaveAttribute('data-hero-chapter', 'discovery');
    await expect(hero.getByRole('heading', { name: 'The quiet notes' })).toBeVisible();
    await expect(hero.getByRole('link', { name: 'Try the ghost-note comparison' })).toBeVisible();
  }
  await expect(picture).toHaveJSProperty('paused', true);

  await seekHero(hero, 0);
  await expect(hero).toHaveAttribute('data-scene', 'portrait');
  await expect(poster).toBeHidden();
  await expect(discovery).toBeHidden();
  await expect(film).toHaveAttribute('inert', '');
  await expect(picture).toHaveJSProperty('paused', false);
});

test('sponsor entrances complete and exits wait for their own triggers', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await waitForCinematicHero(page);
  const hero = page.locator('[data-hero-sequence]');
  const sabian = hero.locator('[data-hero-sponsor-scene="sabian"]');
  const yamaha = hero.locator('[data-hero-sponsor-scene="yamaha"]');
  const remo = hero.locator('[data-hero-sponsor-scene="remo"]');
  const prologix = hero.locator('[data-hero-sponsor-scene="prologix"]');

  await seekHero(hero, .04);
  await expect(sabian).toBeVisible();
  await expect(yamaha).toBeHidden();
  await page.waitForTimeout(3200);
  await expect(sabian).toBeVisible();
  await expect(yamaha).toBeHidden();

  await seekHero(hero, .18);
  await expect(sabian).toBeHidden({ timeout: 6000 });
  await expect(yamaha).toBeHidden();

  await seekHero(hero, .29);
  await expect(yamaha).toBeVisible();
  await page.waitForTimeout(3000);
  await expect(yamaha).toBeVisible();

  await seekHero(hero, .35);
  await expect(yamaha).toBeHidden({ timeout: 6000 });

  await seekHero(hero, .47);
  await expect(remo).toBeVisible();
  await expect(prologix).toBeHidden();
  await page.waitForTimeout(3000);
  await expect(remo).toBeVisible();

  await seekHero(hero, .54);
  await expect(remo).toBeHidden({ timeout: 6000 });
  await expect(prologix).toBeHidden();

  await seekHero(hero, .77);
  await expect(prologix).toBeVisible();
  await page.waitForTimeout(3000);
  await expect(prologix).toBeVisible();

  await seekHero(hero, .85);
  await expect(prologix).toBeHidden({ timeout: 6000 });
});

test('chapter captions remain visible until their individual exit triggers', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await waitForCinematicHero(page);
  const hero = page.locator('[data-hero-sequence]');
  const groove = hero.getByRole('heading', { name: 'Groove', exact: true });
  const musicality = hero.getByRole('heading', { name: 'Musicality', exact: true });
  const beforeHit = hero.getByRole('heading', { name: 'Before the hit', exact: true });

  await seekHero(hero, .25);
  await expect(groove).toBeVisible();
  await page.waitForTimeout(1600);
  await expect(groove).toBeVisible();

  await seekHero(hero, .36);
  await expect(groove).toBeHidden({ timeout: 6000 });

  await seekHero(hero, .59);
  await expect(musicality).toBeVisible();
  await page.waitForTimeout(1600);
  await expect(musicality).toBeVisible();

  await seekHero(hero, .66);
  await expect(beforeHit).toBeHidden();
  await page.waitForTimeout(1600);
  await expect(musicality).toBeVisible();
  await expect(beforeHit).toBeHidden();

  await seekHero(hero, .68);
  await expect(musicality).toBeHidden({ timeout: 6000 });
  await expect(beforeHit).toBeVisible();
});

test('keeps long hero captions within the narrow stage during a reveal', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await waitForCinematicHero(page);
  const hero = page.locator('[data-hero-sequence]');
  await expect(hero).toHaveAttribute('data-cinematic', 'true');
  await seekHero(hero, .48);
  await expect(hero).toHaveAttribute('data-scene', 'technique');
  const caption = hero.locator('[data-hero-chapter=technique] .hero-chapter-copy');
  await expect(caption.getByRole('heading', { name: 'Technique' })).toBeVisible();
  await expect.poll(() => caption.evaluate((element) => {
    const dock = element.closest('[data-hero-stage]')?.querySelector('.hero-dock')?.getBoundingClientRect();
    if (!dock) return false;
    const captionFits = [...element.querySelectorAll('h2, p')].every((line) => {
      const range = document.createRange();
      range.selectNodeContents(line);
      const box = range.getBoundingClientRect();
      return box.width > 0 && box.left >= 0 && box.right <= document.documentElement.clientWidth &&
        box.top >= 0 && box.bottom <= dock.top;
    });
    // Word masks are intentional during the kinetic reveal; the caption itself must remain unclipped.
    return captionFits && [element, ...element.querySelectorAll('*:not(.hero-title-word)')].every((line) => {
      const style = getComputedStyle(line);
      return style.overflowY === 'visible' && style.clipPath === 'none' && style.maskImage === 'none';
    });
  })).toBe(true);
});

test('cymbal responds to a keyboard strike with the graphical fallback available', async ({ page }) => {
  await page.goto('/');
  await waitForCinematicHero(page);
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
    if (path === '/work/') {
      await expect(film).toHaveAttribute('src', '/videos/sergio-mr-d-full.mp4');
      await expect.poll(() => film.evaluate((video: HTMLVideoElement) => video.duration)).toBeCloseTo(279.33, 1);
    }
    await expect(page.getByRole('button', { name: 'Mute film' })).toBeVisible();
    await page.getByRole('button', { name: 'Mute film' }).click();
    await expect(film).toHaveJSProperty('muted', true);
  }
});

test('explicit hero sound works with reduced motion and static chapters', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const soundtrack = page.locator('[data-hero-soundtrack]');
  await expect(page.getByRole('heading', { name: 'Seven movements. One performance.' })).toBeVisible();
  await expect(page.locator('.hero-static-chapter')).toHaveCount(7);
  await expect(page.locator('.hero-static-sponsors')).toHaveAccessibleName('Sponsored by Sabian Cymbals, Yamaha Drums, Remo Drumheads, and ProLogix Practice Pads');
  await expect(page.locator('.hero-static-sponsors img')).toHaveCount(4);
  await page.getByRole('button', { name: 'Play soundtrack' }).click();
  await expect(page.getByRole('button', { name: 'Mute soundtrack' })).toBeVisible();
  await expect(soundtrack).toHaveJSProperty('paused', false);
  await page.getByRole('button', { name: 'Mute soundtrack' }).click();
  await expect(soundtrack).toHaveJSProperty('paused', true);
});
