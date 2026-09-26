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
	/** The category field lighting up when the payee fills it. */
	fieldGlow: { f: number; b: Box };
	availRing: { f: number; b: Box };
	chart: { f: number; b: Box };
	/** Cursor visibility (desktop). */
	cursorOn: [number, number][];
	/** Desktop only: the frame the dragged sidebar snaps to the icon rail. */
	snap?: number;
};

/** Phone budget: the sticky header ends here and the bottom bar starts here (CSS px). */
const PHONE_BARS = { top: 101, bottom: 789 };
/** The Ready to Assign card's own colours: amber while money waits, green at zero. */
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
	// The sidebar's links are 36 px apart; Budget is three above Reports.
	const reportsLink = box('d20-assigned', 'reports');
	const budgetLink: [number, number] = [reportsLink.x + 70, reportsLink.y - 108 + reportsLink.h / 2];
	const save = center('d14-cat-set', 'save');
	const cat = box('d07-payee-set', 'category');
	const SAVE = A + 380;
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
		{ f: A + 118, src: 'd04-payee-open', fx: 'fade', dur: 6 },
		...typing(A + 132, 'd05-payee', 4, 9),
		{ f: A + 182, src: 'd06-payee-hover', fx: 'fade', dur: 4 },
		// The payee brings its default category along: no category step.
		{ f: A + 194, src: 'd07-payee-set', fx: 'fade', dur: 6 },
		{ f: A + 252, src: 'd08-inflow', fx: 'fade', dur: 5 },
		{ f: A + 284, src: 'd09-amount-focus', fx: 'fade', dur: 4 },
		...typing(A + 296, 'd10-amount', 3, 10),
		{ f: A + 364, src: 'd15-hover-save', fx: 'fade', dur: 4 },
		// Saved: the dialog closes on a budget that still has nothing to assign…
		{ f: SAVE + 2, src: 'd01-base', fx: 'fade', dur: 12 },
		// …until the income lands in Ready to Assign.
		{ f: SAVE + 50, src: 'd16-rta-850', fx: 'fade', dur: 14 },
		{ f: B + 60, src: 'd17-hover-vac', fx: 'fade', dur: 5 },
		{ f: B + 76, src: 'd18-vac-edit', fx: 'fade', dur: 5 },
		...typing(B + 92, 'd19-vac', 4, 9),
		{ f: B + 142, src: 'd20-assigned', fx: 'fade', dur: 10 },
		{ f: R + 40, src: 'd21-hover-reports', fx: 'fade', dur: 5 },
		{ f: R + 54, src: 'd22-reports-full', fx: 'cards', sticky: reportsSticky },
		{ f: R + 298, src: 'd23-networth', fx: 'fade', dur: 14 },
		// Back to the budget from the sidebar before resizing anything.
		{ f: R + 416, src: 'sb-start', fx: 'fade', dur: 10 },
		{ f: D + 38, src: 'sb-hover', fx: 'fade', dur: 4 },
		...drag.entries.slice(1),
		{ f: D + RS.landscape.sidebar[1] + 8, src: 'sb-rail', fx: 'fade', dur: 8 },
		...accentEntries('pacc-reports', [372, 18])
	];
	const cam: CamKey[] = [
		[T.head, 1, 720, 450],
		[A + 60, 1, 720, 450],
		[A + 96, 1.5, dlgC[0], dlgC[1]],
		[SAVE + 4, 1.5, dlgC[0], dlgC[1]],
		[SAVE + 40, 1.75, ...rtaFocus],
		[B + 30, 1.75, ...rtaFocus],
		[B + 70, 1.42, 848, vac[1] - 40],
		[B + 170, 1.42, 848, vac[1] - 40],
		[B + 210, 1.12, 860, 420],
		[R + 0, 1.12, 860, 420],
		[R + 30, 1, 720, 450],
		[R + 300, 1, 720, 450],
		[R + 336, 1.32, chartC[0], chartC[1] - 20],
		[R + 376, 1.32, chartC[0], chartC[1] - 20],
		[R + 398, 1, 720, 450]
	];
	const path: PathKey[] = [
		[A - 10, 1150, 820],
		[A + 40, ...center('d01-base', 'add')],
		[A + 54, ...center('d01-base', 'add')],
		[A + 106, ...center('d03-dialog', 'payee')],
		[A + 164, ...center('d03-dialog', 'payee')],
		[A + 182, ...center('d06-payee-hover', 'item')],
		[A + 196, ...center('d06-payee-hover', 'item')],
		[A + 244, ...center('d07-payee-set', 'inflow')],
		[A + 254, ...center('d07-payee-set', 'inflow')],
		[A + 276, ...center('d07-payee-set', 'amount')],
		[A + 326, ...center('d07-payee-set', 'amount')],
		[A + 362, ...save],
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
		[R + 392, 1360, 860],
		[R + 412, ...budgetLink],
		[R + 420, ...budgetLink],
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
			A + 116,
			A + 192,
			A + 250,
			A + 282,
			SAVE,
			B + 74,
			R + 52,
			R + 296,
			R + 414,
			D + RS.landscape.sidebar[0] - 2
		],
		taps: [],
		keys: [...times(A + 132, 4, 9), ...times(A + 296, 3, 10), ...times(B + 92, 4, 9), B + 140],
		chip: { f: SAVE + 16, from: save, to: [rtaC[0] + 40, rtaC[1]] },
		rtaGlow: [
			{ f: SAVE + 52, b: rta, color: AMBER },
			{ f: B + 212, b: box('d20-assigned', 'rta'), color: GREEN }
		],
		notes: [
			{ f: SAVE + 68, out: B + 30, at: [rtaAmt.x + 124, rtaAmt.y + rtaAmt.h / 2], text: 'Income lands in Ready to Assign', tone: 'teal' },
			{ f: A + 206, out: A + 264, at: [cat.x + 4, cat.y + cat.h + 24], text: "Filled from the payee's default category", tone: 'teal' }
		],
		fieldGlow: { f: A + 198, b: cat },
		availRing: { f: B + 150, b: box('d20-assigned', 'vacAvail') },
		chart: { f: R + 318, b: chart },
		cursorOn: [
			[A - 12, 0],
			[A, 1],
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
	// The tab bar has five equal tabs; Budget is the first, three to the left of Reports.
	const tab = box('p11-top', 'reportsTab');
	const budgetTab: [number, number] = [tab.x - 3 * tab.w + tab.w / 2, tab.y + tab.h / 2];
	const save = center('p02-sheet', 'save');
	const cat = box('p03-payee', 'category');
	const entries: Entry[] = [
		{ f: T.head, src: 'p01-base' },
		{ f: A + 42, src: 'p02-sheet', fx: 'sheet', dur: 22, sheet },
		{ f: A + 98, src: 'p02b-payee-open', fx: 'fade', dur: 6 },
		...typing(A + 112, 'p02c-payee', 4, 9),
		// The payee brings its default category along: no category step.
		{ f: A + 160, src: 'p03-payee', fx: 'fade', dur: 6 },
		{ f: A + 212, src: 'p03b-inflow', fx: 'fade', dur: 4 },
		{ f: A + 232, src: 'p03c-amount-focus', fx: 'fade', dur: 4 },
		{ f: A + 244, src: 'p04-amount-1', fx: 'fade', dur: 3 },
		{ f: A + 253, src: 'p04-amount-2' },
		{ f: A + 262, src: 'p04-amount-3' },
		{ f: A + 304, src: 'p01-base', fx: 'fade', dur: 14 },
		{ f: A + 354, src: 'p06b-rta-top', fx: 'fade', dur: 14 },
		{ f: B + 40, src: 'p07-scrolled', fx: 'scroll', dur: 20, fixed: PHONE_BARS },
		{ f: B + 76, src: 'p08-cat-sheet', fx: 'sheet', dur: 22, sheet: catSheet },
		...typing(B + 118, 'p09-vac', 4, 9),
		{ f: B + 178, src: 'p10-assigned', fx: 'fade', dur: 12 },
		{ f: B + 214, src: 'p11-top', fx: 'scroll', dur: 20, fixed: PHONE_BARS },
		{
			f: R + 42,
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
		{ f: R + 294, src: 'p13-networth', fx: 'fade', dur: 14 },
		// Back to the budget from the tab bar before the phone grows into a desktop.
		{ f: R + 406, src: 'p11-top', fx: 'fade', dur: 10 },
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
		[R + 376, 1.25, 195, chartC[1]],
		[R + 398, 1, 195, 422]
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
			[A + 158, ...center('p02d-payee-item', 'item')],
			[A + 210, ...center('p02-sheet', 'inflow')],
			[A + 230, ...center('p02-sheet', 'amount')],
			[A + 300, ...save],
			[B + 74, ...center('p07-scrolled', 'vacName')],
			[B + 110, ...input],
			[B + 176, ...center('p08-cat-sheet', 'save')],
			[R + 40, ...center('p11-top', 'reportsTab')],
			[R + 292, card1.x + card1.w / 2, card1.y + 150],
			[R + 404, budgetTab[0], budgetTab[1]]
		],
		keys: [...times(A + 112, 4, 9), ...times(A + 244, 3, 9), ...times(B + 118, 4, 9)],
		chip: { f: A + 320, from: save, to: [rtaC[0] - 40, rtaC[1] + 10] },
		rtaGlow: [
			{ f: A + 356, b: rta, color: AMBER },
			{ f: B + 262, b: box('p11-top', 'rta'), color: GREEN }
		],
		notes: [
			{ f: A + 372, out: B + 30, at: [rtaAmt.x + 118, rtaAmt.y + rtaAmt.h / 2], text: 'Income lands here', tone: 'teal' },
			{ f: A + 172, out: A + 206, at: [cat.x + 2, cat.y + cat.h + 20], text: 'Filled from the payee', tone: 'teal' }
		],
		fieldGlow: { f: A + 164, b: cat },
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
