// 2026-09-27：云端音色队列防死锁。
// 真机偶发 fetch 不响应 AbortSignal（弱网 / 浏览器 bug），导致 _drain 的消费者 _busy
// 永远不被释放，后续所有句子都排不进队列 → 用户看到「云端语音合成中…」一直转、没声音。
// 修复：_drain 给每个 job 加 25s 安全网，超时就 reject 并释放消费者，保证队列能继续。
import { test, expect } from '@playwright/test';

const rootUrl = 'http://127.0.0.1:8932';

const SIXQ: Record<string, string> = (() => {
  const words = ['apple', 'banana', 'cherry', 'date'];
  const vocab: Record<string, { m: string }> = {};
  words.forEach((w, i) => { vocab[w] = { m: 'n. ' + ['苹果', '香蕉', '樱桃', '枣'][i] }; });
  const mk = (title: string, ai: number, n: number) => ({
    title, zh: title, subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) => `Sentence ${i} about [[${words[(ai + i) % words.length]}:${words[(ai + i) % words.length]}]].`)],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
    paraZh: [''],
  });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i, i === 0 ? 8 : 2))),
    'vocab.json': JSON.stringify(vocab),
    'chapters.json': '[]',
  };
})();

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/shadow/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

async function waitAppReady(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    try {
      return typeof SECTIONS !== 'undefined' && SECTIONS.length > 0
        && typeof TASK !== 'undefined' && typeof dataReady !== 'undefined' && dataReady;
    } catch (e) { return false; }
  }, undefined, { timeout: 30000 });
}

test.describe('3.0 云端音色：队列防死锁', () => {
  test('fetch 不响应 abort 时，队列安全网会释放消费者并降级', async ({ page }) => {
    test.setTimeout(20000);
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitAppReady(page);

    const r = await page.evaluate(async () => {
      const w = window as any;
      w.__fb = [];
      w.__done = { ok: false };
      const cloud = CLOUD as any;
      cloud._on = true;
      cloud._jobTimeout = 500; // 测试里把安全网改成 500ms，避免等 25s

      // 模拟一个彻底挂死的 fetch：既不 resolve，也不响应 abort
      let hangCalls = 0;
      cloud._fetchTTS = async (_t: string, _v: string, _r: number, signal?: AbortSignal) => {
        hangCalls++;
        return new Promise((_resolve) => {
          if (signal) signal.addEventListener('abort', () => { /* 故意不 reject */ });
        });
      };

      const audio = {
        paused: false, ended: false, src: '', onended: null as null | (() => void),
        play: () => Promise.resolve(), pause: () => {}, addEventListener: () => {}, setAttribute: () => {},
      };
      cloud._ensureAudio = () => audio as any;

      // 起播第一句
      cloud.play('S1', 'en-GB-SoniaNeural', 1, 0,
        () => { w.__done.ok = true; },
        (e: Error) => { w.__fb.push(e && e.message); });

    // 等 _drain 安全网超时（测试里改到 500ms）
    await new Promise((res) => setTimeout(res, 1200));

      const state1 = {
        busy: cloud._busy,
        qLength: cloud._q.length,
        pendSize: cloud._pend.size,
        fb: w.__fb.slice(),
        done: w.__done.ok,
        hangCalls,
      };

      // 此时再尝试起播第二句，模拟「跟读下一句」
      cloud.play('S2', 'en-GB-SoniaNeural', 1, 1,
        () => {},
        (e: Error) => { w.__fb.push(e && e.message); });

      await new Promise((res) => setTimeout(res, 500));

      return {
        ...state1,
        afterQ: cloud._q.length,
        afterFb: w.__fb.slice(),
      };
    });

    expect(r.busy, '安全网触发后队列消费者应该释放').toBe(false);
    expect(r.fb, '首句应触发 fallback').toContain('timeout');
    expect(r.afterFb, '死锁解除后下一句也不应卡住').toContain('timeout');
  });
});
