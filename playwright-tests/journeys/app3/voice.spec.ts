// 2026-09-25 refine3 ①②：音色全局立刻生效 + 云端音色"总是加载不到"的真因修复。
//
// 真因（见 /tmp/refine3-report.md）：
//   云端连播时，上一轮 launch 会预取下一句 i+1；这句放完 → launch(i+1) → speak → CLOUD.play。
//   play 起手调 stop()，把队列里 i+1 的预取 job 连同其它旧预取一起 reject 成 'stale'。
//   play 随后 synth() 命中 `_pend` 里那条"刚被拒绝的预取 promise" → 当成当句合成失败 →
//   降级本地音色 + 弹「本句改用本地音色：stale」。几乎每句都发生，所以用户体感是"总是加载不到"。
// 修法：play 起播前 stop(clipKey) 只清别的、留下本句同 key 的预取（keepKey）；万一 stale 漏到当句，
//   也只重开一份全新合成重试，绝不因此降级本地 / 不弹降级提示。
//
// 锁 1：stop(keepKey) 语义（留下同 key，其它 reject 成 stale）。
// 锁 2：预取与起播同一句时，play 复用预取、不触发 fallback（反向：旧代码必红 → __fb=['stale']）。
// 锁 3：改音色立刻生效 —— 正在播时换音色会用新音色就地重播当前句（真断言 utterance.voice 变了）。
import { test, expect } from '../../fixtures';

declare const TASK: { resetV2(): void; initPlan(minutes: number): void; next(): void };
declare const CLOUD: {
  _on: boolean; _busy: boolean; _q: unknown[]; _pend: Map<string, unknown>;
  _enqueue(fn: () => Promise<unknown>, ctl: unknown, key: string): Promise<unknown>;
  _drain(): void;
  stop(keepKey?: string): void;
  prefetch(text: string, voiceId: string, rate: number): void;
  play(text: string, voiceId: string, rate: number, my: number, cb: () => void, fallback: (e: Error) => void, fresh?: boolean): void;
  _fetchTTS(text: string, voiceId: string, rate: number, signal?: AbortSignal): Promise<Blob>;
  _ensureAudio(): HTMLAudioElement;
};
declare const SECTIONS: unknown[];

const rootUrl = process.env.E2E_ROOT_URL || '';

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
        && typeof TASK !== 'undefined' && !!(TASK.state() && TASK.state().daily);
    } catch (e) { return false; }
  });
}
/* 两个假本机音色 + 录音笔：记每条 utterance 用的 voiceURI；只回 onstart、不回 onend，
   让 playing 一直为真（要验"正在播时换音色立刻重播"）。 */
async function installVoiceStub(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const fake = [
      { voiceURI: 'fake-gb-1', name: 'Daniel', lang: 'en-GB', default: false, localService: true },
      { voiceURI: 'fake-us-1', name: 'Samantha', lang: 'en-US', default: false, localService: true },
    ];
    const w = window as unknown as { __spoken: { uri: string; text: string }[] };
    w.__spoken = [];
    /* 假 voice 是普通对象，直接赋给真 SpeechSynthesisUtterance.voice 会被浏览器拒绝；
       换掉构造函数，让 u.voice 接受普通对象（只测"用了哪个 voiceURI"，不真的发声）。 */
    class FakeUtt {
      text: string; voice: unknown = null; lang = ''; rate = 1; volume = 1;
      onstart: ((ev: Event) => void) | null = null;
      onend: ((ev: Event) => void) | null = null;
      onerror: ((ev: Event) => void) | null = null;
      constructor(t: string) { this.text = t; }
    }
    (window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = FakeUtt;
    const sy = window.speechSynthesis as unknown as Record<string, unknown>;
    try { Object.defineProperty(sy, 'getVoices', { value: () => fake, configurable: true }); } catch (e) {}
    try { Object.defineProperty(sy, 'speaking', { get: () => false, configurable: true }); } catch (e) {}
    try { Object.defineProperty(sy, 'pending', { get: () => false, configurable: true }); } catch (e) {}
    try { Object.defineProperty(sy, 'paused', { get: () => false, configurable: true }); } catch (e) {}
    sy.cancel = () => {};
    sy.resume = () => {};
    sy.pause = () => {};
    sy.speak = (u: SpeechSynthesisUtterance) => {
      w.__spoken.push({ uri: (u.voice && u.voice.voiceURI) || '', text: u.text });
      try { if (u.onstart) (u.onstart as (ev: Event) => void)(new Event('start')); } catch (e) {}
    };
  });
}

