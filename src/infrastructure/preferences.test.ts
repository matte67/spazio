import { describe, expect, it } from 'vitest';
import { LocalPreferenceRepository, parsePreferences } from './preferences';
import { DEFAULT_PREFERENCES, PS4_SHORTCUT_ID, getFavorites } from '../domain/launcher';
const supportedWallpapers = [
  'horizon',
  'night',
  'sand',
  ...Array.from({ length: 10 }, (_, index) => `bg-${index + 1}`),
];
describe('preference boundary', () => {
  it('recovers corrupt and partial data without leaking invalid types', () => {
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(
      parsePreferences({ wallpaper: 'unknown', showClock: 'yes', favoriteIds: ['a', 42, 'a'] }),
    ).toEqual({
      wallpaper: 'horizon',
      showClock: true,
      showDecorations: true,
      blurWallpaper: true,
      showRecommendations: true,
      animations: true,
      favoriteIds: ['a'],
    });
  });
  it('preserves an intentionally empty favorites list', () => {
    expect(parsePreferences({ favoriteIds: [] }).favoriteIds).toEqual([]);
  });
  it('reports failed writes instead of pretending to save', () => {
    const repository = new LocalPreferenceRepository({
      getItem: () => '{',
      setItem: () => {
        throw new Error('quota');
      },
    });
    expect(repository.load()).toEqual(DEFAULT_PREFERENCES);
    expect(() => repository.save(DEFAULT_PREFERENCES)).toThrow('Preferenze non salvate');
  });
  it('omits uninstalled favorites and preserves selection order', () => {
    const apps = [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ];
    expect(getFavorites(apps, ['b', 'uninstalled', 'a']).map((app) => app.id)).toEqual(['b', 'a']);
  });
});

it('preserves supplied wallpaper identifiers in stored preferences', () => {
  for (const wallpaper of supportedWallpapers) {
    expect(parsePreferences({ wallpaper }, supportedWallpapers).wallpaper).toBe(wallpaper);
  }
});

it('adds PS4 once without changing saved order, settings or later removal', () => {
  let saved = JSON.stringify({
    ...DEFAULT_PREFERENCES,
    favoriteIds: ['com.netflix.ninja', 'com.spotify.tv.android'],
    showRecommendations: false,
    wallpaper: 'bg-2',
  });
  const repository = new LocalPreferenceRepository(
    {
      getItem: () => saved,
      setItem: (_key, value) => {
        saved = value;
      },
    },
    supportedWallpapers,
  );
  const migrated = repository.load();
  expect(migrated.favoriteIds).toEqual([
    'com.netflix.ninja',
    'com.spotify.tv.android',
    PS4_SHORTCUT_ID,
  ]);
  expect(migrated.wallpaper).toBe('bg-2');
  expect(migrated.showRecommendations).toBe(false);
  repository.save({ ...migrated, favoriteIds: [] });
  expect(repository.load().favoriteIds).toEqual([]);
});

it('falls back when an image is removed, without resetting the wallpaper blur preference', () => {
  const parsed = parsePreferences({ wallpaper: 'file:removed.png', blurWallpaper: false }, [
    'bg-9',
  ]);
  expect(parsed.wallpaper).toBe('bg-9');
  expect(parsed.blurWallpaper).toBe(false);
});
