import type { HomeContentFeed, HomeContentItem } from '../domain/home-content';

/** Fictional fixtures, used exclusively by the browser adapter, never as an Android fallback. */
const PREVIEW_CONTENT: readonly (Omit<HomeContentItem, 'image' | 'imageKind'> & {
  artwork: string;
})[] = [
  {
    id: 'continue:900001',
    kind: 'continue',
    title: 'Oltre l’orbita',
    appId: 'com.netflix.ninja',
    appName: 'Netflix',
    artwork: 'orbit',
    progress: 0.64,
  },
  {
    id: 'continue:900002',
    kind: 'continue',
    title: 'L’ultima vetta',
    appId: 'com.amazon.amazonvideo.livingroom',
    appName: 'Prime Video',
    artwork: 'alpine',
    progress: 0.27,
  },
  {
    id: 'continue:900003',
    kind: 'continue',
    title: 'La città dopo il tramonto',
    appId: 'com.disney.disneyplus',
    appName: 'Disney+',
    artwork: 'city',
    progress: 0.46,
  },
  {
    id: 'continue:900004',
    kind: 'continue',
    title: 'Una costa lontana',
    appId: 'it.rainet.androidtv',
    appName: 'RaiPlay',
    artwork: 'coast',
    progress: 0.82,
  },
  {
    id: 'continue:900005',
    kind: 'continue',
    title: 'Il sentiero nascosto',
    appId: 'com.netflix.ninja',
    appName: 'Netflix',
    artwork: 'forest',
    progress: 0.12,
  },
  {
    id: 'recommendation:900001',
    kind: 'recommendation',
    title: 'Le voci del bosco',
    appId: 'com.disney.disneyplus',
    appName: 'Disney+',
    artwork: 'forest',
  },
  {
    id: 'recommendation:900002',
    kind: 'recommendation',
    title: 'Il cielo di domani',
    appId: 'com.netflix.ninja',
    appName: 'Netflix',
    artwork: 'orbit',
  },
  {
    id: 'recommendation:900003',
    kind: 'recommendation',
    title: 'Rotte sonore',
    appId: 'com.spotify.tv.android',
    appName: 'Spotify',
    artwork: 'sound',
  },
  {
    id: 'recommendation:900004',
    kind: 'recommendation',
    title: 'Appunti di viaggio',
    appId: 'com.google.android.youtube.tv',
    appName: 'YouTube',
    artwork: 'coast',
  },
  {
    id: 'recommendation:900005',
    kind: 'recommendation',
    title: 'Tra le cime',
    appId: 'com.amazon.amazonvideo.livingroom',
    appName: 'Prime Video',
    artwork: 'alpine',
  },
  {
    id: 'recommendation:900006',
    kind: 'recommendation',
    title: 'Una notte in città',
    appId: 'it.rainet.androidtv',
    appName: 'RaiPlay',
    artwork: 'city',
  },
];

export function createPreviewHomeContent(): HomeContentFeed {
  return {
    status: 'preview',
    items: PREVIEW_CONTENT.map(({ artwork, ...item }) => ({
      ...item,
      imageKind: 'poster',
      image: new URL(`preview-content/${artwork}.svg`, document.baseURI).href,
    })),
  };
}
