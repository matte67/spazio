import { AppWindow } from 'lucide-react';
import { siNetflix, siPlaystation4, siSpotify, siYoutube } from 'simple-icons';
import { PS4_SHORTCUT_ID, type LauncherItem } from '../../domain/launcher';

type LogoArtwork =
  | { readonly kind: 'vector'; readonly path: string; readonly color: string }
  | { readonly kind: 'image'; readonly file: string };

/** Transparent brand artwork is independent of Android's opaque app icons. */
const APPLICATION_LOGOS: Readonly<Record<string, LogoArtwork>> = {
  'com.google.android.youtube.tv': { kind: 'vector', path: siYoutube.path, color: '#ff0033' },
  [PS4_SHORTCUT_ID]: { kind: 'vector', path: siPlaystation4.path, color: '#ffffff' },
  'com.netflix.ninja': { kind: 'vector', path: siNetflix.path, color: '#e50914' },
  'com.spotify.tv.android': { kind: 'vector', path: siSpotify.path, color: '#1ed760' },
  'com.amazon.amazonvideo.livingroom': { kind: 'image', file: 'prime.png' },
  'com.disney.disneyplus': { kind: 'image', file: 'disney.png' },
  'it.rainet.androidtv': { kind: 'image', file: 'rai.webp' },
};

export function ApplicationLogo({ app }: { app: LauncherItem }) {
  const artwork = APPLICATION_LOGOS[app.id];
  if (!artwork) return <AppWindow className="favorite-logo-fallback" aria-hidden="true" />;
  if (artwork.kind === 'vector') {
    return (
      <svg viewBox="0 0 24 24" fill={artwork.color} aria-hidden="true">
        <path d={artwork.path} />
      </svg>
    );
  }
  const source = new URL(`app-logos/${artwork.file}`, document.baseURI).href;
  return <img src={source} alt="" draggable={false} />;
}
