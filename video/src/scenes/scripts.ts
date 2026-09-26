import type { Entry } from '../components/Shots';
import type { PathKey } from '../components/Pointer';
import { box, center, META, type Box } from '../lib/anim';
import { T } from '../lib/theme';

export type CamKey = [number, number, number, number]; // frame, scale, focus x, focus y

export type Note = { f: number; out: number; at: [number, number]; text: string; tone: 'teal' | 'green' };

export type Script = {
	/** CSS size of the screen during the app story (before the resize beat). */
	vw: number;
	vh: number;
	entries: Entry[];
	scroll: [number, number][];
	cam: CamKey[];
	path: PathKey[];
	clicks: number[];
	taps: [number, number, number][];
	keys: number[];
	/** The "+$850" chip: when it leaves, where from, and where it lands (screen px). */
	chip: { f: number; from: [number, number]; to: [number, number] };
	rtaGlow: { f: number; b: Box; color: string }[];
	notes: Note[];
	availRing: { f: number; b: Box };
	chart: { f: number; b: Box };
	/** Cursor visibility (desktop). */
	cursorOn: [number, number][];
	/** Desktop only: the frame the dragged sidebar snaps to the icon rail. */
	snap?: number;
};

/** The Ready to Assign card's own colours: amber while money waits, green at zero. */
/** Phone budget: the sticky header ends here and the bottom bar starts here (CSS px). */
const PHONE_BARS = { top: 101, bottom: 789 };
const AMBER = '#f59e0b';
const GREEN = '#10b981';

const A = T.add;
const B = T.assign;
const R = T.reports;
const E = T.pers;
const D = T.resp;

/** Resize beat, relative to T.resp. */
export const RS = {
	// Landscape first drags the sidebar down to its icon rail (sidebar), then shrinks the window.
	landscape: {
		sidebar: [48, 102],
		shrink: [132, 272],
		morph: [282, 316],
		swap: [286, 310],
		end: 330,
		resize: [124, 278]
	},
	portrait: { morph: [10, 48], grow: [60, 250], swap: [6, 26], end: 290, resize: [56, 256] }
} as const;

/** "Make it yours", relative to T.pers. */
export const PS = { swatchIn: 4, cycleStart: 40, step: 14, toggle: 160, wipe: 170, dark: 186 } as const;
export const CYCLE = ['emerald', 'amber', 'orange', 'rose', 'pink', 'blue', 'indigo', 'violet'];

function accentEntries(prefix: string, origin: [number, number]): Entry[] {
	const list: Entry[] = [{ f: E + 4, src: `${prefix}-light-teal`, fx: 'fade', dur: 16 }];
	CYCLE.forEach((a, i) =>
		list.push({ f: E + PS.cycleStart + i * PS.step, src: `${prefix}-light-${a}`, fx: 'fade', dur: 5 })
	);
	list.push({ f: E + PS.wipe, src: `${prefix}-dark-violet`, fx: 'wipe', dur: 34, origin });
	return list;
}

/** Rail when dragged past halfway to it; otherwise never narrower than 208 px. */
const RAIL_SNAP = (64 + 208) / 2;

/**
 * The sidebar drag, sampled every two frames along the cursor's eased path: each frame shows the
 * capture whose sidebar width is closest to where the edge is.
 */
function sidebarDrag(from: number, to: number): { entries: Entry[]; path: PathKey[]; snap: number } {
	const [x0, x1] = [META.sidebar.handle.x + META.sidebar.handle.w / 2, 120];
	const shots: [number, string][] = [[256, 'sb-hover'], ...META.sidebar.drags.filter((x) => x >= 208).map((x) => [x, `sb-${x}`] as [number, string])];
	const entries: Entry[] = [];
	let last = '';
	let snap = to;
	for (let f = from; f <= to; f += 2) {
		const t = (f - from) / (to - from);
		const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
		const x = x0 + (x1 - x0) * e;
		let src: string;
		if (x < RAIL_SNAP) src = 'sb-rail-drag';
		else {
			const w = Math.max(208, x);
			src = shots.reduce((a, b) => (Math.abs(b[0] - w) < Math.abs(a[0] - w) ? b : a))[1];
		}
		if (src !== last) {
			if (src === 'sb-rail-drag') snap = f;
			entries.push({ f, src });
			last = src;
		}
	}
	return {
		entries,
		path: [
			[from, x0, 450],
			[to, x1, 450]
		],
		snap
	};
}

const typing = (f: number, prefix: string, n: number, step: number): Entry[] =>
	Array.from({ length: n }, (_, i) => ({ f: f + i * step, src: `${prefix}-${i + 1}` }));
