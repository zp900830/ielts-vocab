// 3.0 故事脉络二级页（2026-10-10 用户加：入口在「我的」最后一行，路由 #/story；可深链、可返回首页）。
// 这条锁钉四件事：
//   ① 入口形态 —— PC 浮窗 / 手机端页面里那行的位置（最后一行）与去路（PC 先收浮窗再切路由）；
//   ② 它是**纯静态内容页** —— 数据接口全空 + 未登录的冷启动直链也必须整页画全（不挂 loading、不弹登录）；
//   ③ 页面上的篇数/句数/卷数/每卷「段号范围 + 句数」与 data/sections.json 逐条对账。
//      这些数写死在 app.js 的 STORY_STOPS 里，数据一改就必须连页面一起改 —— 这正是这条锁的意义；
//   ④ 两条动作出口：返回首页回 #/home（不是 history.back，深链背后没有上一页）、
//      「去读这一篇」与首页卡片同一个 openArticle（因此也共用同一道登录闸）。
//      注意：fixtures.ts 的 e2eAuth 后门让 isLoggedIn() 在测试里恒为真，「未登录被拦下」那一支
//      在这里测不到（那条口径归 login-gate.spec.ts），这里只锁"点得通、进得去这一篇"。
// 服务器归 global-setup.ts 起停（仓库根 8932）；站点在仓库根，同 home/stats，用 E2E_ROOT_URL，不走 baseURL。
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '../../fixtures';

declare const TASK: {
  active: boolean;
  resetV2(): void;
  initPlan(minutes: number): void;
  state(): Record<string, unknown> | null;
};

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 六篇小壳（与 me5.spec.ts 同款，缩到每篇 1 句）：故事页自己不读数据，
   但「返回首页 / 去读这一篇」两条出口要落回真页面，所以给一份够用的壳。 */
const SIX: Record<string, string> = (() => {
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  const mk = (title: string) => ({
    title, zh: title, subheads: [''],
    paragraphs: [['Sentence about [[word:word]].']],
    sentZh: [['第 1 句。']],
    paraZh: [''],
  });
  return {
    'sections.json': JSON.stringify(titles.map(mk)),
    'vocab.json': JSON.stringify({ word: { m: 'word' } }),
    'chapters.json': '[]',
  };
})();
const EMPTY: Record<string, string> = { 'sections.json': '[]', 'vocab.json': '{}', 'chapters.json': '[]' };

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}
const waitTask = (page: import('@playwright/test').Page) =>
  page.waitForFunction(() => { try { return typeof TASK !== 'undefined' && !!TASK.state; } catch (e) { return false; } });
/* 「我的」两个宿主（与 me-page/me5 同一颗判据）：PC = #mePop 浮窗，手机端 = #/me 一级页。 */
const isMobileVp = (page: import('@playwright/test').Page) =>
  page.evaluate(() => window.matchMedia('(max-width: 700px)').matches);
const openMe = async (page: import('@playwright/test').Page) => {
  const mobile = await isMobileVp(page);
  const host = page.locator(mobile ? '#appView .me-page' : '#mePop');
  const modal = page.locator('#loginModal');
  await page.locator('#meCard').click();
  if (await modal.isVisible()) await modal.locator('[data-login-settings]').click();
  if (!mobile && !(await host.isVisible())) await page.locator('#meCard').click();
  await expect(host).toBeVisible();
  return host;
};

/* ---- 对账用：由 data/sections.json 推出「每卷：名字 + 段号范围 + 句数」----
   卷边界 = subheads 数组里非空的那些位置（与页面上写死的口径同一份来源）。 */
type Sec = { title: string; paragraphs: string[][]; subheads?: string[] };
const DATA: Sec[] = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), '..', 'data', 'sections.json'), 'utf8')) as Sec[];
const sentsOf = (s: Sec) => s.paragraphs.reduce((a, p) => a + p.length, 0);
const sentsOfTotal = () => DATA.reduce((a, s) => a + sentsOf(s), 0);
function volsOf(s: Sec) {
  const sh = s.subheads || [];
  const starts = sh.map((v, k) => (v ? k : -1)).filter((k) => k >= 0);
  return starts.map((k, n) => {
    const end = n + 1 < starts.length ? starts[n + 1] - 1 : s.paragraphs.length - 1;
    const sents = s.paragraphs.slice(k, end + 1).reduce((a, p) => a + p.length, 0);
    /* 页面上写的是简称，这里按同一套规则缩写：
       「第一卷·远行——从课堂到山海极地」→「卷一 · 远行」；「下篇·老屋餐厅」→「下篇 · 老屋餐厅」 */
    const name = sh[k].split('——')[0]
      .replace(/^第([一二三四五六七八九十])卷·/, '卷$1 · ')
      .replace(/^(上篇|下篇)·/, '$1 · ');
    return { name, range: `P${k}–${end}`, sents };
  });
}
const EXPECT_VOLS = DATA.flatMap(volsOf);
const EXPECT_META = DATA.map((s) => `${sentsOf(s)} 句 · ${volsOf(s).length} 卷`);
const STOP_NAMES = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];

