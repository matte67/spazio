export type Direction = 'left' | 'right' | 'up' | 'down';
export interface FocusRect {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
const OFF_AXIS_PENALTY = 2000;
/** Spatial selection is pure; the presentation layer supplies measured rectangles. */
export function findNextFocus(
  current: FocusRect,
  candidates: readonly FocusRect[],
  direction: Direction,
): string | undefined {
  const horizontal = direction === 'left' || direction === 'right';
  const sign = direction === 'left' || direction === 'up' ? -1 : 1;
  const center = (rect: FocusRect) => ({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
  const origin = center(current);
  let best: { id: string; score: number } | undefined;
  for (const candidate of candidates) {
    if (candidate.id === current.id) continue;
    const point = center(candidate);
    const forward = (horizontal ? point.x - origin.x : point.y - origin.y) * sign;
    if (forward <= 1) continue;
    const lateral = Math.abs(horizontal ? point.y - origin.y : point.x - origin.x);
    const aligned = horizontal
      ? candidate.y < current.y + current.height && candidate.y + candidate.height > current.y
      : candidate.x < current.x + current.width && candidate.x + candidate.width > current.x;
    const score = forward + lateral * 2 + (aligned ? 0 : OFF_AXIS_PENALTY);
    if (!best || score < best.score) best = { id: candidate.id, score };
  }
  return best?.id;
}
