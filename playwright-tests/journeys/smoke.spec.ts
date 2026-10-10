import { test, expect } from '../fixtures';

// 服务器归 global-setup.ts 起停，这里只取地址（以前各 spec 自己起停会互杀，见 global-setup.ts）
const rootUrl = process.env.E2E_ROOT_URL || '';

function ignoreKnownErrors(page: any) {
  const errors: string[] = [];
  page.on('pageerror', (err: Error) => errors.push(err.message));
  page.on('console', (msg: any) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('favicon.ico')) return;
      if (text.includes('Manifest')) return;
      if (text.includes('Failed to load resource')) return;
      errors.push(text);
    }
  });
  return errors;
}

test.describe('Smoke tests for admin', () => {
  test('admin login page renders and dark mode works', async ({ page }) => {
    const errors = ignoreKnownErrors(page);

    await page.goto(`${rootUrl}/admin/index.html`);
    await expect(page).toHaveTitle(/管理后台/);

    await expect(page.locator('.sr-only-focusable')).toHaveAttribute('href', '#app');
    await expect(page.getByPlaceholder('管理员邮箱')).toBeVisible();
    await expect(page.getByPlaceholder('密码')).toBeVisible();
    await expect(page.getByRole('button', { name: '登录' })).toBeVisible();

    const darkBtn = page.locator('#darkToggle');
    await expect(darkBtn).toBeVisible();
    await darkBtn.click();
    await expect(page.locator('body')).toHaveClass(/dark/);

    expect(errors).toEqual([]);
  });

  /* 回归锁（2026-10-10）：admin 页第三方资源全部本地自托管（原来是 fastly.jsdelivr.net）。
     为什么要有这条：本机/国内 jsdelivr 常不可达，外链一断 Vue 就加载不出来、<el-input>
     永远不渲染 —— 上面那条用例会红，但红出来的是「表单不可见」，不告诉你原因；
     真回归（谁手滑改回远端引用、或漏拷文件）需要一条**断言级的锁**直接点名。 */
  test('admin 页第三方资源全部本地自托管（不许出现远端引用）', async ({ page }) => {
    await page.goto(`${rootUrl}/admin/index.html`);
    const assets = await page.evaluate(() =>
      Array.from(document.querySelectorAll('script[src], link[href]')).map(
        (el) => el.getAttribute('src') || el.getAttribute('href') || '',
      ),
    );
    // ① 不许有任何 http(s) 远端引用
    expect(assets.filter((u) => /^https?:/i.test(u))).toEqual([]);
    // ② 关键本地文件必须挂在页面上（版本钉死；升级库时这里跟着改）
    const pinned = [
      '../vendor/vue/vue-3.5.43.global.prod.js',
      '../vendor/element-plus/element-plus-2.14.7.css',
      '../vendor/element-plus/element-plus-2.14.7.full.min.js',
      '../vendor/element-plus/element-plus-2.14.7.zh-cn.min.js',
      '../vendor/echarts/echarts-5.6.0.min.js',
      '../vendor/supabase/supabase-js-2.117.3.js',
    ];
    for (const u of pinned) {
      expect(assets, `页面缺少本地资源 ${u}`).toContain(u);
      // ③ 文件必须真的存在（第一个用例会把 404 当成可过滤的控制台噪音，抓不住「文件漏拷」）
      const res = await page.request.get(`${rootUrl}/${u.replace('../', '')}`);
      expect(res.status(), `本地资源缺失：${u}`).toBe(200);
    }
  });
});
