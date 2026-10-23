import { LauncherError, type PreferenceRepository } from '../application/ports';
import {
  DEFAULT_PREFERENCES,
  DEFAULT_WALLPAPER_IDS,
  type Wallpaper,
  PS4_SHORTCUT_ID,
  isWallpaper,
  type Preferences,
} from '../domain/launcher';
const STORAGE_KEY = 'spazio.preferences.v1';
const PREFERENCES_VERSION = 3;
/** Validate untrusted or stale persisted values before entering the application. */
export function parsePreferences(
  value: unknown,
  supportedWallpapers: readonly Wallpaper[] = DEFAULT_WALLPAPER_IDS,
): Preferences {
  const fallbackWallpaper = supportedWallpapers.includes('horizon')
    ? 'horizon'
    : (supportedWallpapers[0] ?? 'horizon');
  if (!value || typeof value !== 'object')
    return { ...DEFAULT_PREFERENCES, wallpaper: fallbackWallpaper };
  const item = value as Record<string, unknown>;
  return {
    wallpaper: isWallpaper(item.wallpaper, supportedWallpapers)
      ? item.wallpaper
      : fallbackWallpaper,
    randomWallpaper: typeof item.randomWallpaper === 'boolean' ? item.randomWallpaper : false,
    blurWallpaper: typeof item.blurWallpaper === 'boolean' ? item.blurWallpaper : true,
    showRecommendations:
      typeof item.showRecommendations === 'boolean' ? item.showRecommendations : true,
    showDecorations: typeof item.showDecorations === 'boolean' ? item.showDecorations : true,
    showClock: typeof item.showClock === 'boolean' ? item.showClock : true,
    animations: typeof item.animations === 'boolean' ? item.animations : true,
    favoriteIds: Array.isArray(item.favoriteIds)
      ? [...new Set(item.favoriteIds.filter((id): id is string => typeof id === 'string'))]
      : DEFAULT_PREFERENCES.favoriteIds,
  };
}
export class LocalPreferenceRepository implements PreferenceRepository {
  constructor(
    private readonly storage: Pick<Storage, 'getItem' | 'setItem'>,
    private readonly supportedWallpapers: readonly Wallpaper[] = DEFAULT_WALLPAPER_IDS,
  ) {}
  load(): Preferences {
    try {
      const stored: unknown = JSON.parse(this.storage.getItem(STORAGE_KEY) ?? 'null');
      const preferences = parsePreferences(stored, this.supportedWallpapers);
      if (
        !stored ||
        typeof stored !== 'object' ||
        ('version' in stored && stored.version === PREFERENCES_VERSION)
      )
        return preferences;
      // Add the requested shortcut once, preserving order and subsequent user removal.
      const migrated = {
        ...preferences,
        favoriteIds: [...new Set([...preferences.favoriteIds, PS4_SHORTCUT_ID])],
      };
      try {
        this.save(migrated);
      } catch {
        /* Keep readable preferences if storage is full. */
      }
      return migrated;
    } catch {
      return parsePreferences(null, this.supportedWallpapers);
    }
  }
  save(preferences: Preferences): void {
    try {
      this.storage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...preferences, version: PREFERENCES_VERSION }),
      );
    } catch {
      throw new LauncherError(
        'Preferenze non salvate. Spazio locale non disponibile.',
        'STORAGE_UNAVAILABLE',
      );
    }
  }
}
