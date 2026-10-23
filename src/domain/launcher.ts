/** Shared visual identity, independent of Android and UI libraries. */
interface LauncherItemIdentity {
  readonly id: string;
  readonly name: string;
  readonly icon?: string;
  readonly banner?: string;
  readonly brand?: 'youtube' | 'netflix' | 'prime' | 'spotify' | 'disney' | 'rai' | 'playstation';
}
/** Installed applications and input shortcuts have distinct launch capabilities. */
export interface TvApplication extends LauncherItemIdentity {
  readonly kind?: 'application';
}
export interface TvInputShortcut extends LauncherItemIdentity {
  readonly kind: 'input';
  readonly inputLabel: string;
}
export type LauncherItem = TvApplication | TvInputShortcut;
export const PS4_SHORTCUT_ID = 'shortcut:ps4-hdmi3';

/** Stable asset identifier; available choices are supplied by the composition root. */
export type Wallpaper = string;
export const DEFAULT_WALLPAPER_IDS: readonly Wallpaper[] = ['horizon', 'night', 'sand'];

/** Validate persisted choices against the injected catalog, never arbitrary asset URLs. */
export function isWallpaper(value: unknown, supported: readonly Wallpaper[]): value is Wallpaper {
  return typeof value === 'string' && supported.includes(value);
}
export interface Preferences {
  readonly wallpaper: Wallpaper;
  readonly randomWallpaper: boolean;
  readonly showClock: boolean;
  readonly showDecorations: boolean;
  readonly blurWallpaper: boolean;
  readonly showRecommendations: boolean;
  readonly animations: boolean;
  readonly favoriteIds: readonly string[];
}
export interface DeviceInfo {
  readonly model: string;
  readonly androidVersion: string;
  readonly mode: 'android' | 'preview';
}
export const DEFAULT_PREFERENCES: Preferences = {
  wallpaper: 'horizon',
  randomWallpaper: false,
  showClock: true,
  showDecorations: true,
  blurWallpaper: true,
  showRecommendations: true,
  animations: true,
  favoriteIds: [
    'it.rainet.androidtv',
    'com.google.android.youtube.tv',
    'com.spotify.tv.android',
    'com.netflix.ninja',
    'com.amazon.amazonvideo.livingroom',
    'com.disney.disneyplus',
    PS4_SHORTCUT_ID,
  ],
};
/** Reconcile saved favorites with available applications and input shortcuts. */
export function getFavorites(apps: readonly LauncherItem[], ids: readonly string[]) {
  return ids.flatMap((id) => {
    const app = apps.find((candidate) => candidate.id === id);
    return app ? [app] : [];
  });
}
