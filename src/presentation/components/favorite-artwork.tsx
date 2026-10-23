import type { LauncherItem } from '../../domain/launcher';
import { ApplicationLogo } from './application-logo';

/** Composes a sharp card surface with a separate, overlapping transparent logo. */
export function FavoriteArtwork({ app }: { app: LauncherItem }) {
  return (
    <>
      <span className="favorite-surface" aria-hidden="true">
        {app.banner && (
          <img className="favorite-background" src={app.banner} alt="" draggable={false} />
        )}
        <span className="favorite-surface-wash" />
        <span className="favorite-logo-fade" />
      </span>
      <span className="favorite-floating-logo">
        <ApplicationLogo app={app} />
      </span>
    </>
  );
}
