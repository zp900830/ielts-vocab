import type { Page } from '@playwright/test';

// CLOUD 是 index.html 里 classic script 的顶层 const：它在页面主作用域可见，
// 但**不是 window 属性** —— 回调里必须用裸标识符读，写成 window.CLOUD 拿到的是 undefined。
declare const CLOUD: {
  _on: boolean;
  _userMail: string;
  bootDone: Promise<unknown> | null;
  checkStatus(): Promise<unknown>;
};
declare const APP3: { updateMeCard(): void } | undefined;

/* 等 CLOUD.boot() 真的跑完（index.html 把在跑的 promise 挂在 CLOUD.bootDone 上）。
   不等的代价是并行负载下的偶发红：boot 收尾会拿它自己查到的 session 覆写 _userMail，
   而 E2E 没有真会话 —— 测试先点亮账号态、boot 后落，就把邮箱擦回空，
   下一次点「我的」弹出来的就不是浮窗而是登录弹窗（2026-10-08 全量跑到 424 绿、这 2 条红）。 */
export async function waitCloudBoot(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    try { return typeof CLOUD !== 'undefined' && !!CLOUD.bootDone; } catch (e) { return false; }
  });
  await page.evaluate(() => CLOUD.bootDone);
}

/* 把「我的」浮窗要的登录态点亮，并且是钉住的：等 boot 落定之后再写。
   只改数据不改门禁 —— 未登录该拦的路径（login-gate.spec.ts）一律别用这个。 */
export async function stubCloudAccount(page: Page, mail = 'alice@example.com'): Promise<void> {
  await waitCloudBoot(page);
  await page.evaluate((m) => {
    CLOUD._userMail = m;
    try { if (typeof APP3 !== 'undefined' && APP3) APP3.updateMeCard(); } catch (e) { /* 卡片还没渲出来，路由会补 */ }
  }, mail);
}

/* 让云音色开关停在测试要的位置，并且不再被真实状态查询改动：
   boot 之后还会把 _on 翻回 false 的只剩 checkStatus（拿不到会话就置 false），
   而带假 TTS 的用例根本不该依赖一次真的 12s 网络查询。 */
export async function stubCloudVoice(page: Page, on = true): Promise<void> {
  await waitCloudBoot(page);
  await page.evaluate((v) => {
    CLOUD.checkStatus = async () => v;
    CLOUD._on = v;
  }, on);
}
