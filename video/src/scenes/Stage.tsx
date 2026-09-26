import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { ArrowLeft, Check, Moon, Sun } from 'lucide-react';
import { Backdrop, Device } from '../components/Device';
import { Cursor, Taps } from '../components/Pointer';
import { Pic, Shots } from '../components/Shots';
import { Caption, Words } from '../components/Type';
import { inOut, kf, META, out, prog } from '../lib/anim';
import { ACCENT_HEX, ACCENTS, C, FONT, INTRO_HOLD, T } from '../lib/theme';
import { CYCLE, DESKTOP, PHONE, PS, RS, type CamKey, type Note, type Script } from './scripts';

/** The stage mounts under the intro so its iris opens onto it. */
export const STAGE_FROM = 110 + INTRO_HOLD;
const D = T.resp;
const E = T.pers;
const WIDTHS: number[] = META.responsive.widths;

function nearestWidth(w: number): number {
	let best = WIDTHS[0];
	for (const x of WIDTHS) if (Math.abs(x - w) < Math.abs(best - w)) best = x;
	return best;
}

function camAt(g: number, keys: CamKey[]): [number, number, number] {
	return [
		kf(g, keys.map((k) => [k[0], k[1]])),
		kf(g, keys.map((k) => [k[0], k[2]])),
		kf(g, keys.map((k) => [k[0], k[3]]))
	];
}

const CAPTIONS = (portrait: boolean) => [
	{ start: T.add, end: T.assign - 14, title: 'Zero-based budgeting', body: 'Every dollar gets a job before you spend it.' },
	{ start: T.assign, end: T.reports - 14, title: 'Assign in a keystroke', body: 'Type math right in the cell. Ready to Assign hits zero.' },
	{ start: T.reports, end: T.resp - 14, title: 'Reports that tell the story', body: 'Spending, net worth, cash flow and Age of Money.' },
	{
		start: T.resp,
		end: T.pers - 14,
		title: portrait ? 'Phone to desktop' : 'Desktop to phone',
		body: portrait
			? 'Responsive, installable, and fully offline.'
			: 'A sidebar that folds to icons, a layout that fits any screen, fully offline.'
	},
	{ start: T.pers, end: T.priv - 4, title: 'Make it yours', body: 'Ten accent colors, in light and dark.' }
];

