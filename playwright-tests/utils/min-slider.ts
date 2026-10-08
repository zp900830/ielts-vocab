import type { Locator } from '@playwright/test';

/* 「每天有多少分钟」滑块（5..240，步长 5）的测试用操作。
   Playwright 的 fill() 不接 input[type=range]，只能走 DOM 设值；这里把 range 原生拖动收尾会发的
   两个事件补齐（input=拖的过程中、change=松手落账），这样测的还是产品真实监听的那两个事件。
   真按键路径（方向键会由浏览器自己发 input+change）另有专门的用例覆盖，不靠这里代替。 */

/** 拖到某档但**不松手**：只发 input。 */
export async function slideMin(slider: Locator, minutes: number): Promise<void> {
  await slider.evaluate((el, m) => {
    const i = el as HTMLInputElement;
    i.value = String(m);
    i.dispatchEvent(new Event('input', { bubbles: true }));
  }, minutes);
}

/** 拖到某档并**松手**：input + change（= 落账）。 */
export async function setMin(slider: Locator, minutes: number): Promise<void> {
  await slider.evaluate((el, m) => {
    const i = el as HTMLInputElement;
    i.value = String(m);
    i.dispatchEvent(new Event('input', { bubbles: true }));
    i.dispatchEvent(new Event('change', { bubbles: true }));
  }, minutes);
}

/** 读滑块本身的状态：档位 + 当前值 + 读数文本。 */
export async function readMinSlider(slider: Locator): Promise<{ min: string; max: string; step: string; value: string }> {
  return slider.evaluate((el) => {
    const i = el as HTMLInputElement;
    return { min: i.min, max: i.max, step: i.step, value: i.value };
  });
}
