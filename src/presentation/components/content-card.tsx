import { Film } from 'lucide-react';
import { useState } from 'react';
import type { HomeContentItem } from '../../domain/home-content';

interface ContentCardProps {
  readonly item: HomeContentItem;
  readonly busy: boolean;
  readonly onOpen: () => void;
}

/** One accessible action, with separate cover, playback progress and provider metadata. */
export function ContentCard({ item, busy, onOpen }: ContentCardProps) {
  const [failedSources, setFailedSources] = useState<readonly string[]>([]);
  const imageFailed = !!item.image && failedSources.includes(item.image);
  const source = imageFailed ? item.fallbackImage : item.image;
  const isAppIcon = item.imageKind === 'app-icon' || imageFailed;
  const showImage = !!source && !failedSources.includes(source);
  return (
    <button
      className="content-card"
      data-tv-focus={`content-${item.id}`}
      data-app-id={item.appId}
      onClick={onOpen}
      aria-label={`Apri ${item.title} in ${item.appName}`}
      aria-busy={busy}
    >
      <span className={`content-poster ${isAppIcon ? 'content-poster--app-icon' : ''}`}>
        {showImage ? (
          <img
            src={source}
            alt=""
            loading="lazy"
            draggable={false}
            onError={() => setFailedSources((failed) => [...failed, source])}
          />
        ) : (
          <Film aria-hidden="true" />
        )}
      </span>
      {item.progress !== undefined && (
        <span className="content-playback-state">
          <progress
            className="content-progress"
            max={1}
            value={item.progress}
            aria-label="Avanzamento riproduzione"
          />
        </span>
      )}
      <span className="content-details">
        <span className="content-title">{item.title}</span>
        <span className="content-app">{busy ? 'Apertura…' : item.appName}</span>
      </span>
    </button>
  );
}
