// 3.0 M1 遗留清单（W1 / W2 / W6）。
// W1 · 任务模式顶栏补齐（PRD §4.3 / §8.1）：译文/行内词义/口音/音色/夜间 这些开关过去被
//      `body > .topbar{display:none}` 连根藏掉，全部不可达。现在收进那条常驻顶栏，真的能用。
// W2 · 深色全覆盖（PRD §10.1）：新外壳的关键元素在 body.dark 下必须换成暖黑 token，而不是
//      继续用浅色那套（.a-bar / .a-stage 等硬编码色过去在深色下不变）。
// W6 · PWA（PRD §2.5）：/app/ 要有 manifest 链接，且启动时注册 service worker（scope 落在 /app/）。
// 服务器归 global-setup.ts 起停（仓库根 8932）；/app/ 在仓库根，所以和其余 app3 用例一样用 E2E_ROOT_URL。
import { test, expect } from '../../fixtures';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  enterTaskMode(): void;
};
declare const ShadowPlan: { articleScope(sections: unknown, article: number): Set<number> };
declare const SECTIONS: unknown[];

const rootUrl = process.env.E2E_ROOT_URL || '';

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/shadow/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }),
    );
  }
}

async function waitAppReady(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    try {
      return typeof SECTIONS !== 'undefined' && SECTIONS.length > 0
        && typeof TASK !== 'undefined' && !!(TASK.state() && TASK.state().daily);
    } catch (e) { return false; }
  });
}

/* 第 0 篇 8 句，每句带一个目标词 + 中文译文（够任务模式渲出 .sent-zh 与行内词义）。 */
const QWORDS = ['apple', 'banana', 'cherry', 'date'];
const SIXQ: Record<string, string> = (() => {
  const vocab: Record<string, { m: string }> = {};
  QWORDS.forEach((w, i) => { vocab[w] = { m: 'n. ' + ['苹果', '香蕉', '樱桃', '枣'][i] }; });
  const mk = (title: string, ai: number, n: number) => ({
    title, zh: title, subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) => {
      const w = QWORDS[(ai + i) % QWORDS.length];
      return `Sentence ${i} about [[${w}:${w}]].`;
    })],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
    paraZh: [''],
  });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i, i === 0 ? 8 : 2))),
    'vocab.json': JSON.stringify(vocab),
    'chapters.json': '[]',
  };
})();

/* 首页深色用例：六篇、第 0 篇 24 句，够渲出 .art-card 与 .a-bar。 */
const SIX: Record<string, string> = (() => {
  const mk = (title: string, n: number) => ({
    title, zh: title, subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) => `Sentence ${i} about [[w${i}:w${i}]].`)],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
    paraZh: [''],
  });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i === 0 ? 24 : 2))),
    'vocab.json': '{}',
    'chapters.json': '[]',
  };
})();

