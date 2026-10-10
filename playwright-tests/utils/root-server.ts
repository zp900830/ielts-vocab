/* 8932 的静态服务器（服务仓库根）—— 全量跑测的整个周期里由 global-setup / global-teardown 起停。
   为什么必须在 globalSetup 而不是各 spec 的 beforeAll：见 global-setup.ts 顶部说明。
   2026-10-10：从 python3 -m http.server 换成自写的 scripts/serve.cjs（Node）。
   python 版在 4 workers 并发下会成片 RST（同端口压测 23/40 失败），把门禁拖成随机红；
   Node 版 40/40。识别「端口上跑的是不是我们」靠响应头 Server: vocab-test-server。 */
import { spawn, ChildProcess, execSync } from 'child_process';
import path from 'path';

let proc: ChildProcess | null = null;
let url = '';

const PORT = 8932;
const URL = `http://127.0.0.1:${PORT}`;
const SERVE = path.resolve(__dirname, '..', 'scripts', 'serve.cjs');

async function isHealthy(): Promise<boolean> {
  try {
    const res = await fetch(`${URL}/index.html`);
    const text = res.ok ? await res.text() : '';
    // 内容对 + 实现是我们的（旧 python 服务器并发下不可靠，发现就清掉重起）
    return res.ok && res.headers.get('server') === 'vocab-test-server' && text.includes('词汇真经单词速记');
  } catch {
    return false;
  }
}

/* 按端口清掉遗留进程 —— 不再只认 python 的 pkill 模式（服务器换了实现，按端口找最稳）。 */
function clearPort(): void {
  let out = '';
  try {
    out = execSync(`lsof -ti tcp:${PORT} -sTCP:LISTEN`).toString();
  } catch {
    return; // lsof 没找到占用者，无需清理
  }
  for (const line of out.split('\n')) {
    const pid = Number(line.trim());
    if (!pid) continue;
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      /* 进程可能已退出 */
    }
  }
}

export async function startRootServer(): Promise<string> {
  if (url) return url;
  if (await isHealthy()) {
    url = URL;
    return url;
  }

  const root = path.resolve(process.cwd(), '..');
  clearPort();
  await new Promise(r => setTimeout(r, 300));

  /* 用 process.execPath（当前 node）拉起 serve.cjs，root 默认取 spawn 的 cwd = 仓库根。
     历史坑：旧 python 版必须显式 --bind 127.0.0.1，否则启动前做反向 DNS 卡约 30s；
     serve.cjs 固定只监听 127.0.0.1，不存在这个问题。 */
  proc = spawn(process.execPath, [SERVE, String(PORT)], { cwd: root });
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
      if (output.includes('[serve] vocab-test-server')) finish();
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