/** The app story, from the headline to the privacy panel: headline, then one device that is used, resized and restyled. */
export const Stage: React.FC = () => {
	const local = useCurrentFrame();
	const g = local + STAGE_FROM;
	const { width: W, height: H } = useVideoConfig();
	const portrait = H > W;
	const s: Script = portrait ? PHONE : DESKTOP;

	// ---------------------------------------------------------------- device geometry
	let m: number;
	let cw: number;
	const rs = portrait ? RS.portrait : RS.landscape;
	if (portrait) {
		m = kf(g, [[D + RS.portrait.morph[0], 1], [D + RS.portrait.morph[1], 0]]);
		cw = kf(g, [[D + RS.portrait.grow[0], 390], [D + RS.portrait.grow[1], 1440]]);
	} else {
		m = kf(g, [[D + RS.landscape.morph[0], 0], [D + RS.landscape.morph[1], 1]]);
		cw = kf(g, [[D + RS.landscape.shrink[0], 1440], [D + RS.landscape.shrink[1], 390]]);
	}
	const ch = 900 + (844 - 900) * m;
	// Landscape drags the sidebar with ordinary captures first; the resize sweep takes over after.
	const respFrom = portrait ? 0 : RS.landscape.shrink[0] - 10;
	const inResp = g >= D + respFrom && g < D + rs.end;
	const afterResp = g >= D;

	const fly = prog(g, T.head + 150, T.head + 236, out);
	let scale: number;
	let cx: number;
	let cy: number;
	if (portrait) {
		const frameW = cw + 24 * m;
		const fit = Math.min(1.55, 1000 / frameW);
		scale = fit;
		cx = W / 2;
		const devH = (ch + 46 * (1 - m) + 48 * m + 24 * m) * scale;
		cy = kf(g, [[D + RS.portrait.grow[0], 1130], [D + RS.portrait.grow[1], 1020]]);
		void devH;
	} else {
		const [m0, m1] = RS.landscape.morph;
		scale = kf(g, [[D + m0 - 8, 0.86], [D + m1 + 4, 0.98]]);
		cx = kf(g, [[D + m0 - 8, 1211], [D + m1 + 4, 1150]]);
		cy = 540;
	}
	const flyY = (1 - fly) * (portrait ? 1500 : 1000);
	const rotX = (1 - fly) * 28;

	// ---------------------------------------------------------------- camera
	const vw = afterResp ? cw : s.vw;
	const vh = afterResp ? ch : s.vh;
	let [cs, fx, fy] = camAt(g, s.cam);
	if (afterResp) [cs, fx, fy] = [1, vw / 2, vh / 2];
	// Portrait pushes the whole phone toward the focus instead of zooming inside its narrow screen.
	let push = 1;
	let origin = '50% 50%';
	if (portrait && !afterResp) {
		push = cs;
		const S = scale;
		origin = `${cx + (fx - vw / 2) * S}px ${cy + (fy - vh / 2 + 24) * S}px`;
		[cs, fx, fy] = [1, vw / 2, vh / 2];
	}
	const tx = Math.min(0, Math.max(vw - vw * cs, vw / 2 - fx * cs));
	const ty = Math.min(0, Math.max(vh - vh * cs, vh / 2 - fy * cs));
	const scroll = kf(g, s.scroll);

	// ---------------------------------------------------------------- content
	let content: React.ReactNode;
	if (inResp) {
		const rsSrc = `rs-${nearestWidth(cw)}`;
		if (portrait) {
			const a = prog(g, D + RS.portrait.swap[0], D + RS.portrait.swap[1]);
			content = (
				<>
					<Pic src="p11-top" />
					<div style={{ position: 'absolute', inset: 0, opacity: a, background: '#fff' }}>
						<Pic src={rsSrc} />
					</div>
				</>
			);
		} else {
			const a = prog(g, D + RS.landscape.swap[0], D + RS.landscape.swap[1]);
			content = (
				<>
					<Pic src={rsSrc} />
					{a > 0 && (
						<div style={{ position: 'absolute', inset: 0, opacity: a }}>
							<Pic src="p11-top" />
						</div>
					)}
				</>
			);
		}
	} else {
		const entries = afterResp
			? [...s.entries, { f: D + rs.end, src: portrait ? 'rs-1440' : 'p11-top' }].sort((a, b) => a.f - b.f)
			: s.entries;
		content = <Shots entries={entries} frame={g} scroll={scroll} vh={vh} />;
	}

	// ---------------------------------------------------------------- overlays in screen space
	const dragging = !portrait && g >= D + RS.landscape.sidebar[0] - 6 && g < D + RS.landscape.sidebar[1] + 10;
	const cursor = !portrait && g < D + RS.landscape.sidebar[1] + 40 && (
		<Cursor frame={g} path={s.path} clicks={s.clicks} opacity={kf(g, s.cursorOn)} resize={dragging} />
	);
	const overlays = !afterResp && (
		<>
			<Chip s={s} g={g} portrait={portrait} />
			{s.rtaGlow.map((r, i) => (
				<Glow key={i} g={g} f={r.f} b={r.b} color={r.color} />
			))}
			<Glow g={g} f={s.availRing.f} b={s.availRing.b} radius={999} len={portrait ? 30 : 70} />
			<Glow g={g} f={s.fieldGlow.f} b={s.fieldGlow.b} radius={8} len={portrait ? 50 : 76} />
			{s.notes.map((n, i) => (
				<Badge key={i} g={g} note={n} portrait={portrait} />
			))}
			<ChartWipe g={g} f={s.chart.f} b={s.chart.b} />
			{portrait && <Taps frame={g} taps={s.taps} />}
		</>
	);

	const dark = g >= E + PS.dark;
	const headlineOut = prog(g, T.head + 150, T.head + 180, inOut);

	return (
		<AbsoluteFill>
			<Backdrop frame={g} />
			{/* Headline */}
			{g < T.head + 190 && (
				<AbsoluteFill
					style={{
						alignItems: 'center',
						justifyContent: 'center',
						transform: `translateY(${-headlineOut * 120}px)`,
						opacity: 1 - headlineOut
					}}
				>
					<Words
						text="Give every dollar a job."
						frame={g}
						start={T.head + 6}
						stagger={6}
						size={portrait ? 128 : 150}
						align="center"
						accentWords={['job']}
						maxWidth={portrait ? 900 : 1700}
					/>
				</AbsoluteFill>
			)}

			<AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: origin }}>
			<Device
				contentW={vw}
				contentH={vh}
				m={portrait ? (g < D ? 1 : m) : g < D ? 0 : m}
				scale={scale * (0.82 + 0.18 * fly)}
				cx={cx}
				cy={cy + flyY}
				rotateX={rotX}
				dark={dark}
				shadow={fly}
			>
				<div
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						width: vw,
						height: vh,
						transformOrigin: '0 0',
						transform: `translate(${tx}px, ${ty}px) scale(${cs})`
					}}
				>
					{content}
					{overlays}
					{cursor}
				</div>
			</Device>
			</AbsoluteFill>
			{portrait && (
				<AbsoluteFill
					style={{
						background: `linear-gradient(180deg, ${C.paper} 0px, ${C.paper} 250px, rgba(243,246,245,0.85) 330px, rgba(243,246,245,0) 420px)`,
						opacity: prog(g, T.add - 10, T.add + 10) * (1 - prog(g, T.priv - 10, T.priv))
					}}
				/>
			)}

			<Resize g={g} portrait={portrait} cw={cw} ch={ch} scale={scale} cx={cx} cy={cy} m={m} />
			<Swatches g={g} portrait={portrait} cx={cx} cy={cy} scale={scale} cw={cw} ch={ch} />

			{/* Captions */}
			{CAPTIONS(portrait).map((c, i) => (
				<div
					key={i}
					style={
						portrait
							? { position: 'absolute', left: 70, right: 70, top: 110, display: 'flex', justifyContent: 'center' }
							: { position: 'absolute', left: 110, top: 0, bottom: 0, display: 'flex', alignItems: 'center' }
					}
				>
					<Caption
						frame={g}
						start={c.start}
						end={c.end}
						index={`0${i + 1}`}
						title={c.title}
						body={c.body}
						align={portrait ? 'center' : 'left'}
						width={portrait ? 940 : 470}
						titleSize={portrait ? 74 : 66}
						bodySize={portrait ? 32 : 27}
					/>
				</div>
			))}
		</AbsoluteFill>
	);
};