async function enterTask(page: import('@playwright/test').Page) {
  await page.goto(`${rootUrl}/app/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);
  await page.locator('.art-card').first().click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  await expect(page.locator('#taskBar')).toBeVisible();
}
/* ===================== W1 · 文章内头部开关（W1 重做：照抄主站） ===================== */
test.describe('3.0 W1 头部开关可达（PRD §4.3 / §8.1，用户 2026-09-24 修正）', () => {
  test('文章内：译文/词义是 iOS 拨杆、口音+音色可见可点；夜间开关不在文章内', async ({ page }) => {
    await stubData(page, SIXQ);
    await enterTask(page);

    // 修正 2/3：主站 .tr-msw 那种 iOS 拨杆（带 .knob），不是自造的文字按钮
    for (const sel of ['#btnZh', '#btnGloss']) {
      await expect(page.locator(sel), `${sel} 必须在文章内可见`).toBeVisible();
      await expect(page.locator(`${sel} .knob`), `${sel} 必须是主站那种 iOS 拨杆`).toBeVisible();
    }
    // ③ 口音/音色已按用户口径挪进「我的」浮窗：文章头（.r-badges）不再有它们
    expect(await page.locator('#taskBadges #btnAccent').count(), '文章头不该有口音开关').toBe(0);
    expect(await page.locator('#taskBadges #voiceBtn').count(), '文章头不该有音色选择').toBe(0);
    // 主题（含夜间）已收进「我的」浮窗（用户 2026-09-24）：文章内、外壳顶栏都没有 #btnDark
    expect(await page.locator('#btnDark').count(), '夜间按钮已从顶栏去掉').toBe(0);

    // 全句译文拨杆：点一下正文译文真的藏起来，aria-checked 跟着翻
    const zh = page.locator('#art .sent-zh').first();
    await expect(zh).toBeVisible();
    await page.locator('#btnZh').click();
    await expect(page.locator('body')).toHaveClass(/hide-zh/);
    await expect(zh).toBeHidden();
    await expect(page.locator('#btnZh')).toHaveAttribute('aria-checked', 'false');
    await page.locator('#btnZh').click();
    await expect(zh).toBeVisible();
    await expect(page.locator('#btnZh')).toHaveAttribute('aria-checked', 'true');

    // 行内词义拨杆：body.hide-gl 跟着切
    await page.locator('#btnGloss').click();
    await expect(page.locator('body')).toHaveClass(/hide-gl/);
  });

  test('主题在「我的」浮窗里：点用户卡弹浮窗 → 切主题 body.dark 真的变；顶栏不再有它', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    // 一级页面顶栏那条（原 #shellTop）与 #btnDark 已去掉：主题只活在「我的」浮窗里
    expect(await page.locator('#shellTop').count(), '一级页面顶栏已去掉').toBe(0);
    expect(await page.locator('#btnDark').count(), '顶栏的夜间按钮已去掉').toBe(0);

    // 点左下角用户卡 → 向上弹「我的」浮窗，里面有主题拨杆
    await page.locator('#meCard').click();
    const pop = page.locator('#mePop');
    await expect(pop).toBeVisible();
    const theme = pop.locator('[data-me-theme]');
    await expect(theme, '浮窗里必须有主题开关').toBeVisible();

    const wasDark = await page.evaluate(() => document.body.classList.contains('dark'));
    await theme.click();
    expect(await page.evaluate(() => document.body.classList.contains('dark')), '切主题后 body.dark 必须翻转').toBe(!wasDark);
    await page.locator('#mePop [data-me-theme]').click();
    expect(await page.evaluate(() => document.body.classList.contains('dark')), '再切一次翻回来').toBe(wasDark);

    // 进文章 → 用户卡随 #appShell 一起收走，文章内没有主题开关
    await waitAppReady(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await page.reload();
    await waitAppReady(page);
    await page.locator('.art-card').first().click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    expect(await page.locator('#meCard').isVisible(), '文章内不该有用户卡').toBe(false);
    expect(await page.locator('#btnDark').count()).toBe(0);
  });

  // 用户 2026-09-24 修正：头部要和文章等宽（对齐 .layout 的内容框，不是主站的 860px）。
  // 2026-09-25（G）：第二排（#taskBadges）已并进 .reader-head，这条只钉头部这一条。
  test('文章内头部与正文内容框左右边缘对齐（<2px）', async ({ page }) => {
    await stubData(page, SIXQ);
    await enterTask(page);
    const m = await page.evaluate(() => {
      const rh = document.getElementById('readerHead')!.getBoundingClientRect();
      const lay = document.querySelector('.layout') as HTMLElement;
      const ls = getComputedStyle(lay);
      const lr = lay.getBoundingClientRect();
      return {
        rhL: rh.left, rhR: rh.right,
        contentL: lr.left + parseFloat(ls.paddingLeft),
        contentR: lr.right - parseFloat(ls.paddingRight),
      };
    });
    expect(Math.abs(m.rhL - m.contentL), '标题胶囊左缘').toBeLessThan(2);
    expect(Math.abs(m.rhR - m.contentR), '标题胶囊右缘').toBeLessThan(2);
  });

  /* refine3 ⑥（2026-09-25 用户「头部的标题条，与二级页面任务模式一样」）：
     随身听展开阅读（二级页）的头部原先是一条通栏 sticky 条，与正文框不齐；
     现在照抄任务模式那套 reader-head：同容器宽（<2px）、同 .back、同 .r-pos 层级。 */
  test('随身听展开（二级页）头部与任务模式同套：与正文等宽 <2px + 同一枚 .back / .r-pos', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitAppReady(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await page.goto(`${rootUrl}/app/index.html#/listen`);
    await waitAppReady(page);
    await page.evaluate(() => { (TASK as unknown as { listenExpand(): void }).listenExpand(); });
    await expect(page.locator('body')).toHaveClass(/listen-mode/);
    /* 展开入场动画（ls-page-in，0.32s）跑着的时候 scale(.99) 会让几何测量漂 4px ——
       先把动画跳到终态再量（产品行为不变，只是别在动画中途量几何）。 */
    await page.evaluate(() => {
      document.getAnimations().forEach(function (a) { try { a.finish(); } catch (e) {} });
    });
    await expect(page.locator('#listenTop')).toBeVisible();
    const m = await page.evaluate(() => {
      const lt = document.getElementById('listenTop')!.getBoundingClientRect();
      const lay = document.querySelector('body > .layout') as HTMLElement;
      const ls = getComputedStyle(lay); const lr = lay.getBoundingClientRect();
      const cs = getComputedStyle(document.getElementById('listenTop')!);
      return {
        ltL: lt.left, ltR: lt.right,
        contentL: lr.left + parseFloat(ls.paddingLeft),
        contentR: lr.right - parseFloat(ls.paddingRight),
        radius: cs.borderRadius,
        backCls: document.getElementById('lsClose')!.className,
        posCls: document.getElementById('lsPos')!.className,
      };
    });
    expect(Math.abs(m.ltL - m.contentL), '二级页头部左缘').toBeLessThan(2);
    expect(Math.abs(m.ltR - m.contentR), '二级页头部右缘').toBeLessThan(2);
    expect(m.radius, '与任务模式头部同一套玻璃胶囊（999px）').toContain('999px');
    // 2026-09-26 用户改口径：左上角是「收起」不是返回 —— 不再复用 .back，改成带字胶囊 .ls-collapse
    expect(m.backCls, '收起键是带字胶囊控件').toContain('ls-collapse');
    expect(m.posCls, '同一 .r-pos 标题层级胶囊').toContain('r-pos');
  });

  // 2026-09-24 用户：换掉原生 <select> 音色下拉（移动端巨大、样式对不上）→ 自定义玻璃浮层。
  test('音色选择器是自定义浮层（无原生 select），选中的音色照旧存进 ielts-voice', async ({ page }) => {
    // headless 里 speechSynthesis 没音色 → 先塞两个假音色，选择器才有内容
    await page.addInitScript(() => {
      const fake = [
        { voiceURI: 'fake-gb-1', name: 'Daniel', lang: 'en-GB', default: false, localService: true },
        { voiceURI: 'fake-us-1', name: 'Samantha', lang: 'en-US', default: false, localService: true },
      ];
      try { Object.defineProperty(window.speechSynthesis, 'getVoices', { value: () => fake, configurable: true }); } catch (e) {}
    });
    await stubData(page, SIXQ);
    // ③ 音色选择器已挪进「我的」浮窗：在一级页面开浮窗再点
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await page.locator('#meCard').click();
    const mePop = page.locator('#mePop');
    await expect(mePop).toBeVisible();

    expect(await page.locator('select#voiceSel').count(), '原生 select 已换掉').toBe(0);
    await mePop.locator('#voiceBtn').click();
    const pop = page.locator('#voicePop');
    await expect(pop).toBeVisible();
    expect(await pop.locator('.vp-group').count(), '要有分组标题').toBeGreaterThan(0);
    const first = pop.locator('.vp-item').first();
    await expect(first.locator('.vp-play'), '每项要带试听').toBeVisible();
    const uri = await first.getAttribute('data-voice-uri');
    await first.click();
    await expect(pop, '选完收起来').toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('ielts-voice')), '选中要存进 ielts-voice').toBe(uri);
  });
});

