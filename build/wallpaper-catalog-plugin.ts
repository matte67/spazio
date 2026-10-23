import { readdir, readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import type { Plugin } from 'vite';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg']);

/** Build-time filesystem adapter; only a static filename manifest enters the browser or APK. */
export function wallpaperCatalogPlugin(): Plugin {
  let root: string;
  let source: string;
  let target: string;
  let pending = Promise.resolve();
  const scan = async (directory: string): Promise<string[]> => {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
    const groups = await Promise.all(
      entries
        .filter((entry) => !entry.name.startsWith('.'))
        .map(async (entry) => {
          const path = resolve(directory, entry.name);
          if (entry.isDirectory()) return scan(path);
          if (!entry.isFile() || !IMAGE_EXTENSIONS.has(extname(entry.name).toLowerCase()))
            return [];
          return [relative(source, path).split(sep).join('/')];
        }),
    );
    return groups.flat();
  };
  const sync = async () => {
    const files = (await scan(source)).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
    const content = `${JSON.stringify(files, null, 2)}\n`;
    let previous: string | undefined;
    try {
      previous = await readFile(target, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    if (previous === content) return;
    await mkdir(dirname(target), { recursive: true });
    const temporary = `${target}.${process.pid}.tmp`;
    await writeFile(temporary, content);
    await rename(temporary, target);
  };
  return {
    name: 'spazio-wallpaper-catalog',
    configResolved(config) {
      root = config.root;
      source = resolve(root, 'public/wallpapers');
      target = resolve(root, 'src/generated/wallpaper-files.json');
    },
    buildStart: sync,
    async configureServer(server) {
      await sync();
      const refresh = (file: string) => {
        const path = resolve(file);
        if (path !== source && !path.startsWith(`${source}${sep}`)) return;
        // Serialize watcher bursts so a slow scan cannot overwrite a newer catalog.
        pending = pending.then(sync).catch((error: unknown) => {
          server.config.logger.error(`Wallpaper catalog: ${String(error)}`);
        });
      };
      server.watcher.add(source);
      server.watcher
        .on('add', refresh)
        .on('unlink', refresh)
        .on('addDir', refresh)
        .on('unlinkDir', refresh);
      server.httpServer?.once('close', () => {
        server.watcher
          .off('add', refresh)
          .off('unlink', refresh)
          .off('addDir', refresh)
          .off('unlinkDir', refresh);
      });
    },
  };
}