test.describe('3.0 音色：全局立刻生效（refine3 ①）', () => {
  test('正在播时换音色：用新音色就地重播当前句，并持久化 ielts-voice', async ({ page }) => {
    await installVoiceStub(page);
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitAppReady(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await page.reload();
    await waitAppReady(page);
    // 「正在播」现实里发生在随身听（任务模式里不播时也能开「我的」，但一步一停；随身听才是连播场景）
    await page.goto(`${rootUrl}/app/index.html#/listen`);
    await expect(page.locator('.ls-card')).toBeVisible();

    // 起播当前句（本地音色）
    await page.locator('.ls-play').click();
    await expect.poll(async () => page.evaluate(() => (window as unknown as { __spoken: unknown[] }).__spoken.length)).toBeGreaterThan(0);
    const firstUri = await page.evaluate(() => {
      const s = (window as unknown as { __spoken: { uri: string }[] }).__spoken;
      return s[s.length - 1].uri;
    });
    expect(firstUri, '先出声要落在某个假本机音色上').toContain('fake-');

    // 换到另一个音色
    await page.locator('#meCard').click();
    await page.locator('#mePop #voiceBtn').click();
    const items = page.locator('#voicePop .vp-item[data-voice-uri]');
    await expect(items).toHaveCount(2);
    const target = await page.evaluate((cur) => {
      const els = Array.from(document.querySelectorAll('#voicePop .vp-item[data-voice-uri]')) as HTMLElement[];
      return els.map((e) => e.dataset.voiceUri).find((u) => u && u !== cur) || '';
    }, firstUri);
    expect(target, '要能换到一个不同的音色').not.toBe('');
    await page.locator(`#voicePop .vp-item[data-voice-uri="${target}"]`).click();

    // 立刻生效：最后一条 utterance 用的是新音色
    await expect.poll(async () => page.evaluate(() => {
      const s = (window as unknown as { __spoken: { uri: string }[] }).__spoken;
      return s[s.length - 1].uri;
    })).toBe(target);
    expect(await page.evaluate(() => localStorage.getItem('ielts-voice')), '选中要存进 ielts-voice').toBe(target);
  });
});

test.describe('3.0 云端音色：起播不再被自己的清理误杀（refine3 ②）', () => {
  test('stop(keepKey) 留下同 key 的排队项，其余 reject 成 stale', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitAppReady(page);
    const r = await page.evaluate(async () => {
      CLOUD._busy = true; // 卡住消费者，让两个 job 都停在队列里
      const mk = (key: string) => CLOUD._enqueue(async () => 'ok', null, key);
      const out: Record<string, string> = { a: 'pending', b: 'pending' };
      mk('A').then(() => { out.a = 'ok'; }, (e: Error) => { out.a = e.message; });
      mk('B').then(() => { out.b = 'ok'; }, (e: Error) => { out.b = e.message; });
      await new Promise((res) => setTimeout(res, 0));
      CLOUD.stop('A');            // 只清别的，留下 A
      CLOUD._busy = false; CLOUD._drain();
      await new Promise((res) => setTimeout(res, 200));
      return out;
    });
    expect(r.b, '不同 key 的旧预取要被清掉').toBe('stale');
    expect(r.a, '同 key 的预取要活下来').toBe('ok');
  });

  test('预取后的起播复用同一份合成，不触发"改用本地音色"降级', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitAppReady(page);
    const r = await page.evaluate(async () => {
      const w = window as unknown as { __fb: string[]; __done: { ok: boolean } };
      w.__fb = []; w.__done = { ok: false };
      CLOUD._on = true;
      CLOUD._fetchTTS = async (_t, _v, _r, signal) => {
        await new Promise((res) => setTimeout(res, 30));
        if (signal && signal.aborted) throw new Error('aborted');
        return new Blob(['x'], { type: 'audio/mpeg' });
      };
      const audio = {
        paused: false, ended: false, src: '', onended: null as null | (() => void),
        play: () => Promise.resolve(), pause: () => {}, addEventListener: () => {}, setAttribute: () => {},
      };
      CLOUD._ensureAudio = () => audio as unknown as HTMLAudioElement;

      CLOUD._busy = true;                                   // 预取先入队但不被消费（模拟"预取已排队"）
      CLOUD.prefetch('HELLO', 'en-GB-SoniaNeural', 1);
      await new Promise((res) => setTimeout(res, 0));       // 让 synth 的 await idbGet 后真正入队
      CLOUD.play('HELLO', 'en-GB-SoniaNeural', 1, 0,
        () => { w.__done.ok = true; },
        (e: Error) => { w.__fb.push(e && e.message); });
      CLOUD._busy = false; CLOUD._drain();
      await new Promise((res) => setTimeout(res, 250));
      if (audio.onended) audio.onended();
      return { fb: w.__fb, ok: w.__done.ok };
    });
    expect(r.fb, '起播复用预取，不该把 stale 当成本句合成失败').toEqual([]);
    expect(r.ok, '音频放完回调要正常兑现').toBe(true);
  });
});
