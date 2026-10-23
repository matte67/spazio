import { Home, LayoutGrid, Settings2 } from 'lucide-react';
import type { Wallpaper } from '../../domain/launcher';
import { HeaderStatus } from './header-status';
export type Page = 'home' | 'apps';
interface HeaderProps {
  page: Page;
  showClock: boolean;
  wallpaper: Wallpaper;
  onNavigate: (page: Page) => void;
  onSettings: () => void;
}
export function Header({ page, showClock, wallpaper, onNavigate, onSettings }: HeaderProps) {
  return (
    <header className="header">
      <nav className="navigation glass-dock" aria-label="Navigazione principale">
        <button
          data-tv-focus="nav-home"
          className={page === 'home' ? 'nav-item active' : 'nav-item'}
          aria-current={page === 'home' ? 'page' : undefined}
          aria-label="Home"
          onClick={() => onNavigate('home')}
        >
          <Home aria-hidden="true" />
          <span className="nav-label">Home</span>
        </button>
        <button
          data-tv-focus="nav-apps"
          className={page === 'apps' ? 'nav-item active' : 'nav-item'}
          aria-current={page === 'apps' ? 'page' : undefined}
          aria-label="Applicazioni"
          onClick={() => onNavigate('apps')}
        >
          <LayoutGrid aria-hidden="true" />
          <span className="nav-label">Applicazioni</span>
        </button>
        <button
          className="nav-item"
          data-tv-focus="settings"
          aria-label="Personalizza launcher"
          onClick={onSettings}
        >
          <Settings2 aria-hidden="true" />
          <span className="nav-label">Personalizza</span>
        </button>
      </nav>
      <HeaderStatus showClock={showClock} wallpaper={wallpaper} />
    </header>
  );
}