// -------------------------------------------------------------------- overlay pieces

const Chip: React.FC<{ s: Script; g: number; portrait: boolean }> = ({ s, g, portrait }) => {
	const { f, from, to } = s.chip;
	if (g < f || g > f + 60) return null;
	const q = prog(g, f + 4, f + 34, inOut);
	const pop = prog(g, f, f + 10, out);
	const fade = prog(g, f + 36, f + 52);
	const x = from[0] + (to[0] - from[0]) * q;
	const y = from[1] + (to[1] - from[1]) * q - Math.sin(q * Math.PI) * (portrait ? 120 : 160);
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				transform: `translate(-50%, -50%) scale(${(0.5 + 0.5 * pop) * (1 - 0.3 * fade)})`,
				opacity: 1 - fade,
				padding: '6px 14px',
				borderRadius: 999,
				background: `linear-gradient(135deg, ${C.tealBright}, ${C.teal})`,
				color: '#fff',
				fontFamily: FONT,
				fontWeight: 700,
				fontSize: 18,
				letterSpacing: '-0.01em',
				boxShadow: '0 10px 30px rgba(13,148,136,0.45)',
				whiteSpace: 'nowrap',
				zIndex: 40
			}}
		>
			+$850.00
		</div>
	);
};

const Glow: React.FC<{
	g: number;
	f: number;
	b: { x: number; y: number; w: number; h: number };
	radius?: number;
	len?: number;
	color?: string;
}> = ({ g, f, b, radius = 14, len = 110, color = C.teal }) => {
	if (g < f || g > f + len) return null;
	const q = prog(g, f, f + 12, out);
	const fade = prog(g, f + len * 0.64, f + len);
	const pulse = 1 + Math.sin(((g - f) / 55) * Math.PI) * 0.015;
	return (
		<div
			style={{
				position: 'absolute',
				left: b.x - 4,
				top: b.y - 4,
				width: b.w + 8,
				height: b.h + 8,
				borderRadius: radius,
				border: `2.5px solid ${color}`,
				boxShadow: `0 0 0 ${6 * q}px ${color}2e, 0 0 40px ${color}${Math.round(0x73 * q)
					.toString(16)
					.padStart(2, '0')}`,
				opacity: q * (1 - fade),
				transform: `scale(${pulse})`,
				zIndex: 30
			}}
		/>
	);
};

