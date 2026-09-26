// Drives the demo budget through every beat of the showcase and saves lossless captures plus
// the bounding boxes (CSS px) of what the synthetic cursor and camera aim at.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { serve } from './serve.mjs';

const OUT = new URL('../video/public/captures/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const META_FILE = OUT + 'meta.json';
const meta = existsSync(META_FILE) ? JSON.parse(readFileSync(META_FILE, 'utf8')) : {};
const only = process.argv.slice(2);
const want = (s) => only.length === 0 || only.includes(s);

const ACCENTS = ['blue', 'indigo', 'violet', 'cyan', 'teal', 'emerald', 'amber', 'orange', 'rose', 'pink'];
const MONTH = '2026-09';

const srv = await serve();
const browser = await chromium.launch();

async function open({ width, height, dpr, phone = false }) {
	const ctx = await browser.newContext({
		viewport: { width, height },
		deviceScaleFactor: dpr,
		locale: 'en-US',
		timezoneId: 'America/New_York',
		hasTouch: phone,
		isMobile: phone,
		reducedMotion: 'no-preference'
	});
	await ctx.addInitScript(() => localStorage.setItem('moneta.demo', 'on'));
	const page = await ctx.newPage();
	await page.goto(`${srv.url}/budget/${MONTH}`);
	await page.getByTestId('rta-amount').waitFor();
	await page.waitForTimeout(600);
	return { ctx, page };
}

async function box(loc) {
	const b = await loc.first().boundingBox();
	if (!b) throw new Error('no box for ' + loc);
	return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
}

/** Screenshot plus named boxes. `settle` waits for transitions to finish. */
async function shot(page, name, boxes = {}, { settle = 350, fullPage = false } = {}) {
	await page.waitForTimeout(settle);
	await page.screenshot({ path: `${OUT}${name}.png`, fullPage });
	const vp = page.viewportSize();
	const size = fullPage
		? await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }))
		: { w: vp.width, h: vp.height };
	const resolved = {};
	for (const [k, loc] of Object.entries(boxes)) resolved[k] = typeof loc.x === 'number' ? loc : await box(loc);
	for (const [k, v] of Object.entries(await page.evaluate(() => {
		const out = {};
		const r = (el) => { const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
		const cards = document.querySelector('[data-testid="report-cards"]');
		if (cards) [...cards.children].forEach((c, i) => (out['card' + i] = r(c)));
		const svgs = [...document.querySelectorAll('main svg')].map((s) => [s, s.getBoundingClientRect()]).filter(([, b]) => b.width > 120);
		svgs.sort((a, b) => b[1].width * b[1].height - a[1].width * a[1].height);
		if (svgs[0]) out.chart = r(svgs[0][0]);
		return out;
	}))) if (!(k in resolved)) resolved[k] = v;
	const scrollY = await page.evaluate(() => window.scrollY);
	meta[name] = { ...size, scrollY, boxes: resolved };
	console.log('✓', name);
}

async function hover(page, loc) {
	const b = await box(loc);
	await page.mouse.move(b.x + b.w / 2, b.y + b.h / 2, { steps: 4 });
}

/** Collapses Income and Bills so the envelopes that move fit in one screen. */
async function collapseTop(page) {
	for (const g of ['Income', 'Bills']) {
		await page.getByTestId('group-row').filter({ hasText: g }).getByRole('button').first().click();
	}
	await page.mouse.move(5, 895);
	await page.waitForTimeout(400);
}

const popover = (page) => page.locator('[data-slot="popover-content"][data-state="open"]');

