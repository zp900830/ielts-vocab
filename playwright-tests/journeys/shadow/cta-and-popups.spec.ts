// Hand-written alongside tests/e2e/shadow/cta-and-popups.md
// 2026-09-24（第三轮）用户要求主按钮退回「深墨字」之前那一版 —— 轻薄荷渐变 #2bd4a4→#0fae7e + 白字。
// 实测白字压最亮端只有 1.90:1，⚠️ 已知低于 WCAG AA，用户看过数字后仍选这支品牌色，知情接受。
// 因此本门禁**不再按对比度判达标**（量了就必然红，那是假达标），改成**锁定色值的回归锁**：
//   ① 源码级：三站主按钮的 --grad / --iel-grad 必须精确等于锁定值，--cta-ink 必须是 #fff；
//   ② 实页级：屏幕上渐变绿底的控件，每一档绿必须是锁定值；#tbNext 另加白字锚。
// 两道都只防"有人手滑改浅/改深/改字色"，不再假装 1.90 达标。源码那道配夹具自检
// （fixtures/cta-gate-selfcheck.css，喂一个漂移值进去，锁必须响）。
//
// 范围口径：非主按钮（--cta-ink-dark 压 --accent/--task-new 的选中胶囊等）是另一族，不在本锁里；
// 它们仍按 AA 由 app3/palette.spec.ts 的实底胶囊用例管。
import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';
import fs from 'fs';
import path from 'path';

declare const TASK: {
  resetV2(): void; initPlan(n: number): void; enterTaskMode(): void; exitTaskMode(): void;
  todayPlan(force?: boolean): { queue: { i: number }[] };
  readDone(i: number): void;
  cloudPush(): Promise<{ sent?: number; error?: string; offline?: boolean }>;
};
declare function addMark(): void;
declare const window: { __supaReject?: boolean };

/* ---------------- 源码级：把三站主按钮的渐变色值锁死 ---------------- */

/* 锁定的品牌渐变（用户 2026-09-24 亲自选定；白字实测 1.90/2.85:1，已知低于 AA，用户知情接受）。
   只防手滑改浅/改深/改字色 —— 不再量对比度。 */
const LOCKED_GRAD = 'linear-gradient(135deg,#2bd4a4,#0fae7e)';   // #2bd4a4 → #0fae7e
const LOCKED_INK = ['#fff', '#ffffff', 'rgb(255,255,255)'];
const normGrad = (s: string) => s.toLowerCase().replace(/\s+/g, '');

const scanGradLock = (file: string) => {
  const html = fs.readFileSync(file, 'utf-8');
  // HTML 只扫 <style> 里那些；.css 文件（自检夹具）本身就是样式表，整份扫
  const blocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
  // 注释里也写着 #2bd4a4 这类色值，不摘干净会把注释当成声明
  const css = (blocks.length ? blocks.join('\n') : html).replace(/\/\*[\s\S]*?\*\//g, '');
  // 一个 token 可能声明多次（浅色 + body.dark）：全留下来逐个锁，别只锁第一档
  const vars: Record<string, string[]> = {};
  [...css.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)].forEach((m) => {
    (vars[m[1]] ||= []).push(m[2].trim());
  });
  const first = (k: string) => vars[k]?.[0] ?? '';
  const resolve = (s: string, depth = 0): string => {
    if (depth > 4) return s;
    return s.replace(/var\((--[\w-]+)(?:\s*,\s*([^()]*))?\)/g, (_all, name, fallback) => {
      return resolve(first(name) ?? fallback ?? '', depth + 1);
    });
  };
  const gradKeys = ['--grad', '--iel-grad'].filter((k) => k in vars);
  if (!gradKeys.length) return [];   // 该站没有薄荷主按钮渐变（admin 是蓝 --accent），不在本锁内
  const hits: string[] = [];
  for (const k of gradKeys) {
    for (const v of vars[k]) {
      if (normGrad(resolve(v)) !== normGrad(LOCKED_GRAD)) hits.push(`${k} 漂移（应锁定为 ${LOCKED_GRAD}，实为 ${v}）`);
    }
  }
  const inkKeys = ['--cta-ink', '--iel-cta-ink'].filter((k) => k in vars);
  for (const k of inkKeys) {
    for (const v of vars[k]) {
      const r = resolve(v).toLowerCase().replace(/\s+/g, '');
      if (!LOCKED_INK.includes(r)) hits.push(`${k} 漂移（应锁定为 #fff，实为 ${r}）`);
    }
  }
  return hits;
};

