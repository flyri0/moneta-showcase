import { execFileSync } from 'node:child_process';
const D = new URL('../node_modules/@remotion/compositor-linux-x64-gnu/', import.meta.url).pathname;
const [file, beat] = [process.argv[2], Number(process.argv[3])];
const buf = execFileSync(D + 'ffmpeg', ['-v', 'quiet', '-i', file, '-ac', '1', '-ar', '22050', '-c:a', 'pcm_s16le', '-f', 'wav', '-'], { env: { ...process.env, LD_LIBRARY_PATH: D }, maxBuffer: 1 << 30 });
const x = new Int16Array(buf.buffer.slice(buf.byteOffset + 44, buf.byteOffset + buf.length - ((buf.length - 44) % 2)));
const SR = 22050, bar = 2;
const out = [];
for (let t = beat, k = 0; t + bar < x.length / SR; t += bar, k++) { let e = 0; const a = Math.round(t * SR), b = Math.round((t + bar) * SR); for (let i = a; i < b; i++) e += (x[i] / 32768) ** 2; out.push(`${k}@${t.toFixed(1)}:${(10 * Math.log10(e / (b - a))).toFixed(0)}`); }
console.log(out.join(' '));