// ---------------------------------------------------------------- desktop story
async function desktop() {
	const { ctx, page } = await open({ width: 1440, height: 900, dpr: 2 });
	await collapseTop(page);
	const add = page.getByRole('button', { name: 'Transaction', exact: true });
	const rta = page.getByTestId('rta-card');
	const vacRow = page.getByTestId('category-row').filter({ hasText: 'Vacation' });
	const reports = page.getByRole('link', { name: 'Reports' }).first();
	const base = { add, rta, rtaAmount: page.getByTestId('rta-amount'), rtaHint: page.getByTestId('rta-hint'), sep: page.getByRole('separator', { name: 'Resize sidebar' }), vacAssigned: vacRow.getByTestId('assigned'), vacAvail: vacRow.getByTestId('available'), vacRow, reports, settings: page.getByRole('link', { name: 'Settings' }).first() };
	await shot(page, 'd01-base', base);

	await hover(page, add);
	await shot(page, 'd02-hover-add', base);
	await add.click();
	const dialog = page.getByRole('dialog');
	const payee = dialog.getByLabel('Payee');
	const inflow = dialog.getByRole('button', { name: 'Inflow' });
	const amount = dialog.getByLabel('Amount', { exact: true });
	const category = dialog.getByLabel('Category');
	const save = dialog.getByRole('button', { name: 'Save' });
	const form = { dialog, payee, inflow, amount, category, save };
	await page.mouse.move(720, 150);
	await shot(page, 'd03-dialog', form, { settle: 700 });

	await hover(page, payee);
	await payee.click();
	await shot(page, 'd04-payee-open', { ...form, pop: popover(page) }, { settle: 400 });
	const search = popover(page).locator('[data-slot="command-input"]');
	let typed = '';
	for (const ch of 'Free') {
		typed += ch;
		await search.press(ch === ' ' ? 'Space' : ch);
		await shot(page, `d05-payee-${typed.length}`, {}, { settle: 120 });
	}
	const item = popover(page).locator('[data-slot="command-item"]').filter({ hasText: 'Freelance' }).first();
	await hover(page, item);
	await shot(page, 'd06-payee-hover', { item }, { settle: 150 });
	await item.click();
	await shot(page, 'd07-payee-set', form, { settle: 400 });

	await hover(page, inflow);
	await inflow.click();
	await shot(page, 'd08-inflow', form, { settle: 300 });
	await hover(page, amount);
	await amount.click();
	await shot(page, 'd09-amount-focus', form, { settle: 200 });
	typed = '';
	for (const ch of '850') {
		typed += ch;
		await page.keyboard.press(ch);
		await shot(page, `d10-amount-${typed.length}`, {}, { settle: 100 });
	}

	await hover(page, category);
	await category.click();
	await shot(page, 'd11-cat-open', { ...form, pop: popover(page) }, { settle: 400 });
	const catSearch = popover(page).locator('[data-slot="command-input"]');
	typed = '';
	for (const ch of 'Other') {
		typed += ch;
		await catSearch.press(ch);
		await shot(page, `d12-cat-${typed.length}`, {}, { settle: 120 });
	}
	const catItem = popover(page).locator('[data-slot="command-item"]').filter({ hasText: 'Other Income' }).first();
	await hover(page, catItem);
	await shot(page, 'd13-cat-hover', { item: catItem }, { settle: 150 });
	await catItem.click();
	await shot(page, 'd14-cat-set', form, { settle: 400 });

	await hover(page, save);
	await shot(page, 'd15-hover-save', form, { settle: 150 });
	await save.click();
	await dialog.waitFor({ state: 'hidden' });
	await page.mouse.move(900, 300);
	await shot(page, 'd16-rta-850', base, { settle: 700 });

	// Assign it all to Vacation with a formula.
	await hover(page, base.vacAssigned);
	await shot(page, 'd17-hover-vac', base, { settle: 200 });
	await base.vacAssigned.click();
	await shot(page, 'd18-vac-edit', base, { settle: 250 });
	await page.keyboard.press('End');
	typed = '';
	for (const ch of '+850') {
		typed += ch;
		await page.keyboard.type(ch);
		await shot(page, `d19-vac-${typed.length}`, {}, { settle: 100 });
	}
	await page.keyboard.press('Enter');
	await page.mouse.move(1200, 400);
	await shot(page, 'd20-assigned', base, { settle: 700 });

	// Reports.
	await hover(page, reports);
	await shot(page, 'd21-hover-reports', base, { settle: 200 });
	await reports.click();
	await page.getByTestId('report-cards').waitFor();
	await page.mouse.move(1300, 60);
	const cards = { cards: page.getByTestId('report-cards'), spending: page.getByTestId('spending-card'), netWorth: page.getByTestId('net-worth-card'), cashFlow: page.getByTestId('cash-flow-card'), settings: base.settings };
	await shot(page, 'd22-reports', cards, { settle: 1500 });
	await shot(page, 'd22-reports-full', cards, { settle: 200, fullPage: true });

	for (const [slug, name] of [['net-worth', 'd23-networth'], ['cash-flow', 'd24-cashflow'], ['spending', 'd25-spending']]) {
		await page.goto(`${srv.url}/reports/${slug}`);
		await page.waitForTimeout(800);
		const period = page.getByLabel(/period/i).first();
		if (await period.isVisible().catch(() => false)) {
			await period.click();
			const opt = page.locator('[data-slot="select-content"][data-state="open"] [data-slot="select-item"]').filter({ hasText: /12 months/ }).first();
			if (await opt.isVisible().catch(() => false)) await opt.click();
			else await page.keyboard.press('Escape');
		}
		await page.mouse.move(1430, 890);
		await shot(page, name, {}, { settle: 1500 });
	}

	// Settings: pick violet, then dark.
	await page.goto(`${srv.url}/settings`);
	await page.waitForTimeout(800);
	const violet = page.getByRole('button', { name: 'Violet' });
	const dark = page.getByRole('button', { name: 'Dark' });
	const set = { violet, dark, teal: page.getByRole('button', { name: 'Teal' }), budget: page.getByRole('link', { name: 'Budget' }).first() };
	await page.mouse.move(1300, 60);
	await shot(page, 'd26-settings', set, { settle: 600 });
	await hover(page, violet);
	await shot(page, 'd27-hover-violet', set, { settle: 150 });
	await violet.click();
	await shot(page, 'd28-violet', set, { settle: 400 });
	await hover(page, dark);
	await shot(page, 'd29-hover-dark', set, { settle: 150 });
	await dark.click();
	await shot(page, 'd30-dark', set, { settle: 500 });
	await ctx.close();
}

