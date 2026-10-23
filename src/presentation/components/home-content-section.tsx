import { RefreshCw } from 'lucide-react';
import { orderHomeContent } from '../../domain/home-content';
import { ContentRail } from './content-rail';
import { ContentCard } from './content-card';
import type { useHomeContent } from '../hooks/use-home-content';

type HomeContentState = ReturnType<typeof useHomeContent>;

/** Optional home rows use the same semantic buttons and spatial focus as favorite apps. */
export function HomeContentSection({
  content,
  favoriteIds,
}: {
  content: HomeContentState;
  favoriteIds: readonly string[];
}) {
  const { feed, loading, error } = content;
  const orderedItems = orderHomeContent(feed?.items ?? [], favoriteIds);
  const groups = [
    { kind: 'continue', title: 'Continua a guardare' },
    { kind: 'recommendation', title: 'Consigli dalle tue app' },
  ] as const;
  if (feed?.items.length)
    return (
      <div className="home-content-section scene-enter">
        {error && (
          <p className="content-status" role="alert">
            {error}
          </p>
        )}
        {groups.map((group) => {
          const items = orderedItems.filter((item) => item.kind === group.kind);
          if (!items.length) return null;
          return (
            <section
              className="content-group"
              key={group.kind}
              aria-labelledby={`content-${group.kind}-title`}
            >
              <div className="content-heading">
                <h2 id={`content-${group.kind}-title`}>{group.title}</h2>
                <button
                  className="text-button"
                  data-tv-focus={`refresh-${group.kind}`}
                  onClick={content.reload}
                  aria-label={`Aggiorna ${group.title.toLowerCase()}`}
                >
                  <RefreshCw size={18} />
                </button>
              </div>
              <ContentRail title={group.title}>
                {items.map((item) => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    busy={content.busyId === item.id}
                    onOpen={() => void content.open(item.id)}
                  />
                ))}
              </ContentRail>
            </section>
          );
        })}
      </div>
    );
  const status =
    error ??
    (loading
      ? 'Caricamento contenuti…'
      : feed?.status === 'preview'
        ? 'I contenuti condivisi dalle app sono disponibili sulla TV.'
        : feed?.status === 'permission-required'
          ? 'Consenti l’accesso ai contenuti condivisi dalle app TV.'
          : feed?.status === 'unavailable'
            ? 'Il firmware non rende disponibili i contenuti delle app.'
            : 'Le app non hanno condiviso contenuti disponibili.');
  return (
    <section className="home-content-section content-empty" aria-labelledby="shared-content-title">
      <h2 id="shared-content-title">Dalle tue app</h2>
      <p className="content-status" role={error ? 'alert' : 'status'}>
        {status}
      </p>
      {feed?.status === 'permission-required' ? (
        <button
          className="text-button"
          data-tv-focus="allow-content"
          onClick={() => void content.requestAccess()}
        >
          Consenti accesso
        </button>
      ) : (
        feed?.status !== 'preview' &&
        !loading && (
          <button className="text-button" data-tv-focus="refresh-content" onClick={content.reload}>
            <RefreshCw size={18} />
            Aggiorna
          </button>
        )
      )}
    </section>
  );
}
