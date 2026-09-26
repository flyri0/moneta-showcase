// Screenshots for the READMEs: desktop budget and reports (light and dark) and three phone
// screens, in English and Brazilian Portuguese.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { serve } from './serve.mjs';

const OUT = new URL('../.github/screenshots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const MONTH = '2026-09';
const srv = await serve();
const browser = await chromium.launch();

async function open(locale, viewport, dpr, phone = false) {
	const ctx = await browser.newContext({ viewport, deviceScaleFactor: dpr, locale, hasTouch: phone, isMobile: phone });
	await ctx.addInitScript(() => localStorage.setItem('moneta.demo', 'on'));
	const page = await ctx.newPage();
	await page.goto(`${srv.url}/budget/${MONTH}`);
	await page.getByTestId('rta-amount').waitFor();
	// Income first: fold it so the envelopes show.
	await page.getByTestId('group-row').first().getByRole('button').first().click();
	await page.mouse.move(1, viewport.height - 1);
	await page.waitForTimeout(600);
	return { ctx, page };
}

const theme = (page, dark) =>
	page.evaluate((d) => {
		document.documentElement.classList.toggle('dark', d);
		document.documentElement.style.colorScheme = d ? 'dark' : 'light';
	}, dark);

async function both(page, name) {
	for (const dark of [false, true]) {
		await theme(page, dark);
		await page.waitForTimeout(300);
		await page.screenshot({ path: `${OUT}${name.split('.')[0]}-${dark ? 'dark' : 'light'}${name.includes('.') ? '.pt-BR' : ''}.png` });
	}
	await theme(page, false);
}

for (const [locale, suffix] of [['pt-BR', '.pt-BR']]) {
	// Desktop
	{
		const { ctx, page } = await open(locale, { width: 1280, height: 800 }, 1.5);
		await both(page, `budget${suffix}`);
		await page.goto(`${srv.url}/reports`);
		await page.getByTestId('report-cards').waitFor();
		await page.mouse.move(1, 799);
		await page.waitForTimeout(1500);
		await both(page, `reports${suffix}`);
		await ctx.close();
	}
	// Phone: budget, new transaction, reports
	{
		const { ctx, page } = await open(locale, { width: 390, height: 844 }, 2, true);
		const shots = [];
		shots.push(await page.screenshot());
		await page.locator('button[data-compact]').tap();
		await page.getByRole('dialog').waitFor();
		await page.waitForTimeout(700);
		shots.push(await page.screenshot());
		await page.goto(`${srv.url}/reports`);
		await page.getByTestId('report-cards').waitFor();
		await page.waitForTimeout(1500);
		shots.push(await page.screenshot());
		await ctx.close();
		// Three phones side by side on a transparent background.
		const comp = await browser.newPage({ viewport: { width: 1320, height: 900 }, deviceScaleFactor: 1.5 });
		const imgs = shots.map((b) => `data:image/png;base64,${b.toString('base64')}`);
		await comp.setContent(
			`<body style="margin:0;background:transparent;display:flex;gap:40px;justify-content:center;align-items:center;height:900px">${imgs
				.map(
					(src) =>
						`<div style="width:390px;height:844px;border-radius:44px;padding:10px;background:#111;box-shadow:0 0 0 1px #333"><img src="${src}" style="width:390px;height:844px;border-radius:34px;display:block"></div>`
				)
				.join('')}</body>`
		);
		await comp.waitForTimeout(300);
		await comp.screenshot({ path: `${OUT}phone${suffix}.png`, omitBackground: true });
		await comp.close();
	}
	console.log('✓', locale);
}
writeFileSync(OUT + '.keep', '');
await browser.close();
srv.stop();
