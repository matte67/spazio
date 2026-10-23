import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const source = fileURLToPath(new URL('../dist/', import.meta.url));
const target = fileURLToPath(new URL('../android/app/src/main/assets/launcher/', import.meta.url));
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
// Android uses a 1080p design canvas independent of its density or panel pixels.
// The browser entry keeps device-width for desktop/mobile development.
const indexPath = `${target}/index.html`;
const html = await readFile(indexPath, 'utf8');
await writeFile(indexPath, html.replace('width=device-width, initial-scale=1.0', 'width=1920'));
console.log('Build web copiata negli asset Android.');
