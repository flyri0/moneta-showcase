import React from 'react';
import { Img, staticFile } from 'remotion';
import { META, out, prog, type Box } from '../lib/anim';

export type Fx = 'cut' | 'fade' | 'sheet' | 'scroll' | 'cards' | 'wipe';
export type Entry = {
	f: number;
	src: string;
	fx?: Fx;
	dur?: number;
	/** 'sheet': the region that slides up from the bottom. */
	sheet?: Box;
	/** 'wipe': where the circle grows from. */
	origin?: [number, number];
	/** Background colour behind the cards while they assemble. */
	bg?: string;
	/** Parts that stay put while a tall capture scrolls (sidebar, headers, nav), from a viewport capture. */
	sticky?: { src: string; boxes: (Box & { r?: number })[] };
};

const url = (src: string) => staticFile(`captures/${src}.png`);

/** A capture at its CSS size. */
export const Pic: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) => {
	const m = META[src];
	return (
		<Img
			src={url(src)}
			style={{ position: 'absolute', left: 0, top: 0, width: m.w, height: m.h, ...style }}
		/>
	);
};

/** Crop of a capture, drawn at its own place. */
const Crop: React.FC<{ src: string; b: Box; style?: React.CSSProperties }> = ({ src, b, style }) => {
	const m = META[src];
	return (
		<div
			style={{
				position: 'absolute',
				left: b.x,
				top: b.y,
				width: b.w,
				height: b.h,
				overflow: 'hidden',
				...style
			}}
		>
			<Img
				src={url(src)}
				style={{ position: 'absolute', left: -b.x, top: -b.y, width: m.w, height: m.h }}
			/>
		</div>
	);
};

export function currentIndex(entries: Entry[], frame: number): number {
	let i = 0;
	for (let k = 0; k < entries.length; k++) if (entries[k].f <= frame) i = k;
	return i;
}

/**
 * Plays a list of captures like a screen recording: each entry takes over at its frame, with a
 * transition from the one before it. `scroll` pans captures taller than the screen (`vh`).
 */
export const Shots: React.FC<{
	entries: Entry[];
	frame: number;
	scroll?: number;
	vh: number;
}> = ({ entries, frame, scroll = 0, vh }) => {
	const i = currentIndex(entries, frame);
	const cur = entries[i];
	const prev = i > 0 ? entries[i - 1] : null;
	const fx = cur.fx ?? 'cut';
	const dur = cur.dur ?? 8;
	const p = prog(frame, cur.f, cur.f + dur, out);
	const panOf = (src: string, extra?: React.CSSProperties): React.CSSProperties => ({
		position: 'absolute',
		inset: 0,
		transform: `translateY(${META[src].h > vh + 10 ? -scroll : 0}px)`,
		...extra
	});
	const layer = (src: string, extra?: React.CSSProperties, node?: React.ReactNode) => (
		<div style={panOf(src, extra)}>{node ?? <Pic src={src} />}</div>
	);

	const sticky = cur.sticky && (
		<>
			{cur.sticky.boxes.map((b, k) => (
				<Crop key={k} src={cur.sticky!.src} b={b} style={{ borderRadius: b.r ?? 0 }} />
			))}
		</>
	);
	if (!prev || fx === 'cut' || p >= 1) {
		return (
			<>
				{fx === 'cards' ? layer(cur.src, undefined, <Cards e={cur} frame={frame} />) : layer(cur.src)}
				{sticky}
			</>
		);
	}

	const under = (
		<>
			{layer(prev.src)}
			{prev.sticky?.boxes.map((b, k) => (
				<Crop key={k} src={prev.sticky!.src} b={b} style={{ borderRadius: b.r ?? 0 }} />
			))}
		</>
	);
	if (fx === 'fade') {
		return (
			<>
				{under}
				{layer(cur.src, { opacity: p })}
			</>
		);
	}
	if (fx === 'sheet' && cur.sheet) {
		const s = cur.sheet;
		const m = META[cur.src];
		return (
			<>
				{under}
				<Crop src={cur.src} b={{ x: 0, y: 0, w: m.w, h: s.y }} style={{ opacity: p }} />
				<Crop
					src={cur.src}
					b={{ ...s, h: m.h - s.y }}
					style={{
						transform: `translateY(${(1 - p) * (m.h - s.y + 40)}px)`,
						boxShadow: '0 -20px 60px rgba(0,0,0,0.12)',
						borderRadius: '14px 14px 0 0'
					}}
				/>
			</>
		);
	}
	if (fx === 'scroll') {
		const dy = (META[cur.src].scrollY ?? 0) - (META[prev.src].scrollY ?? 0);
		const q = prog(frame, cur.f, cur.f + dur);
		return (
			<>
				<Pic src={prev.src} style={{ transform: `translateY(${-dy * q}px)`, opacity: 1 - q }} />
				<Pic src={cur.src} style={{ transform: `translateY(${dy * (1 - q)}px)`, opacity: q }} />
			</>
		);
	}
	if (fx === 'wipe') {
		const [ox, oy] = cur.origin ?? [0, 0];
		const m = META[cur.src];
		const r = Math.hypot(Math.max(ox, m.w - ox), Math.max(oy, m.h - oy)) * p;
		return (
			<>
				{under}
				{layer(cur.src, { clipPath: `circle(${r}px at ${ox}px ${oy}px)` })}
			</>
		);
	}
	// cards
	return (
		<>
			{layer(prev.src, { opacity: 1 - prog(frame, cur.f, cur.f + 6) })}
			{layer(cur.src, undefined, <Cards e={cur} frame={frame} />)}
			<div style={{ position: 'absolute', inset: 0, opacity: prog(frame, cur.f, cur.f + 6) }}>{sticky}</div>
		</>
	);
};

/** A report overview whose cards assemble one after another. */
const Cards: React.FC<{ e: Entry; frame: number }> = ({ e, frame }) => {
	const m = META[e.src];
	const cards = Object.entries(m.boxes)
		.filter(([k]) => /^card\d+$/.test(k))
		.sort((a, b) => Number(a[0].slice(4)) - Number(b[0].slice(4)))
		.map(([, b]) => b);
	const x0 = Math.min(...cards.map((b) => b.x)) - 4;
	const y0 = Math.min(...cards.map((b) => b.y)) - 4;
	const x1 = Math.max(...cards.map((b) => b.x + b.w)) + 4;
	const y1 = Math.max(...cards.map((b) => b.y + b.h)) + 4;
	const base = prog(frame, e.f, e.f + 6);
	return (
		<>
			<Pic src={e.src} style={{ opacity: base }} />
			<div
				style={{
					position: 'absolute',
					left: x0,
					top: y0,
					width: x1 - x0,
					height: y1 - y0,
					background: e.bg ?? '#fff'
				}}
			/>
			{cards.map((b, k) => {
				const q = prog(frame, e.f + 4 + k * 7, e.f + 38 + k * 7, out);
				if (q >= 1) return <Crop key={k} src={e.src} b={b} />;
				return (
					<Crop
						key={k}
						src={e.src}
						b={b}
						style={{
							opacity: q,
							transform: `translateY(${(1 - q) * 60}px) scale(${0.94 + 0.06 * q})`,
							borderRadius: 12
						}}
					/>
				);
			})}
		</>
	);
};
