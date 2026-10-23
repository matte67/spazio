import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Pin, RefreshCw } from 'lucide-react';
import type { HomeContentService } from '../application/home-content-service';
import { useHomeContent } from './hooks/use-home-content';
import { HomeContentSection } from './components/home-content-section';
import type { LauncherService } from '../application/launcher-service';
import { getFavorites } from '../domain/launcher';
import { useLauncher } from './hooks/use-launcher';
import { useRemoteNavigation } from './hooks/use-remote-navigation';
import { AppTile } from './components/app-tile';
import { Header, type Page } from './components/header';
import { SettingsPanel } from './components/settings-panel';
import { PreviewDialog } from './components/preview-dialog';
import { WallpaperBackdrop } from './components/wallpaper-backdrop';
import { wallpaperDecorationUrl } from './wallpapers';

/** Screen composition; all platform operations are delegated to injected use cases. */
export function LauncherApp({
  service,
  homeContentService,
}: {
  service: LauncherService;
  homeContentService: HomeContentService;
}) {
  const launcher = useLauncher(service);
  const [page, setPage] = useState<Page>('home');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [focusHomeOnClose, setFocusHomeOnClose] = useState(false);
  const { previewApp, setPreviewApp } = launcher;
  const back = useCallback(() => {
    if (previewApp) setPreviewApp(undefined);
    else if (settingsOpen) setSettingsOpen(false);
    else {
      setPage('home');
      requestAnimationFrame(() =>
        document.querySelector<HTMLButtonElement>('[data-tv-focus="nav-home"]')?.focus(),
      );
    }
  }, [previewApp, setPreviewApp, settingsOpen]);
  useRemoteNavigation(back);
  useEffect(() => {
    const showHome = () => {
      setFocusHomeOnClose(true);
      setPreviewApp(undefined);
      setSettingsOpen(false);
      setPage('home');
      requestAnimationFrame(() => {
        document.querySelector<HTMLButtonElement>('[data-tv-focus="nav-home"]')?.focus();
      });
    };
    window.addEventListener('spazio-home', showHome);
    return () => window.removeEventListener('spazio-home', showHome);
  }, [setPreviewApp]);
  useEffect(() => {
    if (launcher.loading) return;
    const frame = requestAnimationFrame(() => {
      if (document.activeElement === document.body)
        document
          .querySelector<HTMLButtonElement>(
            '.apps-grid [data-tv-focus], [data-tv-focus="retry"], [data-tv-focus="empty-action"]',
          )
          ?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [launcher.loading]);
  const preferences = launcher.preferences;
  const homeContent = useHomeContent(
    homeContentService,
    !launcher.loading && preferences.showRecommendations,
  );
  useEffect(() => {
    document.documentElement.dataset.motion = preferences.animations ? 'on' : 'off';
  }, [preferences.animations]);
  const favorites = getFavorites(launcher.apps, preferences.favoriteIds);
  const visibleApps = page === 'home' ? favorites : launcher.apps;
  const wallpaperPatternClass =
    preferences.wallpaper !== 'bg-6'
      ? ''
      : preferences.blurWallpaper
        ? 'wallpaper-pattern--backdrop'
        : 'wallpaper-pattern--surfaces';
  const goToApps = () => {
    setPage('apps');
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLButtonElement>('.apps-grid [data-tv-focus]')
        ?.focus({ preventScroll: true }),
    );
  };
  return (
    <div className={`launcher wallpaper--${preferences.wallpaper} ${wallpaperPatternClass}`}>
      <WallpaperBackdrop variant={preferences.wallpaper} blurred={preferences.blurWallpaper} />
      {preferences.showDecorations && (
        <div
          className={`wallpaper-decoration wallpaper-decoration--${preferences.wallpaper}`}
          aria-hidden="true"
        >
          {preferences.wallpaper === 'bg-6' ? (
            <>
              <img
                className="wallpaper-bottom-art"
                src={wallpaperDecorationUrl(preferences.wallpaper)}
                alt=""
                draggable={false}
              />
              <img
                className="wallpaper-bottom-art"
                src={wallpaperDecorationUrl(preferences.wallpaper)}
                alt=""
                draggable={false}
              />
            </>
          ) : (
            <img
              className="wallpaper-bottom-art"
              src={wallpaperDecorationUrl(preferences.wallpaper)}
              alt=""
              draggable={false}
            />
          )}
        </div>
      )}
      <div className="launcher-content">
        <Header
          page={page}
          showClock={preferences.showClock}
          wallpaper={preferences.wallpaper}
          onNavigate={(next) => {
            if (next === 'apps') goToApps();
            else setPage('home');
          }}
          onSettings={() => {
            setFocusHomeOnClose(false);
            setSettingsOpen(true);
          }}
        />
        <main className={`main-content ${page === 'apps' ? 'main-content--apps' : ''}`}>
          <section
            className={`apps-section ${page === 'apps' ? 'scene-enter' : ''}`}
            aria-labelledby="apps-title"
            key={page}
          >
            <div className="section-heading">
              <div>
                <h1 id="apps-title">
                  {page === 'home' ? 'Le tue preferite' : 'Tutte le applicazioni'}
                  <span className="app-count">
                    {page === 'home' ? favorites.length : launcher.apps.length}
                  </span>
                </h1>
                {page === 'apps' && (
                  <p>
                    <Pin size={16} />
                    Usa la puntina per scegliere le app della Home.
                  </p>
                )}
              </div>
              {page === 'home' ? (
                <button className="text-button" data-tv-focus="all-apps" onClick={goToApps}>
                  Tutte le app
                  <ArrowRight size={19} />
                </button>
              ) : (
                <button
                  className="text-button"
                  data-tv-focus="refresh-apps"
                  onClick={() => void launcher.reload()}
                >
                  <RefreshCw size={18} />
                  Aggiorna
                </button>
              )}
            </div>
            {launcher.loading ? (
              <div className="loading-state" role="status">
                <span className="loading-dot" />
                Caricamento applicazioni…
              </div>
            ) : launcher.error ? (
              <div className="empty-state" role="alert">
                <p>{launcher.error}</p>
                <button
                  className="primary-button"
                  data-tv-focus="retry"
                  onClick={() => void launcher.reload()}
                >
                  <RefreshCw size={18} />
                  Riprova
                </button>
              </div>
            ) : visibleApps.length === 0 ? (
              <div className="empty-state">
                <p>
                  {page === 'home'
                    ? 'Le tue preferite iniziano da qui.'
                    : 'Nessuna applicazione TV disponibile.'}
                </p>
                <button
                  className="primary-button"
                  data-tv-focus="empty-action"
                  onClick={page === 'home' ? goToApps : () => void launcher.reload()}
                >
                  {page === 'home' ? 'Scegli le app' : 'Riprova'}
                  <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <div
                className={`apps-grid ${page === 'home' ? 'apps-grid--favorites' : ''}`}
                data-tv-rail={page === 'home' ? '' : undefined}
                aria-label={page === 'home' ? 'Applicazioni preferite' : 'Applicazioni installate'}
              >
                {visibleApps.map((app) => (
                  <AppTile
                    key={app.id}
                    app={app}
                    favorite={preferences.favoriteIds.includes(app.id)}
                    busy={launcher.busyId === app.id}
                    editable={page === 'apps'}
                    featured={page === 'home'}
                    onLaunch={() => {
                      setFocusHomeOnClose(false);
                      void launcher.launch(app);
                    }}
                    onToggleFavorite={() => launcher.toggleFavorite(app.id)}
                  />
                ))}
              </div>
            )}
          </section>
          {page === 'home' &&
            !launcher.loading &&
            !launcher.error &&
            preferences.showRecommendations && (
              <HomeContentSection content={homeContent} favoriteIds={preferences.favoriteIds} />
            )}
        </main>
      </div>
      <SettingsPanel
        returnFocusToContent={service.platform.mode === 'android'}
        focusHomeOnClose={focusHomeOnClose}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        preferences={preferences}
        device={launcher.device}
        onChange={launcher.updatePreferences}
        onSystemSettings={() => void launcher.openSystemSettings()}
      />
      <PreviewDialog
        focusHomeOnClose={focusHomeOnClose}
        app={previewApp}
        favorite={!!previewApp && preferences.favoriteIds.includes(previewApp.id)}
        onClose={() => setPreviewApp(undefined)}
        onToggleFavorite={() => {
          if (previewApp) launcher.toggleFavorite(previewApp.id);
        }}
      />
      <div
        className={`notice ${launcher.notice ? 'notice--visible' : ''}`}
        role="status"
        aria-live="polite"
      >
        {launcher.notice}
      </div>
    </div>
  );
}
