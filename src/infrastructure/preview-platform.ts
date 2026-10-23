import { createPreviewHomeContent } from './preview-home-content';
import { createPs4Shortcut } from './input-shortcuts';
import { LauncherError, type LauncherPlatform } from '../application/ports';
import type { TvApplication } from '../domain/launcher';
/** Browser fixtures are explicit and never used to conceal native errors. */
const PREVIEW_APPS: readonly TvApplication[] = [
  { id: 'com.google.android.youtube.tv', name: 'YouTube', brand: 'youtube' },
  { id: 'com.netflix.ninja', name: 'Netflix', brand: 'netflix' },
  { id: 'com.amazon.amazonvideo.livingroom', name: 'Prime Video', brand: 'prime' },
  { id: 'com.disney.disneyplus', name: 'Disney+', brand: 'disney' },
  { id: 'com.spotify.tv.android', name: 'Spotify', brand: 'spotify' },
  { id: 'it.rainet.androidtv', name: 'RaiPlay', brand: 'rai' },
];
export class PreviewPlatform implements LauncherPlatform {
  readonly mode = 'preview' as const;
  async getHomeContent() {
    return createPreviewHomeContent();
  }
  async openHomeContent(): Promise<void> {
    throw new LauncherError('Esempio sintetico: nessun video da riprodurre.', 'PREVIEW_ONLY');
  }
  async requestContentAccess(): Promise<void> {
    throw new LauncherError('Accesso ai contenuti disponibile sulla TV.', 'PREVIEW_ONLY');
  }
  async getApplications() {
    return PREVIEW_APPS.map((app) => ({
      ...app,
      banner: new URL(`app-banners/${app.id}.png`, document.baseURI).href,
    }));
  }
  async getInputShortcuts() {
    return [createPs4Shortcut()];
  }
  async openInputShortcut(): Promise<void> {
    throw new LauncherError('La selezione HDMI è disponibile sulla TV.', 'PREVIEW_ONLY');
  }
  async getDeviceInfo() {
    return { model: 'MiTV-MSSP2', androidVersion: '11', mode: this.mode };
  }
  async launchApplication(): Promise<void> {
    throw new LauncherError('L’apertura delle app è disponibile sulla TV.', 'PREVIEW_ONLY');
  }
  async openSystemSettings(): Promise<void> {
    throw new LauncherError('Le impostazioni Android sono disponibili sulla TV.', 'PREVIEW_ONLY');
  }
}
