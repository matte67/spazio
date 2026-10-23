import { readFile, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

// Give navigation tests a fixed fixture order without changing product defaults.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('spazio.preferences.v1') !== null) return;
    localStorage.setItem(
      'spazio.preferences.v1',
      JSON.stringify({
        wallpaper: 'horizon',
        showClock: true,
        animations: true,
        favoriteIds: [
          'com.google.android.youtube.tv',
          'com.netflix.ninja',
          'com.amazon.amazonvideo.livingroom',
          'com.disney.disneyplus',
          'com.spotify.tv.android',
          'it.rainet.androidtv',
        ],
      }),
    );
  });
});
test('D-pad navigation, OK and Back restore the previous screen', async ({ page }) => {
  await page.goto('/');
  const youtube = page.getByRole('button', { name: 'Apri YouTube', exact: true });
  await expect(youtube).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('button', { name: 'Apri Netflix', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Apri Netflix', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: /Le tue preferite/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Home', exact: true })).toBeFocused();
});
test('settings persist, focus stays inside the panel and returns on Back', async ({ page }) => {
  await page.goto('/');
  const settings = page.getByRole('button', { name: 'Personalizza launcher' });
  const frameBefore = await page.locator('.launcher').boundingBox();
  await settings.click();
  expect(await page.locator('.launcher').boundingBox()).toEqual(frameBefore);
  await page.getByRole('button', { name: 'Notte', exact: true }).click();
  await page.getByRole('switch', { name: 'Mostra orologio' }).click();
  await page.keyboard.press('ArrowDown');
  expect(
    await page
      .locator('[role="dialog"]')
      .evaluate((element) => element.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press('Escape');
  await expect(settings).toBeFocused();
  await page.reload();
  await expect(page.locator('.wallpaper-backdrop')).toHaveClass(/wallpaper--night/);
  await expect(page.locator('.clock')).toHaveCount(0);
});
test('favorites, empty state and reload remain consistent', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Applicazioni', exact: true }).click();
  const selectedPins = page.getByRole('button', { name: /^Rimuovi .* dai preferiti$/ });
  while (await selectedPins.count()) await selectedPins.first().click();
  await page.keyboard.press('Escape');
  await expect(page.getByText('Le tue preferite iniziano da qui.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Le tue preferite iniziano da qui.')).toBeVisible();
});
test('mobile layout stays contained and reduced motion disables travel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Personalizza launcher' }).click();
  expect(
    await page
      .getByRole('dialog')
      .evaluate((element) => parseFloat(getComputedStyle(element).animationDuration)),
  ).toBeLessThan(0.001);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Personalizza launcher' })).toBeFocused();
});

test('the app rail keeps focused apps clear of both edge fades', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Apri YouTube', exact: true })).toBeFocused();
  for (let index = 0; index < 5; index++) await page.keyboard.press('ArrowRight');
  const lastApp = page.getByRole('button', { name: 'Apri RaiPlay', exact: true });
  await expect(lastApp).toBeFocused();
  const geometry = await lastApp.evaluate((element) => ({
    right: element.getBoundingClientRect().right,
    railRight: element.closest('.apps-grid')!.getBoundingClientRect().right,
  }));
  expect(geometry.right).toBeLessThan(geometry.railRight - 64);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(lastApp).toBeFocused();
  for (let index = 0; index < 5; index++) await page.keyboard.press('ArrowLeft');
  const firstApp = page.getByRole('button', { name: 'Apri YouTube', exact: true });
  await expect(firstApp).toBeFocused();
  const leftGeometry = await firstApp.evaluate((element) => ({
    left: element.getBoundingClientRect().left,
    railLeft: element.closest('.apps-grid')!.getBoundingClientRect().left,
  }));
  expect(leftGeometry.left).toBeGreaterThan(leftGeometry.railLeft + 64);
  await expect(page.locator('.apps-grid--favorites')).toHaveCSS(
    'mask-image',
    /linear-gradient\(90deg, rgba\(0, 0, 0, 0\)/,
  );
});

