// 2026-09-28 云端卡顿两件套：
// A. 预热——预取以前只在 launch（开播）里发生，首句永远冷、切音色后全冷。
//    入口/切音色/随身听开门时把后面 8 句先丢进后台合成。
// B. 正式播放优先——串行队列里正在执行的预取（20s 上限）stop 清不掉，
//    新起播干等它。stop 现在把它掐掉，新播放立刻拿到槽位。
import { test, expect } from '../../fixtures';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  state(): { daily: Record<string, unknown> };
};
declare const SECTIONS: unknown[];

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 六篇 stub（抄 task-exit.spec.ts 同一套）：第 0 篇 12 句，其余各 2 句。 */
const SIX: Record<string, string> = (() => {
  const mk = (title: string, ai: number, n: number) => ({
    title,
    zh: title,
    subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) => `Sentence ${i} about [[a${ai}_w${i}:a${ai}_w${i}]].`)],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
    paraZh: [''],
  });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i, i === 0 ? 12 : 2))),
    'vocab.json': '{}',
    'chapters.json': '[]',
  };
})();

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/shadow/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }),
    );
  }
}

async function waitAppReady(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    try {
      return typeof SECTIONS !== 'undefined' && SECTIONS.length > 0
        && typeof TASK !== 'undefined' && !!(TASK.state() && TASK.state().daily);
    } catch (e) { return false; }
  });
}

test('进文章即预热后面几句：开播前后台已合成', async ({ page }) => {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/app/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.evaluate(() => { localStorage.setItem('ielts-voice', 'cloud:test-voice'); });
  await page.reload();
  await waitAppReady(page);
  // 上线云开关 + 录音 fetch（即时 resolve，不真请求网络）
  await page.evaluate(() => {
    const w = window as unknown as { __fetched: string[] };
    const cloud = CLOUD as any;
    w.__fetched = [];
    cloud._on = true;
    cloud._fetchTTS = async (t: string) => {
      w.__fetched.push(t.slice(0, 30));
      return new Blob(['x'], { type: 'audio/mpeg' });
    };
  });
  await page.locator('.art-card').first().click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  // 入口不自动播，但预取已经跑了后面几句
  await page.waitForFunction(() => (window as unknown as { __fetched: string[] }).__fetched.length >= 3,
    undefined, { timeout: 15000 });
  const hl = await page.evaluate(() =>
    Array.from(document.querySelectorAll('#art .sent')).findIndex((el) => el.classList.contains('playing')));
  const nums = await page.evaluate(() =>
    (window as unknown as { __fetched: string[] }).__fetched.map((t) => {
      const m = /Sentence (\d+) about/.exec(t);
      return m ? Number(m[1]) : -1;
    }));
  for (const n of [hl + 1, hl + 2, hl + 3]) {
    expect(nums, `高亮后面第 ${n} 句应已预合成`).toContain(n);
  }
});

test('正式播放不等慢预取：stop 掐掉执行中的预取，新播放立刻拿到槽位', async ({ page }) => {
  test.setTimeout(25000);
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/app/index.html#/home`);
  await waitAppReady(page);
  const r = await page.evaluate(async () => {
    const w = window as unknown as { __n: number; __aborted: boolean };
    const cloud = CLOUD as any;
    cloud._on = true;
    const audio = {
      paused: false, ended: false, src: '',
      onended: null as null | (() => void), onerror: null, onpause: null,
      play: () => {
        Promise.resolve().then(() => { try { audio.onended && audio.onended(); } catch (e) {} });
        return Promise.resolve();
      },
      pause: () => {}, addEventListener: () => {}, setAttribute: () => {},
    };
    cloud._ensureAudio = () => audio as any;
    w.__n = 0; w.__aborted = false;
    cloud._fetchTTS = async (t: string, _v: string, _r: number, signal?: AbortSignal) => {
      w.__n++;
      // 慢预取：永远挂起（除非被 abort）——复现弱网下堵住队列的请求
      if (t.indexOf('slow') >= 0) {
        return new Promise((_res, rej) => {
          if (signal) signal.addEventListener('abort', () => {
            w.__aborted = true;
            const e: any = new Error('aborted');
            e.name = 'AbortError';
            rej(e);
          });
        });
      }
      return new Blob(['x'], { type: 'audio/mpeg' });
    };
    cloud.prefetch('slow-prefetch-sentence', 'v', 1);
    await new Promise((res) => setTimeout(res, 800));   // 等慢预取进入执行态
    const my = ++speakToken;
    const done = await new Promise((resolve) => {
      const to = setTimeout(() => resolve({ timeout: true }), 8000);
      cloud.play('quick-now', 'v', 1, my,
        () => { clearTimeout(to); resolve({ ok: true }); },
        (e: Error) => { clearTimeout(to); resolve({ fb: String(e && e.message) }); });
    });
    return { done, aborted: w.__aborted, n: w.__n };
  });
  expect(r.aborted, '慢预取应被掐掉，不许占着槽位').toBe(true);
  expect(r.done, '新播放不等慢预取，立刻播完').toEqual({ ok: true });
});

test('双通道：两个预取可并发，后发的快请求先完成', async ({ page }) => {
  test.setTimeout(25000);
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/app/index.html#/home`);
  await waitAppReady(page);
  const order = await page.evaluate(async () => {
    const w = window as unknown as { __order: string[] };
    const cloud = CLOUD as any;
    cloud._on = true;
    w.__order = [];
    cloud._fetchTTS = async (t: string) => {
      // 慢请求 1200ms，快请求 100ms：串行必定慢先完成，双通道快先完成
      await new Promise((res) => setTimeout(res, t.indexOf('slow-A') >= 0 ? 1200 : 100));
      w.__order.push(t);
      return new Blob(['x'], { type: 'audio/mpeg' });
    };
    cloud.prefetch('slow-A-prefetch', 'v', 1);
    cloud.prefetch('fast-B-prefetch', 'v', 1);
    await new Promise((res) => setTimeout(res, 3000));
    return w.__order.slice();
  });
  expect(order.length, '两个预取都应完成').toBe(2);
  expect(order[0], '快请求先完成（双通道并发）').toContain('fast-B');
  expect(order[1], '慢请求后完成').toContain('slow-A');
});
