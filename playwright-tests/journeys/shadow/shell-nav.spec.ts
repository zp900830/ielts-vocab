// 顶栏收纳：一行放不下时整排工具收进汉堡，而不是让顶栏自己折成两排吃掉阅读区。
// 起因是他给的截图 —— 桌面宽度下顶栏已经排到第二行了。
import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

// 不用系统音色列表做断言：headless 里它有几条、名字多长都不确定，
// 拿它当「放得下」的前提会偶发假红。这里把两颗最宽的直接钉死。
const SHORT = 'Daniel';
const LONG = 'Guy · 美式男声 ★★★ Neuron Online (en-US) Microsoft Azure Speech —— '.repeat(4);

async function openAt(page: import('@playwright/test').Page, baseURL: string, width: number) {
  await page.goto(`${baseURL}/index.html`);
  await expect(page.locator('.sent').first()).toBeVisible();
  await page.setViewportSize({ width, height: 900 });
}

async function setLabels(page: import('@playwright/test').Page, voice: string) {
  await page.evaluate((v) => {
    document.getElementById('voiceSel')!.innerHTML = `<option>${v}</option>`;
    document.getElementById('btnCloud')!.innerHTML =
      '<i class="ri-cloud-line"></i> ' + (v.length > 20 ? '1013711120 已登录，点击可退出' : '未登录');
  }, voice);
}

const state = (page: import('@playwright/test').Page) => page.evaluate(() => ({
  navMenu: document.body.classList.contains('nav-menu'),
  inPanel: !!document.querySelector('.topbar-right .app-link'),
  burgerShown: getComputedStyle(document.getElementById('btnMenu')).display !== 'none',
  barH: Math.round(document.querySelector('.topbar').getBoundingClientRect().height),
}));

const waitsFor = (page: import('@playwright/test').Page) => (want: boolean) =>
  expect.poll(() => state(page).then(s => s.navMenu), { timeout: 4000 }).toBe(want);

test.describe('topbar collapse · 汉堡收纳', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);

  test('放得下就保持一行铺开，不出现汉堡', async ({ page, baseURL }) => {
    test.setTimeout(Math.min(currentTimeout() * 8, 45000));   // 这四条正常 3s 内跑完；卡住要早点红，别拖满预算
    await openAt(page, baseURL, 1440);
    await setLabels(page, SHORT);
    await waitsFor(page)(false);
    const s = await state(page);
    expect(s.burgerShown).toBe(false);
    expect(s.inPanel).toBe(false);
  });

  test('放不下就自动收进汉堡，阅读训练那颗也一起进去', async ({ page, baseURL }) => {
    test.setTimeout(Math.min(currentTimeout() * 8, 45000));   // 这四条正常 3s 内跑完；卡住要早点红，别拖满预算
    await openAt(page, baseURL, 1280);
    await setLabels(page, SHORT);
    await waitsFor(page)(false);            // 前提：这一行本来就放得下
    await setLabels(page, LONG);
    await waitsFor(page)(true);             // 被撑宽 → 自动收
    const s = await state(page);
    expect(s.burgerShown).toBe(true);
    expect(s.inPanel).toBe(true);
    expect(s.barH).toBeLessThan(64);        // 收纳后顶栏仍只有一行
    await page.locator('#btnMenu').click();
    await expect(page.locator('.topbar-right')).toBeVisible();
    await expect(page.locator('.topbar-right .app-link')).toHaveAttribute('href', '../index.html');
  });

  test('窄屏一律走汉堡，面板里的按钮点得到', async ({ page, baseURL }) => {
    test.setTimeout(Math.min(currentTimeout() * 8, 45000));   // 这四条正常 3s 内跑完；卡住要早点红，别拖满预算
    await openAt(page, baseURL, 1440);
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
    test.setTimeout(Math.min(currentTimeout() * 8, 45000));   // 这四条正常 3s 内跑完；卡住要早点红，别拖满预算
    await openAt(page, baseURL, 1280);
    await setLabels(page, LONG);
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
    test.setTimeout(Math.min(currentTimeout() * 8, 45000));
    await openAt(page, baseURL, 1440);
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
