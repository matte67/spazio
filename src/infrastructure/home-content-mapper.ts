import { LauncherError } from '../application/ports';
import type { HomeContentFeed, HomeContentItem } from '../domain/home-content';

/** Accept native-owned artwork URLs only; remote URLs and launch intents never enter the UI. */
export function mapHomeContent(value: unknown): HomeContentFeed {
  if (!value || typeof value !== 'object') throw invalidResponse();
  const feed = value as Record<string, unknown>;
  if (
    !['ready', 'permission-required', 'unavailable', 'preview'].includes(String(feed.status)) ||
    !Array.isArray(feed.items)
  ) {
    throw invalidResponse();
  }
  const items: HomeContentItem[] = [];
  for (const value of feed.items.slice(0, 40)) {
    if (!value || typeof value !== 'object') continue;
    const item = value as Record<string, unknown>;
    if (
      typeof item.id !== 'string' ||
      !/^(continue|recommendation):\d+$/.test(item.id) ||
      typeof item.title !== 'string' ||
      !item.title.trim() ||
      typeof item.appName !== 'string' ||
      typeof item.appId !== 'string' ||
      !item.appId.trim() ||
      item.appId.length > 255 ||
      !['continue', 'recommendation'].includes(String(item.kind))
    )
      continue;
    items.push({
      id: item.id,
      title: item.title.slice(0, 200),
      appName: item.appName.slice(0, 100),
      appId: item.appId,
      kind: item.kind as HomeContentItem['kind'],
      image: safeArtwork(item.image),
      fallbackImage:
        typeof item.fallbackImage === 'string' && item.fallbackImage.startsWith('data:')
          ? safeArtwork(item.fallbackImage)
          : undefined,
      imageKind: item.imageKind === 'app-icon' ? 'app-icon' : 'poster',
      progress:
        typeof item.progress === 'number' && Number.isFinite(item.progress)
          ? Math.min(1, Math.max(0, item.progress))
          : undefined,
    });
  }
  return {
    status: feed.status as HomeContentFeed['status'],
    items: [...new Map(items.map((item) => [item.id, item])).values()],
  };
}
function invalidResponse() {
  return new LauncherError('Contenuti TV non disponibili. Riprova.', 'INVALID_CONTENT_RESPONSE');
}

function safeArtwork(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  if (
    /^https:\/\/appassets\.androidplatform\.net\/home-art\/(?:continue|recommendation)(?::|%3[Aa])\d+$/.test(
      value,
    )
  )
    return value;
  if (value.length <= 400_000 && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value))
    return value;
  return undefined;
}
