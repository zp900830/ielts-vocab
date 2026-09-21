// pretest guard: a stale `python3 -m http.server 8931` started from a foreign
// cwd serves the wrong directory, and playwright's `reuseExistingServer: true`
// would silently reuse it -> every test fails/hangs. Kill only a WRONG server;
// leave a healthy one (or no server) alone so webServer can start fresh.
//
// 「对不对」只能比对文件内容。原来这里查的是页面里有没有「影子跟读」四个字 ——
// 主检出和每个 worktree 的 index.html 都有这四个字，于是别的目录起的服务器
// 被判成健康并复用：一次跑完 16 条红，报的还是「blankQuiz is not a function」，
// 看着像代码坏了，其实是测到了另一棵树。
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 8931;
const PROBE = '/js/plan-engine.js';
const LOCAL = path.resolve(__dirname, '../../shadow/js/plan-engine.js');

async function main() {
  if (process.env.E2E_NO_SERVER) return;
  const mine = fs.readFileSync(LOCAL, 'utf8');
  let verdict = 'no usable server';
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}${PROBE}`);
    if (!res.ok) verdict = `HTTP ${res.status}`;
    else {
      const served = await res.text();
      if (served === mine) { console.log('[pretest] reusing healthy server on 8931'); return; }
      verdict = `serves a different tree (${served.length} bytes vs local ${mine.length})`;
    }
  } catch (e) {
    verdict = e && e.code ? String(e.code) : String(e);
  }
  console.log(`[pretest] ${verdict} — clearing stale processes (if any), webServer will start fresh`);
  try {
    execSync(`pkill -f "http.server ${PORT}"`);
  } catch {
    /* nothing to kill */
  }
  await new Promise((r) => setTimeout(r, 1000));
}

main();