test('native failure is visible and retry recovers without demo data', async ({ page }) => {
  await page.addInitScript(() => {
    let available = false;
    window.addEventListener('test-native-recovered', () => {
      available = true;
    });
    window.AndroidLauncher = {
      postMessage(payload: string) {
        const request = JSON.parse(payload);
        queueMicrotask(() => {
          if (request.method === 'getDeviceInfo') {
            window.spazioNativeResponse?.({
              id: request.id,
              result: { model: 'Test TV', androidVersion: '11' },
            });
          } else if (request.method === 'getHomeContent') {
            window.spazioNativeResponse?.({
              id: request.id,
              result: { status: 'ready', items: [] },
            });
          } else if (!available) {
            window.spazioNativeResponse?.({
              id: request.id,
              error: 'Connessione alla TV interrotta.',
            });
          } else {
            window.spazioNativeResponse?.({ id: request.id, result: [] });
          }
        });
      },
    };
  });
  await page.goto('/');
  await expect(page.getByRole('alert')).toHaveText(/Connessione alla TV interrotta/);
  await expect(page.getByRole('button', { name: 'Apri Netflix', exact: true })).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event('test-native-recovered')));
  await page.getByRole('button', { name: 'Riprova', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByText('Le tue preferite iniziano da qui.')).toBeVisible();
});

test('native Home closes panels and returns from the app grid to favorites', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Tutte le app', exact: true }).click();
  await page.getByRole('button', { name: 'Personalizza launcher' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('spazio-home')));
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /Le tue preferite/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Home', exact: true })).toBeFocused();
});

test('supplied wallpapers load and the selection survives reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Personalizza launcher' }).click();
  for (const index of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    await page.locator(`[data-tv-focus="wallpaper-bg-${index}"]`).click();
    await expect(page.locator('.wallpaper-base')).toHaveCSS(
      'background-image',
      new RegExp(`bg-${index}\\.jpg`),
    );
  }
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('.wallpaper-backdrop')).toHaveClass(/wallpaper--bg-10/);
  const banner = page.locator('.favorite-background').first();
  const blur = await banner.evaluate((element) =>
    parseFloat(getComputedStyle(element).filter.replace('blur(', '')),
  );
  expect(blur).toBeGreaterThanOrEqual(10);
});

test('shared TV content opens through its native identifier and can be disabled persistently', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const fixture = {
      id: 'continue:42',
      title: 'Episodio di prova',
      appName: 'Player di prova',
      appId: 'test.player',
      kind: 'continue',
      progress: 0.4,
    };
    Object.assign(window, { contentReads: 0, openedContent: undefined });
    window.AndroidLauncher = {
      postMessage(payload: string) {
        const { id, method, params } = JSON.parse(payload);
        let result: unknown = null;
        if (method === 'getInputShortcuts') result = [];
        if (method === 'getApplications')
          result = [{ id: 'com.google.android.youtube.tv', name: 'YouTube' }];
        if (method === 'getDeviceInfo') result = { model: 'Test TV', androidVersion: '11' };
        if (method === 'getHomeContent') {
          (window as unknown as { contentReads: number }).contentReads++;
          result = { status: 'ready', items: [fixture] };
        }
        if (method === 'openHomeContent') Object.assign(window, { openedContent: params.id });
        queueMicrotask(() => window.spazioNativeResponse?.({ id, result }));
      },
    };
  });
  await page.goto('/');
  const card = page.getByRole('button', { name: 'Apri Episodio di prova in Player di prova' });
  await expect(card).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '0.4');
  await card.focus();
  await page.keyboard.press('Enter');
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { openedContent: string }).openedContent))
    .toBe('continue:42');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Personalizza launcher' }).click();
  await page.getByRole('switch', { name: 'Consigli e continua a guardare' }).click();
  await page.keyboard.press('Escape');
  await expect(card).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Apri YouTube', exact: true })).toBeVisible();
  await expect(card).toHaveCount(0);
  expect(
    await page.evaluate(() => (window as unknown as { contentReads: number }).contentReads),
  ).toBe(0);
});

