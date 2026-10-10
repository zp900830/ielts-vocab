// pretest guard: 8931 上如果趴着「不是我们的」静态服务器，playwright 的
// `reuseExistingServer: true` 会把它当成现成的直接复用 —— 服务器不可靠（旧 python 版
// 并发下成片 RST）或者服务的是另一棵树，全量就会出现莫名其妙的红。
//
// 判「是不是我们的」两条都要过：
//   ① 内容：/js/plan-engine.js 与本地文件逐字节比对；
//   ② 实现：响应头 Server: vocab-test-server（scripts/serve.cjs 的标记）。
// 都过 → 留着复用；否则按端口清掉，让 webServer 用 scripts/serve.cjs 起新的。
//
// 为什么只能比对文件内容（历史坑）：原来查的是页面里有没有「影子跟读」四个字 ——
// 主检出和每个 worktree 的 index.html 都有这四个字，于是别的目录起的服务器
// 被判成健康并复用：一次跑完 16 条红，报的还是「blankQuiz is not a function」，
// 看着像代码坏了，其实是测到了另一棵树。
//
// 2026-10-10：服务器从 python3 -m http.server 换成 Node 版（见 scripts/serve.cjs 头部），
// 清残留也从 pkill 模式改为按端口清理。
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 8931;
const PROBE = '/js/plan-engine.js';
const LOCAL = path.resolve(__dirname, '../../js/plan-engine.js');

function clearPort() {
  let out = '';
  try {
    out = execSync(`lsof -ti tcp:${PORT} -sTCP:LISTEN`).toString();
  } catch {
    return; // 没有占用者
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

async function main() {
  if (process.env.E2E_NO_SERVER) return;
  const mine = fs.readFileSync(LOCAL, 'utf8');
  let verdict = 'no usable server';
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}${PROBE}`);
    if (!res.ok) verdict = `HTTP ${res.status}`;
    else {
      const served = await res.text();
      const impl = res.headers.get('server') || '(无 Server 头)';
      if (served === mine && impl === 'vocab-test-server') {
        console.log('[pretest] reusing healthy server on 8931');
        return;
      }
      verdict = served !== mine
        ? `serves a different tree (${served.length} bytes vs local ${mine.length})`
        : `foreign server impl (Server: ${impl})`;
    }
  } catch (e) {
    verdict = e && e.code ? String(e.code) : String(e);
  }
  console.log(`[pretest] ${verdict} — clearing stale processes (if any), webServer will start fresh`);
  clearPort();
  await new Promise((r) => setTimeout(r, 1000));
}

main();