/* ---------------- 实页级：屏幕上渐变绿底的控件，色值必须锁定 ---------------- */

/* 只认「linear-gradient 底 + 含绿色档」的控件（= 主按钮那一族），断言每一档绿都落在锁定的
   #2bd4a4→#0fae7e 里。不再算对比度 —— 品牌色白字 1.90:1 已知低于 AA，用户知情接受。 */
const sweepLive = (page: import('@playwright/test').Page) => page.evaluate(() => {
  const parse = (s: string) => { const m = /rgba?\(([^)]+)\)/.exec(s || ''); if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(parseFloat);
    return p.length >= 3 ? [p[0], p[1], p[2], p.length > 3 ? p[3] : 1] : null; };
  const isGreen = (c: number[]) => c[1] > 110 && c[1] - c[0] > 25 && c[1] - c[2] > 25;
  const LOCKED = [[43, 212, 164], [15, 174, 126]];   // #2bd4a4 / #0fae7e（用户锁定的品牌色）
  const isLocked = (c: number[]) => LOCKED.some((l) =>
    Math.abs(c[0] - l[0]) <= 2 && Math.abs(c[1] - l[1]) <= 2 && Math.abs(c[2] - l[2]) <= 2);
  const bad: { sel: string; stops: string[] }[] = [];
  let seen = 0;
  document.querySelectorAll('*').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    // 渐变裁字的标题（-webkit-text-fill-color:transparent）不是按钮底，别误伤
    if (cs.webkitTextFillColor && /transparent|rgba?\([^)]*,\s*0(\.0+)?\s*\)/.test(cs.webkitTextFillColor)) return;
    if (!/gradient/i.test(cs.backgroundImage || '')) return;   // 只锁渐变底；实底 --accent 是另一族
    const stops: number[][] = []; const re = /rgba?\([^)]+\)/g; let m: RegExpExecArray | null;
    while ((m = re.exec(cs.backgroundImage))) { const c = parse(m[0]); if (c) stops.push(c); }
    const greens = stops.filter(isGreen); if (!greens.length) return;
    const txt = (el.textContent || '').trim();
    const isIcon = !txt && !!el.querySelector('i[class*="ri-"]');
    if (!txt && !isIcon) return;
    seen++;
    const rogue = greens.filter((g) => !isLocked(g));
    if (rogue.length) bad.push({ sel: el.id ? '#' + el.id : el.tagName.toLowerCase(),
      stops: greens.map((c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`) });
  });
  return { seen, bad };
});

const POPUPS = [
  { name: '循环次数', trigger: '#btnLoop', menu: '#loopWrap .loop-menu' },
  { name: '倍速', trigger: '#rateCycle', menu: '#rateWrap .rate-menu' },
  { name: 'A-B 选段', trigger: '#btnAB', menu: '#abWrap .ab-menu' },
  { name: '书签', trigger: '#markBtn', menu: '#markWrap .ab-menu' },
];

async function measurePopup(page: import('@playwright/test').Page, p: { name: string; trigger: string; menu: string }) {
  await page.locator(p.trigger).click();
  // 展开是 .18s 过渡，点完立刻量会把"正在淡入"读成"没开"
  await expect(page.locator(p.menu)).toBeVisible();
  await page.waitForTimeout(260);
  const geo = await page.evaluate((sel) => {
    const menu = document.querySelector(sel) as HTMLElement;
    const vw = document.documentElement.clientWidth;
    const r = menu.getBoundingClientRect();
    const items = [...menu.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().height > 0);
    const edge = items[items.length - 1] as HTMLElement | undefined;
    return { left: +r.left.toFixed(1), right: +r.right.toFixed(1), vw, items: items.length,
      top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1),
      lastLabel: edge ? (edge.textContent || '').trim().slice(0, 10) : '' };
  }, p.menu);
  /* 判"用户点得到吗"不用坐标猜，直接真点最外侧那一项 —— 有东西压着它，Playwright 会点名是谁。
     （上一版在这里用 elementFromPoint 自己算，算出过一次分不清是遮挡还是时序的假失败。） */
  const last = page.locator(`${p.menu} button`).last();
  try {
    await last.click({ timeout: 4000 });
  } catch (e) {
    throw new Error(`${p.name} 最外侧那一项「${geo.lastLabel}」点不到：`
      /* 别只留第一行 —— 2026-09-23 那次偶发红，第一行只有 "Timeout 4000ms exceeded"，
         真正点名的那行（谁 intercepts pointer events）在第 8 行，被截掉之后白查二十分钟。 */
      + String((e as Error).message).split('\n').slice(0, 10).join('\n'));
  }
  // 选完通常自己收；没收的（书签那条）手工收一下，别挡住下一颗
  await page.evaluate(() => document.querySelectorAll('.loop-wrap.open, .rate-wrap.open, .ab-wrap.open')
    .forEach((w) => w.classList.remove('open')));
  await page.waitForTimeout(160);
  return geo;
}

test.describe('主按钮渐变色值锁 · 全站', () => {
  const root = path.resolve(process.cwd(), '..');

  test('源码里三站主按钮渐变被锁死（含深色档；防手滑改浅/改深/改字色）', () => {
    // 先自检这道闸门本身：夹具喂漂移值必须响
    const fx = scanGradLock(path.join(root, 'playwright-tests/fixtures/cta-gate-selfcheck.css'));
    expect(fx.length, `色值锁没抓到夹具里的漂移值：${JSON.stringify(fx)}`).toBeGreaterThan(0);
    // 纯比较器两个方向都要对（锁定值相等、漂移值不等）
    expect(normGrad(LOCKED_GRAD)).toBe('linear-gradient(135deg,#2bd4a4,#0fae7e)');
    expect(normGrad('linear-gradient(135deg, #2e9c76, #0f7c5a)')).not.toBe(normGrad(LOCKED_GRAD));
    const report = ['shadow/index.html', 'index.html', 'app/index.html', 'admin/index.html']
      .map((f) => [f, scanGradLock(path.join(root, f))] as const)
      .filter(([, h]) => h.length > 0);
    expect(report, report.map(([f, h]) => `${f}: ${h.join(' | ')}`).join('\n')).toEqual([]);
  });

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 4);
    await page.goto(`${baseURL}/index.html`);
    await expect(page.locator('.sent').first()).toBeVisible();
  });

  test('屏幕上真的量一遍：首屏渐变绿底控件的色值全锁定', async ({ page }) => {
    const r = await sweepLive(page);
    expect(r.bad, JSON.stringify(r.bad)).toEqual([]);
    expect(r.seen, '一处渐变绿底控件都没捞到 = 扫描没跑到东西，不算通过').toBeGreaterThan(0);
  });

  test('任务模式那颗「下一句」：渐变锁定 + 字回到白（反向验证的锚）', async ({ page }) => {
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); TASK.enterTaskMode(); });
    await expect(page.locator('#tbNext')).toBeVisible();
    const one = await page.evaluate(() => {
      const el = document.getElementById('tbNext') as HTMLElement;
      const cs = getComputedStyle(el);
      return { color: cs.color, bg: cs.backgroundImage.slice(0, 140) };
    });
    expect(one.color).toBe('rgb(255, 255, 255)');      // --cta-ink 回到 #fff
    expect(one.bg).toContain('43, 212, 164');           // #2bd4a4 —— 锁定品牌渐变最亮端（白字 1.90，用户知情接受）
    expect(one.bg).toContain('15, 174, 126');           // #0fae7e —— 最暗端
    expect(one.bg).not.toContain('46, 156, 118');       // 不再是上一版 #2e9c76
    const r = await sweepLive(page);
    expect(r.bad, JSON.stringify(r.bad)).toEqual([]);
    expect(r.seen).toBeGreaterThan(0);
    await page.evaluate(() => { try { TASK.exitTaskMode(); TASK.resetV2(); } catch (e) {} });
  });
});

test.describe('播放条小弹层 · 不许伸出屏幕', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  const run = async (page: import('@playwright/test').Page) => {
    /* 「今日学习任务」这块面板常驻在 DOM 里，靠 .today-panel.open 才显形（不是 display:none）。
       它开着的时候会盖住底栏上方那一条，弹层的量测就变成在测"模态挡没挡"，所以先断言它是关的。 */
    await expect(page.locator('.today-panel.open')).toHaveCount(0);
    // 书签那条 .ab-menu 空着量不出真实溢出（里面是一条条列表），先记一条
    await page.evaluate(() => { try { addMark(); } catch (e) {} });
    for (const p of POPUPS) {
      const m = await measurePopup(page, p);
      expect(m.items, `${p.name} 弹层里没有可点的项，等于没量`).toBeGreaterThan(0);
      expect(m.left, `${p.name} 伸出左边界 ${m.left} < 0`).toBeGreaterThanOrEqual(-0.5);
      expect(m.right, `${p.name} 伸出右边界 ${m.right} > 视口 ${m.vw}`).toBeLessThanOrEqual(m.vw + 0.5);
    }
    // 上面是真的点了选项：把倍速/循环/A-B 拨回默认，别把状态带给后面的用例
    await page.evaluate(() => {
      try { pickRate(1); } catch (e) {}
      try { setLoopCount(0); } catch (e) {}
      try { abCancel(); } catch (e) {}
    });
  };

  test('390px 常规模式：四类弹层全在屏幕内，末项点得到', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/index.html`);
    await expect(page.locator('.audiobar')).toBeVisible();
    await run(page);
  });

  test('390px 任务模式：播放组挪到左边后溢出方向反过来，也收得住', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/index.html`);
    await expect(page.locator('.sent').first()).toBeVisible();
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); TASK.enterTaskMode(); });
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'read');
    await run(page);
    await page.evaluate(() => { try { TASK.exitTaskMode(); TASK.resetV2(); } catch (e) {} });
  });

  /* 这一族（同步药丸压弹层）单独走查在下一条 describe —— 上面四颗弹层是在"没有药丸"的
     干净页上量的，而偶发红灯只有药丸挂着时才出现。别在这里加断言把两件事混成一条。 */
});

/* ---------------- 常驻同步药丸 · 不许压在弹层末项上 ---------------- */

/* 桩只要够让「上传被拒」真的发生：药丸由 app 自己显形。
   ⚠️ 不要改成 `el.hidden = false` 强行显形 —— 那样落的是 CSS 的 bottom，
   而真路径 setSyncHint() 会调 placeSyncHint() 用 getBoundingClientRect 现量底栏顶边重写
   bottom（390 任务模式实测两者差 51px）。强行显形量到的不是用户看到的那个位置；
   上一轮那条被撤掉的锁就是栽在这儿（反向验证时它不响，因为它量的东西根本没在屏上）。 */
const REJECTING_CLOUD = `
window.__supaReject = true;
window.supabase = { createClient: function () { return {
  auth: {
    getSession: function () { return Promise.resolve({ data: { session: { user: { id: 'u-lock', email: 'lock@local' } } } }); },
    onAuthStateChange: function () { return { data: { subscription: { unsubscribe: function () {} } } }; }
  },
  from: function () { var q = {};
    q.upsert = function () { return Promise.resolve({ error: { message: 'rls denied' } }); };
    q.select = function () { return q; }; q.eq = function () { return q; }; q.order = function () { return q; };
    q.range = function () { return Promise.resolve({ data: [], error: null }); }; return q; }
}; } };`;

/** 让药丸挂着：记两笔进度 → 上传被拒 → app 自己把提示条立起来。
 *  必须断言它真的显形 —— 药丸不在屏上时后面那四颗弹层量得再绿也是假通过。 */
const raiseSyncHint = async (page: import('@playwright/test').Page) => {
  await page.evaluate(async () => {
    window.__supaReject = true;
    TASK.initPlan(10);
    TASK.todayPlan(true).queue.slice(0, 2).forEach((x) => TASK.readDone(x.i));
    await TASK.cloudPush();
  });
  await expect(page.locator('#syncHint')).toBeVisible();
  return page.evaluate(() => {
    const el = document.getElementById('syncHint')!;
    return { bottom: +el.getBoundingClientRect().bottom.toFixed(1), text: el.textContent || '' };
  });
};

const popupsUnderHint = async (page: import('@playwright/test').Page) => {
  const hint = await raiseSyncHint(page);
  expect(hint.text, '药丸上没有话，等于没量到状态').not.toBe('');
  await expect(page.locator('.today-panel.open')).toHaveCount(0);
  await page.evaluate(() => { try { addMark(); } catch (e) {} });
  for (const p of POPUPS) {
    const m = await measurePopup(page, p);   // 点不到就 throw，且会点名是谁压着
    expect(m.items, `${p.name} 弹层里没有可点的项，等于没量`).toBeGreaterThan(0);
  }
  await page.evaluate(() => {
    try { pickRate(1); } catch (e) {}
    try { setLoopCount(0); } catch (e) {}
    try { abCancel(); } catch (e) {}
  });
  await expect(page.locator('#syncHint')).toBeVisible();   // 修完药丸还在：不许靠藏掉它来让路
  return hint;
};

test.describe('常驻同步药丸 · 手机档', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 4);
    await page.route('**/supabase-js@2*', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: REJECTING_CLOUD }));
    await page.goto(`${baseURL}/index.html`);
    await expect(page.locator('.sent').first()).toBeVisible();
  });

  test('390 常规模式：药丸挂着，四类弹层末项全点得到', async ({ page }) => {
    const hint = await popupsUnderHint(page);
    // 药丸确实压在弹层那一条带上（不是"本来就不重叠、所以量不出什么"）：
    // 390 实测弹层末项上沿 656、药丸下沿 706 —— 未修版被 #syncHint 吃掉命中
    expect(hint.bottom).toBeGreaterThan(600);
  });

  test('390 任务模式：药丸与弹层抢同一条带，让位的是被动状态不是控件', async ({ page }) => {
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); TASK.enterTaskMode(); });
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'read');
    const hint = await popupsUnderHint(page);
    expect(hint.bottom).toBeGreaterThan(600);
  });
});

test.describe('常驻同步药丸 · 桌面档', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('1280 任务模式：桌面也压得住（未修实测 循环末项 796.7 / 药丸下沿 825）', async ({ page, baseURL }) => {
    await page.route('**/supabase-js@2*', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: REJECTING_CLOUD }));
    await page.goto(`${baseURL}/index.html`);
    await expect(page.locator('.sent').first()).toBeVisible();
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); TASK.enterTaskMode(); });
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'read');
    await popupsUnderHint(page);
    await page.evaluate(() => { try { TASK.exitTaskMode(); TASK.resetV2(); } catch (e) {} });
  });
});
