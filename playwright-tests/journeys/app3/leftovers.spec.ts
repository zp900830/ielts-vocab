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
    for (const sel of ['#btnAccent', '#voiceBtn']) {
      await expect(page.locator(sel), `${sel} 必须在文章内可见`).toBeVisible();
    }
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

    // 口音：英式 ↔ 美式，按钮文案跟着变
    const accent = page.locator('#btnAccent');
    await expect(accent).toContainText('英式');
    await accent.click();
    await expect(accent).toContainText('美式');
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
  test('文章内头部与正文内容框左右边缘对齐（<2px）', async ({ page }) => {
    await stubData(page, SIXQ);
    await enterTask(page);
    const m = await page.evaluate(() => {
      const rh = document.getElementById('readerHead')!.getBoundingClientRect();
      const badges = document.getElementById('taskBadges')!.getBoundingClientRect();
      const lay = document.querySelector('.layout') as HTMLElement;
      const ls = getComputedStyle(lay);
      const lr = lay.getBoundingClientRect();
      return {
        rhL: rh.left, rhR: rh.right, bL: badges.left, bR: badges.right,
        contentL: lr.left + parseFloat(ls.paddingLeft),
        contentR: lr.right - parseFloat(ls.paddingRight),
      };
    });
    expect(Math.abs(m.rhL - m.contentL), '标题胶囊左缘').toBeLessThan(2);
    expect(Math.abs(m.rhR - m.contentR), '标题胶囊右缘').toBeLessThan(2);
    expect(Math.abs(m.bL - m.contentL), '控件排左缘').toBeLessThan(2);
    expect(Math.abs(m.bR - m.contentR), '控件排右缘').toBeLessThan(2);
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
    await enterTask(page);

    expect(await page.locator('select#voiceSel').count(), '原生 select 已换掉').toBe(0);
    await page.locator('#voiceBtn').click();
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
        meCard: bg('.me-card'),
        mePop: bg('.me-pop'),
        readerHead: bg('.reader-head'),
        trMsw: bg('.tr-msw'),
      };
    });

    const light = await snapshot();
    await page.evaluate(() => document.body.classList.add('dark'));

    const dark = await snapshot();

    // 新头部（旧代码里这些节点根本不存在 / 或深浅一致）—— 这几条是「旧代码必红」的锁
    expect(dark.meCard, '用户卡底色必须随深色换').not.toBe(light.meCard);
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
test.describe('3.0 W6 PWA', () => {
  test('/app/ 有 manifest 链接，且启动时注册 service worker（scope = /app/）', async ({ page }) => {
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

    // service worker 注册：被调用，且 scope 落在 /app/
    await page.waitForFunction(() => ((window as unknown as { __swCalls?: unknown[] }).__swCalls || []).length > 0);
    const calls = await page.evaluate(() => (window as unknown as { __swCalls: { url: string; scope?: string }[] }).__swCalls);
    expect(calls.length, '启动时必须尝试注册 service worker').toBeGreaterThan(0);
    expect(calls[0].scope, 'service worker 的 scope 必须是 /app/').toContain('/app/');
    expect(errors, 'PWA 初始化不许抛出未捕获错误').toEqual([]);
  });
});
