import { afterEach, describe, expect, it, vi } from 'vitest';
import { AndroidPlatform } from './android-platform';
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
function setup(result: unknown) {
  vi.stubGlobal('window', {});
  return new AndroidPlatform({
    postMessage: (payload: string) => {
      const { id } = JSON.parse(payload);
      window.spazioNativeResponse?.({ id, result });
    },
  });
}
describe('Android contract', () => {
  it('keeps icon and banner separate and rejects executable image URLs', async () => {
    const banner = 'data:image/png;base64,AA==';
    const platform = setup([{ id: 'app', name: 'App', icon: 'javascript:alert(1)', banner }]);
    expect(await platform.getApplications()).toEqual([
      { id: 'app', name: 'App', icon: undefined, banner },
    ]);
  });
  it('rejects malformed payloads without preview substitution', async () => {
    await expect(setup({ invalid: true }).getApplications()).rejects.toThrow(
      'Elenco app non valido',
    );
  });
  it('rejects an unanswered request after the timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('window', {});
    const pending = new AndroidPlatform({ postMessage: () => {} }).getApplications();
    const assertion = expect(pending).rejects.toThrow('La TV non risponde');
    await vi.advanceTimersByTimeAsync(12_000);
    await assertion;
  });
});
