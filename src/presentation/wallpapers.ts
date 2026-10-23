import wallpaperFiles from '../generated/wallpaper-files.json';
import type { Wallpaper } from '../domain/launcher';

export interface WallpaperBrand {
  readonly name: string;
  readonly file: string;
  readonly kind: 'monogram' | 'wordmark';
}
interface WallpaperOption {
  readonly id: Wallpaper;
  readonly name: string;
  readonly file: string;
  readonly brand?: WallpaperBrand;
}

/** Every bundled image is discovered by Vite; metadata customizes only known theme identities. */
const BRANDS: Readonly<Record<string, WallpaperBrand>> = {
  rick: { name: 'Rick and Morty', file: 'rick-and-morty.svg', kind: 'wordmark' },
  vuitton: { name: 'Louis Vuitton', file: 'louis-vuitton.svg', kind: 'monogram' },
  minecraft: { name: 'Minecraft', file: 'minecraft.svg', kind: 'wordmark' },
  marvel: { name: 'Marvel', file: 'marvel.svg', kind: 'wordmark' },
  ciccioGamer89: {
    name: 'CiccioGamer89',
    file: 'CiccioGamer89_logo.png',
    kind: 'wordmark',
  },
};
const KNOWN_WALLPAPERS: Readonly<Record<string, { name: string; brand?: WallpaperBrand }>> = {
  'bg-1': { name: 'Rick and Morty', brand: BRANDS.rick },
  'file:bg-1.png': { name: 'Minecraft', brand: BRANDS.minecraft },
  'bg-2': { name: 'CiccioGamer89', brand: BRANDS.ciccioGamer89 },
  'bg-3': { name: 'Minecraft', brand: BRANDS.minecraft },
  'bg-4': { name: 'Rick and Morty', brand: BRANDS.rick },
  'bg-5': { name: 'Marvel', brand: BRANDS.marvel },
  'bg-6': { name: 'Louis Vuitton', brand: BRANDS.vuitton },
  'bg-7': { name: 'Graffiti' },
  'bg-8': { name: 'Homer Simpson' },
  'bg-9': { name: 'Deadpool' },
  'bg-10': { name: 'Batman' },
};

/** Keep the essential themes in the initial six choices, even with extra bundled images. */
const PRIORITIZED_WALLPAPER_IDS = ['bg-1', 'bg-2', 'bg-3'];
const WALLPAPER_DECORATIONS: Readonly<Record<string, string>> = {
  'bg-1': 'rick_&_morty_decoration_full_width.png',
  'file:bg-1.png': 'minecraft_decoration_full_width.png',
  'bg-3': 'minecraft_decoration_full_width.png',
  'bg-4': 'rick_&_morty_decoration_full_width.png',
  'bg-5': 'marvel_decoration.png',
  'bg-6': 'luis_vuitton_decoration.png',
  'bg-8': 'simpson_decoration_full_width.png',
  'bg-9': 'marvel_decoration.png',
  'bg-10': 'marvel_decoration.png',
};
const DEFAULT_DECORATION_FILE = 'sfondo-in-basso.png';

export const WALLPAPER_OPTIONS: readonly WallpaperOption[] = createWallpaperOptions(wallpaperFiles);

/** Deterministic IDs retain saved jpg selections and disambiguate all other filenames. */
export function createWallpaperOptions(files: readonly string[]): readonly WallpaperOption[] {
  const options: WallpaperOption[] = files.map((file) => {
    const numbered = /^bg-(\d+)\.jpg$/.exec(file);
    const id =
      file === 'horizon.svg'
        ? 'horizon'
        : numbered
          ? `bg-${numbered[1]}`
          : `file:${encodeURIComponent(file)}`;
    const filename = file
      .split('/')
      .pop()!
      .replace(/\.[^.]+$/, '');
    const known = KNOWN_WALLPAPERS[id];
    return {
      id,
      file,
      name:
        known?.name ??
        (id === 'horizon'
          ? 'Orizzonte'
          : numbered
            ? `Sfondo ${numbered[1]}`
            : filename.replace(/[-_]+/g, ' ')),
      brand: known?.brand,
    };
  });
  const horizon = options.find((option) => option.id === 'horizon');
  const images = options.filter((option) => option.id !== 'horizon');
  const themes = horizon
    ? [
        horizon,
        { id: 'night', name: 'Notte', file: horizon.file },
        { id: 'sand', name: 'Sabbia', file: horizon.file },
      ]
    : [];
  const prioritizedImages = PRIORITIZED_WALLPAPER_IDS
    .map((id) => images.find((option) => option.id === id))
    .filter((option): option is WallpaperOption => option !== undefined);
  const prioritizedIds = new Set(prioritizedImages.map((option) => option.id));
  return [...themes, ...prioritizedImages, ...images.filter((option) => !prioritizedIds.has(option.id))];
}

/** Resolve bundled assets for both Vite and the offline Android asset origin. */
export function wallpaperImageUrl(id: Wallpaper): string | undefined {
  const option = WALLPAPER_OPTIONS.find((item) => item.id === id) ?? WALLPAPER_OPTIONS[0];
  if (!option) return undefined;
  const path = option.file.split('/').map(encodeURIComponent).join('/');
  return new URL(`wallpapers/${path}`, document.baseURI).href;
}

/** Theme identity belongs to the selected wallpaper, independently of clock visibility. */
export function wallpaperBrand(id: Wallpaper): WallpaperBrand | undefined {
  return WALLPAPER_OPTIONS.find((option) => option.id === id)?.brand;
}

/** Resolve theme-specific bottom art while keeping the shared decoration as a fallback. */
export function wallpaperDecorationUrl(id: Wallpaper): string {
  const file = WALLPAPER_DECORATIONS[id] ?? DEFAULT_DECORATION_FILE;
  return new URL(file, document.baseURI).href;
}

/** Pick uniformly from the available wallpapers, avoiding the current one when possible. */
export function chooseRandomWallpaper(
  current?: Wallpaper,
  random: () => number = Math.random,
): Wallpaper {
  const available = WALLPAPER_OPTIONS.map((option) => option.id);
  const alternatives = available.filter((id) => id !== current);
  const choices = alternatives.length > 0 ? alternatives : available;
  const index = Math.floor(random() * choices.length);
  return choices[index] ?? current ?? 'horizon';
}
