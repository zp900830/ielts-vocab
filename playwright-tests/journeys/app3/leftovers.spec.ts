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

/* ===================== W1 · 任务模式顶栏开关补齐 ===================== */
test.describe('3.0 W1 顶栏开关真的可达（PRD §4.3 / §8.1）', () => {
  test('译文/词义/口音/音色/夜间 都可见且点得动；译文开关真的显示/隐藏译文', async ({ page }) => {
    await stubData(page, SIXQ);
    await enterTask(page);

    // 过去这些节点在 display:none 的 header.topbar 里（0×0），这条必红
    for (const sel of ['#btnZh', '#btnGloss', '#btnAccent', '#voiceSel', '#btnDark']) {
      await expect(page.locator(sel), `${sel} 必须在任务模式顶栏可见`).toBeVisible();
    }

    // 译文开关：点一下真的把正文里的中文译文藏起来，再点回来
    const zh = page.locator('#art .sent-zh').first();
    await expect(zh).toBeVisible();
    await page.locator('#btnZh').click();
    await expect(page.locator('body')).toHaveClass(/hide-zh/);
    await expect(zh).toBeHidden();
    await page.locator('#btnZh').click();
    await expect(page.locator('body')).not.toHaveClass(/hide-zh/);
    await expect(zh).toBeVisible();

    // 行内词义开关：body.hide-gl 跟着切
    await page.locator('#btnGloss').click();
    await expect(page.locator('body')).toHaveClass(/hide-gl/);

    // 口音开关：英式 ↔ 美式，按钮文案跟着变
    const accent = page.locator('#btnAccent');
    await expect(accent).toContainText('英式');
    await accent.click();
    await expect(accent).toContainText('美式');
  });

  test('夜间开关在顶栏：点一下 body.dark 切换，且新外壳观感跟着变', async ({ page }) => {
    await stubData(page, SIXQ);
    await enterTask(page);

    const topBgLight = await page.locator('#taskTop').evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.locator('#btnDark').click();
    await expect(page.locator('body')).toHaveClass(/dark/);

    const topBgDark = await page.locator('#taskTop').evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(topBgDark, '外壳顶栏在深色下必须换成暖黑 token，不能还是浅色那套').not.toBe(topBgLight);

    await page.locator('#btnDark').click();
    await expect(page.locator('body')).not.toHaveClass(/dark/);
  });
});

/* ===================== W2 · 深色全覆盖（PRD §10.1） ===================== */
test.describe('3.0 W2 深色全覆盖', () => {
  test('切 body.dark 后外壳关键元素的背景/文字色都不是浅色那套', async ({ page }) => {
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
        aBar: bg('.art-card .a-bar'),
        aStage: bg('.art-card .a-stage'),
        banner: bg('.home-banner'),
        taskTop: bg('.task-top'),
      };
    });

    const light = await snapshot();
    await page.evaluate(() => document.body.classList.add('dark'));
    const dark = await snapshot();

    // 硬编码色（旧代码在深色下原样不动）—— 这三条是「旧代码必红」的锁
    expect(dark.aStage, '阶段胶囊底色必须随深色换，不能沿用浅色硬编码').not.toBe(light.aStage);
    expect(dark.sidenav, '侧栏底色必须随深色换，不能靠透明蹭 body').not.toBe(light.sidenav);
    expect(dark.taskTop, '顶栏底色必须随深色换').not.toBe(light.taskTop);
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
