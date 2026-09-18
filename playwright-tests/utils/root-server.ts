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

  // 必须显式 --bind 127.0.0.1：不带 --bind 时 http.server 启动前会先做 socket.getfqdn('') 反向 DNS，
  // 反向 DNS 超时的机器上要卡约 30s 才开始监听/打印横幅，导致就绪检测必然超时。
  proc = spawn('python3', ['-u', '-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: root });
  await new Promise<void>((resolve, reject) => {
    const startedAt = Date.now();
    let done = false;
    let output = '';
    let poll = true;
    const finish = () => {
      if (done) return;
      done = true;
      poll = false;
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      poll = false;
      reject(new Error(`root static server failed to start after ${Date.now() - startedAt}ms\n${output.slice(-500)}`));
    }, 15000);
    const onData = (data: Buffer) => {
      output += data.toString();
      if (output.includes('Serving HTTP')) finish();
    };
    proc!.stdout!.on('data', onData);
    proc!.stderr!.on('data', onData);
    proc!.on('error', reject);
    // 横幅之外再轮询真实可访问性，双保险
    void (async () => {
      while (poll) {
        if (await isHealthy()) { finish(); return; }
        await new Promise((r) => setTimeout(r, 250));
      }
    })();
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
