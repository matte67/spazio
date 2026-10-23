import type { HomeContentFeed } from '../domain/home-content';
import { LauncherError } from './ports';

/** Platform boundary for optional shared TV content. */
export interface HomeContentSource {
  getHomeContent(): Promise<HomeContentFeed>;
  openHomeContent(id: string): Promise<void>;
  requestContentAccess(): Promise<void>;
}

/** Keep content access independent of the application's launcher availability. */
export class HomeContentService {
  constructor(private readonly source: HomeContentSource) {}
  load(): Promise<HomeContentFeed> {
    return this.source.getHomeContent();
  }
  open(id: string): Promise<void> {
    if (!/^(continue|recommendation):\d+$/.test(id)) {
      throw new LauncherError('Contenuto non valido.', 'INVALID_CONTENT');
    }
    return this.source.openHomeContent(id);
  }
  requestAccess(): Promise<void> {
    return this.source.requestContentAccess();
  }
}
