import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
const dir = new URL('../public/music/', import.meta.url).pathname;
const ff = new URL('../node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg', import.meta.url).pathname;
const env = { ...process.env, LD_LIBRARY_PATH: new URL('../node_modules/@remotion/compositor-linux-x64-gnu/', import.meta.url).pathname };
const SR = 11025;
for (const f of readdirSync(dir).filter((f) => f.endsWith('.mp3'))) {
	const buf = execFileSync(ff, ['-v', 'quiet', '-i', dir + f, '-ac', '1', '-ar', String(SR), '-c:a', 'pcm_s16le', '-f', 'wav', '-'], { env, maxBuffer: 1 << 30 });
	const pcm = new Int16Array(buf.buffer.slice(buf.byteOffset + 44, buf.byteOffset + buf.length - ((buf.length - 44) % 2)));
	const x = Float32Array.from(pcm, (v) => v / 32768);
	const dur = x.length / SR;
	const hop = 256, frames = Math.floor(x.length / hop);
	const e = new Float32Array(frames);
	for (let i = 0; i < frames; i++) { let s = 0; for (let j = 0; j < hop; j++) s += x[i * hop + j] ** 2; e[i] = Math.sqrt(s / hop); }
	const on = new Float32Array(frames);
	for (let i = 1; i < frames; i++) on[i] = Math.max(0, Math.log(1e-4 + e[i]) - Math.log(1e-4 + e[i - 1]));
	const fps = SR / hop;
	let best = 0, bestBpm = 0;
	for (let bpm = 80; bpm <= 160; bpm += 0.5) {
		const lag = (60 / bpm) * fps; let s = 0;
		for (let i = 0; i + Math.ceil(lag * 2) < frames; i++) s += on[i] * (on[Math.round(i + lag)] + 0.5 * on[Math.round(i + 2 * lag)]);
		if (s > best) { best = s; bestBpm = bpm; }
	}
	// loudness profile per 5 s
	const prof = [];
	for (let t = 0; t < dur; t += 5) { let s = 0, n = 0; for (let i = Math.floor(t * SR); i < Math.min(x.length, (t + 5) * SR); i++) { s += x[i] ** 2; n++; } prof.push(Math.round(20 * Math.log10(Math.sqrt(s / n) + 1e-9))); }
	console.log(`${f.padEnd(26)} ${dur.toFixed(0).padStart(4)}s  ~${bestBpm} bpm  dB/5s: ${prof.slice(0, 16).join(' ')}`);
}
