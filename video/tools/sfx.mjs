// Synthesizes the UI sounds that aren't from @remotion/sfx: key ticks, pops, a chime, a blip.
import { writeFileSync } from 'node:fs';
const SR = 48000;
function wav(name, samples) {
	const n = samples.length, buf = Buffer.alloc(44 + n * 2);
	buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
	buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24);
	buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
	let peak = 0; for (const s of samples) peak = Math.max(peak, Math.abs(s));
	const g = 0.7 / (peak || 1);
	samples.forEach((s, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s * g)) * 32767), 44 + i * 2));
	writeFileSync(new URL(`../public/audio/${name}.wav`, import.meta.url), buf);
}
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
// key: short bright click with a soft thock underneath
{
	const n = Math.round(SR * 0.06), out = new Float32Array(n); let lp = 0;
	for (let i = 0; i < n; i++) { const t = i / SR; const nz = rnd(); lp += 0.35 * (nz - lp); const hp = nz - lp;
		out[i] = hp * Math.exp(-t * 180) * 0.8 + Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 60) * 0.5; }
	wav('key', out);
}
// pop: quick downward sine sweep
{
	const n = Math.round(SR * 0.16), out = new Float32Array(n); let ph = 0;
	for (let i = 0; i < n; i++) { const t = i / SR; const f = 300 + 700 * Math.exp(-t * 40); ph += 2 * Math.PI * f / SR;
		out[i] = Math.sin(ph) * Math.min(1, t * 800) * Math.exp(-t * 28); }
	wav('pop', out);
}
// chime: two bell-like notes (E6, B6)
{
	const n = Math.round(SR * 1.3), out = new Float32Array(n);
	const note = (f, start) => { for (let i = Math.round(start * SR); i < n; i++) { const t = i / SR - start;
		const env = Math.min(1, t * 400) * Math.exp(-t * 4.5);
		out[i] += env * (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * f * 2.01 * t) * Math.exp(-t * 6) + 0.12 * Math.sin(2 * Math.PI * f * 3.02 * t) * Math.exp(-t * 10)); } };
	note(1318.5, 0); note(1975.5, 0.085);
	wav('chime', out);
}
// blip: short soft sine for the accent cycle
{
	const n = Math.round(SR * 0.09), out = new Float32Array(n);
	for (let i = 0; i < n; i++) { const t = i / SR; out[i] = Math.sin(2 * Math.PI * 880 * t) * Math.min(1, t * 1000) * Math.exp(-t * 45); }
	wav('blip', out);
}
// riser: filtered noise swelling into a transition
{
	const n = Math.round(SR * 1.0), out = new Float32Array(n); let lp = 0;
	for (let i = 0; i < n; i++) { const t = i / SR; const k = 0.02 + 0.5 * (t / 1.0) ** 2; lp += k * (rnd() - lp);
		out[i] = lp * (t / 1.0) ** 2.2 * (t < 0.97 ? 1 : (1 - t) / 0.03); }
	wav('riser', out);
}
console.log('ok');
