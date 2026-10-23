import { expect, it, vi } from 'vitest';
import { LauncherService } from './launcher-service';
import type { LauncherPlatform } from './ports';
import { DEFAULT_PREFERENCES, PS4_SHORTCUT_ID, type TvInputShortcut } from '../domain/launcher';

it('routes input shortcuts through their own capability without launching an app package', async () => {
  const shortcut: TvInputShortcut = {
    id: PS4_SHORTCUT_ID,
    name: 'PS4',
    kind: 'input',
    inputLabel: 'HDMI 3',
  };
  const platform: LauncherPlatform = {
    mode: 'android',
    getApplications: async () => [{ id: 'netflix', name: 'Netflix' }],
    getInputShortcuts: async () => [shortcut],
    getDeviceInfo: async () => ({ model: 'Test TV', androidVersion: '11', mode: 'android' }),
    launchApplication: vi.fn(async () => {}),
    openInputShortcut: vi.fn(async () => {}),
    openSystemSettings: async () => {},
    getHomeContent: async () => ({ status: 'ready', items: [] }),
    openHomeContent: async () => {},
    requestContentAccess: async () => {},
  };
  const service = new LauncherService(platform, {
    load: () => DEFAULT_PREFERENCES,
    save: () => {},
  });
  expect((await service.load()).apps.map((item) => item.id)).toEqual(['netflix', PS4_SHORTCUT_ID]);
  await service.launch(shortcut);
  expect(platform.openInputShortcut).toHaveBeenCalledWith(PS4_SHORTCUT_ID);
  expect(platform.launchApplication).not.toHaveBeenCalled();
});