test('both content rows follow favorites and keep focused cards clear of both fades', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.AndroidLauncher = {
      postMessage(payload: string) {
        const { id, method } = JSON.parse(payload);
        const apps = [
          { id: 'com.google.android.youtube.tv', name: 'YouTube' },
          { id: 'com.netflix.ninja', name: 'Netflix' },
        ];
        const items = ['continue', 'recommendation'].flatMap((kind, group) =>
          Array.from({ length: 8 }, (_, index) => {
            const appId =
              index === 0
                ? 'other.app'
                : index % 2
                  ? 'com.netflix.ninja'
                  : 'com.google.android.youtube.tv';
            return {
              id: `${kind}:${group * 10 + index}`,
              kind,
              appId,
              title: `Contenuto di prova ${index}`,
              appName: appId,
            };
          }),
        );
        const result =
          method === 'getInputShortcuts'
            ? []
            : method === 'getApplications'
              ? apps
              : method === 'getDeviceInfo'
                ? { model: 'Test TV', androidVersion: '11' }
                : method === 'getHomeContent'
                  ? { status: 'ready', items }
                  : null;
        queueMicrotask(() => window.spazioNativeResponse?.({ id, result }));
      },
    };
  });
  await page.goto('/');
  await expect(page.locator('.content-group')).toHaveCount(2);
  for (const group of await page.locator('.content-group').all()) {
    const cards = group.locator('.content-card');
    expect(
      await cards.evaluateAll((elements) =>
        elements.map((element) => element.getAttribute('data-app-id')),
      ),
    ).toEqual([
      'com.google.android.youtube.tv',
      'com.google.android.youtube.tv',
      'com.google.android.youtube.tv',
      'com.netflix.ninja',
      'com.netflix.ninja',
      'com.netflix.ninja',
      'com.netflix.ninja',
      'other.app',
    ]);
    await cards.first().focus();
    for (let index = 0; index < 7; index++) await page.keyboard.press('ArrowRight');
    await expect(cards.last()).toBeFocused();
    const rail = group.locator('.content-rail');
    const lastBox = (await cards.last().boundingBox())!;
    const railBox = (await rail.boundingBox())!;
    expect(lastBox.x + lastBox.width).toBeLessThan(railBox.x + railBox.width - 40);
    for (let index = 0; index < 7; index++) await page.keyboard.press('ArrowLeft');
    await expect(cards.first()).toBeFocused();
    const firstBox = (await cards.first().boundingBox())!;
    expect(firstBox.x).toBeGreaterThan(railBox.x + 40);
    await expect(rail).toHaveCSS('mask-image', 'none');
    await expect(cards.first().locator('.content-details')).toHaveCSS(
      'mask-image',
      /linear-gradient/,
    );
  }
});

