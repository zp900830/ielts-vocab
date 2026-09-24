/* M6 深色逐页截图（一次性工具）。输出 /tmp/m6-shots/<name>.png。 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BASE = 'http://127.0.0.1:8932';
const OUT = '/tmp/m6-shots';
fs.mkdirSync(OUT, { recursive: true });
let srv = null;
function spawnServer() {
  srv = spawn('python3', ['-m', 'http.server', '8932', '--bind', '127.0.0.1'], { cwd: ROOT });
  srv.stdout.on('data', () => {}); srv.stderr.on('data', () => {});
}
async function ensureServer() {
  for (let i = 0; i < 3; i++) {
    try { const r = await fetch(BASE + '/app/index.html'); if (r.ok) return; } catch (e) {}
    try { if (srv) srv.kill('SIGKILL'); } catch (e) {}
    await new Promise((r) => setTimeout(r, 300));
    spawnServer();
    for (let j = 0; j < 20; j++) { await new Promise((r) => setTimeout(r, 250)); try { const r = await fetch(BASE + '/app/index.html'); if (r.ok) return; } catch (e) {} }
  }
  throw new Error('server unavailable');
}
spawnServer();
await ensureServer();

async function ready(page) {
  await page.waitForFunction(() => {
    try { return typeof dataReady !== 'undefined' && dataReady && window.APP3 && document.getElementById('appView').children.length > 0; } catch (e) { return false; }
  }, undefined, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(500);
}

const browser = await chromium.launch();
async function shot(name, vp, setup, dark) {
  await ensureServer();
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/app/index.html#/home`);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => { try { TASK.resetV2(); TASK.initPlan(15); } catch (e) {} });
    await page.reload();
    await ready(page);
    if (setup) await setup(page);
    if (dark) { await page.evaluate(() => document.body.classList.add('dark')); await page.waitForTimeout(250); }
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });
    console.log('shot ok', name);
  } catch (e) {
    console.log('shot FAIL', name, (e && e.message) || e);
  } finally {
    await ctx.close();
  }
}

const desktop = { width: 1200, height: 900 };
const mobile = { width: 390, height: 844 };

for (const dark of [false, true]) {
  const t = dark ? 'dark' : 'light';
  await shot(`home-${t}`, desktop, async (p) => { await p.goto(`${BASE}/app/index.html#/home`); await ready(p); }, dark);
  await shot(`stats-${t}`, desktop, async (p) => { await p.goto(`${BASE}/app/index.html#/stats`); await ready(p); }, dark);
  await shot(`words-${t}`, desktop, async (p) => { await p.goto(`${BASE}/app/index.html#/words`); await ready(p); await p.locator('.wb-row').first().click(); await p.waitForTimeout(250); }, dark);
  await shot(`listen-${t}`, desktop, async (p) => { await p.goto(`${BASE}/app/index.html#/listen`); await ready(p); }, dark);
  await shot(`listen-expand-${t}`, desktop, async (p) => { await p.goto(`${BASE}/app/index.html#/listen`); await ready(p); await p.locator('.ls-cover').click(); await p.waitForTimeout(500); }, dark);
  await shot(`me-${t}`, desktop, async (p) => { await p.locator('#meCard').click(); await p.waitForTimeout(300); }, dark);
  await shot(`task-${t}`, desktop, async (p) => { await p.locator('.art-card .a-open').first().click(); await p.waitForTimeout(700); }, dark);
  await shot(`home-mobile-${t}`, mobile, async (p) => { await p.goto(`${BASE}/app/index.html#/home`); await ready(p); }, dark);
  await shot(`words-mobile-${t}`, mobile, async (p) => { await p.goto(`${BASE}/app/index.html#/words`); await ready(p); }, dark);
}
await browser.close();
srv.kill();
console.log('shots ->', fs.readdirSync(OUT).sort().join(', '));
