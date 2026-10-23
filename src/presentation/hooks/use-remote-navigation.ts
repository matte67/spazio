import { useEffect } from 'react';
import { findNextFocus, type Direction } from '../../domain/navigation';
const DIRECTIONS: Record<string, Direction> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
};
const RAIL_SELECTOR = '[data-tv-rail]';
const BACK_KEYS = new Set(['Escape', 'Backspace', 'BrowserBack', 'GoBack']);
function focusableControls() {
  const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"][data-state="open"]');
  const scope = dialogs.item(dialogs.length - 1) ?? document;
  return Array.from(scope.querySelectorAll<HTMLButtonElement>('[data-tv-focus]')).filter(
    (element) => !element.disabled && element.getBoundingClientRect().width > 0,
  );
}
/** Use the same DOM focus and activation path for keyboard and Android D-pad. */
export function useRemoteNavigation(onBack: () => void) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (BACK_KEYS.has(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        onBack();
        return;
      }
      const controls = focusableControls();
      if (event.key === 'Enter') {
        event.preventDefault();
        if (!event.repeat && document.activeElement instanceof HTMLButtonElement)
          document.activeElement.click();
        return;
      }
      const direction = DIRECTIONS[event.key];
      if (!direction) return;
      event.preventDefault();
      const current = controls.find((element) => element === document.activeElement);
      if (!current) {
        controls[0]?.focus();
        return;
      }
      const toRect = (element: HTMLElement) => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { id: element.dataset.tvFocus!, x, y, width, height };
      };
      const rail = current.closest(RAIL_SELECTOR);
      const horizontal = direction === 'left' || direction === 'right';
      // Stay in a scrolling row even when the previous item is beyond its visible edge.
      const rowTarget =
        horizontal && rail
          ? findNextFocus(
              toRect(current),
              controls.filter((element) => rail.contains(element)).map(toRect),
              direction,
            )
          : undefined;
      const id = rowTarget ?? findNextFocus(toRect(current), controls.map(toRect), direction);
      const target = controls.find((element) => element.dataset.tvFocus === id);
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
    };
    document.addEventListener('keydown', handleKey, true);
    return () => document.removeEventListener('keydown', handleKey, true);
  }, [onBack]);
}