const times = (f: number, n: number, step: number) => Array.from({ length: n }, (_, i) => f + i * step);

// ------------------------------------------------------------------ desktop (landscape)
function desktop(): Script {
	const dlg = box('d03-dialog', 'dialog');
	const dlgC: [number, number] = [dlg.x + dlg.w / 2, dlg.y + dlg.h / 2];
	const rta = box('d16-rta-850', 'rta');
	const rtaC = center('d16-rta-850', 'rtaAmount');
	const rtaAmt = box('d16-rta-850', 'rtaAmount');
	const vac = center('d17-hover-vac', 'vacAssigned');
	const chart = box('d23-networth', 'chart');
	const chartC: [number, number] = [chart.x + chart.w / 2, chart.y + chart.h / 2];
	const nw = center('d22-reports', 'netWorth');
	const save = center('d14-cat-set', 'save');
	const rtaFocus: [number, number] = [700, rtaC[1] + 110];
	const maxScroll = META['d22-reports-full'].h - 900;
	const drag = sidebarDrag(D + RS.landscape.sidebar[0], D + RS.landscape.sidebar[1]);
	const reportsSticky = {
		src: 'd22-reports',
		boxes: [
			{ x: 0, y: 0, w: 256, h: 900 },
			{ x: 256, y: 0, w: 1184, h: 61 }
		]
	};
	const entries: Entry[] = [
		{ f: T.head, src: 'd01-base' },
		{ f: A + 36, src: 'd02-hover-add', fx: 'fade', dur: 5 },
		{ f: A + 52, src: 'd03-dialog', fx: 'fade', dur: 12 },
		{ f: A + 130, src: 'd04-payee-open', fx: 'fade', dur: 6 },
		...typing(A + 142, 'd05-payee', 4, 8),
		{ f: A + 184, src: 'd06-payee-hover', fx: 'fade', dur: 4 },
		{ f: A + 196, src: 'd07-payee-set', fx: 'fade', dur: 6 },
		{ f: A + 234, src: 'd08-inflow', fx: 'fade', dur: 5 },
		{ f: A + 262, src: 'd09-amount-focus', fx: 'fade', dur: 4 },
		...typing(A + 272, 'd10-amount', 3, 9),
		{ f: A + 328, src: 'd11-cat-open', fx: 'fade', dur: 6 },
		...typing(A + 338, 'd12-cat', 5, 7),
		{ f: A + 382, src: 'd13-cat-hover', fx: 'fade', dur: 4 },
		{ f: A + 394, src: 'd14-cat-set', fx: 'fade', dur: 6 },
		{ f: A + 420, src: 'd15-hover-save', fx: 'fade', dur: 4 },
		// Saved: the dialog closes on a budget that still has nothing to assign…
		{ f: A + 434, src: 'd01-base', fx: 'fade', dur: 12 },
		// …until the income lands in Ready to Assign.
		{ f: A + 474, src: 'd16-rta-850', fx: 'fade', dur: 14 },
		{ f: B + 60, src: 'd17-hover-vac', fx: 'fade', dur: 5 },
		{ f: B + 76, src: 'd18-vac-edit', fx: 'fade', dur: 5 },
		...typing(B + 92, 'd19-vac', 4, 9),
		{ f: B + 142, src: 'd20-assigned', fx: 'fade', dur: 10 },
		{ f: R + 40, src: 'd21-hover-reports', fx: 'fade', dur: 5 },
		{ f: R + 54, src: 'd22-reports-full', fx: 'cards', sticky: reportsSticky },
		{ f: R + 298, src: 'd23-networth', fx: 'fade', dur: 14 },
		{ f: D, src: 'sb-start', fx: 'fade', dur: 14 },
		{ f: D + 38, src: 'sb-hover', fx: 'fade', dur: 4 },
		...drag.entries.slice(1),
		{ f: D + RS.landscape.sidebar[1] + 8, src: 'sb-rail', fx: 'fade', dur: 8 },
		...accentEntries('pacc-reports', [372, 18])
	];
	const cam: CamKey[] = [
		[T.head, 1, 720, 450],
		[A + 60, 1, 720, 450],
		[A + 96, 1.5, dlgC[0], dlgC[1]],
		[A + 436, 1.5, dlgC[0], dlgC[1]],
		[A + 470, 1.75, ...rtaFocus],
		[B + 30, 1.75, ...rtaFocus],
		[B + 70, 1.42, 848, vac[1] - 40],
		[B + 170, 1.42, 848, vac[1] - 40],
		[B + 210, 1.12, 860, 420],
		[R + 0, 1.12, 860, 420],
		[R + 30, 1, 720, 450],
		[R + 300, 1, 720, 450],
		[R + 336, 1.32, chartC[0], chartC[1] - 20],
		[R + 390, 1.32, chartC[0], chartC[1] - 20],
		[R + 414, 1, 720, 450]
	];
	const path: PathKey[] = [
		[A - 10, 1150, 820],
		[A + 40, ...center('d01-base', 'add')],
		[A + 70, ...center('d01-base', 'add')],
		[A + 124, ...center('d03-dialog', 'payee')],
		[A + 168, ...center('d03-dialog', 'payee')],
		[A + 186, ...center('d06-payee-hover', 'item')],
		[A + 198, ...center('d06-payee-hover', 'item')],
		[A + 226, ...center('d07-payee-set', 'inflow')],
		[A + 238, ...center('d07-payee-set', 'inflow')],
		[A + 256, ...center('d07-payee-set', 'amount')],
		[A + 300, ...center('d07-payee-set', 'amount')],
		[A + 322, ...center('d07-payee-set', 'category')],
		[A + 366, ...center('d07-payee-set', 'category')],
		[A + 384, ...center('d13-cat-hover', 'item')],
		[A + 402, ...center('d13-cat-hover', 'item')],
		[A + 424, ...save],
		[B + 20, ...save],
		[B + 64, ...vac],
		[B + 150, ...vac],
		[B + 190, 1180, 720],
		[R + 10, 1180, 720],
		[R + 44, ...center('d20-assigned', 'reports')],
		[R + 60, ...center('d20-assigned', 'reports')],
		[R + 96, 1300, 830],
		[R + 250, 1300, 830],
		[R + 286, ...nw],
		[R + 306, ...nw],
		[R + 344, 1360, 860],
		[D + 4, 1000, 640],
		[D + 40, ...drag.path[0].slice(1) as [number, number]],
		...drag.path,
		[D + RS.landscape.sidebar[1] + 12, 120, 450],
		[D + RS.landscape.sidebar[1] + 30, 520, 620]
	];
	return {
		vw: 1440,
		vh: 900,
		entries,
		scroll: [
			[R + 140, 0],
			[R + 200, maxScroll],
			[R + 216, maxScroll],
			[R + 262, 0]
		],
		cam,
		path,
		clicks: [
			A + 50,
			A + 128,
			A + 194,
			A + 232,
			A + 260,
			A + 326,
			A + 392,
			A + 432,
			B + 74,
			R + 52,
			R + 296,
			D + RS.landscape.sidebar[0] - 2
		],
		taps: [],
		keys: [...times(A + 142, 4, 8), ...times(A + 272, 3, 9), ...times(A + 338, 5, 7), ...times(B + 92, 4, 9), B + 140],
		chip: { f: A + 440, from: save, to: [rtaC[0] + 40, rtaC[1]] },
		rtaGlow: [
			{ f: A + 476, b: rta, color: AMBER },
			{ f: B + 212, b: box('d20-assigned', 'rta'), color: GREEN }
		],
		notes: [
			{ f: A + 492, out: B + 30, at: [rtaAmt.x + 124, rtaAmt.y + rtaAmt.h / 2], text: 'Income lands in Ready to Assign', tone: 'teal' }
		],
		availRing: { f: B + 150, b: box('d20-assigned', 'vacAvail') },
		chart: { f: R + 318, b: chart },
		cursorOn: [
			[A - 12, 0],
			[A, 1],
			[R + 380, 1],
			[R + 400, 0],
			[D + 4, 0],
			[D + 16, 1],
			[D + RS.landscape.sidebar[1] + 24, 1],
			[D + RS.landscape.sidebar[1] + 36, 0]
		],
		snap: drag.snap
	};
}