test.describe('3.0 故事脉络（#/story）', () => {
  test('入口：PC 浮窗最后一行是「故事脉络」，点了先收浮窗再切到 #/story', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/index.html#/home`);
    await waitTask(page);
    const pop = await openMe(page);

    // 位置锁：就是最后一行（用户在「数据」后面要的那一行），且不是外链
    const last = pop.locator('.mp-row').last();
    await expect(last.locator('.mp-label'), '最后一行是「故事脉络」').toHaveText('故事脉络');
    await expect(last.locator('[data-me-story]')).toBeVisible();
    expect(await pop.locator('a[href]').count(), '仍然没有外链入口').toBe(0);

    await last.locator('[data-me-story]').click();
    expect(await page.evaluate(() => location.hash), '点了就切路由').toBe('#/story');
    await expect(page.locator('#mePop'), 'PC 浮窗先收掉，不压在页面上').toBeHidden();
    await expect(page.locator('#appView .story-page')).toBeVisible();
  });

  test('手机端：这一行在「我的」页面里，点了切路由（浮窗仍是空壳）', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/index.html#/home`);
    await waitTask(page);
    const me = await openMe(page);
    await expect(me.locator('.mp-row .mp-label').last()).toHaveText('故事脉络');

    await me.locator('[data-me-story]').click();
    expect(await page.evaluate(() => location.hash)).toBe('#/story');
    await expect(page.locator('#appView .story-page')).toBeVisible();
    expect(await page.locator('#mePop').evaluate((el) => el.innerHTML.trim()),
      '浮窗在手机端保持空壳').toBe('');
  });

  test('冷启动直链：数据接口全空 + 未登录，整页照样画全（不挂 loading、不弹登录）', async ({ page }) => {
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/index.html#/story`);

    const pg = page.locator('#appView .story-page');
    await expect(pg, '直链直接画，不等 dataReady').toBeVisible();
    await expect(pg.locator('.pg-title')).toHaveText('故事脉络');
    // 三个模块都到位：六站路线 / 曲线 / 人物矩阵 / 接力 / 用法
    await expect(pg.locator('.sy-stop')).toHaveCount(6);
    await expect(pg.locator('.sy-trend svg')).toHaveCount(1);
    await expect(pg.locator('.sy-relay-row')).toHaveCount(5);
    await expect(pg.locator('.sy-usage')).toHaveCount(1);
    // 人物矩阵：1 行表头 + 11 位人物（2026-10-10 把「林（孙辈）」从注释提成独立一行 ——
    // 篇4 下篇/篇5 的终章主角不能在矩阵里缺席）
    await expect(pg.locator('.sy-cast[role="table"]')).toHaveCount(1);
    await expect(pg.locator('.sy-cast-row')).toHaveCount(12);
    // 同名族说明必须在（「林」「梅」都是同名不同人，这条是给记忆兜底的）
    await expect(pg.locator('.sy-cast-note')).toContainText('同名族');
    await expect(page.locator('#loginModal'), '故事页不该把登录弹窗叫出来').toBeHidden();
  });

  test('内容对账：每篇句数/卷数、每卷「段号范围 + 句数」与 data/sections.json 完全一致', async ({ page }) => {
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/index.html#/story`);
    const pg = page.locator('#appView .story-page');
    await expect(pg).toBeVisible();

    // ① 六站顺序与篇名
    await expect(pg.locator('.sy-name')).toHaveText(STOP_NAMES);
    // ② 每站「N 句 · M 卷」
    const metas = await pg.locator('.sy-stop .sy-meta').evaluateAll((els) =>
      els.map((el) => ((el.querySelector('span') as HTMLElement | null)?.textContent || '').trim()));
    expect(metas, '篇句数 / 卷数对账').toEqual(EXPECT_META);
    // ③ 每卷「名字 + 段号范围 + 句数」逐条对上（顺序也要对）
    const vols = await pg.locator('.sy-volname').evaluateAll((els) =>
      els.map((el) => (el.textContent || '').trim()));
    const parsed = vols.map((t) => {
      const m = /^(.*?)(P\d+–\d+) · (\d+) 句$/.exec(t);
      return m ? { name: m[1].trim(), range: m[2], sents: Number(m[3]) } : { name: `无法解析：${t}`, range: '', sents: -1 };
    });
    expect(parsed, '每卷名字 / 段号范围 / 句数对账').toEqual(EXPECT_VOLS);
    // ④ 总数：六篇 1833 句（页头那句写死的总数）
    expect(sentsOfTotal(), '六篇总句数应为 1833').toBe(1833);
    const text = await pg.evaluate((el) => el.textContent || '');
    expect(text, '页头总数与数据一致').toContain('1833 句');
    expect(EXPECT_VOLS.length, '全书卷数 = 篇0 四卷 + 其余五篇各两卷').toBe(14);
  });

  test('两条出口：返回首页回 #/home 且导航态跟着走；二级页本身不点亮任何导航项', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/index.html#/story`);
    await waitTask(page);
    const pg = page.locator('#appView .story-page');
    await expect(pg).toBeVisible();
    await expect(page.locator('.sidenav .nav-item.on'), '二级页不该把任何一项导航点亮').toHaveCount(0);

    // 返回首页：显式路由回 #/home（深链进来时背后没有上一页，所以不走 history.back）
    await pg.locator('.sy-back').click();
    expect(await page.evaluate(() => location.hash)).toBe('#/home');
    await expect(page.locator('#appView .art-card'), '真的落在首页上了').toHaveCount(6);
    await expect(page.locator('.sidenav .nav-item.on'), '回到首页后导航态要跟着回来').toHaveCount(1);
    await expect(page.locator('.sidenav .nav-item.on')).toHaveAttribute('data-route', 'home');
  });

  test('去读这一篇：走 openArticle，进这一篇的任务模式（与首页卡片同一条码路）', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/index.html#/story`);
    await waitTask(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });

    await page.locator('#appView .story-page .sy-read').first().click();
    await expect(page.locator('body'), '进任务模式').toHaveClass(/task-mode/);
    await expect(page.locator('#taskBar')).toBeVisible();
    expect(await page.evaluate(() => TASK.active), '任务真的活了').toBe(true);
    await expect(page.locator('#ttTitle .tt-zh'), '进的是第 0 站那一篇').toHaveText('地球与生命');
  });

  test('图标字形真的渲得出（18 颗 ri-*，字体 4.5.0 里有字形）', async ({ page }) => {
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/index.html#/story`);
    const icons = page.locator('#appView .story-page i[class*="ri-"]');
    /* 1 返回 + 6 篇图标 + 6 承接点 + 5 接力箭头 = 18 */
    await expect(icons).toHaveCount(18);
    await page.waitForFunction(() => {
      const els = document.querySelectorAll('#appView .story-page i[class*="ri-"]');
      if (els.length !== 18) return false;
      return Array.from(els).every((el) => {
        const c = getComputedStyle(el, '::before').content;
        return !!c && c !== 'none' && c !== 'normal';
      });
    }, null, { timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('16px remixicon')), 'remixicon 未加载').toBe(true);
  });

  test('深色：卡片不是白底、标题字不是黑（本页无 body.dark 覆盖，全靠 token）', async ({ page }) => {
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/index.html#/story`);
    const card = page.locator('#appView .sy-card').first();
    const read = async () => card.evaluate((el) => ({
      bg: getComputedStyle(el).backgroundColor,
      name: getComputedStyle(el.querySelector('.sy-name') as HTMLElement).color,
    }));
    const light = await read();
    await page.evaluate(() => document.body.classList.add('dark'));
    const dark = await read();
    expect(dark.bg, '深色下卡片必须换底').not.toBe(light.bg);
    expect(dark.bg).not.toBe('rgb(255, 255, 255)');
    expect(dark.name, '深色下篇名必须换字色').not.toBe(light.name);
    expect(dark.name).not.toBe('rgb(0, 0, 0)');
  });

  test('触摸目标：返回键与每站那颗「去读这一篇」≥44px（手机视口）', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/index.html#/story`);
    const pg = page.locator('#appView .story-page');
    await expect(pg).toBeVisible();
    for (const sel of ['.sy-back', '.sy-read']) {
      const t = pg.locator(sel).first();
      await expect(t).toBeVisible();
      const h = await t.evaluate((el) => el.getBoundingClientRect().height);
      expect(h, `${sel} 触摸目标`).toBeGreaterThanOrEqual(44);
    }
    // 手机档不横向溢出（场景链 nowrap 只在链内部换行）
    const wide = await pg.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(wide, '故事页不该横向溢出').toBeLessThanOrEqual(0);
  });
});