/** A pill annotation pinned next to what it explains. */
const Badge: React.FC<{ g: number; note: Note; portrait: boolean }> = ({ g, note, portrait }) => {
	const { f, out: leave, at, text, tone } = note;
	if (g < f || g > leave + 14) return null;
	const q = prog(g, f, f + 22, out) * (1 - prog(g, leave, leave + 12));
	const green = tone === 'green';
	return (
		<div
			style={{
				position: 'absolute',
				left: at[0],
				top: at[1],
				transform: `translate(${(1 - q) * -16}px, -50%) scale(${0.8 + 0.2 * q})`,
				transformOrigin: 'left center',
				opacity: q,
				display: 'flex',
				alignItems: 'center',
				gap: 8,
				padding: portrait ? '5px 11px 5px 6px' : '6px 16px 6px 8px',
				borderRadius: 999,
				background: green ? '#ecfdf5' : '#f0fdfa',
				border: `1px solid ${green ? '#a7f3d0' : '#99f6e4'}`,
				color: green ? '#047857' : '#0f766e',
				fontFamily: FONT,
				fontWeight: 650,
				fontSize: portrait ? 14 : 19,
				whiteSpace: 'nowrap',
				boxShadow: `0 8px 24px ${green ? 'rgba(4,120,87,0.18)' : 'rgba(13,148,136,0.2)'}`,
				zIndex: 40
			}}
		>
			<span
				style={{
					width: portrait ? 18 : 22,
					height: portrait ? 18 : 22,
					borderRadius: 999,
					background: green ? '#10b981' : C.teal,
					display: 'inline-flex',
					alignItems: 'center',
					justifyContent: 'center'
				}}
			>
				{green ? (
					<Check size={portrait ? 12 : 14} color="#fff" strokeWidth={3} />
				) : (
					<ArrowLeft size={portrait ? 12 : 14} color="#fff" strokeWidth={3} />
				)}
			</span>
			{text}
		</div>
	);
};

const ChartWipe: React.FC<{ g: number; f: number; b: { x: number; y: number; w: number; h: number } }> = ({ g, f, b }) => {
	if (g < f - 12 || g > f + 60) return null;
	const p = prog(g, f, f + 52, inOut);
	const left = b.x - 6 + (b.w + 12) * p;
	return (
		<>
			<div
				style={{
					position: 'absolute',
					left,
					top: b.y - 6,
					width: b.x + b.w + 6 - left,
					height: b.h + 12,
					background: '#fff'
				}}
			/>
			{p > 0 && p < 1 && (
				<div
					style={{
						position: 'absolute',
						left: left - 1,
						top: b.y - 6,
						width: 3,
						height: b.h + 12,
						background: `linear-gradient(${C.tealBright}, ${C.teal})`,
						boxShadow: `0 0 18px ${C.tealBright}`,
						borderRadius: 2
					}}
				/>
			)}
		</>
	);
};

/** The window being dragged narrower (or wider), with a live width readout. */
const Resize: React.FC<{
	g: number;
	portrait: boolean;
	cw: number;
	ch: number;
	scale: number;
	cx: number;
	cy: number;
	m: number;
}> = ({ g, portrait, cw, ch, scale, cx, cy, m }) => {
	const r = portrait ? RS.portrait.resize : RS.landscape.resize;
	const [a, b] = [D + r[0], D + r[1]];
	if (g < a - 10 || g > b + 16) return null;
	const vis = prog(g, a - 10, a + 4) * (1 - prog(g, b, b + 14));
	const devH = (ch + 46 * (1 - m) + 48 * m) * scale;
	const x = cx + (cw / 2) * scale + 6;
	const label = `${Math.round(cw)} px`;
	const tier = cw >= 1024 ? 'Desktop' : cw >= 768 ? 'Tablet' : 'Phone';
	return (
		<>
			<Cursor frame={g} path={[[0, x, cy]]} clicks={[]} resize opacity={vis} size={34} />
			<div
				style={{
					position: 'absolute',
					left: cx,
					top: cy - devH / 2 - 64,
					transform: 'translateX(-50%)',
					opacity: vis,
					display: 'flex',
					gap: 10,
					alignItems: 'center',
					fontFamily: FONT
				}}
			>
				<span
					style={{
						padding: '8px 16px',
						borderRadius: 999,
						background: C.ink,
						color: '#fff',
						fontSize: 22,
						fontWeight: 650,
						fontVariantNumeric: 'tabular-nums',
						minWidth: 110,
						textAlign: 'center'
					}}
				>
					{label}
				</span>
				<span
					style={{
						padding: '8px 16px',
						borderRadius: 999,
						background: '#fff',
						color: C.teal,
						fontSize: 22,
						fontWeight: 650,
						boxShadow: `0 0 0 1.5px ${C.teal}`
					}}
				>
					{tier}
				</span>
			</div>
		</>
	);
};

