import { execFileSync } from 'node:child_process';
const D = new URL('../node_modules/@remotion/compositor-linux-x64-gnu/', import.meta.url).pathname;
const buf = execFileSync(D + 'ffmpeg', ['-v', 'quiet', '-i', process.argv[2], '-vn', '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', '-f', 'wav', '-'], { env: { ...process.env, LD_LIBRARY_PATH: D }, maxBuffer: 1 << 30 });
const start = buf.indexOf('data') + 8;
const x = new Int16Array(buf.buffer.slice(buf.byteOffset + start, buf.byteOffset + buf.length - ((buf.length - start) % 2)));
let peak = 0; for (const v of x) peak = Math.max(peak, Math.abs(v));
const db = (v) => (20 * Math.log10(v / 32768)).toFixed(1);
const secs = [];
for (let s = 0; s < x.length / 48000; s++) { let e = 0, p = 0; for (let i = s * 48000; i < Math.min(x.length, (s + 1) * 48000); i++) { e += x[i] ** 2; p = Math.max(p, Math.abs(x[i])); } secs.push(`${s}:${db(Math.sqrt(e / 48000))}/${db(p)}`); }
console.log('peak', db(peak), 'dBFS'); console.log(secs.join('  '));
