import { PS4_SHORTCUT_ID, type TvInputShortcut } from '../domain/launcher';

/** Presentation metadata is local; native input identifiers never enter the UI. */
export function createPs4Shortcut(): TvInputShortcut {
  return {
    id: PS4_SHORTCUT_ID,
    kind: 'input',
    name: 'PS4',
    inputLabel: 'HDMI 3',
    brand: 'playstation',
    banner: new URL('app-banners/ps4.svg', document.baseURI).href,
  };
}
