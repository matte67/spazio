import type { LauncherPlatform, PreferenceRepository } from './ports';
import { LauncherError } from './ports';
import type { Preferences, LauncherItem } from '../domain/launcher';
/** Application use cases, with no dependency on React, DOM or Android. */
export class LauncherService {
  constructor(
    readonly platform: LauncherPlatform,
    private readonly repository: PreferenceRepository,
  ) {}
  async load() {
    const [applications, shortcuts, device] = await Promise.all([
      this.platform.getApplications(),
      this.platform.getInputShortcuts(),
      this.platform.getDeviceInfo(),
    ]);
    return { apps: [...applications, ...shortcuts], device, preferences: this.repository.load() };
  }
  launch(app: LauncherItem) {
    if (!app.id.trim()) throw new LauncherError('Applicazione non valida.', 'INVALID_APP');
    return app.kind === 'input'
      ? this.platform.openInputShortcut(app.id)
      : this.platform.launchApplication(app.id);
  }
  savePreferences(preferences: Preferences) {
    this.repository.save(preferences);
    return preferences;
  }
}
