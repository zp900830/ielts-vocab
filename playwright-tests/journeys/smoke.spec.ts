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

test.describe('Smoke tests for non-shadow pages', () => {
  test('index.html loads and basic interactions work', async ({ page }) => {
    const errors = ignoreKnownErrors(page);

    await page.goto(`${rootUrl}/index.html`);
    await expect(page).toHaveTitle(/雅思词汇真经/);

    const skip = page.locator('.sr-only-focusable');
    await expect(skip).toHaveAttribute('href', '#app');
    await expect(page.locator('h1.sr-only')).toHaveText('雅思词汇真经 · 情境阅读训练');

    const darkBtn = page.locator('#darkBtn');
    await expect(darkBtn).toBeVisible();
    await darkBtn.click();
    await expect(page.locator('body')).toHaveClass(/dark/);
    await darkBtn.click();
    await expect(page.locator('body')).not.toHaveClass(/dark/);

    const accentBtn = page.locator('#accentBtn');
    await expect(accentBtn).toHaveText('🇬🇧 英音');
    await accentBtn.click();
    await expect(accentBtn).toHaveText('🇺🇸 美音');

    // 两个应用各自独立：阅读这边不许再出现跳去影子跟读的入口（他明确说没这个诉求）
    await expect(page.locator('#shadowLink')).toHaveCount(0);
    const toShadow = await page.evaluate(() => [...document.querySelectorAll('a[href]')]
      .map(a => a.getAttribute('href')!)
      .filter(h => h.includes('shadow')));
    expect(toShadow).toEqual([]);

    expect(errors).toEqual([]);
  });

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
});
