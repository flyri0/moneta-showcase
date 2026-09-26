// Usage: node contact.mjs out.png cols name1 name2 ... (names without .png, from video/public/captures)
import { chromium } from '@playwright/test';
const [out, cols, ...names] = process.argv.slice(2);
const dir = new URL('../video/public/captures/', import.meta.url).pathname;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 400 } });
import { writeFileSync } from 'node:fs';
const html = `<body style="margin:0;background:#333;display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;font:14px sans-serif;color:#fff">${names.map((n) => `<div><img src="${n}.png" style="width:100%;display:block"><div>${n}</div></div>`).join('')}</body>`;
writeFileSync(dir + '_contact.html', html);
await p.goto('file://' + dir + '_contact.html');
await p.waitForLoadState('networkidle');
await p.screenshot({ path: out, fullPage: true });
await b.close();
