// 顶栏收纳：一行放不下时整排工具收进汉堡，而不是让顶栏自己折成两排吃掉阅读区。
// 起因是他给的截图 —— 桌面宽度下顶栏已经排到第二行了。
import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';
const budget = () => test.setTimeout(Math.min(currentTimeout() * 8, 45000)); // 正常 3s 内跑完；卡住要早点红

/* 「放不下」用窗口宽度造，不往 #voiceSel / #btnCloud 里写长文字。
   那两个节点归应用所有：loadVoices() 会在 document.fonts.ready、
   speechSynthesis.onvoiceschanged、云端会话恢复三个异步时刻整体重建它们 —— 覆写晚一步就被冲掉。
   2026-09-21 那条间歇红就是这个形状（未修版 410 次红 1 次，带探针的 550 次 0 红）：
   负载决定「覆写」和「重建」谁先到，改产品代码也判不了真假。
   宽度则量过：真实内容下 ≤1000px 一定放不下、≥1440px 一定放得下，与音色名/章节名长短无关
   （复测：node work/nav_probe.mjs --sweep；2026-09-23 摘掉「阅读训练」那颗后重量过一遍，区间没变）。 */
const WIDE = 1600;   // 放得下：整排工具保持一行铺开
const TIGHT = 900;   // 放不下：整排收进汉堡

async function openAt(page: import('@playwright/test').Page, baseURL: string, width: number) {
  await page.goto(`${baseURL}/index.html`);
  await expect(page.locator('.sent').first()).toBeVisible();
  await page.setViewportSize({ width, height: 900 });
  // 续读位（ielts-pos 在 profile 里跨轮存活）会让开页直接落在正文中段，把「存档落在哪」
  // 和「这一行放不放得下」两件事绑在一起，红绿就由上一个用例的残留决定。回顶部再开始量。
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => document.body.classList.contains('scrolled')),
    { timeout: 4000 }).toBe(false);
}

const state = (page: import('@playwright/test').Page) => page.evaluate(() => ({
  navMenu: document.body.classList.contains('nav-menu'),
  // 收纳后工具栏改挂成浮层面板（position:absolute）；铺开时它就是顶栏行内的一段
  panelMode: getComputedStyle(document.querySelector('.topbar-right')!).position === 'absolute',
  burgerShown: getComputedStyle(document.getElementById('btnMenu')).display !== 'none',
  barH: Math.round(document.querySelector('.topbar')!.getBoundingClientRect().height),
}));

const waitsFor = (page: import('@playwright/test').Page) => (want: boolean) =>
  expect.poll(() => state(page).then(s => s.navMenu), { timeout: 4000 }).toBe(want);

