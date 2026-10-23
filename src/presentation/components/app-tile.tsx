import { AppWindow, Pin, Play } from 'lucide-react';
import type { LauncherItem } from '../../domain/launcher';
import { ApplicationLogo } from './application-logo';
import { FavoriteArtwork } from './favorite-artwork';
export function AppIdentity({ app }: { app: LauncherItem }) {
  if (app.kind === 'input')
    return (
      <span className="input-shortcut-logo">
        <ApplicationLogo app={app} />
      </span>
    );
  if (app.icon) return <img className="native-icon" src={app.icon} alt="" draggable={false} />;
  switch (app.brand) {
    case 'youtube':
      return (
        <span className="brand-youtube">
          <span>
            <Play fill="currentColor" strokeWidth={0} />
          </span>
          YouTube
        </span>
      );
    case 'netflix':
      return <span className="brand-netflix">NETFLIX</span>;
    case 'prime':
      return (
        <span className="brand-prime">
          prime video
          <span className="prime-smile" />
        </span>
      );
    case 'spotify':
      return (
        <span className="brand-spotify">
          <svg viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="20" fill="currentColor" />
            <path
              d="M9 15q12-5 23 1M10 21q10-4 20 1M12 27q8-3 16 1"
              fill="none"
              stroke="#111b16"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          Spotify
        </span>
      );
    case 'disney':
      return (
        <span className="brand-disney">
          Disney<span>+</span>
        </span>
      );
    case 'rai':
      return (
        <span className="brand-rai">
          Rai<span>Play</span>
        </span>
      );
    default:
      return <AppWindow size={48} />;
  }
}
interface AppTileProps {
  app: LauncherItem;
  favorite: boolean;
  busy: boolean;
  editable?: boolean;
  featured?: boolean;
  onLaunch: () => void;
  onToggleFavorite: () => void;
}
export function AppTile({
  app,
  favorite,
  busy,
  editable,
  featured = false,
  onLaunch,
  onToggleFavorite,
}: AppTileProps) {
  return (
    <div className={`app-item ${featured ? 'app-item--featured' : ''}`}>
      <button
        className={`app-tile app-tile--${app.brand ?? 'native'} ${featured ? 'favorite-card' : ''}`}
        data-tv-focus={`app-${app.id}`}
        onClick={onLaunch}
        aria-label={
          app.kind === 'input' ? `Apri ${app.name} su ${app.inputLabel}` : `Apri ${app.name}`
        }
        title={app.kind === 'input' ? `${app.name} · ${app.inputLabel}` : app.name}
        aria-busy={busy}
      >
        {featured ? (
          <FavoriteArtwork app={app} />
        ) : (
          <>
            {(app.banner ?? app.icon) && (
              <img
                className="app-artwork-backdrop"
                src={app.banner ?? app.icon}
                alt=""
                draggable={false}
              />
            )}
            <span className="app-artwork-fade" aria-hidden="true" />
            <span className="app-logo">
              <AppIdentity app={app} />
            </span>
            <span className="app-artwork-shine" aria-hidden="true" />
          </>
        )}
        {busy && <span className="launching">Apertura…</span>}
      </button>
      <div className="app-caption">
        <span>{app.name}</span>
        {editable && (
          <button
            className="pin-button"
            data-tv-focus={`pin-${app.id}`}
            aria-pressed={favorite}
            aria-label={`${favorite ? 'Rimuovi' : 'Aggiungi'} ${app.name} ${favorite ? 'dai' : 'ai'} preferiti`}
            onClick={onToggleFavorite}
          >
            <Pin size={18} fill={favorite ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
    </div>
  );
}