test('PS4 preview explains HDMI 3 and removal remains saved', async ({ page }) => {
  await page.goto('/');
  const shortcut = page.getByRole('button', { name: 'Apri PS4 su HDMI 3', exact: true });
  await shortcut.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toContainText('seleziona HDMI 3');
  await page.getByRole('button', { name: 'Rimuovi dai preferiti', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(shortcut).toHaveCount(0);
  await page.reload();
  await expect(shortcut).toHaveCount(0);
  await page.getByRole('button', { name: 'Tutte le app', exact: true }).click();
  await expect(shortcut).toBeVisible();
});

test('PS4 selection sends only its shortcut identifier through the native bridge', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.AndroidLauncher = {
      postMessage(payload: string) {
        const { id, method, params } = JSON.parse(payload);
        let result: unknown = null;
        if (method === 'getApplications') result = [];
        if (method === 'getInputShortcuts') result = ['shortcut:ps4-hdmi3'];
        if (method === 'getDeviceInfo') result = { model: 'MiTV-MSSP2', androidVersion: '11' };
        if (method === 'getHomeContent') result = { status: 'ready', items: [] };
        if (method === 'openInputShortcut') Object.assign(window, { selectedInput: params.id });
        queueMicrotask(() => window.spazioNativeResponse?.({ id, result }));
      },
    };
  });
  await page.goto('/');
  const shortcut = page.getByRole('button', { name: 'Apri PS4 su HDMI 3', exact: true });
  await shortcut.focus();
  await page.keyboard.press('Enter');
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { selectedInput: string }).selectedInput))
    .toBe('shortcut:ps4-hdmi3');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('synthetic content separates cover, playback and text into independent surfaces', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.content-poster img[src*="/preview-content/"]')).toHaveCount(11);
  const rows = page.locator('.content-group');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0).locator('.content-card')).toHaveCount(5);
  await expect(rows.nth(1).locator('.content-card')).toHaveCount(6);
  await expect(rows.nth(1).getByRole('progressbar')).toHaveCount(0);
  const card = rows.first().locator('.content-card').first();
  await card.focus();
  const geometry = await card.evaluate((element) => {
    const poster = element.querySelector('.content-poster')!;
    const progress = element.querySelector('progress')!;
    const details = element.querySelector('.content-details')!;
    const state = element.querySelector('.content-playback-state')!;
    const navigation = document.querySelector('.navigation')!;
    return {
      outerBackground: getComputedStyle(element).backgroundColor,
      coverBackground: getComputedStyle(poster).backgroundColor,
      stateGap: state.getBoundingClientRect().top - poster.getBoundingClientRect().bottom,
      detailsGap: details.getBoundingClientRect().top - state.getBoundingClientRect().bottom,
      progressParent: progress.parentElement!.className,
      surfaces: [state, details].map((pane) => ({
        background: getComputedStyle(pane).backgroundColor,
        backdrop: getComputedStyle(pane).backdropFilter,
      })),
      navBackground: getComputedStyle(navigation).backgroundColor,
      navBackdrop: getComputedStyle(navigation).backdropFilter,
    };
  });
  expect(geometry.outerBackground).toBe('rgba(0, 0, 0, 0)');
  expect(geometry.coverBackground).toBe('rgba(0, 0, 0, 0)');
  expect(geometry.stateGap).toBeGreaterThanOrEqual(9);
  expect(geometry.detailsGap).toBeGreaterThanOrEqual(9);
  expect(geometry.progressParent).toBe('content-playback-state');
  for (const pane of geometry.surfaces) {
    expect(pane.background).toBe(geometry.navBackground);
    expect(pane.backdrop).toBe(geometry.navBackdrop);
  }
  await page.keyboard.press('Enter');
  await expect(page.getByRole('alert')).toContainText('Esempio sintetico');
  await page.getByRole('button', { name: 'Personalizza launcher' }).click();
  await page.getByRole('switch', { name: 'Consigli e continua a guardare' }).click();
  await page.keyboard.press('Escape');
  await expect(rows).toHaveCount(0);
});

test('bottom decorations can be hidden persistently and restored independently of wallpaper', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.wallpaper-bottom-art')).toBeVisible();
  await page.getByRole('button', { name: 'Personalizza launcher' }).click();
  const toggle = page.getByRole('switch', { name: 'Mostra decorazioni' });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('.wallpaper-bottom-art')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('.wallpaper-bottom-art')).toHaveCount(0);
  await expect(page.locator('.wallpaper-backdrop')).toBeVisible();
  await page.getByRole('button', { name: 'Personalizza launcher' }).click();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await toggle.click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.wallpaper-bottom-art')).toBeVisible();
});

