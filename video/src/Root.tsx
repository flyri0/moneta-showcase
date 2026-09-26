import React from 'react';
import { AbsoluteFill, Composition, Sequence, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { prog } from './lib/anim';
import { DURATION, FPS, INTRO_HOLD, T } from './lib/theme';
import { Intro, Outro, Privacy } from './scenes/Bookends';
import { Stage, STAGE_FROM } from './scenes/Stage';
import { Soundtrack, TRACKS, type TrackId } from './Soundtrack';

const schema = z.object({
	track: z.enum(Object.keys(TRACKS) as [TrackId, ...TrackId[]]),
	offset: z.number()
});

const OutroIn: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{ opacity: prog(f, 0, 22) }}>
			<Outro />
		</AbsoluteFill>
	);
};

const Showcase: React.FC<z.infer<typeof schema>> = ({ track, offset }) => (
	<AbsoluteFill style={{ background: '#050e0c' }}>
		<Sequence from={STAGE_FROM} durationInFrames={T.priv + 40 - STAGE_FROM}>
			<Stage />
		</Sequence>
		<Sequence from={0} durationInFrames={172 + INTRO_HOLD}>
			<Intro />
		</Sequence>
		<Sequence from={T.priv} durationInFrames={T.outro - T.priv + 24}>
			<Privacy />
		</Sequence>
		<Sequence from={T.outro - 4} durationInFrames={T.end - T.outro + 4}>
			<OutroIn />
		</Sequence>
		<Soundtrack track={track} offset={offset} />
	</AbsoluteFill>
);

export const Root: React.FC = () => (
	<>
		<Composition
			id="Showcase16x9"
			component={Showcase}
			schema={schema}
			defaultProps={{ track: 'advertime' as TrackId, offset: 0 }}
			durationInFrames={DURATION}
			fps={FPS}
			width={1920}
			height={1080}
		/>
		<Composition
			id="Showcase9x16"
			component={Showcase}
			schema={schema}
			defaultProps={{ track: 'advertime' as TrackId, offset: 0 }}
			durationInFrames={DURATION}
			fps={FPS}
			width={1080}
			height={1920}
		/>
	</>
);