/** Accent swatches beside the device, following the colour the screen shows. */
const Swatches: React.FC<{
	g: number;
	portrait: boolean;
	cx: number;
	cy: number;
	scale: number;
	cw: number;
	ch: number;
}> = ({ g, portrait, cx, cy, scale, cw, ch }) => {
	if (g < E - 4 || g > T.priv + 30) return null;
	const vis = prog(g, E + 4, E + 30, out);
	const k = Math.floor((g - (E + PS.cycleStart)) / PS.step);
	const active = g < E + PS.cycleStart ? 'teal' : CYCLE[Math.min(CYCLE.length - 1, k)];
	const darkOn = prog(g, E + PS.toggle, E + PS.toggle + 16, out);
	const size = 46;
	const gap = 16;
	const list = [...ACCENTS];
	const horizontal = portrait;
	const devW = (cw + 24) * scale;
	const devH = (ch + 48 + 24) * scale;
	const pos: React.CSSProperties = horizontal
		? { left: cx, top: cy + ((ch + 46) * scale) / 2 + 60, transform: `translate(-50%, ${(1 - vis) * 30}px)` }
		: { left: cx + devW / 2 + 70, top: cy, transform: `translate(${(1 - vis) * 30}px, -50%)` };
	void devH;
	return (
		<div
			style={{
				position: 'absolute',
				...pos,
				opacity: vis,
				display: 'flex',
				flexDirection: horizontal ? 'row' : 'column',
				alignItems: 'center',
				gap: 26,
				padding: horizontal ? '18px 26px' : '26px 18px',
				borderRadius: 999,
				background: 'rgba(255,255,255,0.75)',
				boxShadow: '0 20px 50px -10px rgba(4,40,35,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
				backdropFilter: 'blur(10px)'
			}}
		>
			<div style={{ display: 'flex', flexDirection: horizontal ? 'row' : 'column', gap }}>
				{list.map((a, i) => {
					const on = a === active;
					const q = prog(g, E + 8 + i * 2, E + 24 + i * 2, out);
					return (
						<div
							key={a}
							style={{
								width: size,
								height: size,
								borderRadius: 999,
								background: ACCENT_HEX[a],
								transform: `scale(${(0.4 + 0.6 * q) * (on ? 1.12 : 1)})`,
								boxShadow: on ? `0 0 0 4px #fff, 0 0 0 7px ${ACCENT_HEX[a]}` : 'none',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center'
							}}
						>
							{on && <Check size={24} color="#fff" strokeWidth={3} />}
						</div>
					);
				})}
			</div>
			<div
				style={{
					width: horizontal ? 104 : 56,
					height: horizontal ? 56 : 104,
					borderRadius: 999,
					background: darkOn > 0.5 ? C.ink : '#e7ecea',
					position: 'relative',
					transition: 'none'
				}}
			>
				<div
					style={{
						position: 'absolute',
						width: 44,
						height: 44,
						borderRadius: 999,
						background: '#fff',
						left: horizontal ? 6 + darkOn * 48 : 6,
						top: horizontal ? 6 : 6 + darkOn * 48,
						boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center'
					}}
				>
					{darkOn > 0.5 ? <Moon size={24} color={C.ink} /> : <Sun size={24} color="#f59e0b" />}
				</div>
			</div>
		</div>
	);
};
