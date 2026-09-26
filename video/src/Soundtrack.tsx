import React from 'react';
import { Audio, interpolate, Sequence, staticFile, useVideoConfig } from 'remotion';
import { kf } from './lib/anim';
import { T } from './lib/theme';
import { CYCLE, DESKTOP, PHONE, PS, RS } from './scenes/scripts';

/**
 * Music tracks (all 120 bpm, CC0 from FreePD by Kevin MacLeod) and where to start them: on a bar
 * line, two seconds before a section lifts when the track has one, so it lifts as the app appears.
 */
export const TRACKS = {
	advertime: { file: 'Advertime.mp3', start: 30.203 },
	finalStep: { file: 'Final Step.mp3', start: 6.197 },
	inspiration: { file: 'Inspiration.mp3', start: 0.331 },
	motions: { file: 'Motions.mp3', start: 14.238 },
	favorite: { file: 'Favorite.mp3', start: 24.145 },
	beatOne: { file: 'Beat One.mp3', start: 14.163 }
} as const;
export type TrackId = keyof typeof TRACKS;

/** Mix levels: keep the music's peaks and stacked effects under -1 dBFS. */
const MUSIC_GAIN = 0.85;
const SFX_GAIN = 0.8;

const Sfx: React.FC<{ at: number; src: string; volume?: number; rate?: number }> = ({ at, src, volume = 0.5, rate = 1 }) => (
	<Sequence from={Math.max(0, Math.round(at))} durationInFrames={150} layout="none">
		<Audio src={staticFile(`audio/${src}.wav`)} volume={volume * SFX_GAIN} playbackRate={rate} />
	</Sequence>
);

export const Soundtrack: React.FC<{ track: TrackId; offset?: number }> = ({ track, offset = 0 }) => {
	const { width, height, fps, durationInFrames } = useVideoConfig();
	const portrait = height > width;
	const s = portrait ? PHONE : DESKTOP;
	const t = TRACKS[track];
	const D = T.resp;
	const E = T.pers;

	// Tier changes during the resize (desktop ↔ tablet ↔ phone).
	const tiers: number[] = [];
	let last = '';
	for (let g = D; g < D + 300; g++) {
		const cw = portrait
			? kf(g, [[D + RS.portrait.grow[0], 390], [D + RS.portrait.grow[1], 1440]])
			: kf(g, [[D + RS.landscape.shrink[0], 1440], [D + RS.landscape.shrink[1], 390]]);
		const tier = cw >= 1024 ? 'd' : cw >= 768 ? 't' : 'p';
		if (last && tier !== last) tiers.push(g);
		last = tier;
	}

	return (
		<>
			<Audio
				src={staticFile(`music/${t.file}`)}
				trimBefore={Math.round((t.start + offset) * fps)}
				volume={(f) =>
					interpolate(f, [0, 8, durationInFrames - 100, durationInFrames - 4], [0, MUSIC_GAIN, MUSIC_GAIN, 0], {
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp'
					})
				}
			/>
			{/* intro */}
			<Sfx at={4} src="pop" volume={0.2} />
			<Sfx at={50} src="whoosh" volume={0.45} />
			<Sfx at={108} src="riser" volume={0.3} />
			<Sfx at={140} src="whip" volume={0.4} />
			<Sfx at={298} src="whoosh" volume={0.5} />
			{/* the app */}
			{s.clicks.map((f) => (
				<Sfx key={`c${f}`} at={f - 1} src="mouse-click" volume={0.55} />
			))}
			{s.taps.map(([f]) => (
				<Sfx key={`t${f}`} at={f - 1} src="mouse-click" volume={0.45} rate={1.15} />
			))}
			{s.keys.map((f, i) => (
				<Sfx key={`k${f}`} at={f} src="key" volume={0.22} rate={0.95 + (i % 3) * 0.06} />
			))}
			<Sfx at={s.chip.f} src="whoosh" volume={0.3} />
			<Sfx at={s.chip.f + 34} src="pop" volume={0.4} />
			<Sfx at={s.rtaGlow[0].f} src="chime" volume={0.3} />
			<Sfx at={s.rtaGlow[1].f} src="chime" volume={0.35} rate={1.12} />
			<Sfx at={T.reports + (portrait ? 46 : 54)} src="whoosh" volume={0.4} />
			<Sfx at={s.chart.f} src="switch" volume={0.3} />
			{/* resize */}
			<Sfx at={D} src="whip" volume={0.35} />
			{tiers.map((f) => (
				<Sfx key={`r${f}`} at={f} src="blip" volume={0.35} rate={1.2} />
			))}
			<Sfx at={D + (portrait ? RS.portrait.morph[0] : RS.landscape.morph[0])} src="whoosh" volume={0.45} />
			{/* accents and dark mode */}
			{CYCLE.map((_, i) => (
				<Sfx key={`a${i}`} at={E + PS.cycleStart + i * PS.step} src="blip" volume={0.28} rate={1 + i * 0.06} />
			))}
			<Sfx at={E + PS.toggle} src="switch" volume={0.45} />
			<Sfx at={E + PS.wipe} src="whoosh" volume={0.35} />
			{/* privacy and outro */}
			<Sfx at={T.priv - 2} src="whoosh" volume={0.5} />
			{Array.from({ length: 6 }, (_, i) => (
				<Sfx key={`p${i}`} at={T.priv + 50 + i * 10} src="pop" volume={0.18} rate={1 + i * 0.05} />
			))}
			<Sfx at={T.outro - 4} src="whip" volume={0.35} />
			<Sfx at={T.outro + 64} src="chime" volume={0.35} />
		</>
	);
};
