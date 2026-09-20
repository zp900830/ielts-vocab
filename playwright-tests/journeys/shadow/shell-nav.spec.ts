// 顶栏收纳：一行放不下时整排工具收进汉堡，而不是让顶栏自己折成两排吃掉阅读区。
// 起因是他给的截图 —— 桌面宽度下顶栏已经排到第二行了。
import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

async function openAt(page: import('@playwright/test').Page, baseURL: string, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`${baseURL}/index.html`);
  await expect(page.locator('.sent').first()).toBeVisible();
}

// 把顶栏撑宽到一定放不下：音色名和登录态是线上最长的那两颗
async function fatten(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const vs = document.getElementById('voiceSel');
    vs.innerHTML = '<option>Guy · 美式男声 ★★★ Neuron Online (en-US) Microsoft Azure Speech'
      + ' —— 这是一颗长到会顶不下这一行的音色名</option>';
    document.getElementById('btnCloud').innerHTML = '<i class="ri-cloud-line"></i> 1013711120 已登录，点击可退出';
  });
  await page.waitForTimeout(300);
}

const state = (page: import('@playwright/test').Page) => page.evaluate(() => ({
  navMenu: document.body.classList.contains('nav-menu'),
  inPanel: !!document.querySelector('.topbar-right .app-link'),
  burgerShown: getComputedStyle(document.getElementById('btnMenu')).display !== 'none',
  barH: Math.round(document.querySelector('.topbar').getBoundingClientRect().height),
}));

test.describe('topbar collapse · 汉堡收纳', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);

  test('放得下就保持一行铺开，不出现汉堡', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout() * 8);
    await openAt(page, baseURL, 1440);
    const s = await state(page);
    expect(s.navMenu).toBe(false);
    expect(s.burgerShown).toBe(false);
    expect(s.inPanel).toBe(false);
  });

  test('放不下就自动收进汉堡，阅读训练那颗也一起进去', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout() * 8);
    await openAt(page, baseURL, 1280);
    expect((await state(page)).navMenu).toBe(false);   // 先确认是「被撑宽」触发的，不是一开始就收着
    await fatten(page);
    const s = await state(page);
    expect(s.navMenu).toBe(true);
    expect(s.burgerShown).toBe(true);
    expect(s.inPanel).toBe(true);
    // 收纳后顶栏仍只有一行
    expect(s.barH).toBeLessThan(64);
    await page.locator('#btnMenu').click();
    await expect(page.locator('.topbar-right')).toBeVisible();
    await expect(page.locator('.topbar-right .app-link')).toHaveAttribute('href', '../index.html');
  });

  test('窄屏一律走汉堡，面板里的按钮点得到', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout() * 8);
    await openAt(page, baseURL, 390);
    const s = await state(page);
    expect(s.navMenu).toBe(true);
    expect(s.barH).toBeLessThan(64);
    await page.locator('#btnMenu').click();
    const panel = page.locator('.topbar-right');
    await expect(panel).toBeVisible();
    await expect(panel.locator('#btnZh')).toBeVisible();
    // 面板浮在正文上，不是把正文顶下去
    const box = await panel.boundingBox();
    const bar = await page.locator('.topbar').boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(bar.y + bar.height - 1);
  });

  test('滚动收缩态下面板照样打得开（body.scrolled 不许把它压没）', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout() * 8);
    await openAt(page, baseURL, 900);
    await fatten(page);
    expect((await state(page)).navMenu).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(400);
    await page.locator('#btnMenu').click();
    await expect(page.locator('.topbar-right')).toBeVisible();
    await expect(page.locator('.topbar-right #btnZh')).toBeVisible();
  });
});