/* ===================== W2 · 深色全覆盖（PRD §10.1） ===================== */
test.describe('3.0 W2 深色全覆盖', () => {
  test('切 body.dark 后新头部与外壳关键元素的背景色都换到暖黑', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await expect(page.locator('.art-card')).toHaveCount(6);

    const snapshot = () => page.evaluate(() => {
      const bg = (sel: string) => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el).backgroundColor : null;
      };
      return {
        body: getComputedStyle(document.body).backgroundColor,
        sidenav: bg('.sidenav'),
        navOn: bg('.nav-item.on'),
        artCard: bg('.art-card'),
        aStage: bg('.art-card .a-stage'),
        banner: bg('.home-banner'),
        mePop: bg('.me-pop'),
        readerHead: bg('.reader-head'),
        trMsw: bg('.tr-msw'),
      };
    });

    const light = await snapshot();
    await page.evaluate(() => document.body.classList.add('dark'));

    const dark = await snapshot();

    // 新头部（旧代码里这些节点根本不存在 / 或深浅一致）—— 这几条是「旧代码必红」的锁
    expect(dark.mePop, '「我的」浮窗底色必须随深色换').not.toBe(light.mePop);
    expect(dark.readerHead, '文章内玻璃胶囊底色必须随深色换').not.toBe(light.readerHead);
    expect(dark.trMsw, '译文拨杆底色必须随深色换').not.toBe(light.trMsw);
    expect(dark.sidenav, '侧栏底色必须随深色换，不能靠透明蹭 body').not.toBe(light.sidenav);
    expect(dark.aStage, '阶段胶囊底色必须随深色换').not.toBe(light.aStage);
    // 其余外壳元素也不许在深色下停在浅色那套
    for (const k of ['navOn', 'artCard', 'banner'] as const) {
      expect(dark[k], `${k} 在深色下必须与浅色不同`).not.toBe(light[k]);
    }
    // 深色底确实是暖黑，不是浅色
    expect(dark.body).toBe('rgb(28, 26, 23)');
  });
});

