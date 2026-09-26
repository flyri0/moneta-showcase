// node tools/stills.mjs <composition> <frame> [frame...] — renders stills with one bundle.
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition, openBrowser } from '@remotion/renderer';
import path from 'node:path';
import { rmSync } from 'node:fs';
const [id, ...rest] = process.argv.slice(2);
const frames = rest.flatMap((a) => a.split(/[ ,]+/)).filter(Boolean);
const root = path.resolve(new URL('..', import.meta.url).pathname);
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public') });
const browser = await openBrowser('chrome');
const composition = await selectComposition({ serveUrl, id, puppeteerInstance: browser });
for (const f of frames) await renderStill({ composition, serveUrl, frame: Number(f), output: path.join(root, `out/stills/${id}-${f}.jpg`), imageFormat: 'jpeg', jpegQuality: 80, puppeteerInstance: browser });
await browser.close({ silent: true });
rmSync(serveUrl, { recursive: true, force: true });
console.log('done');
