/* 并发压测探针（4 并发 × 10 轮页面加载）—— 专门用来测「测试服务器在门禁并发下扛不扛得住」。
   来历：python3 -m http.server 曾把全量门禁拖成随机红 —— 并发下成片 RST 掉 plan-engine.js，
   TASK.init() 在 index.html 的 try/catch 里被静默吞掉，表现为 waitAppReady 挂满 120s。
   同一支探针、同一端口，只换服务器实现即可做 A/B：
     python 版 23/40 失败（2026-10-10 实测）
     Node 版（scripts/serve.cjs）40/40（同日实测）
   用法：先起服务器（如 `node scripts/serve.cjs 8951 ..`），再跑本探针：
     node scripts/stress-probe.cjs              # 默认 8951
     PROBE_PORT=9000 node scripts/stress-probe.cjs
   输出：每次加载 ✓/✘ 与耗时；失败时附「挂起请求」与「页面事件」便于定性。 */
const { chromium } = require('@playwright/test');
const PORT = Number(process.env.PROBE_PORT || 8951);
const URL_BASE = `http://127.0.0.1:${PORT}/index.html#/home`;
const stubs = {
  'sections.json': JSON.stringify([{ title: 'A', zh: 'A', subheads: [''], paragraphs: [Array.from({length: 12}, (_, i) => `Sentence ${i} about [[w${i}:w${i}]].`)], sentZh: [Array.from({length: 12}, (_, i) => `第 ${i} 句。`)], paraZh: [''] }]),
  'vocab.json': JSON.stringify(Object.fromEntries(Array.from({length: 12}, (_, i) => [`w${i}`, { m: 'n. 词 ' + i }]))),
  'chapters.json': '[]',
};
async function one(b, k) {
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  const errs = [], pending = new Map();
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  p.on('request', (r) => pending.set(r.url(), r));
  p.on('requestfinished', (r) => pending.delete(r.url()));
  p.on('requestfailed', (r) => { pending.delete(r.url()); errs.push('FAILED ' + r.url().slice(-60) + ' :: ' + (r.failure() || {}).errorText); });
  for (const [name, body] of Object.entries(stubs)) {
    await p.route(`**/data/${name}*`, (r) => r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
  const t0 = Date.now();
  await p.goto(URL_BASE);
  let ok = true;
  try {
    await p.waitForFunction(() => typeof SECTIONS !== 'undefined' && SECTIONS.length > 0
      && typeof TASK !== 'undefined' && !!(TASK.state() && TASK.state().daily), null, { timeout: 20000 });
  } catch (e) { ok = false; }
  const dt = Date.now() - t0;
  if (!ok) {
    const d = await p.evaluate(() => {
      let st = null; try { st = TASK.state(); } catch (e) { st = 'throw:' + e.message; }
      return {
        sections: (typeof SECTIONS !== 'undefined' && SECTIONS.length) || 0,
        dataReady: typeof dataReady !== 'undefined' ? dataReady : 'n/a',
        task: typeof TASK, app3: typeof window.APP3,
        stateKeys: st && typeof st === 'object' ? Object.keys(st).slice(0, 8) : String(st),
      };
    }).catch((e) => ({ evalErr: String(e).slice(0, 120) }));
    console.log(`#${k} ✘ ${dt}ms`, JSON.stringify(d));
    console.log('   挂起请求:', Array.from(pending.keys()).map((u) => u.slice(-70)).join(' | ') || '(无)');
    console.log('   事件:', errs.slice(0, 5).join(' | ') || '(无)');
  } else console.log(`#${k} ✓ ${dt}ms`);
  await ctx.close();
  return ok;
}
(async () => {
  const b = await chromium.launch();
  let bad = 0;
  for (let round = 0; round < 10; round++) {
    const res = await Promise.all([0, 1, 2, 3].map((j) => one(b, `${round * 4 + j}`)));
    bad += res.filter((x) => !x).length;
  }
  console.log(`\n=== 共 40 次加载，失败 ${bad} 次 ===`);
  await b.close();
})();
