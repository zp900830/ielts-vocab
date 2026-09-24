/* M6 a11y 扫描（一次性工具，不进 E2E）：
   用 @axe-core/playwright 扫 /app/ 各路由与关键浮层（浅色 + 深色），输出违规清单。
   用法：node scripts/a11y-scan.mjs > /tmp/a11y.json
   自带 python3 http.server 8932（仓库根）。 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = 8932;
const BASE = `http://127.0.0.1:${PORT}`;

async function waitHealthy() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`${BASE}/app/index.html`);
      if (r.ok) return;
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('server not healthy');
}

async function appReady(page) {
  await page.waitForFunction(() => {
    try {
      return typeof dataReady !== 'undefined' && dataReady === true &&
        typeof window.APP3 !== 'undefined' && typeof window.APP3.route === 'function';
    } catch (e) { return false; }
  }, undefined, { timeout: 30000 });
  await page.waitForFunction(() => {
    const v = document.getElementById('appView');
    return !!(v && v.children.length > 0);
  }, undefined, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(400);
}

async function scan(page, label) {
  const res = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze();
  return res.violations.map((v) => ({
    label,
    id: v.id,
    impact: v.impact,
    help: v.help,
    count: v.nodes.length,
    nodes: v.nodes.slice(0, 6).map((n) => ({ target: n.target, summary: n.failureSummary })),
  }));
}

const out = [];
async function run(page, label, fn) {
  try {
    if (fn) await fn(page);
    out.push(...await scan(page, label));
  } catch (e) {
    out.push({ label, id: 'SCAN_ERROR', impact: 'error', help: String((e && e.message) || e), count: 1, nodes: [] });
  }
}

async function openPage(browser, vp) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  return { ctx, page };
}

const main = async () => {
  const proc = spawn('python3', ['-u', '-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT });
  proc.stdout.on('data', () => {});
  proc.stderr.on('data', () => {});
  await waitHealthy();
  const browser = await chromium.launch();

  const routes = ['home', 'stats', 'words', 'listen'];
  for (const route of routes) {
    const { ctx, page } = await openPage(browser, { width: 1200, height: 900 });
    await page.goto(`${BASE}/app/index.html#/${route}`);
    await page.evaluate(() => { try { TASK.initPlan(15); } catch (e) {} });
    await page.reload();
    await appReady(page);
    await run(page, `${route} light`, null);
    await page.evaluate(() => document.body.classList.add('dark'));
    await page.waitForTimeout(150);
    await run(page, `${route} dark`, null);
    await ctx.close();
  }

  for (const vp of [{ width: 1200, height: 900 }, { width: 390, height: 844 }]) {
    const { ctx, page } = await openPage(browser, vp);
    await page.goto(`${BASE}/app/index.html#/home`);
    await appReady(page);
    await run(page, `me-pop ${vp.width}`, async (p) => {
      await p.locator('#meCard').click();
      await p.waitForTimeout(250);
    });
    await ctx.close();
  }

  {
    const { ctx, page } = await openPage(browser, { width: 1200, height: 900 });
    await page.goto(`${BASE}/app/index.html#/home`);
    await page.evaluate(() => { try { TASK.initPlan(15); } catch (e) {} });
    await page.reload();
    await appReady(page);
    await run(page, 'task ① light', async (p) => {
      await p.locator('.art-card .a-open').first().click();
      await p.waitForTimeout(500);
    });
    await run(page, 'task ① dark', async (p) => {
      await p.evaluate(() => document.body.classList.add('dark'));
      await p.waitForTimeout(200);
    });
    await ctx.close();
  }

  {
    const { ctx, page } = await openPage(browser, { width: 1200, height: 900 });
    await page.goto(`${BASE}/app/index.html#/home`);
    await page.evaluate(() => { try { TASK.initPlan(15); } catch (e) {} });
    await page.reload();
    await appReady(page);
    await run(page, 'blank-pop', async (p) => {
      await p.locator('.art-card .a-open').first().click();
      await p.waitForTimeout(400);
      const ok = await p.evaluate(() => {
        try {
          if (TASK.seedArticleForTest) TASK.seedArticleForTest(0);
          if (TASK.openBlank) { TASK.openBlank(); return true; }
        } catch (e) { return String((e && e.message) || e); }
        return false;
      });
      if (ok !== true) throw new Error('openBlank unavailable: ' + ok);
      await p.waitForTimeout(300);
    });
    await ctx.close();
  }

  await browser.close();
  proc.kill();
  fs.writeFileSync('/tmp/a11y-raw.json', JSON.stringify(out, null, 2));
  const agg = {};
  for (const v of out) {
    const k = `${v.impact} | ${v.id} | ${v.help}`;
    agg[k] = agg[k] || { runs: 0, totalNodes: 0, labels: new Set(), sample: null };
    const a = agg[k];
    a.runs++; a.totalNodes += v.count; a.labels.add(v.label);
    if (!a.sample && v.nodes[0]) a.sample = v.nodes[0];
  }
  console.log(JSON.stringify({ total: out.length, agg: Object.fromEntries(Object.entries(agg).map(([k, v]) => [k, { runs: v.runs, totalNodes: v.totalNodes, labels: [...v.labels], sample: v.sample }])) }, null, 2));
};

main().catch((e) => { console.error(e); process.exit(1); });
