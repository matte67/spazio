import * as Dialog from '@radix-ui/react-dialog';
import { useRef } from 'react';
import { Monitor, Pin } from 'lucide-react';
import type { LauncherItem } from '../../domain/launcher';
import { AppIdentity } from './app-tile';
export function PreviewDialog({
  focusHomeOnClose = false,
  app,
  favorite,
  onClose,
  onToggleFavorite,
}: {
  focusHomeOnClose?: boolean;
  app?: LauncherItem;
  favorite: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
}) {
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root
      open={!!app}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className="preview-dialog"
          onOpenAutoFocus={() => {
            returnFocus.current = document.activeElement as HTMLElement;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (focusHomeOnClose) {
              document.querySelector<HTMLButtonElement>('[data-tv-focus="nav-home"]')?.focus();
              return;
            }
            if (returnFocus.current?.isConnected) returnFocus.current.focus();
            else
              document
                .querySelector<HTMLButtonElement>(
                  '[data-tv-focus="all-apps"], [data-tv-focus="nav-home"]',
                )
                ?.focus();
          }}
        >
          {app && (
            <>
              <div className={`preview-brand app-tile--${app.brand ?? 'native'}`}>
                <AppIdentity app={app} />
              </div>
              <Dialog.Title>{app.name}, sulla tua TV.</Dialog.Title>
              <Dialog.Description>
                {app.kind === 'input'
                  ? `Sulla TV questo collegamento seleziona ${app.inputLabel}.`
                  : 'Questa è l’anteprima desktop: sulla TV si aprirà l’app installata.'}
              </Dialog.Description>
              <button
                className="primary-button"
                data-tv-focus="preview-favorite"
                onClick={onToggleFavorite}
              >
                <Pin size={19} />
                {favorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
              </button>
              <Dialog.Close className="text-button" data-tv-focus="close-preview">
                <Monitor size={18} />
                Torna al launcher
              </Dialog.Close>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