// ------------------------------------------------ same screen in every accent, light and dark
async function accents() {
	const { ctx, page } = await open({ width: 1440, height: 900, dpr: 2 });
	await collapseTop(page);
	const setTheme = (accent, dark) =>
		page.evaluate(([a, d]) => {
			document.documentElement.dataset.theme = a;
			document.documentElement.classList.toggle('dark', d);
			document.documentElement.style.colorScheme = d ? 'dark' : 'light';
		}, [accent, dark]);
	for (const route of ['budget', 'reports']) {
		if (route === 'reports') {
			await page.getByRole('link', { name: 'Reports' }).first().click();
			await page.getByTestId('report-cards').waitFor();
			await page.waitForTimeout(1500);
		}
		await page.mouse.move(1430, 890);
		for (const dark of [false, true]) {
			for (const a of ACCENTS) {
				await setTheme(a, dark);
				await shot(page, `acc-${route}-${dark ? 'dark' : 'light'}-${a}`, {}, { settle: 250 });
			}
		}
		await setTheme('teal', false);
	}
	await ctx.close();
}

// ------------------------------------------------ responsive sweep, 1440 → 390
async function responsive() {
	const H = 900;
	const { ctx, page } = await open({ width: 1440, height: H, dpr: 2 });
	await collapseTop(page);
	// The same budget the story left: the income added and assigned to Vacation.
	await page.getByRole('button', { name: 'Transaction', exact: true }).click();
	const dialog = page.getByRole('dialog');
	await dialog.getByLabel('Payee').click();
	await popover(page).locator('[data-slot="command-input"]').fill('Free');
	await popover(page).locator('[data-slot="command-item"]').filter({ hasText: 'Freelance' }).first().click();
	await dialog.getByRole('button', { name: 'Inflow' }).click();
	await dialog.getByLabel('Amount', { exact: true }).fill('850');
	await dialog.getByLabel('Category').click();
	await popover(page).locator('[data-slot="command-input"]').fill('Other');
	await popover(page).locator('[data-slot="command-item"]').filter({ hasText: 'Other Income' }).first().click();
	await dialog.getByRole('button', { name: 'Save' }).click();
	await dialog.waitFor({ state: 'hidden' });
	await page.getByTestId('category-row').filter({ hasText: 'Vacation' }).getByTestId('assigned').click();
	await page.keyboard.press('End');
	await page.keyboard.type('+850');
	await page.keyboard.press('Enter');
	await page.evaluate(() => window.scrollTo(0, 0));
	await page.mouse.move(700, 880);
	await page.waitForTimeout(700);

	// Drag the sidebar's edge down to the icon rail.
	const sep = page.getByRole('separator', { name: 'Resize sidebar' });
	await shot(page, 'sb-start', { sep }, { settle: 300 });
	const s0 = await box(sep);
	await page.mouse.move(s0.x + s0.w / 2, 450, { steps: 3 });
	await shot(page, 'sb-hover', { sep }, { settle: 200 });
	await page.mouse.down();
	const drags = [];
	for (const x of [248, 238, 228, 218, 208, 180, 150]) {
		await page.mouse.move(x, 450, { steps: 2 });
		await shot(page, `sb-${x}`, {}, { settle: 120 });
		drags.push(x);
	}
	await page.mouse.move(120, 450, { steps: 2 });
	await shot(page, 'sb-rail-drag', { sep }, { settle: 250 });
	await page.mouse.up();
	await page.mouse.move(700, 880);
	await shot(page, 'sb-rail', { sep }, { settle: 400 });
	meta.sidebar = { drags, handle: s0 };

	const widths = [];
	for (let w = 1440; w > 390; w -= 30) widths.push(w);
	widths.push(390);
	for (const w of widths) {
		await page.setViewportSize({ width: w, height: H });
		await page.mouse.move(1, H - 1);
		await shot(page, `rs-${w}`, {}, { settle: 250 });
	}
	meta.responsive = { widths, height: H };
	await ctx.close();
}

