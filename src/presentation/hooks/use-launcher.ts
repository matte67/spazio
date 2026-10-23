import { useCallback, useEffect, useState } from 'react';
import type { LauncherService } from '../../application/launcher-service';
import { DEFAULT_PREFERENCES, type Preferences, type LauncherItem } from '../../domain/launcher';
import { chooseRandomWallpaper } from '../wallpapers';
type LoadedLauncher = Awaited<ReturnType<LauncherService['load']>>;

function applyRandomWallpaper(data: LoadedLauncher): LoadedLauncher {
  if (!data.preferences.randomWallpaper) return data;
  return {
    ...data,
    preferences: {
      ...data.preferences,
      wallpaper: chooseRandomWallpaper(data.preferences.wallpaper),
    },
  };
}

/** React binding for use cases; operational state stays outside visual components. */
export function useLauncher(service: LauncherService) {
  const [data, setData] = useState<LoadedLauncher>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [busyId, setBusyId] = useState<string>();
  const [previewApp, setPreviewApp] = useState<LauncherItem>();
  const reload = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setData(await service.load());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossibile caricare le app.');
    } finally {
      setLoading(false);
    }
  }, [service]);
  useEffect(() => {
    let active = true;
    // The initial loading state already exists. Only settle it after external I/O.
    service
      .load()
      .then((result) => {
        if (active) setData(applyRandomWallpaper(result));
      })
      .catch((cause: unknown) => {
        if (active)
          setError(cause instanceof Error ? cause.message : 'Impossibile caricare le app.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [service]);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(undefined), 4500);
    return () => clearTimeout(timeout);
  }, [notice]);
  const updatePreferences = (patch: Partial<Preferences>) => {
    if (!data) return;
    try {
      const preferences = service.savePreferences({ ...data.preferences, ...patch });
      setData({ ...data, preferences });
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'Salvataggio non riuscito.');
    }
  };
  const launch = async (app: LauncherItem) => {
    if (service.platform.mode === 'preview') {
      setPreviewApp(app);
      return;
    }
    if (busyId) return;
    setBusyId(app.id);
    try {
      await service.launch(app);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'Apertura non riuscita.');
    } finally {
      setBusyId(undefined);
    }
  };
  const openSystemSettings = async () => {
    try {
      await service.platform.openSystemSettings();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'Impostazioni non disponibili.');
    }
  };
  const toggleFavorite = (id: string) => {
    const ids = data?.preferences.favoriteIds ?? [];
    updatePreferences({
      favoriteIds: ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id],
    });
  };
  return {
    apps: data?.apps ?? [],
    device: data?.device,
    preferences: data?.preferences ?? DEFAULT_PREFERENCES,
    loading,
    error,
    notice,
    busyId,
    previewApp,
    setPreviewApp,
    reload,
    updatePreferences,
    launch,
    openSystemSettings,
    toggleFavorite,
  };
}
