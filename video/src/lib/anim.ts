import { Easing, interpolate } from 'remotion';
import meta from '../../public/captures/meta.json';

export const inOut = Easing.bezier(0.65, 0, 0.35, 1);
export const out = Easing.bezier(0.16, 1, 0.3, 1);
export const inn = Easing.bezier(0.7, 0, 0.84, 0);

/** Piecewise keyframes: [[frame, value], ...], eased per segment, clamped at both ends. */
export function kf(frame: number, keys: [number, number][], easing = inOut): number {
	if (keys.length === 1) return keys[0][1];
	return interpolate(
		frame,
		keys.map((k) => k[0]),
		keys.map((k) => k[1]),
		{ easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
	);
}

/** 0 → 1 between two frames. */
export function prog(frame: number, from: number, to: number, easing = inOut): number {
	return interpolate(frame, [from, to], [0, 1], {
		easing,
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp'
	});
}

export type Box = { x: number; y: number; w: number; h: number };
export type ShotMeta = { w: number; h: number; scrollY?: number; boxes: Record<string, Box> };
export const META = meta as unknown as Record<string, ShotMeta> & {
	responsive: { widths: number[]; height: number };
};

export function box(shot: string, key: string): Box {
	const b = META[shot]?.boxes?.[key];
	if (!b) throw new Error(`No box ${key} in ${shot}`);
	return b;
}

export function center(shot: string, key: string): [number, number] {
	const b = box(shot, key);
	return [b.x + b.w / 2, b.y + b.h / 2];
}