// ------------------------------------------------ phone story, 390x844 @3x
async function phone() {
	const { ctx, page } = await open({ width: 390, height: 844, dpr: 3, phone: true });
	await collapseTop(page);
	const fab = page.getByRole('button', { name: 'Transaction', exact: true });
	const vacName = page.getByRole('button', { name: 'Vacation', exact: true });
	const base = { fab, rta: page.getByTestId('rta-card'), rtaAmount: page.getByTestId('rta-amount'), rtaHint: page.getByTestId('rta-hint'), vacName, vacRow: page.getByTestId('category-row').filter({ hasText: 'Vacation' }), reportsTab: page.getByRole('link', { name: 'Reports' }).first() };
	await shot(page, 'p01-base', base);
	await fab.tap();
	const dialog = page.getByRole('dialog');
	const form = { dialog, payee: dialog.getByLabel('Payee'), inflow: dialog.getByRole('button', { name: 'Inflow' }), amount: dialog.getByLabel('Amount', { exact: true }), category: dialog.getByLabel('Category'), save: dialog.getByRole('button', { name: 'Save' }) };
	await shot(page, 'p02-sheet', form, { settle: 700 });
	await form.payee.tap();
	await popover(page).locator('[data-slot="command-input"]').fill('Free');
	await popover(page).locator('[data-slot="command-item"]').filter({ hasText: 'Freelance' }).first().tap();
	await shot(page, 'p03-payee', form, { settle: 400 });
	await form.inflow.tap();
	await form.amount.tap();
	let typed = '';
	for (const ch of '850') {
		typed += ch;
		await page.keyboard.press(ch);
		await shot(page, `p04-amount-${typed.length}`, form, { settle: 100 });
	}
	await form.category.tap();
	await popover(page).locator('[data-slot="command-input"]').fill('Other');
	await popover(page).locator('[data-slot="command-item"]').filter({ hasText: 'Other Income' }).first().tap();
	await shot(page, 'p05-cat', form, { settle: 400 });
	if (!(await dialog.isVisible())) throw new Error('phone dialog closed early');
	await form.save.tap();
	await dialog.waitFor({ state: 'hidden' });
	await shot(page, 'p06-rta-850', base, { settle: 700 });
	await page.evaluate(() => window.scrollTo(0, 0));
	await shot(page, 'p06b-rta-top', base, { settle: 400 });

	await page.evaluate(() => window.scrollTo(0, 0));
	await vacName.scrollIntoViewIfNeeded();
	await page.evaluate(() => window.scrollBy(0, 120));
	await shot(page, 'p07-scrolled', base, { settle: 300 });
	await vacName.tap();
	const sheet = page.getByRole('dialog');
	const input = sheet.locator('#sheet-assigned');
	const sheetBoxes = { sheet, input, save: sheet.getByRole('button', { name: 'Save', exact: true }) };
	await shot(page, 'p08-cat-sheet', sheetBoxes, { settle: 700 });
	await input.tap();
	await page.keyboard.press('End');
	typed = '';
	for (const ch of '+850') {
		typed += ch;
		await page.keyboard.type(ch);
		await shot(page, `p09-vac-${typed.length}`, sheetBoxes, { settle: 100 });
	}
	await sheetBoxes.save.tap();
	await page.waitForTimeout(300);
	if (await sheet.isVisible()) await page.keyboard.press('Escape');
	await page.waitForTimeout(500);
	await shot(page, 'p10-assigned', base, { settle: 500 });
	await page.evaluate(() => window.scrollTo(0, 0));
	await shot(page, 'p11-top', base, { settle: 400 });

	await base.reportsTab.tap();
	await page.getByTestId('report-cards').waitFor();
	await shot(page, 'p12-reports', {}, { settle: 1500 });
	await shot(page, 'p12-reports-full', {}, { settle: 200, fullPage: true });
	await page.goto(`${srv.url}/reports/net-worth`);
	await shot(page, 'p13-networth', {}, { settle: 1500 });
	await page.goto(`${srv.url}/accounts`);
	await shot(page, 'p14-accounts', {}, { settle: 1000 });
	await page.goto(`${srv.url}/reports`);
	await page.getByTestId('report-cards').waitFor();
	await page.waitForTimeout(1500);
	for (const dark of [false, true]) {
		for (const a of ACCENTS) {
			await page.evaluate(([a, d]) => {
				document.documentElement.dataset.theme = a;
				document.documentElement.classList.toggle('dark', d);
				document.documentElement.style.colorScheme = d ? 'dark' : 'light';
			}, [a, dark]);
			await shot(page, `pacc-reports-${dark ? 'dark' : 'light'}-${a}`, {}, { settle: 250 });
		}
	}
	await ctx.close();
}

try {
	if (want('desktop')) await desktop();
	if (want('accents')) await accents();
	if (want('responsive')) await responsive();
	if (want('phone')) await phone();
} finally {
	writeFileSync(META_FILE, JSON.stringify(meta, null, 1));
	await browser.close();
	srv.stop();
}
