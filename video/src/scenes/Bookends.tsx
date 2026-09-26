import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import {
	CalendarClock,
	CloudUpload,
	Code2,
	Languages,
	ShieldCheck,
	WifiOff
} from 'lucide-react';
import { Backdrop } from '../components/Device';
import { Logo, Words } from '../components/Type';
import { inOut, out, prog } from '../lib/anim';
import { C, FONT } from '../lib/theme';

const Wordmark: React.FC<{ size: number; reveal: number; color?: string }> = ({ size, reveal, color = '#fff' }) => (
	<div style={{ overflow: 'hidden', paddingRight: 8 }}>
		<div
			style={{
				fontFamily: FONT,
				fontSize: size,
				fontWeight: 760,
				letterSpacing: '-0.05em',
				color,
				transform: `translateX(${(1 - reveal) * -105}%)`,
				lineHeight: 1.1
			}}
		>
			Moneta
		</div>
	</div>
);

/** 0–170: the mark draws itself, the name slides out of it, then an iris opens onto the app. */
export const Intro: React.FC = () => {
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();
	const portrait = height > width;
	const logo = portrait ? 150 : 170;
	const pop = prog(frame, 0, 22, out);
	const draw = prog(frame, 8, 62, inOut);
	const slide = prog(frame, 52, 88, out);
	const word = prog(frame, 60, 96, out);
	const iris = prog(frame, 128, 166, inOut);
	const exit = prog(frame, 118, 142, inOut);
	const r = iris * Math.hypot(width, height) * 0.62;
	const wordSize = portrait ? 118 : 150;
	const shift = slide * (portrait ? 230 : 290);
	return (
		<AbsoluteFill
			style={{
				maskImage: `radial-gradient(circle at 50% 50%, transparent ${r}px, black ${r + 1}px)`,
				WebkitMaskImage: `radial-gradient(circle at 50% 50%, transparent ${r}px, black ${r + 1}px)`
			}}
		>
			<Backdrop frame={frame} dark />
			<AbsoluteFill
				style={{
					alignItems: 'center',
					justifyContent: 'center',
					opacity: 1 - exit,
					transform: `scale(${1 + exit * 0.12})`,
					filter: `blur(${exit * 8}px)`
				}}
			>
				<div style={{ position: 'relative', width: 0, height: 0 }}>
					<div
						style={{
							position: 'absolute',
							left: -logo / 2 - shift,
							top: -logo / 2 - 30,
							transform: `scale(${0.6 + 0.4 * pop}) rotate(${(1 - pop) * -12}deg)`,
							filter: `drop-shadow(0 20px 50px rgba(45,212,191,${0.35 * draw}))`
						}}
					>
						<Logo size={logo} draw={draw} fill={pop} bg={C.teal} />
					</div>
					<div
						style={{
							position: 'absolute',
							left: -logo / 2 - shift + logo + 34,
							top: -wordSize * 0.55 - 30,
							opacity: word
						}}
					>
						<Wordmark size={wordSize} reveal={word} />
					</div>
					<div
						style={{
							position: 'absolute',
							left: -600,
							width: 1200,
							top: logo / 2 + 20,
							display: 'flex',
							justifyContent: 'center'
						}}
					>
						<Words
							text="Budgeting that never leaves your device."
							frame={frame}
							start={86}
							stagger={3}
							size={portrait ? 40 : 38}
							weight={480}
							tracking={-0.015}
							color={C.mutedDark}
							align="center"
							maxWidth={portrait ? 760 : 1200}
						/>
					</div>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

const TILES = [
	{ icon: ShieldCheck, title: 'No account, no server', body: 'Nothing is uploaded anywhere.' },
	{ icon: WifiOff, title: 'Works offline', body: 'Install it. Budget on a plane.' },
	{ icon: CloudUpload, title: 'Encrypted backups', body: 'To your own Google Drive.' },
	{ icon: CalendarClock, title: 'Scheduled transactions', body: 'Paychecks and bills, on time.' },
	{ icon: Languages, title: 'English & Português', body: 'Every screen, both languages.' },
	{ icon: Code2, title: 'Free & open source', body: 'MIT licensed. Yours to keep.' }
];

/** Dark panel rises over the app; privacy promise and the rest of the features. */
export const Privacy: React.FC = () => {
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();
	const portrait = height > width;
	const rise = prog(frame, 0, 24, inOut);
	const leave = prog(frame, 250, 270, inOut);
	const cols = portrait ? 2 : 3;
	const tileW = portrait ? 440 : 470;
	const tileH = portrait ? 250 : 200;
	return (
		<AbsoluteFill style={{ transform: `translateY(${(1 - rise) * 100}%)`, overflow: 'hidden', borderRadius: (1 - rise) * 80 }}>
			<Backdrop frame={frame + 400} dark />
			<AbsoluteFill
				style={{
					alignItems: 'center',
					justifyContent: 'center',
					flexDirection: 'column',
					gap: portrait ? 90 : 70,
					opacity: 1 - leave,
					transform: `translateY(${-leave * 40}px) scale(${1 - leave * 0.03})`
				}}
			>
				<Words
					text="Your money never leaves your device."
					frame={frame}
					start={14}
					stagger={4}
					size={portrait ? 84 : 84}
					color="#fff"
					align="center"
					accentWords={['never']}
					accent={C.tealBright}
					maxWidth={portrait ? 900 : 1500}
				/>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: `repeat(${cols}, ${tileW}px)`,
						gap: 24
					}}
				>
					{TILES.map((t, i) => {
						const q = prog(frame, 50 + i * 10, 84 + i * 10, out);
						const Icon = t.icon;
						return (
							<div
								key={t.title}
								style={{
									height: tileH,
									borderRadius: 26,
									padding: portrait ? 34 : 30,
									background: 'linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.025))',
									border: '1px solid rgba(255,255,255,0.1)',
									boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
									opacity: q,
									transform: `translateY(${(1 - q) * 50}px) scale(${0.92 + 0.08 * q})`,
									fontFamily: FONT,
									display: 'flex',
									flexDirection: 'column',
									justifyContent: 'space-between'
								}}
							>
								<div
									style={{
										width: 60,
										height: 60,
										borderRadius: 16,
										background: `linear-gradient(145deg, ${C.tealBright}, ${C.teal})`,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										boxShadow: '0 10px 30px rgba(45,212,191,0.3)'
									}}
								>
									<Icon size={32} color="#042f2e" strokeWidth={2.2} />
								</div>
								<div>
									<div style={{ color: '#fff', fontSize: portrait ? 36 : 32, fontWeight: 700, letterSpacing: '-0.03em' }}>
										{t.title}
									</div>
									<div style={{ color: C.mutedDark, fontSize: portrait ? 26 : 23, marginTop: 8, fontWeight: 450 }}>
										{t.body}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/** The lockup and where to try it. */
export const Outro: React.FC = () => {
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();
	const portrait = height > width;
	const pop = prog(frame, 6, 30, out);
	const draw = prog(frame, 8, 50, inOut);
	const word = prog(frame, 26, 56, out);
	const cta = prog(frame, 64, 94, out);
	const foot = prog(frame, 80, 110, out);
	const logo = portrait ? 150 : 150;
	const shimmer = ((frame - 100) / 60) * 140 - 20;
	return (
		<AbsoluteFill>
			<Backdrop frame={frame + 600} dark />
			<AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 46 }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 34, height: logo }}>
					<div
						style={{
							transform: `scale(${0.6 + 0.4 * pop})`,
							opacity: pop,
							filter: 'drop-shadow(0 20px 50px rgba(45,212,191,0.35))'
						}}
					>
						<Logo size={logo} draw={draw} bg={C.teal} />
					</div>
					<div style={{ opacity: word }}>
						<Wordmark size={portrait ? 118 : 140} reveal={word} />
					</div>
				</div>
				<Words
					text="Zero-based budgeting, right in your browser."
					frame={frame}
					start={40}
					stagger={3}
					size={portrait ? 40 : 40}
					weight={480}
					tracking={-0.015}
					color={C.mutedDark}
					align="center"
					maxWidth={portrait ? 800 : 1400}
				/>
				<div
					style={{
						marginTop: 14,
						opacity: cta,
						transform: `translateY(${(1 - cta) * 30}px) scale(${0.94 + 0.06 * cta})`,
						padding: '24px 40px',
						borderRadius: 999,
						background: `linear-gradient(135deg, ${C.tealBright}, ${C.teal})`,
						color: '#042f2e',
						fontFamily: FONT,
						fontSize: portrait ? 36 : 34,
						fontWeight: 700,
						letterSpacing: '-0.02em',
						boxShadow: '0 20px 60px -10px rgba(45,212,191,0.55)',
						position: 'relative',
						overflow: 'hidden',
						display: 'flex',
						gap: 18,
						alignItems: 'center'
					}}
				>
					<span>Try the demo</span>
					<span style={{ opacity: 0.55 }}>→</span>
					<span style={{ fontWeight: 600 }}>usemoneta.netlify.app</span>
					<div
						style={{
							position: 'absolute',
							top: 0,
							bottom: 0,
							left: `${shimmer}%`,
							width: '18%',
							background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.55), transparent)',
							transform: 'skewX(-20deg)'
						}}
					/>
				</div>
				<div
					style={{
						opacity: foot * 0.9,
						fontFamily: FONT,
						fontSize: 24,
						color: C.mutedDark,
						letterSpacing: '0.02em',
						fontWeight: 500
					}}
				>
					Free &amp; open source · No sign-up
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
