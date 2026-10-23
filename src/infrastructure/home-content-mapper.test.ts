import { describe, expect, it } from 'vitest';
import { mapHomeContent } from './home-content-mapper';

describe('shared content boundary', () => {
  const item = {
    id: 'continue:12',
    title: 'Episode',
    appName: 'Player',
    appId: 'test.player',
    kind: 'continue',
  };
  it('keeps native artwork, clamps progress and discards duplicate or invalid items', () => {
    const image = 'https://appassets.androidplatform.net/home-art/continue%3A12';
    expect(
      mapHomeContent({
        status: 'ready',
        items: [
          { ...item, image, progress: 2 },
          { ...item, image, progress: 2 },
          { ...item, id: 'intent:bad' },
        ],
      }).items,
    ).toEqual([{ ...item, image, fallbackImage: undefined, imageKind: 'poster', progress: 1 }]);
  });
  it('rejects external and executable artwork without hiding valid metadata', () => {
    for (const image of [
      'https://example.com/poster.jpg',
      'javascript:alert(1)',
      'file:///private',
    ]) {
      expect(
        mapHomeContent({ status: 'ready', items: [{ ...item, image }] }).items[0].image,
      ).toBeUndefined();
    }
  });
  it('reports invalid native responses and preserves permission states', () => {
    expect(() => mapHomeContent({ status: 'invented', items: [] })).toThrow(
      'Contenuti TV non disponibili',
    );
    expect(mapHomeContent({ status: 'permission-required', items: [] })).toEqual({
      status: 'permission-required',
      items: [],
    });
  });
});