test('TV settings close restores content focus and ignores synthetic hover without a mouse', async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 1920, height: 1080 },
    baseURL: 'http://127.0.0.1:5173',
  });
  const page = await context.newPage();
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      window.AndroidLauncher = {
        postMessage(payload: string) {
          const { id, method } = JSON.parse(payload);
          const result =
            method === 'getApplications'
              ? [{ id: 'com.google.android.youtube.tv', name: 'YouTube' }]
              : method === 'getInputShortcuts'
                ? []
                : method === 'getDeviceInfo'
                  ? { model: 'MiTV-MSSP2', androidVersion: '11' }
                  : method === 'getHomeContent'
                    ? { status: 'ready', items: [] }
                    : null;
          queueMicrotask(() => window.spazioNativeResponse?.({ id, result }));
        },
      };
    });
    await page.goto('/');
    const app = page.getByRole('button', { name: 'Apri YouTube', exact: true });
    await expect(app).toBeFocused();
    const settings = page.getByRole('button', { name: 'Personalizza launcher' });
    for (const closeWithBack of [true, false]) {
      await settings.focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('dialog')).toBeVisible();
      if (closeWithBack) await page.keyboard.press('Escape');
      else await page.getByRole('button', { name: 'Chiudi personalizzazione' }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(app).toBeFocused();
    }
    await page.evaluate(() => window.dispatchEvent(new Event('spazio-home')));
    await expect(page.getByRole('button', { name: 'Home', exact: true })).toBeFocused();
    await settings.hover();
    await app.focus();
    expect(await settings.evaluate((el) => el.matches(':hover'))).toBe(true);
    await expect(settings.locator('.nav-label')).toHaveCSS('opacity', '0');
  } finally {
    await context.close();
  }
});

test.describe('header status dock', () => {
  test.use({ timezoneId: 'Europe/Rome' });

  test('clock moves to the left dock and changes its symbol with local time', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-23T10:00:00Z') });
    await page.goto('/');
    await expect(page.locator('.clock time')).toHaveText('12:00');
    await expect(page.locator('.clock-symbol')).toHaveAttribute('data-period', 'day');
    await expect(page.locator('.clock-symbol .lucide-sun')).toHaveCount(1);
    const geometry = await page.locator('.header-status').evaluate((dock) => {
      const nav = document.querySelector('.navigation')!;
      return {
        left: dock.getBoundingClientRect().left,
        navLeft: nav.getBoundingClientRect().left,
        height: dock.getBoundingClientRect().height,
        width: dock.getBoundingClientRect().width,
        navHeight: nav.getBoundingClientRect().height,
        navWidth: nav.getBoundingClientRect().width,
        radius: getComputedStyle(dock).borderRadius,
        navRadius: getComputedStyle(nav).borderRadius,
        surface: getComputedStyle(dock).backgroundColor,
        navSurface: getComputedStyle(nav).backgroundColor,
        backdrop: getComputedStyle(dock).backdropFilter,
        navBackdrop: getComputedStyle(nav).backdropFilter,
      };
    });
    expect(geometry.left).toBe(geometry.navLeft);
    expect(geometry.height).toBe(geometry.navWidth);
    expect(geometry.width).toBe(geometry.navHeight);
    expect(geometry.radius).toBe(geometry.navRadius);
    expect(geometry.surface).toBe(geometry.navSurface);
    expect(geometry.backdrop).toBe(geometry.navBackdrop);
    await page.clock.setFixedTime(new Date('2026-10-23T20:00:00Z'));
    await page.clock.runFor(1000);
    await expect(page.locator('.clock time')).toHaveText('22:00');
    await expect(page.locator('.clock-symbol')).toHaveAttribute('data-period', 'night');
    await expect(page.locator('.clock-symbol .lucide-moon')).toHaveCount(1);
  });

  test('wallpaper logos remain visible independently of the clock toggle', async ({ page }) => {
    await page.goto('/');
    const settings = page.getByRole('button', { name: 'Personalizza launcher' });
    for (const [number, name] of [
      [6, 'Louis Vuitton'],
      [4, 'Rick and Morty'],
      [3, 'Minecraft'],
      [5, 'Marvel'],
      [1, 'Rick and Morty'],
      [9, 'Marvel'],
    ] as const) {
      await settings.click();
      await page.locator(`[data-tv-focus="wallpaper-bg-${number}"]`).click();
      await page.keyboard.press('Escape');
      const logo = page.getByRole('img', { name, exact: true });
      await expect(logo).toBeVisible();
      await logo.evaluate((image: HTMLImageElement) => image.decode());
      await expect(page.locator('.clock')).toHaveCount(1);
      await expect(page.locator('.clock-symbol')).toHaveCount(0);
      await expect(page.locator('.clock-date')).toHaveCount(0);
    }
    await settings.click();
    await page.getByRole('switch', { name: 'Mostra orologio' }).click();
    await page.keyboard.press('Escape');
    await expect(page.locator('.clock')).toHaveCount(0);
    await expect(page.getByRole('img', { name: 'Marvel', exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('img', { name: 'Marvel', exact: true })).toBeVisible();
    await settings.click();
    await page.locator('[data-tv-focus="wallpaper-bg-7"]').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('.header-status')).toHaveCount(0);
  });
});

