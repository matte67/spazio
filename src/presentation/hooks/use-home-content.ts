import { useCallback, useEffect, useState } from 'react';
import type { HomeContentService } from '../../application/home-content-service';
import type { HomeContentFeed } from '../../domain/home-content';

const REFRESH_INTERVAL_MS = 60_000;

/** No provider reads or polling while the user has disabled the section. */
export function useHomeContent(service: HomeContentService, enabled: boolean) {
  const [feed, setFeed] = useState<HomeContentFeed>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [busyId, setBusyId] = useState<string>();
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const refresh = async () => {
      setLoading(true);
      setError(undefined);
      try {
        const result = await service.load();
        if (active) setFeed(result);
      } catch (cause) {
        if (active) setError(message(cause));
      } finally {
        if (active) setLoading(false);
      }
    };
    void refresh();
    return () => {
      active = false;
    };
  }, [service, enabled, revision]);
  useEffect(() => {
    if (!enabled) return;
    const handleRefresh = () => {
      if (!document.hidden) reload();
    };
    window.addEventListener('spazio-content-changed', handleRefresh);
    window.addEventListener('spazio-home', handleRefresh);
    document.addEventListener('visibilitychange', handleRefresh);
    const timer = window.setInterval(handleRefresh, REFRESH_INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('spazio-content-changed', handleRefresh);
      window.removeEventListener('spazio-home', handleRefresh);
      document.removeEventListener('visibilitychange', handleRefresh);
    };
  }, [enabled, reload]);
  const open = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    setError(undefined);
    try {
      await service.open(id);
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusyId(undefined);
    }
  };
  const requestAccess = async () => {
    try {
      await service.requestAccess();
    } catch (cause) {
      setError(message(cause));
    }
  };
  return { feed, loading, error, busyId, reload, open, requestAccess };
}
function message(cause: unknown): string {
  return cause instanceof Error ? cause.message : 'Contenuti non disponibili. Riprova.';
}
