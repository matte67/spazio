import type { HomeContentSource } from './home-content-service';
import type { DeviceInfo, Preferences, TvApplication, TvInputShortcut } from '../domain/launcher';
/** Native capabilities are injected, never imported by UI or domain. */
export interface LauncherPlatform extends HomeContentSource {
  readonly mode: DeviceInfo['mode'];
  getApplications(): Promise<readonly TvApplication[]>;
  getInputShortcuts(): Promise<readonly TvInputShortcut[]>;
  openInputShortcut(id: string): Promise<void>;
  getDeviceInfo(): Promise<DeviceInfo>;
  launchApplication(id: string): Promise<void>;
  openSystemSettings(): Promise<void>;
}
export interface PreferenceRepository {
  load(): Preferences;
  save(preferences: Preferences): void;
}
export class LauncherError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = 'LauncherError';
  }
}
