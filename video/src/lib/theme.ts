import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

export const FPS = 60;
/** 120 bpm: one beat is 30 frames, one bar 120. */
export const BEAT = 30;
/** How long the opening lockup and tagline stay up before the iris opens (one bar). */
export const INTRO_HOLD = 120;
export const DURATION = 2880 + INTRO_HOLD;

/** Global frame where each part of the story starts. */
export const T = {
	intro: 0,
	head: 150 + INTRO_HOLD,
	add: 390 + INTRO_HOLD,
	assign: 930 + INTRO_HOLD,
	reports: 1260 + INTRO_HOLD,
	resp: 1680 + INTRO_HOLD,
	pers: 2040 + INTRO_HOLD,
	priv: 2340 + INTRO_HOLD,
	outro: 2610 + INTRO_HOLD,
	end: 2880 + INTRO_HOLD
} as const;

export const C = {
	teal: '#0d9488',
	tealDeep: '#0f766e',
	tealBright: '#2dd4bf',
	tealGlow: '#5eead4',
	ink: '#0b1211',
	paper: '#f3f6f5',
	night: '#050e0c',
	muted: '#5d6d69',
	mutedDark: '#8fa39e',
	line: 'rgba(11,18,17,0.08)'
};

export const FONT = 'Inter';

loadFont({
	family: FONT,
	url: staticFile('fonts/inter-latin-wght-normal.woff2'),
	weight: '100 900'
});

export const ACCENTS = [
	'blue',
	'indigo',
	'violet',
	'cyan',
	'teal',
	'emerald',
	'amber',
	'orange',
	'rose',
	'pink'
] as const;

/** Tailwind -600 shades, matching the app's light-mode swatches. */
export const ACCENT_HEX: Record<(typeof ACCENTS)[number], string> = {
	blue: '#2563eb',
	indigo: '#4f46e5',
	violet: '#7c3aed',
	cyan: '#0891b2',
	teal: '#0d9488',
	emerald: '#059669',
	amber: '#f59e0b',
	orange: '#f97316',
	rose: '#e11d48',
	pink: '#db2777'
};
