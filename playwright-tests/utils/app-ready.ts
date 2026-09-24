import type { Page } from '@playwright/test';

// shadow/index.html 的 app globals 是 classic script 的顶层 let：在页面主作用域
// 可见，但**不是 window 属性** —— waitForFunction 回调里必须用裸标识符读取。
declare const dataReady: boolean;
declare const sents: unknown[];

/* shadow 应用的启动闸门（对应 app3 各 spec 里内联的那份 waitAppReady）。
   page.goto()/page.reload() 在 load 事件就返回，而 initApp 里的
   loadData().then(render/loadPos/…) 仍在异步跑：loadData 要 fetch 三份 JSON，
   数据落地前 sents 是空数组，此时 playFrom(i) 会走 `i >= sents.length` 分支
   静默 no-op（连 savePos 都不写），loadPos 也无句可依。
   全量并行、静态服务器被拖慢时便偶发（2026-09-24 复现 3/25 @ workers=8）。
   等 sents 渲染出来，任何依赖句子数组的 evaluate 才真正生效。 */
export async function waitShadowReady(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    try {
      return dataReady === true && typeof sents !== 'undefined' && sents.length > 0;
    } catch (e) {
      return false;
    }
  });
}
