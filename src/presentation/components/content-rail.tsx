import { useRef, type ReactNode } from 'react';
import { useRailEdgeFade } from '../hooks/use-rail-edge-fade';

/** Scroll/fade boundary shared by the two content rows, with one keyboard rail per group. */
export function ContentRail({ title, children }: { title: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useRailEdgeFade(ref);
  return (
    <div ref={ref} className="content-rail" data-tv-rail="" aria-label={title}>
      {children}
    </div>
  );
}