test.describe('topbar collapse · 汉堡收纳', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);

  test('放得下就保持一行铺开，不出现汉堡', async ({ page, baseURL }) => {
    budget();
    await openAt(page, baseURL, WIDE);
    await waitsFor(page)(false);
    const s = await state(page);
    expect(s.burgerShown).toBe(false);
    expect(s.panelMode).toBe(false);
  });

  test('放不下就自动收进汉堡，整排工具改挂面板；宽度还回去就重新铺开', async ({ page, baseURL }) => {
    budget();
    await openAt(page, baseURL, WIDE);
    await waitsFor(page)(false);            // 前提：宽屏本来就放得下
    await page.setViewportSize({ width: TIGHT, height: 900 });
    await waitsFor(page)(true);             // 挤不下 → 自动收
    const s = await state(page);
    expect(s.burgerShown).toBe(true);
    expect(s.panelMode).toBe(true);
    expect(s.barH).toBeLessThan(64);        // 收纳后顶栏仍只有一行
    await page.locator('#btnMenu').click();
    await expect(page.locator('.topbar-right')).toBeVisible();
    await expect(page.locator('.topbar-right #btnDark')).toBeVisible();
    await page.setViewportSize({ width: WIDE, height: 900 });
    await waitsFor(page)(false);            // 反向：放得下了要自己摊回去，不能一收定终身
    expect((await state(page)).panelMode).toBe(false);
  });

  /* 两个应用各自独立：影子跟读里不许再出现跳回阅读训练的入口（他明确说没这个诉求）。
     只认「往上跳一级」的 href —— 测试环境把 shadow/ 当根目录服务，写死 ../index.html 会假绿。 */
  test('页面上没有任何跳去阅读训练的链接', async ({ page, baseURL }) => {
    budget();
    await openAt(page, baseURL, WIDE);
    await expect(page.locator('.app-link')).toHaveCount(0);
    const upward = await page.evaluate(() => [...document.querySelectorAll('a[href]')]
      .map(a => a.getAttribute('href')!)
      .filter(h => h.startsWith('../')));
    expect(upward).toEqual([]);
  });

  test('窄屏一律走汉堡，面板里的按钮点得到', async ({ page, baseURL }) => {
    budget();
    await openAt(page, baseURL, WIDE);
    await page.setViewportSize({ width: 390, height: 844 });
    await waitsFor(page)(true);
    const s = await state(page);
    expect(s.barH).toBeLessThan(64);
    await page.locator('#btnMenu').click();
    const panel = page.locator('.topbar-right');
    await expect(panel).toBeVisible();
    await expect(panel.locator('#btnZh')).toBeVisible();
    // 面板浮在顶栏下沿，不是把正文顶下去
    const box = await panel.boundingBox();
    const bar = await page.locator('.topbar').boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(bar.y + bar.height - 1);
  });

  test('滚动收缩态下面板照样打得开（body.scrolled 不许把它压没）', async ({ page, baseURL }) => {
    budget();
    await openAt(page, baseURL, TIGHT);
    await waitsFor(page)(true);
    await page.evaluate(() => window.scrollTo(0, 800));
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('scrolled')))
      .toBe(true);
    await page.locator('#btnMenu').click();
    await expect(page.locator('.topbar-right')).toBeVisible();
    await expect(page.locator('.topbar-right #btnZh')).toBeVisible();
  });

  /* 手机上的小播放胶囊：上一句/播放/下一句 必须还在（他截图报的就是这里 —— 
     移动端把「展开→收起」的收缩动画顺手套到了 .ab-left > .btn 上，forwards 把它们钉在
     opacity:0 / max-width:0，胶囊里只剩 AB 和书签两颗图标）。
     注意 Playwright 的 toBeVisible 不看 opacity，所以要自己把祖先链的透明度乘起来算。 */
  const pill = (page: import('@playwright/test').Page) => page.evaluate(() => {
    const bar = document.getElementById('audiobar') as HTMLElement;
    const br = bar.getBoundingClientRect();
    const opacityUp = (el: Element) => {
      let o = 1;
      for (let p = el as HTMLElement | null; p && p !== bar; p = p.parentElement) {
        o *= parseFloat(getComputedStyle(p).opacity) || 0;
      }
      return o;
    };
    const one = (sel: string, label: string) => {
      const el = bar.querySelector(sel) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { label, w: Math.round(r.width), op: +opacityUp(el).toFixed(2),
               inside: r.left >= br.left - 1 && r.right <= br.right + 1 };
    };
    return {
      // mini 里 .ab-left 第一层只有 上一句/播放/下一句 该露出来（abLoopBtn 本就该 display:none）
      primary: [...bar.querySelectorAll('.ab-left > .btn')]
        .filter(el => getComputedStyle(el).display !== 'none')
        .map(el => {
          const r = el.getBoundingClientRect();
          return { label: (el.getAttribute('aria-label') || el.title || '').slice(0, 6),
                   w: Math.round(r.width), op: +opacityUp(el).toFixed(2),
                   inside: r.left >= br.left - 1 && r.right <= br.right + 1 };
        }),
      ab: one('#btnAB', 'AB'),
      mark: one('#markBtn', '书签'),
    };
  });

  test('手机上收进小胶囊后，上一句/播放/下一句 仍然看得见点得着', async ({ page, baseURL }) => {
    budget();
    await openAt(page, baseURL, WIDE);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 900));
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('scrolled')))
      .toBe(true);
    await expect.poll(async () => {
      const p = await pill(page);
      return p.primary.every(b => b && b.w >= 28 && b.op > 0.9 && b.inside);
    }, { timeout: 4000 }).toBe(true);
    const p = await pill(page);
    expect(p.primary.length).toBe(3);                   // 上一句 / 播放 / 下一句 一颗都不能少
    expect(p.ab && p.ab.op).toBeGreaterThan(0.9);       // 反向别踩：AB / 书签也要在
    expect(p.mark && p.mark.op).toBeGreaterThan(0.9);
  });
});
