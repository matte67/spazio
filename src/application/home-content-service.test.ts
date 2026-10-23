import { expect, it, vi } from 'vitest';
import { HomeContentService } from './home-content-service';

it('rejects arbitrary links and delegates only a provider-owned content identifier', async () => {
  const openHomeContent = vi.fn(async () => {});
  const service = new HomeContentService({
    getHomeContent: async () => ({ status: 'ready', items: [] }),
    requestContentAccess: async () => {},
    openHomeContent,
  });
  expect(() => service.open('https://example.com')).toThrow('Contenuto non valido');
  expect(openHomeContent).not.toHaveBeenCalled();
  await service.open('recommendation:42');
  expect(openHomeContent).toHaveBeenCalledWith('recommendation:42');
});
