import { execFileSync } from 'node:child_process';
const D = new URL('../node_modules/@remotion/compositor-linux-x64-gnu/', import.meta.url).pathname;
const SR = 11025, hop = 64, fps = SR / hop;
for (const f of process.argv.slice(2)) {
	const buf = execFileSync(D + 'ffmpeg', ['-v', 'quiet', '-i', decodeURIComponent(new URL('../public/music/' + f, import.meta.url).pathname), '-ac', '1', '-ar', String(SR), '-c:a', 'pcm_s16le', '-f', 'wav', '-'], { env: { ...process.env, LD_LIBRARY_PATH: D }, maxBuffer: 1 << 30 });
	const pcm = new Int16Array(buf.buffer.slice(buf.byteOffset + 44, buf.byteOffset + buf.length - ((buf.length - 44) % 2)));
	const frames = Math.floor(pcm.length / hop), e = new Float32Array(frames), on = new Float32Array(frames);
	for (let i = 0; i < frames; i++) { let s = 0; for (let j = 0; j < hop; j++) s += (pcm[i * hop + j] / 32768) ** 2; e[i] = Math.log(1e-5 + Math.sqrt(s / hop)); }
	for (let i = 1; i < frames; i++) on[i] = Math.max(0, e[i] - e[i - 1]);
	let best = [0, 0, 0];
	for (let bpm = 112; bpm <= 128; bpm += 0.05) {
		const per = (60 / bpm) * fps;
		for (let ph = 0; ph < per; ph += 1) { let s = 0; for (let t = ph; t < frames; t += per) s += on[Math.round(t)] + 0.5 * (on[Math.round(t) + 1] ?? 0); if (s > best[0]) best = [s, bpm, ph / fps]; }
	}
	console.log(f.padEnd(22), 'bpm', best[1].toFixed(2), 'first beat at', best[2].toFixed(3), 's');
}
