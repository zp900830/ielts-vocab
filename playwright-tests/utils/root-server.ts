import { spawn, ChildProcess, execSync } from 'child_process';
import path from 'path';

let proc: ChildProcess | null = null;
let url = '';

const PORT = 8932;
const URL = `http://127.0.0.1:${PORT}`;

async function isHealthy(): Promise<boolean> {
  try {
    const res = await fetch(`${URL}/index.html`);
    const text = res.ok ? await res.text() : '';
    return res.ok && text.includes('雅思词汇真经');
  } catch {
    return false;
  }
}

export async function startRootServer(): Promise<string> {
  if (url) return url;
  if (await isHealthy()) {
    url = URL;
    return url;
  }

  const root = path.resolve(process.cwd(), '..');
  // Best-effort clear stale server on the same port
  try { execSync(`pkill -f "http.server ${PORT}"`); } catch {}
  await new Promise(r => setTimeout(r, 300));

  proc = spawn('python3', ['-u', '-m', 'http.server', String(PORT)], { cwd: root });
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('root static server failed to start')), 8000);
    const onData = (data: Buffer) => {
      const s = data.toString();
      if (s.includes('Serving HTTP')) {
        clearTimeout(timer);
        resolve();
      }
    };
    proc!.stdout!.on('data', onData);
    proc!.stderr!.on('data', onData);
    proc!.on('error', reject);
  });

  // Wait until the server is actually responding
  let ready = false;
  for (let i = 0; i < 20; i++) {
    ready = await isHealthy();
    if (ready) break;
    await new Promise(r => setTimeout(r, 200));
  }
  if (!ready) throw new Error('root static server did not become healthy');

  url = URL;
  return url;
}

export async function stopRootServer(): Promise<void> {
  if (proc) {
    proc.kill();
    proc = null;
    url = '';
  }
}
