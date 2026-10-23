import * as Dialog from '@radix-ui/react-dialog';
import { useRef, useState } from 'react';
import { ArrowUpRight, Check, Monitor, Shuffle, X } from 'lucide-react';
import type { DeviceInfo, Preferences } from '../../domain/launcher';
import { chooseRandomWallpaper, WALLPAPER_OPTIONS, wallpaperImageUrl } from '../wallpapers';

const INITIAL_WALLPAPER_COUNT = 6;
interface SettingsPanelProps {
  focusHomeOnClose?: boolean;
  returnFocusToContent?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: Preferences;
  device?: DeviceInfo;
  onChange: (patch: Partial<Preferences>) => void;
  onSystemSettings: () => void;
}
function Toggle({
  label,
  checked,
  id,
  onChange,
}: {
  label: string;
  checked: boolean;
  id: string;
  onChange: () => void;
}) {
  return (
    <button
      className="setting-toggle"
      role="switch"
      aria-checked={checked}
      data-tv-focus={id}
      onClick={onChange}
    >
      <span>{label}</span>
      <span className={`switch-track ${checked ? 'on' : ''}`}>
        <span />
      </span>
    </button>
  );
}
export function SettingsPanel({
  focusHomeOnClose = false,
  returnFocusToContent = false,
  open,
  onOpenChange,
  preferences,
  device,
  onChange,
  onSystemSettings,
}: SettingsPanelProps) {
  const returnFocus = useRef<HTMLElement | null>(null);
  const [showAllWallpapers, setShowAllWallpapers] = useState(false);
  const visibleWallpapers = showAllWallpapers
    ? WALLPAPER_OPTIONS
    : WALLPAPER_OPTIONS.slice(0, INITIAL_WALLPAPER_COUNT);
  const hasAdditionalWallpapers = WALLPAPER_OPTIONS.length > INITIAL_WALLPAPER_COUNT;
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className="settings-panel"
          onOpenAutoFocus={(event) => {
            returnFocus.current = document.activeElement as HTMLElement;
            event.preventDefault();
            document.querySelector<HTMLButtonElement>('[data-tv-focus="close-settings"]')?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (focusHomeOnClose) {
              document.querySelector<HTMLButtonElement>('[data-tv-focus="nav-home"]')?.focus();
              return;
            }
            if (returnFocusToContent) {
              // Resume remote navigation in content instead of leaving the settings dock selected.
              const content = document.querySelector<HTMLButtonElement>(
                '.apps-grid [data-tv-focus], [data-tv-focus="retry"], [data-tv-focus="empty-action"]',
              );
              (
                content ?? document.querySelector<HTMLButtonElement>('[data-tv-focus="nav-home"]')
              )?.focus({ preventScroll: true });
              return;
            }
            if (returnFocus.current?.isConnected) returnFocus.current.focus();
            else document.querySelector<HTMLButtonElement>('[data-tv-focus="settings"]')?.focus();
          }}
        >
          <div className="panel-heading">
            <Dialog.Title>Fallo tuo.</Dialog.Title>
            <Dialog.Close
              className="icon-button"
              data-tv-focus="close-settings"
              aria-label="Chiudi personalizzazione"
            >
              <X />
            </Dialog.Close>
          </div>
          <Dialog.Description>Un po’ di te, nella tua TV.</Dialog.Description>
          <section className="settings-section" aria-labelledby="wallpaper-title">
            <h3 id="wallpaper-title">Sfondo</h3>
            {!WALLPAPER_OPTIONS.length && (
              <p className="content-status">Nessuno sfondo disponibile.</p>
            )}
            <button
              className="wallpaper-random"
              data-tv-focus="wallpaper-random"
              aria-pressed={preferences.randomWallpaper}
              onClick={() =>
                onChange({
                  wallpaper: chooseRandomWallpaper(preferences.wallpaper),
                  randomWallpaper: true,
                })
              }
            >
              <Shuffle size={18} aria-hidden="true" />
              <span>Modalità casuale</span>
              {preferences.randomWallpaper && <Check size={18} aria-hidden="true" />}
            </button>
            <div className="wallpaper-options" role="group" aria-label="Scegli sfondo">
              {visibleWallpapers.map((wallpaper) => (
                <button
                  key={wallpaper.id}
                  className="wallpaper-option"
                  data-tv-focus={`wallpaper-${wallpaper.id}`}
                  aria-pressed={preferences.wallpaper === wallpaper.id}
                  onClick={() =>
                    onChange({ wallpaper: wallpaper.id, randomWallpaper: false })
                  }
                >
                  <span
                    className={`wallpaper-swatch wallpaper-swatch--${wallpaper.id}`}
                    style={{
                      backgroundImage: `url(${JSON.stringify(wallpaperImageUrl(wallpaper.id))})`,
                    }}
                  >
                    {preferences.wallpaper === wallpaper.id && <Check size={22} />}
                  </span>
                  <span>{wallpaper.name}</span>
                </button>
              ))}
            </div>
            {hasAdditionalWallpapers && (
              <button
                className="wallpaper-more"
                data-tv-focus="wallpaper-more"
                aria-expanded={showAllWallpapers}
                onClick={() => setShowAllWallpapers((visible) => !visible)}
              >
                {showAllWallpapers ? 'Mostra meno' : 'Mostra altri sfondi'}
              </button>
            )}
          </section>
          <section className="settings-section" aria-labelledby="appearance-title">
            <h3 id="appearance-title">L’essenziale, come piace a te</h3>
            <Toggle
              label="Consigli e continua a guardare"
              id="toggle-recommendations"
              checked={preferences.showRecommendations}
              onChange={() => onChange({ showRecommendations: !preferences.showRecommendations })}
            />
            <Toggle
              label="Mostra orologio"
              id="toggle-clock"
              checked={preferences.showClock}
              onChange={() => onChange({ showClock: !preferences.showClock })}
            />
            <Toggle
              label="Sfoca sfondo"
              id="toggle-wallpaper-blur"
              checked={preferences.blurWallpaper}
              onChange={() => onChange({ blurWallpaper: !preferences.blurWallpaper })}
            />
            <Toggle
              label="Mostra decorazioni"
              id="toggle-decorations"
              checked={preferences.showDecorations}
              onChange={() => onChange({ showDecorations: !preferences.showDecorations })}
            />
            <Toggle
              label="Animazioni"
              id="toggle-motion"
              checked={preferences.animations}
              onChange={() => onChange({ animations: !preferences.animations })}
            />
          </section>
          <button
            className="system-settings"
            data-tv-focus="system-settings"
            onClick={onSystemSettings}
          >
            <span>
              <Monitor size={22} />
              Impostazioni Android
            </span>
            <ArrowUpRight size={23} />
          </button>
          <p className="device-info">
            {device?.mode === 'preview' ? 'Profilo di destinazione' : 'Dispositivo'}
            <br />
            <strong>
              {device?.model ?? 'TV'} · Android {device?.androidVersion ?? '11'}
            </strong>
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