/* ===================== W6 · PWA（PRD §2.5） ===================== */
/* 2026-09-24 根因修复：SW 从 blob 内联脚本改为仓内真实文件 /app/sw.js。
   旧 blob 形式在 Chromium 里 register 直接被拒（blob 协议不被支持），SW 从未注册 ——
   M2 往 blob 代码里加的「缓存失败退回网络」是死代码，静态服务器偶发丢 /app/app.js 时无兜底 → 白屏。
   这组锁：① 注册指向真实文件（非 blob）；② 文件真能取到且是 SW 源码；③ 真实浏览器里注册成功、
   scope=/app/；④ 高重复加载 app.js 每次都能执行；⑤ 断网 reload 仍能靠缓存供上 app.js。 */
test.describe('3.0 W6 PWA', () => {
  test('/app/ 有 manifest 链接，且启动时用真实文件 sw.js 注册（scope = /app/，不是 blob）', async ({ page }) => {
    // 注册在启动时发生，来不及在页面里 stub —— 用 addInitScript 在页面脚本前把 register 换掉
    await page.addInitScript(() => {
      (window as unknown as { __swCalls: unknown[] }).__swCalls = [];
      const fake = {
        register(url: string, opts?: { scope?: string }) {
          (window as unknown as { __swCalls: unknown[] }).__swCalls.push({ url: String(url), scope: opts && opts.scope });
          return Promise.resolve({ scope: (opts && opts.scope) || '/' });
        },
      };
      Object.defineProperty(navigator, 'serviceWorker', { value: fake, configurable: true });
    });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);

    // manifest：主站那套 base64 data-URI，解出来必须是合法 manifest
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(href, '/app/ 必须有 manifest 链接').toBeTruthy();
    const m = href!.match(/^data:application\/manifest\+json;base64,(.+)$/);
    expect(m, 'manifest 用主站那套 base64 data-URI').toBeTruthy();
    const json = JSON.parse(Buffer.from(m![1], 'base64').toString('utf8'));
    expect(json.name, 'manifest 要指名 3.0').toContain('3.0');
    expect(json.display).toBe('standalone');
    expect(json.start_url).toBeTruthy();

    // service worker 注册：被调用，URL 是真实文件 sw.js（不是 blob:），scope 落在 /app/
    await page.waitForFunction(() => ((window as unknown as { __swCalls?: unknown[] }).__swCalls || []).length > 0);
    const calls = await page.evaluate(() => (window as unknown as { __swCalls: { url: string; scope?: string }[] }).__swCalls);
    expect(calls.length, '启动时必须尝试注册 service worker').toBeGreaterThan(0);
    expect(calls[0].url, '必须注册真实文件 sw.js，不能再是 blob:').not.toContain('blob:');
    expect(calls[0].url, '注册 URL 必须指向 /app/sw.js').toMatch(/\/app\/sw\.js(\?|$)/);
    expect(calls[0].scope, 'service worker 的 scope 必须是 /app/').toContain('/app/');
    expect(errors, 'PWA 初始化不许抛出未捕获错误').toEqual([]);
  });

  test('/app/sw.js 是真实文件：能取到、是 SW 源码（非 blob）、network-first', async ({ request }) => {
    const res = await request.get(`${rootUrl}/app/sw.js`);
    expect(res.status(), '/app/sw.js 必须 200 —— 真实文件，不是脚本内联的 blob').toBe(200);
    const body = await res.text();
    expect(body.trim().startsWith('blob:'), '内容不能是一个 blob: URL 字符串').toBe(false);
    expect(body.length, '必须是一整份 SW 源码，不是一个短 URL').toBeGreaterThan(200);
    expect(body, '必须是真的 SW 源码').toContain("self.addEventListener('fetch'");
    expect(body, '必须有缓存名（activate 清理旧缓存靠它）').toContain('CACHE_NAME');
    expect(body, '必须有 fetch 失败退回 caches.match 的兜底').toMatch(/catch[\s\S]*caches\.match/);
  });

  test('真实浏览器里 SW 注册成功、已激活，scope = /app/，脚本是真实文件', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    // 条件等待：本页 scope 的注册已激活（不 sleep）
    await page.waitForFunction(async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        return !!(reg && reg.active);
      } catch (e) { return false; }
    });
    const info = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      return { scope: (reg && reg.scope) || '', scriptURL: (reg && reg.active && reg.active.scriptURL) || '' };
    });
    expect(info.scope, 'scope 必须落在 /app/').toContain('/app/');
    expect(info.scriptURL, '脚本必须是真实文件 /app/sw.js').toMatch(/\/app\/sw\.js$/);
  });

  test('高重复加载 /app/：app.js 每次都真的执行（回归锁：旧 blob SW 曾让 app.js 拿不到）', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    // 先让真实 SW 激活，后面的 reload 才都在 SW 接管下
    await page.waitForFunction(async () => {
      try { const reg = await navigator.serviceWorker.getRegistration(); return !!(reg && reg.active); }
      catch (e) { return false; }
    });
    const RELOADS = 15;
    for (let i = 0; i < RELOADS; i++) {
      await page.reload();
      // APP3.route 由 defer 的 app.js 定义；app.js 拿不到就永远等 → 红灯。条件等待，不 sleep。
      await page.waitForFunction(() => {
        const w = window as unknown as { APP3?: { route?: unknown } };
        return !!(w.APP3 && typeof w.APP3.route === 'function');
      }, undefined, { timeout: 20000 });
    }
  });

  test('断网后 reload：SW 仍从缓存供上 /app/app.js（network-first 的可靠兜底）', async ({ page, context }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await page.waitForFunction(async () => {
      try { const reg = await navigator.serviceWorker.getRegistration(); return !!(reg && reg.active); }
      catch (e) { return false; }
    });
    // 被接管的一轮：导航与 app.js 进缓存
    await page.reload();
    await page.waitForFunction(() => {
      const w = window as unknown as { APP3?: { route?: unknown } };
      return !!(w.APP3 && typeof w.APP3.route === 'function');
    });
    await context.setOffline(true);
    try {
      await page.reload();
      await page.waitForFunction(() => {
        const w = window as unknown as { APP3?: { route?: unknown } };
        return !!(w.APP3 && typeof w.APP3.route === 'function');
      }, undefined, { timeout: 20000 });
    } finally {
      await context.setOffline(false);
    }
  });

  /* M6：连缓存都没命中时也不许白屏。旧 SW 在「无网 + 无缓存」时只能 reject，浏览器给一张
     错误页（白屏）。现在导航请求兜一张极简离线页（带重试）。反向验证：把 app/sw.js 里那段
     `req.mode === 'navigate'` 兜底删掉，本条必红（reload 抛网络错误）。 */
  test('断网且缓存被清空：导航请求兜到离线页，不白屏', async ({ page, context }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await page.waitForFunction(async () => {
      try { const reg = await navigator.serviceWorker.getRegistration(); return !!(reg && reg.active); }
      catch (e) { return false; }
    });
    await page.reload();   // 被 SW 接管的一轮，app.js / index.html 进缓存
    await page.waitForFunction(() => {
      const w = window as unknown as { APP3?: { route?: unknown } };
      return !!(w.APP3 && typeof w.APP3.route === 'function');
    });
    // 清掉所有缓存 → 制造「无网 + 无缓存」；SW 仍被本页 scope 控制着
    await page.evaluate(async () => { const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); });
    await context.setOffline(true);
    try {
      await page.reload();
      await expect(page.locator('body')).toContainText('当前离线');
      await expect(page.getByRole('button', { name: '重试' })).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });
});
