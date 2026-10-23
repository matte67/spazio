import { useLayoutEffect, type RefObject } from 'react';

/** Keep pane masks aligned to the scroll viewport without masking their backdrop ancestors. */
export function useRailEdgeFade(ref: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const rail = ref.current;
    if (!rail) return;
    let frame: number | undefined;
    const update = () => {
      frame = undefined;
      const bounds = rail.getBoundingClientRect();
      // Read geometry together before writing styles to avoid repeated layout during scrolling.
      const offsets = [...rail.children].flatMap((child) =>
        child instanceof HTMLElement
          ? [{ child, offset: bounds.left - child.getBoundingClientRect().left }]
          : [],
      );
      rail.style.setProperty('--rail-mask-width', `${bounds.width}px`);
      offsets.forEach(({ child, offset }) => {
        child.style.setProperty('--rail-mask-offset', `${offset}px`);
      });
    };
    const schedule = () => {
      if (frame === undefined) frame = requestAnimationFrame(update);
    };
    const resize = new ResizeObserver(schedule);
    const children = new MutationObserver(schedule);
    resize.observe(rail);
    children.observe(rail, { childList: true });
    rail.addEventListener('scroll', schedule, { passive: true });
    update();
    return () => {
      rail.removeEventListener('scroll', schedule);
      resize.disconnect();
      children.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [ref]);
}
