import React from 'react';
import { C, FONT } from '../lib/theme';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * A device that morphs between a browser window (m = 0) and a phone (m = 1). Children are the
 * screen's content in CSS px, `contentW` × `contentH`.
 */
export const Device: React.FC<{
	contentW: number;
	contentH: number;
	m: number;
	scale: number;
	cx: number;
	cy: number;
	rotateX?: number;
	rotateY?: number;
	dark?: boolean;
	shadow?: number;
	children: React.ReactNode;
}> = ({ contentW, contentH, m, scale, cx, cy, rotateX = 0, rotateY = 0, dark = false, shadow = 1, children }) => {
	const bezel = 12 * m;
	const chromeH = 46 * (1 - m);
	const statusH = 48 * m;
	const W = contentW + bezel * 2;
	const H = contentH + chromeH + statusH + bezel * 2;
	const rOuter = lerp(14, 60, m);
	const rInner = lerp(12, 48, m);
	const chromeBg = dark ? '#1c1f1e' : '#eef1f0';
	const screenBg = dark ? '#0a0a0a' : '#ffffff';
	return (
		<div
			style={{
				position: 'absolute',
				left: cx,
				top: cy,
				width: W,
				height: H,
				marginLeft: -W / 2,
				marginTop: -H / 2,
				transform: `perspective(2600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
				transformOrigin: '50% 50%',
				borderRadius: rOuter,
				background: m > 0 ? `linear-gradient(145deg, #2b2f2e, #0c0d0d 40%, #1e2120)` : chromeBg,
				boxShadow: `0 ${60 * shadow}px ${120 * shadow}px -30px rgba(4,40,35,${0.45 * shadow}), 0 ${30 * shadow}px ${60 * shadow}px -30px rgba(0,0,0,${0.5 * shadow}), 0 0 0 1px rgba(0,0,0,${0.1 + 0.4 * m})`
			}}
		>
			<div
				style={{
					position: 'absolute',
					left: bezel,
					top: bezel,
					right: bezel,
					bottom: bezel,
					borderRadius: rInner,
					overflow: 'hidden',
					background: screenBg
				}}
			>
				{/* browser chrome */}
				{chromeH > 0.5 && (
					<div
						style={{
							position: 'absolute',
							left: 0,
							right: 0,
							top: 0,
							height: chromeH,
							background: chromeBg,
							borderBottom: `1px solid ${dark ? '#2a2e2d' : '#dfe4e2'}`,
							opacity: 1 - m,
							display: 'flex',
							alignItems: 'center',
							overflow: 'hidden'
						}}
					>
						<div style={{ display: 'flex', gap: 8, marginLeft: 18 }}>
							{['#ff5f57', '#febc2e', '#28c840'].map((c) => (
								<div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
							))}
						</div>
						<div
							style={{
								position: 'absolute',
								left: '50%',
								transform: 'translateX(-50%)',
								height: 28,
								width: Math.min(420, Math.max(120, contentW - 200)),
								borderRadius: 8,
								background: dark ? '#2a2e2d' : '#ffffff',
								boxShadow: '0 0 0 1px rgba(0,0,0,0.06)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 6,
								fontFamily: FONT,
								fontSize: 13,
								color: dark ? '#b8c4c1' : '#51605c',
								whiteSpace: 'nowrap',
								overflow: 'hidden'
							}}
						>
							<svg width="11" height="12" viewBox="0 0 11 12">
								<rect x="1" y="5" width="9" height="6.5" rx="1.5" fill="currentColor" />
								<path d="M3 5V3.5a2.5 2.5 0 015 0V5" stroke="currentColor" strokeWidth="1.4" fill="none" />
							</svg>
							{contentW > 520 ? 'usemoneta.netlify.app' : 'moneta'}
						</div>
					</div>
				)}
				{/* phone status bar */}
				{statusH > 0.5 && (
					<div
						style={{
							position: 'absolute',
							left: 0,
							right: 0,
							top: 0,
							height: statusH,
							background: screenBg,
							opacity: m,
							fontFamily: FONT,
							color: dark ? '#fff' : '#000',
							fontWeight: 600,
							fontSize: 16
						}}
					>
						<div style={{ position: 'absolute', left: 34, top: 15 }}>9:41</div>
						<div
							style={{
								position: 'absolute',
								left: '50%',
								top: 11,
								width: 112,
								height: 32,
								marginLeft: -56,
								borderRadius: 18,
								background: '#000'
							}}
						/>
						<div style={{ position: 'absolute', right: 30, top: 17, display: 'flex', gap: 6, alignItems: 'center' }}>
							<svg width="18" height="12" viewBox="0 0 18 12">
								{[0, 1, 2, 3].map((i) => (
									<rect key={i} x={i * 4.6} y={9 - i * 3} width="3.2" height={3 + i * 3} rx="1" fill="currentColor" />
								))}
							</svg>
							<svg width="16" height="12" viewBox="0 0 16 12">
								<path d="M8 11.5l2.2-2.6a3.2 3.2 0 00-4.4 0zM3.6 6.6a6.4 6.4 0 018.8 0l1.5-1.8a8.8 8.8 0 00-11.8 0zM.2 3a11.6 11.6 0 0115.6 0" fill="currentColor" stroke="currentColor" strokeWidth="0.6" />
							</svg>
							<div style={{ width: 26, height: 13, borderRadius: 4, border: '1.5px solid currentColor', padding: 1.5, opacity: 0.9 }}>
								<div style={{ width: '80%', height: '100%', borderRadius: 2, background: 'currentColor' }} />
							</div>
						</div>
					</div>
				)}
				<div
					style={{
						position: 'absolute',
						left: 0,
						top: chromeH + statusH,
						width: contentW,
						height: contentH,
						overflow: 'hidden',
						background: screenBg
					}}
				>
					{children}
				</div>
			</div>
		</div>
	);
};

/** Neutral backdrop with a slow teal glow. */
export const Backdrop: React.FC<{ frame: number; dark?: boolean }> = ({ frame, dark = false }) => {
	const t = frame / 60;
	const gx = 30 + Math.sin(t * 0.5) * 12;
	const gy = 30 + Math.cos(t * 0.4) * 10;
	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				background: dark
					? `radial-gradient(60% 60% at ${gx}% ${gy}%, rgba(20,184,166,0.28), transparent 70%), radial-gradient(50% 50% at ${100 - gx}% ${100 - gy}%, rgba(13,148,136,0.18), transparent 70%), ${C.night}`
					: `radial-gradient(55% 55% at ${gx}% ${gy}%, rgba(45,212,191,0.22), transparent 70%), radial-gradient(45% 50% at ${100 - gx}% ${95 - gy}%, rgba(13,148,136,0.14), transparent 70%), ${C.paper}`
			}}
		>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					backgroundImage: `radial-gradient(${dark ? 'rgba(255,255,255,0.06)' : 'rgba(11,18,17,0.07)'} 1.2px, transparent 1.2px)`,
					backgroundSize: '28px 28px',
					maskImage: 'radial-gradient(70% 70% at 50% 50%, black, transparent)'
				}}
			/>
		</div>
	);
};
