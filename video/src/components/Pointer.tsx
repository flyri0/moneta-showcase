import React from 'react';
import { inOut, kf, out, prog } from '../lib/anim';
import { C } from '../lib/theme';

export type PathKey = [number, number, number];

function position(frame: number, keys: PathKey[]): [number, number] {
	const xs = keys.map((k) => [k[0], k[1]] as [number, number]);
	const ys = keys.map((k) => [k[0], k[2]] as [number, number]);
	return [kf(frame, xs, inOut), kf(frame, ys, inOut)];
}

/** A macOS-style arrow that travels along eased keyframes and presses on each click frame. */
export const Cursor: React.FC<{
	frame: number;
	path: PathKey[];
	clicks: number[];
	opacity?: number;
	resize?: boolean;
	size?: number;
}> = ({ frame, path, clicks, opacity = 1, resize = false, size = 26 }) => {
	const [x, y] = position(frame, path);
	let press = 0;
	let ring = -1;
	for (const c of clicks) {
		if (frame >= c - 3 && frame <= c + 8) press = Math.max(press, 1 - Math.abs(frame - c) / (frame < c ? 3 : 8));
		if (frame >= c && frame < c + 22) ring = (frame - c) / 22;
	}
	const s = 1 - press * 0.18;
	return (
		<div style={{ position: 'absolute', left: x, top: y, opacity, pointerEvents: 'none', zIndex: 50 }}>
			{ring >= 0 && (
				<div
					style={{
						position: 'absolute',
						left: -28 * (0.3 + ring),
						top: -28 * (0.3 + ring),
						width: 56 * (0.3 + ring),
						height: 56 * (0.3 + ring),
						borderRadius: '50%',
						border: `3px solid ${C.teal}`,
						opacity: (1 - ring) * 0.8
					}}
				/>
			)}
			{resize ? (
				<svg
					width={size * 1.3}
					height={size * 1.3}
					viewBox="0 0 32 32"
					style={{ position: 'absolute', left: -size * 0.65, top: -size * 0.65, transform: `scale(${s})` }}
				>
					<path
						d="M3 16l7-6v4h12v-4l7 6-7 6v-4H10v4z"
						fill="#111"
						stroke="#fff"
						strokeWidth="2"
						strokeLinejoin="round"
					/>
				</svg>
			) : (
				<svg
					width={size}
					height={size * 1.4}
					viewBox="0 0 20 28"
					style={{
						position: 'absolute',
						left: -2,
						top: -2,
						transform: `scale(${s})`,
						transformOrigin: '2px 2px',
						filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.3))'
					}}
				>
					<path
						d="M2 2v20.5l5.2-5 3.4 7.9 3.4-1.5-3.3-7.7H18z"
						fill="#111"
						stroke="#fff"
						strokeWidth="1.8"
						strokeLinejoin="round"
					/>
				</svg>
			)}
		</div>
	);
};

/** A finger tap: a soft disc that lands, presses and fades. */
export const Taps: React.FC<{ frame: number; taps: [number, number, number][] }> = ({ frame, taps }) => (
	<>
		{taps.map(([f, x, y], i) => {
			if (frame < f - 10 || frame > f + 24) return null;
			const inP = prog(frame, f - 10, f, out);
			const outP = prog(frame, f + 4, f + 24, out);
			const r = 22 * (0.6 + 0.4 * inP) * (1 - 0.15 * prog(frame, f - 2, f + 2));
			return (
				<React.Fragment key={i}>
					<div
						style={{
							position: 'absolute',
							left: x - r,
							top: y - r,
							width: r * 2,
							height: r * 2,
							borderRadius: '50%',
							background: 'rgba(20,20,20,0.28)',
							border: '2px solid rgba(255,255,255,0.9)',
							boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
							opacity: inP * (1 - outP),
							zIndex: 50
						}}
					/>
					{frame >= f && (
						<div
							style={{
								position: 'absolute',
								left: x - 22 - 26 * outP,
								top: y - 22 - 26 * outP,
								width: 44 + 52 * outP,
								height: 44 + 52 * outP,
								borderRadius: '50%',
								border: `2px solid ${C.teal}`,
								opacity: 1 - outP,
								zIndex: 50
							}}
						/>
					)}
				</React.Fragment>
			);
		})}
	</>
);
