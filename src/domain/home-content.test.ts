import { expect, it } from 'vitest';
import { orderHomeContent, type HomeContentItem } from './home-content';

it('orders both rows by favorites and preserves provider order within each app', () => {
  const item = (id: string, appId: string, kind: HomeContentItem['kind']): HomeContentItem => ({
    id,
    appId,
    kind,
    title: id,
    appName: appId,
  });
  const source = [
    item('1', 'other', 'continue'),
    item('2', 'b', 'continue'),
    item('3', 'a', 'continue'),
    item('4', 'b', 'recommendation'),
    item('5', 'a', 'recommendation'),
    item('6', 'a', 'continue'),
    item('7', 'other', 'recommendation'),
  ];
  const ordered = orderHomeContent(source, ['a', 'b']);
  expect(ordered.filter((item) => item.kind === 'continue').map((item) => item.id)).toEqual([
    '3',
    '6',
    '2',
    '1',
  ]);
  expect(ordered.filter((item) => item.kind === 'recommendation').map((item) => item.id)).toEqual([
    '5',
    '4',
    '7',
  ]);
  expect(
    orderHomeContent(source, ['b', 'a'])
      .filter((item) => item.kind === 'continue')
      .map((item) => item.id),
  ).toEqual(['2', '3', '6', '1']);
  expect(source.map((item) => item.id)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
});