test('wallpaper blur can be disabled independently and remains off after reload', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Personalizza launcher' }).click();
  const toggle = page.getByRole('switch', { name: 'Sfoca sfondo' });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(page.locator('.wallpaper-base')).toHaveCSS('filter', /blur\(0px\)/);
  await expect(page.locator('.wallpaper-progressive')).toHaveCount(0);
  await expect(page.locator('.navigation')).toHaveCSS('backdrop-filter', /blur\(24px\)/);
  await expect(page.locator('.favorite-background').first()).toHaveCSS('filter', /blur\(13px\)/);
  await page.reload();
  await expect(page.locator('.wallpaper-base')).toHaveCSS('filter', /blur\(0px\)/);
  await page.getByRole('button', { name: 'Personalizza launcher' }).click();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await toggle.click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.wallpaper-progressive')).toHaveCount(1);
});

test('new wallpaper files are discovered and removed without editing the catalog', async ({
  page,
}) => {
  const fixture = 'qa-auto-discovery.svg';
  const path = resolve('public/wallpapers', fixture);
  const manifest = resolve('src/generated/wallpaper-files.json');
  let created = false;
  try {
    await writeFile(
      path,
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 36"><path fill="#456" d="M0 0h64v36H0z"/></svg>',
      { flag: 'wx' },
    );
    created = true;
    await expect.poll(async () => JSON.parse(await readFile(manifest, 'utf8'))).toContain(fixture);
    await expect
      .poll(async () =>
        (await page.request.get('/src/generated/wallpaper-files.json?import')).text(),
      )
      .toContain(fixture);
    await page.goto('/');
    await page.getByRole('button', { name: 'Personalizza launcher' }).click();
    const option = page.getByRole('button', { name: 'qa auto discovery', exact: true });
    await expect(option).toBeVisible();
    await option.click();
    await page.keyboard.press('Escape');
    await expect(page.locator('.wallpaper-base')).toHaveCSS(
      'background-image',
      /qa-auto-discovery\.svg/,
    );
    await rm(path);
    created = false;
    await expect
      .poll(async () => JSON.parse(await readFile(manifest, 'utf8')))
      .not.toContain(fixture);
    await expect
      .poll(async () =>
        (await page.request.get('/src/generated/wallpaper-files.json?import')).text(),
      )
      .not.toContain(fixture);
    await page.reload();
    await expect(page.locator('.wallpaper-backdrop')).toHaveClass(/wallpaper--horizon/);
  } finally {
    if (created) await rm(path, { force: true });
  }
});
