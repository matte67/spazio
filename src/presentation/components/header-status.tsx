import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Wallpaper } from '../../domain/launcher';
import { timeOfDay } from '../time-of-day';
import { wallpaperBrand } from '../wallpapers';

function Clock({ showSymbol }: { showSymbol: boolean }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  const period = timeOfDay(now);
  const Symbol = period === 'day' ? Sun : Moon;
  return (
    <div className="clock">
      {showSymbol && (
        <span className="clock-symbol" data-period={period} aria-hidden="true">
          <Symbol />
        </span>
      )}
      <div className="clock-reading">
        <time dateTime={now.toISOString()}>
          {now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
        </time>
      </div>
    </div>
  );
}

/** Informational dock: it shares navigation geometry without adding a remote-focus stop. */
export function HeaderStatus({
  showClock,
  wallpaper,
}: {
  showClock: boolean;
  wallpaper: Wallpaper;
}) {
  const brand = wallpaperBrand(wallpaper);
  if (!showClock && !brand) return null;
  return (
    <div
      className={`header-status glass-dock ${brand ? 'header-status--themed' : ''} ${showClock ? 'header-status--with-clock' : ''}`}
      role="group"
      aria-label="Ora e tema"
    >
      {showClock && <Clock showSymbol={!brand} />}
      {brand && (
        <img
          className={`theme-logo theme-logo--${brand.kind}`}
          src={new URL(`theme-logos/${brand.file}`, document.baseURI).href}
          alt={brand.name}
          draggable={false}
        />
      )}
    </div>
  );
}
