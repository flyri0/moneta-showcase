import { spawn } from 'node:child_process';
/** Starts sirv on the worktree build and resolves once it answers. */
export async function serve(port = 4173) {
	const proc = spawn('npx', ['sirv', 'build', '--single', '--port', String(port)], {
		cwd: new URL('..', import.meta.url).pathname,
		stdio: 'ignore',
		detached: true
	});
	for (let i = 0; i < 100; i++) {
		try {
			await fetch(`http://localhost:${port}/`);
			return { url: `http://localhost:${port}`, stop: () => process.kill(-proc.pid, 'SIGTERM') };
		} catch {
			await new Promise((r) => setTimeout(r, 200));
		}
	}
	throw new Error('server did not start');
}
