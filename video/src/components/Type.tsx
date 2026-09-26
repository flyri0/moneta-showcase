import React from 'react';
import { out, prog, inOut } from '../lib/anim';
import { C, FONT } from '../lib/theme';

/** Words rise out of a mask one after another, then leave together. */
export const Words: React.FC<{
	text: string;
	frame: number;
	start: number;
	end?: number;
	stagger?: number;
	size: number;
	weight?: number;
	color?: string;
	tracking?: number;
	align?: 'left' | 'center';
	accentWords?: string[];
	accent?: string;
	lineHeight?: number;
	maxWidth?: number;
}> = ({
	text,
	frame,
	start,
	end,
	stagger = 4,
	size,
	weight = 760,
	color = C.ink,
	tracking = -0.04,
	align = 'left',
	accentWords = [],
	accent = C.teal,
	lineHeight = 1.04,
	maxWidth
}) => {
	const words = text.split(' ');
	const leave = end === undefined ? 0 : prog(frame, end, end + 14, inOut);
	return (
		<div
			style={{
				fontFamily: FONT,
				fontSize: size,
				fontWeight: weight,
				letterSpacing: `${tracking}em`,
				lineHeight,
				color,
				display: 'flex',
				flexWrap: 'wrap',
				justifyContent: align === 'center' ? 'center' : 'flex-start',
				columnGap: size * 0.26,
				maxWidth
			}}
		>
			{words.map((w, i) => {
				const q = prog(frame, start + i * stagger, start + i * stagger + 26, out);
				const hot = accentWords.includes(w.replace(/[.,]/g, ''));
				return (
					<span
						key={i}
						style={{ display: 'inline-block', overflow: 'hidden', paddingBottom: size * 0.12, marginBottom: -size * 0.12 }}
					>
						<span
							style={{
								display: 'inline-block',
								transform: `translateY(${(1 - q) * 110 - leave * 110}%)`,
								opacity: q * (1 - leave),
								color: hot ? accent : undefined
							}}
						>
							{w}
						</span>
					</span>
				);
			})}
		</div>
	);
};

/** Feature caption: number, title and one line of body. */
export const Caption: React.FC<{
	frame: number;
	start: number;
	end: number;
	index: string;
	title: string;
	body: string;
	align?: 'left' | 'center';
	titleSize?: number;
	bodySize?: number;
	width?: number;
	dark?: boolean;
}> = ({ frame, start, end, index, title, body, align = 'left', titleSize = 68, bodySize = 27, width = 470, dark = false }) => {
	if (frame < start - 2 || frame > end + 20) return null;
	const lineIn = prog(frame, start, start + 30, out);
	const leave = prog(frame, end, end + 14, inOut);
	const bodyIn = prog(frame, start + 12, start + 40, out);
	return (
		<div style={{ width, textAlign: align, fontFamily: FONT }}>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 14,
					justifyContent: align === 'center' ? 'center' : 'flex-start',
					marginBottom: 22,
					opacity: 1 - leave
				}}
			>
				<span
					style={{
						fontSize: 20,
						fontWeight: 650,
						letterSpacing: '0.08em',
						color: C.teal,
						fontVariantNumeric: 'tabular-nums',
						opacity: lineIn
					}}
				>
					{index}
				</span>
				<span
					style={{
						height: 2,
						width: 64 * lineIn,
						background: `linear-gradient(90deg, ${C.teal}, ${C.tealBright})`,
						borderRadius: 2
					}}
				/>
			</div>
			<Words
				text={title}
				frame={frame}
				start={start + 4}
				end={end}
				size={titleSize}
				align={align}
				color={dark ? '#fff' : C.ink}
				maxWidth={width}
			/>
			<div
				style={{
					marginTop: 22,
					fontSize: bodySize,
					lineHeight: 1.4,
					fontWeight: 450,
					letterSpacing: '-0.01em',
					color: dark ? C.mutedDark : C.muted,
					opacity: bodyIn * (1 - leave),
					transform: `translateY(${(1 - bodyIn) * 16 - leave * 16}px)`
				}}
			>
				{body}
			</div>
		</div>
	);
};

/** The Moneta mark: rounded square, ring and M, drawn stroke by stroke. */
export const Logo: React.FC<{ size: number; draw?: number; fill?: number; bg?: string }> = ({
	size,
	draw = 1,
	fill = 1,
	bg = C.tealDeep
}) => {
	const ring = 2 * Math.PI * 150;
	const mLen = 560;
	const ringP = Math.min(1, draw / 0.7);
	const mP = Math.max(0, Math.min(1, (draw - 0.3) / 0.7));
	return (
		<svg width={size} height={size} viewBox="0 0 512 512" style={{ overflow: 'visible' }}>
			<rect width="512" height="512" rx="112" fill={bg} opacity={fill} />
			<circle
				cx="256"
				cy="256"
				r="150"
				fill="none"
				stroke="#fff"
				strokeWidth="28"
				strokeDasharray={ring}
				strokeDashoffset={ring * (1 - ringP)}
				transform="rotate(-90 256 256)"
				strokeLinecap="round"
			/>
			<path
				d="M186 326V186l70 84 70-84v140"
				fill="none"
				stroke="#fff"
				strokeWidth="32"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeDasharray={mLen}
				strokeDashoffset={mLen * (1 - mP)}
			/>
		</svg>
	);
};

export { inOut };
