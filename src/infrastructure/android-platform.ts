import { createPs4Shortcut } from './input-shortcuts';
import { PS4_SHORTCUT_ID, type TvInputShortcut } from '../domain/launcher';
import { mapHomeContent } from './home-content-mapper';
import { LauncherError, type LauncherPlatform } from '../application/ports';
import type { DeviceInfo, TvApplication } from '../domain/launcher';
interface NativeResponse {
  id: string;
  result?: unknown;
  error?: string;
}
interface NativeBridge {
  postMessage(payload: string): void;
}
declare global {
  interface Window {
    AndroidLauncher?: NativeBridge;
    spazioNativeResponse?: (response: NativeResponse) => void;
  }
}
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_ICON_LENGTH = 400_000;
function safeNativeImage(value: unknown): string | undefined {
  return typeof value === 'string' &&
    value.length <= MAX_ICON_LENGTH &&
    /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value)
    ? value
    : undefined;
}
function mapApplication(value: unknown): TvApplication {
  if (!value || typeof value !== 'object')
    throw new LauncherError('Dati app non validi.', 'INVALID_RESPONSE');
  const app = value as Record<string, unknown>;
  if (typeof app.id !== 'string' || typeof app.name !== 'string') {
    throw new LauncherError('Risposta Android non valida.', 'INVALID_RESPONSE');
  }
  return {
    id: app.id,
    name: app.name,
    icon: safeNativeImage(app.icon),
    banner: safeNativeImage(app.banner),
  };
}
/** Correlated native RPC with bounded lifetime, response mapping and explicit errors. */
export class AndroidPlatform implements LauncherPlatform {
  readonly mode = 'android' as const;
  private sequence = 0;
  private readonly pending = new Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
      timeout: ReturnType<typeof setTimeout>;
    }
  >();
  constructor(private readonly bridge: NativeBridge) {
    window.spazioNativeResponse = (response) => {
      const request = this.pending.get(response.id);
      if (!request) return;
      clearTimeout(request.timeout);
      this.pending.delete(response.id);
      if (response.error) request.reject(new LauncherError(response.error, 'NATIVE_ERROR'));
      else request.resolve(response.result);
    };
  }
  private request(method: string, params: Record<string, string> = {}): Promise<unknown> {
    const id = `rpc-${++this.sequence}`;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new LauncherError('La TV non risponde. Riprova.', 'NATIVE_TIMEOUT'));
      }, REQUEST_TIMEOUT_MS);
      this.pending.set(id, { resolve, reject, timeout });
      try {
        this.bridge.postMessage(JSON.stringify({ id, method, params }));
      } catch {
        clearTimeout(timeout);
        this.pending.delete(id);
        reject(new LauncherError('Connessione Android non disponibile.', 'BRIDGE_UNAVAILABLE'));
      }
    });
  }
  async getHomeContent() {
    return mapHomeContent(await this.request('getHomeContent'));
  }
  async openHomeContent(id: string) {
    await this.request('openHomeContent', { id });
  }
  async requestContentAccess() {
    await this.request('requestContentAccess');
  }
  async getApplications(): Promise<readonly TvApplication[]> {
    const response = await this.request('getApplications');
    if (!Array.isArray(response))
      throw new LauncherError('Elenco app non valido.', 'INVALID_RESPONSE');
    return response.map(mapApplication);
  }
  async getInputShortcuts(): Promise<readonly TvInputShortcut[]> {
    const response = await this.request('getInputShortcuts');
    if (!Array.isArray(response) || response.some((id) => typeof id !== 'string')) {
      throw new LauncherError('Elenco ingressi non valido.', 'INVALID_RESPONSE');
    }
    return response.includes(PS4_SHORTCUT_ID) ? [createPs4Shortcut()] : [];
  }
  async openInputShortcut(id: string) {
    await this.request('openInputShortcut', { id });
  }
  async getDeviceInfo(): Promise<DeviceInfo> {
    const response = await this.request('getDeviceInfo');
    if (!response || typeof response !== 'object')
      throw new LauncherError('Profilo TV non valido.', 'INVALID_RESPONSE');
    const info = response as Record<string, unknown>;
    if (typeof info.model !== 'string' || typeof info.androidVersion !== 'string') {
      throw new LauncherError('Profilo TV non valido.', 'INVALID_RESPONSE');
    }
    return { model: info.model, androidVersion: info.androidVersion, mode: this.mode };
  }
  async launchApplication(id: string) {
    await this.request('launchApplication', { id });
  }
  async openSystemSettings() {
    await this.request('openSystemSettings');
  }
}
