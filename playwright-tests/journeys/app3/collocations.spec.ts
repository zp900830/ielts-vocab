// 3.0 词伙表（2026-10-17）：路由 #/collocations，数据 data/collocations.json
// 与单词本同族（.words-page/.wb-list/.wb-row），额外锁三件事：
// ① 已覆盖在前、未覆盖在后；② 未覆盖整行置灰；③ 搜索只筛不跳组。
import { test, expect } from '../../fixtures';

const rootUrl = process.env.E2E_ROOT_URL || '';

test.describe('3.0 词伙表', () => {
  test('导航进词伙表：总数口径正确，首屏只有已覆盖条目', async ({ page }) => {
    await page.goto(`${rootUrl}/index.html#/collocations`);
    await expect(page.locator('.sidenav .nav-item.on')).toHaveAttribute('data-route', 'collocations');
    await expect(page.locator('.cl-page .pg-title')).toHaveText('词伙表');

    const count = page.locator('#clCount');
    await expect(count).not.toHaveText('加载中…');   // 懒加载：等数据到位再看口径
    await expect(count).toHaveText(/^共 \d+ 条 · 已覆盖 \d+ 条 · 未覆盖 \d+ 条$/);
    const m = (await count.innerText()).match(/共 (\d+) 条 · 已覆盖 (\d+) 条 · 未覆盖 (\d+) 条/);
    expect(m).not.toBeNull();
    const total = Number(m![1]), cov = Number(m![2]), off = Number(m![3]);
    expect(cov + off).toBe(total);
    expect(total).toBeGreaterThan(3000);

    await expect(page.locator('#clList .cl-row').first()).toBeVisible();
    // 首屏（100 条）全是已覆盖；置灰段还没进入视口
    await expect(page.locator('#clList .cl-row.off')).toHaveCount(0);
    await expect(page.locator('#clJump')).toBeVisible();
  });

  test('跳到未覆盖：灰段排最后、整行压暗，且不可能混进已覆盖组', async ({ page }) => {
    await page.goto(`${rootUrl}/index.html#/collocations`);
    await expect(page.locator('#clCount')).not.toHaveText('加载中…');
    await page.locator('#clJump').click();

    await expect(page.locator('#clList .cl-sec')).toBeVisible();
    await expect(page.locator('#clList .cl-sec')).toContainText('未覆盖');
    const offRows = page.locator('#clList .cl-row.off');
    await expect(offRows.first()).toBeVisible();
    expect(await offRows.count()).toBeGreaterThan(0);

    // 置灰 = 透明度压到 .42（深浅两档同值）
    const op = await offRows.first().evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(op).toBeLessThan(0.6);
    // 灰段在已覆盖之后：最后一个非灰行必须排在第一个灰行之前
    const order = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('#clList .cl-row')];
      const firstOff = rows.findIndex((r) => r.classList.contains('off'));
      const lastOn = rows.map((r) => !r.classList.contains('off')).lastIndexOf(true);
      return { firstOff, lastOn };
    });
    expect(order.lastOn).toBeLessThan(order.firstOff);
  });

  test('搜索：英中都能命中，计数改报「匹配 N 条」', async ({ page }) => {
    await page.goto(`${rootUrl}/index.html#/collocations`);
    await expect(page.locator('#clCount')).not.toHaveText('加载中…');

    await page.locator('#clSearch').fill('pollution');
    await expect(page.locator('#clCount')).toHaveText(/^匹配 \d+ 条（共 \d+ 条）$/);
    const en = await page.locator('#clList .cl-en').allInnerTexts();
    expect(en.length).toBeGreaterThan(0);
    expect(en.join(' ').toLowerCase()).toContain('pollution');
    await expect(page.locator('#clJump')).toBeHidden();

    await page.locator('#clSearch').fill('污染');
    const zh = await page.locator('#clList .cl-zh').allInnerTexts();
    expect(zh.length).toBeGreaterThan(0);
    expect(zh.join(' ')).toContain('污染');

    await page.locator('#clSearch').fill('zzzz-no-such-colloc');
    await expect(page.locator('#clList .cl-sec')).toHaveText('没有匹配的词伙');
    await expect(page.locator('#clCount')).toHaveText('匹配 0 条（共 3320 条）');
  });
});
