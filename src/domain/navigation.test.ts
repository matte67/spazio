import { describe, expect, it } from 'vitest';
import { findNextFocus, type FocusRect } from './navigation';
const rect = (id: string, x: number, y: number): FocusRect => ({
  id,
  x,
  y,
  width: 100,
  height: 60,
});
describe('remote spatial navigation', () => {
  const a = rect('a', 0, 0),
    b = rect('b', 130, 0),
    c = rect('c', 0, 100),
    d = rect('d', 130, 100);
  it('moves along a row in both directions', () => {
    expect(findNextFocus(a, [a, b, c, d], 'right')).toBe('b');
    expect(findNextFocus(b, [a, b, c, d], 'left')).toBe('a');
  });
  it('preserves the column when moving between rows', () => {
    expect(findNextFocus(b, [a, b, c, d], 'down')).toBe('d');
    expect(findNextFocus(c, [a, b, c, d], 'up')).toBe('a');
  });
  it('stays at the boundary rather than losing focus', () => {
    expect(findNextFocus(a, [a, b], 'left')).toBeUndefined();
  });
  it('prefers aligned controls over a closer diagonal control', () => {
    expect(findNextFocus(a, [rect('aligned', 500, 0), rect('diagonal', 120, 100)], 'right')).toBe(
      'aligned',
    );
  });
});