// ------------------------------------------------------------------ phone (portrait)
function phone(): Script {
	const sheet = box('p02-sheet', 'dialog');
	const sheetC: [number, number] = [195, sheet.y + sheet.h / 2 - 40];
	const rta = box('p06b-rta-top', 'rta');
	const rtaC: [number, number] = [rta.x + rta.w / 2, rta.y + rta.h / 2];
	const rtaAmt = box('p06b-rta-top', 'rtaAmount');
	const catSheet = box('p08-cat-sheet', 'sheet');
	const input = center('p08-cat-sheet', 'input');
	const chart = box('p13-networth', 'chart');
	const chartC: [number, number] = [chart.x + chart.w / 2, chart.y + chart.h / 2];
	const card1 = box('p12-reports-full', 'card1');
	const save = center('p02-sheet', 'save');
	const entries: Entry[] = [
		{ f: T.head, src: 'p01-base' },
		{ f: A + 46, src: 'p02-sheet', fx: 'sheet', dur: 22, sheet },
		{ f: A + 108, src: 'p03-payee', fx: 'fade', dur: 8 },
		{ f: A + 184, src: 'p04-amount-1', fx: 'fade', dur: 5 },
		{ f: A + 193, src: 'p04-amount-2' },
		{ f: A + 202, src: 'p04-amount-3' },
		{ f: A + 256, src: 'p05-cat', fx: 'fade', dur: 8 },
		{ f: A + 304, src: 'p01-base', fx: 'fade', dur: 14 },
		{ f: A + 354, src: 'p06b-rta-top', fx: 'fade', dur: 14 },
		{ f: B + 40, src: 'p07-scrolled', fx: 'scroll', dur: 20, fixed: PHONE_BARS },
		{ f: B + 80, src: 'p08-cat-sheet', fx: 'sheet', dur: 22, sheet: catSheet },
		...typing(B + 124, 'p09-vac', 4, 9),
		{ f: B + 182, src: 'p10-assigned', fx: 'fade', dur: 12 },
		{ f: B + 214, src: 'p11-top', fx: 'scroll', dur: 20, fixed: PHONE_BARS },
		{
			f: R + 46,
			src: 'p12-reports-full',
			fx: 'cards',
			sticky: {
				src: 'p12-reports',
				boxes: [
					{ x: 0, y: 0, w: 390, h: 62 },
					{ x: 0, y: 789, w: 390, h: 55 },
					{ x: 244, y: 732, w: 130, h: 44, r: 22 }
				]
			}
		},
		{ f: R + 298, src: 'p13-networth', fx: 'fade', dur: 14 },
		...accentEntries('acc-reports', [1380, 30])
	];
	const cam: CamKey[] = [
		[T.head, 1, 195, 422],
		[A + 50, 1, 195, 422],
		[A + 80, 1.18, 195, sheetC[1]],
		[A + 304, 1.18, 195, sheetC[1]],
		[A + 330, 1, 195, 422],
		[A + 356, 1.28, rtaC[0], rtaC[1]],
		[B + 20, 1.28, rtaC[0], rtaC[1]],
		[B + 44, 1, 195, 422],
		[B + 90, 1, 195, 422],
		[B + 116, 1.22, 195, input[1]],
		[B + 184, 1.22, 195, input[1]],
		[B + 204, 1, 195, 422],
		[B + 236, 1, 195, 422],
		[B + 262, 1.28, rtaC[0], rtaC[1]],
		[R + 0, 1.28, rtaC[0], rtaC[1]],
		[R + 20, 1, 195, 422],
		[R + 300, 1, 195, 422],
		[R + 336, 1.25, 195, chartC[1]],
		[R + 394, 1.25, 195, chartC[1]],
		[R + 416, 1, 195, 422]
	];
	return {
		vw: 390,
		vh: 844,
		entries,
		scroll: [
			[R + 130, 0],
			[R + 200, 1250],
			[R + 216, 1250],
			[R + 262, 0]
		],
		cam,
		path: [],
		clicks: [],
		taps: [
			[A + 40, ...center('p01-base', 'fab')],
			[A + 96, ...center('p02-sheet', 'payee')],
			[A + 146, ...center('p02-sheet', 'inflow')],
			[A + 170, ...center('p02-sheet', 'amount')],
			[A + 236, ...center('p02-sheet', 'category')],
			[A + 300, ...save],
			[B + 74, ...center('p07-scrolled', 'vacName')],
			[B + 110, ...input],
			[B + 176, ...center('p08-cat-sheet', 'save')],
			[R + 40, ...center('p11-top', 'reportsTab')],
			[R + 292, card1.x + card1.w / 2, card1.y + 150]
		],
		keys: [...times(A + 184, 3, 9), ...times(B + 124, 4, 9)],
		chip: { f: A + 320, from: save, to: [rtaC[0] - 40, rtaC[1] + 10] },
		rtaGlow: [
			{ f: A + 356, b: rta, color: AMBER },
			{ f: B + 262, b: box('p11-top', 'rta'), color: GREEN }
		],
		notes: [
			{ f: A + 372, out: B + 30, at: [rtaAmt.x + 118, rtaAmt.y + rtaAmt.h / 2], text: 'Income lands here', tone: 'teal' }
		],
		availRing: {
			f: B + 186,
			b: { x: 270, w: 100, y: box('p10-assigned', 'vacRow').y + 4, h: 34 }
		},
		chart: { f: R + 318, b: chart },
		cursorOn: []
	};
}

export const DESKTOP = desktop();
export const PHONE = phone();
