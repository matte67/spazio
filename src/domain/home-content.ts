/** Content explicitly shared by installed TV applications, never inferred from viewing history. */
export interface HomeContentItem {
  readonly id: string;
  readonly title: string;
  readonly appName: string;
  readonly appId: string;
  readonly kind: 'continue' | 'recommendation';
  readonly image?: string;
  readonly fallbackImage?: string;
  readonly imageKind?: 'poster' | 'app-icon';
  readonly progress?: number;
}
export interface HomeContentFeed {
  readonly status: 'ready' | 'permission-required' | 'unavailable' | 'preview';
  readonly items: readonly HomeContentItem[];
}

/** Prioritize favorite apps without changing each app's provider order or the input array. */
export function orderHomeContent(
  items: readonly HomeContentItem[],
  favoriteIds: readonly string[],
): readonly HomeContentItem[] {
  const priorities = new Map(favoriteIds.map((id, index) => [id, index]));
  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const priority =
        (priorities.get(left.item.appId) ?? favoriteIds.length) -
        (priorities.get(right.item.appId) ?? favoriteIds.length);
      return priority || left.index - right.index;
    })
    .map(({ item }) => item);
}
