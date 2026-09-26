// node tools/sheet.mjs out.jpg cols file... (paths relative to out/stills)
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
const [out, cols, ...files] = process.argv.slice(2);
const dir = new URL('../video/out/stills/', import.meta.url).pathname;
writeFileSync(dir + '_sheet.html', `<body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(${cols},1fr);gap:4px;font:13px sans-serif;color:#eee">${files.map((f) => `<div><img src="${f}" style="width:100%;display:block">${f}</div>`).join('')}</body>`);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1800, height: 300 } });
await p.goto('file://' + dir + '_sheet.html');
await p.waitForLoadState('networkidle');
await p.screenshot({ path: dir + out, fullPage: true, type: 'jpeg', quality: 85 });
await b.close();
