// 2026-10-15 用户报：换设备（含电脑重置后重装）音色回默认，进了随身听才发现不对；
// 要求「已选定的音色在刷新 / 换设备后记住」。
//
// 现状：同端刷新本就有 localStorage（ielts-voice）兜着，真正缺的是跨端 ——
// 本文件锁四件事：
// ① 选定音色后落「可携带记录」ielts-voice-meta（name/lang/ts）并在登录态下推 voice-pref 上云；
// ② 换设备：voice-pref 按「最新者胜」合并进来，本机音色按 name(+lang) 对齐落地（voiceURI 各平台不同）；
// ③ 本机更新者胜：对端旧记录不许覆盖本机，且本机选择要补推上云；
// ④ 旧版裸 ielts-voice 的迁移（自动补 meta）与刷新后播放仍用选定音色（真链路）。
import { test, expect } from '../../fixtures';
import type { Page } from '@playwright/test';

declare const TASK: { resetV2(): void; initPlan(minutes: number): void; state(): unknown };
declare const CLOUD: {
  client(): unknown;
  _on: boolean;
  _userMail?: string;
  cloudPullVoicePref(): Promise<boolean>;
  cloudPushVoicePref(): Promise<boolean>;
};

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

async function stubData(page: Page) {
  for (const [name, body] of Object.entries(SIXQ)) {
    await page.route(`**/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}
async function waitAppReady(page: Page) {
  await page.waitForFunction(() => {
    try {
      return typeof SECTIONS !== 'undefined' && SECTIONS.length > 0
        && typeof TASK !== 'undefined' && !!(TASK.state() && TASK.state().daily);
    } catch (e) { return false; }
  });
}

/* 两个假本机音色 + 录音笔（与 voice.spec 同款）：Daniel(GB) / Samantha(US) */
async function installVoiceStub(page: Page) {
  await page.addInitScript(() => {
    const fake = [
      { voiceURI: 'fake-gb-1', name: 'Daniel', lang: 'en-GB', default: false, localService: true },
      { voiceURI: 'fake-us-1', name: 'Samantha', lang: 'en-US', default: false, localService: true },
    ];
    const w = window as unknown as { __spoken: { uri: string; text: string }[] };
    w.__spoken = [];
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

/* 假 Supabase：voice-pref 链返回注入行；upsert 全部记进 __upserts */
async function installFakeCloud(page: Page, rows: unknown[]) {
  await page.evaluate((serverRows) => {
    const w = window as unknown as { __upserts: unknown[][]; __rows: unknown[] };
    w.__upserts = []; w.__rows = serverRows;
    (CLOUD as unknown as { client(): unknown }).client = () => ({
      auth: { getSession: async () => ({ data: { session: { user: { id: 'voice-sync-user' } } } }) },
      from: () => ({
        select: () => {
          const chain = {
            _f: [] as [string, unknown][],
            eq(c: string, v: unknown) { this._f.push([c, v]); return this; },
            order() { return this; },
            async range() { return { data: w.__rows, error: null }; },
            async maybeSingle() { return { data: null, error: null }; },
          };
          return chain;
        },
        upsert: async (payload: unknown[]) => { w.__upserts.push(payload); return { error: null }; },
      }),
    });
  }, rows);
}

async function openVoicePop(page: Page) {
  if (!(await page.locator('#mePop').isVisible().catch(() => false))) {
    await page.locator('#meCard').click();
    await page.waitForTimeout(250);
    if (await page.locator('#loginModal').isVisible().catch(() => false)) {
      await page.locator('#loginModal [data-login-settings]').click();
      await page.waitForTimeout(250);
    }
  }
  await page.locator('#mePop #voiceBtn').click();
  await page.waitForTimeout(150);
}

const readMeta = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('ielts-voice-meta') || 'null'));

test.describe('3.0 音色偏好云同步（换设备记住音色）', () => {
  test('选定音色：meta 落 name/lang/ts，登录态下 voice-pref 推上云', async ({ page }) => {
    await installVoiceStub(page);
    await stubData(page);
    await page.goto(`${rootUrl}/index.html#/home`);
    await waitAppReady(page);
    await installFakeCloud(page, []);

    await openVoicePop(page);
    await page.locator('#voicePop .vp-item[data-voice-uri="fake-us-1"]').click();
    await page.waitForTimeout(200);

    const meta = await readMeta(page);
    expect(meta, '选定后要有可携带记录').not.toBeNull();
    expect(meta.uri).toBe('fake-us-1');
    expect(meta.name, '记录跨端身份用名字（voiceURI 各平台不同）').toBe('Samantha');
    expect(meta.lang).toBe('en-US');
    expect(meta.ts, '记录选择时刻（多端合并用）').toBeGreaterThan(0);

    // 2s debounce 后推上云
    await expect.poll(async () => page.evaluate(() => {
      const w = window as unknown as { __upserts: unknown[][] };
      return w.__upserts.map((u) => (u[0] as { payload?: { type?: string } }).payload?.type).filter((t) => t === 'voice-pref').length;
    }), { message: '选定音色应推一条 voice-pref', timeout: 8000 }).toBeGreaterThan(0);

    const row = await page.evaluate(() => {
      const w = window as unknown as { __upserts: unknown[][] };
      return w.__upserts.map((u) => u[0] as { event_id: string; type: string; payload: Record<string, unknown> }).find((r) => r.payload && r.payload.type === 'voice-pref');
    });
    expect(row!.type).toBe('voice-pref');
    expect(String(row!.event_id).startsWith('vp-'), '事件 id 带 vp- 前缀防撞').toBe(true);
    expect(row!.payload.uri).toBe('fake-us-1');
    expect(row!.payload.name).toBe('Samantha');
    expect(row!.payload.lang).toBe('en-US');
    expect(row!.payload.accent).toBe('en-GB');
  });

  test('换设备（名字对齐）：对端本机音色按 name+lang 落地，口音跟随，ts 沿用对端', async ({ page }) => {
    await installVoiceStub(page);
    await stubData(page);
    await page.goto(`${rootUrl}/index.html#/home`);
    await waitAppReady(page);

    // 对端（另一台设备）的记录：uri 是本机 **不存在** 的裸名 'Samantha'
    const T = Date.now() + 60000;
    await installFakeCloud(page, [{ event_id: 'vp-remote-1', ts: T, type: 'voice-pref',
      payload: { type: 'voice-pref', ts: T, accent: 'en-US', uri: 'Samantha', name: 'Samantha', lang: 'en-US' } }]);

    const applied = await page.evaluate(() => CLOUD.cloudPullVoicePref());
    expect(applied, '对端更新应被套用').toBe(true);
    expect(await page.evaluate(() => localStorage.getItem('ielts-voice')),
      '本机没有这个 voiceURI，要按名字对齐到 fake-us-1').toBe('fake-us-1');
    expect(await page.evaluate(() => localStorage.getItem('ielts-accent')), '口音跟随对端').toBe('en-US');

    const meta = await readMeta(page);
    expect(meta.ts, 'ts 沿用对端的（否则会被当成新选择再推回去）').toBe(T);
    expect(meta.uri).toBe('fake-us-1');
    expect(meta.name).toBe('Samantha');

    // 套用不回声：不许把同一条再推回去
    await page.waitForTimeout(2300);
    expect(await page.evaluate(() => (window as unknown as { __upserts: unknown[] }).__upserts.length),
      '套用对端记录后不该再推一条').toBe(0);

    // 界面同步：#btnAccent 与音色按钮的标签都反映新选择（mePop 渲染源就是内存里的 accent/selVoiceURI）
    await openVoicePop(page);
    expect(await page.locator('#btnAccent').textContent(), '内存里的口音也要变（不只是存储）').toContain('美式');
    expect(await page.locator('#mePop #voiceBtn').textContent()).toContain('Samantha');
  });

  test('换设备（云音色）：cloud: 记录直接落地（本机无需有这款）', async ({ page }) => {
    await installVoiceStub(page);
    await stubData(page);
    await page.goto(`${rootUrl}/index.html#/home`);
    await waitAppReady(page);

    const T = Date.now() + 60000;
    await installFakeCloud(page, [{ event_id: 'vp-remote-2', ts: T, type: 'voice-pref',
      payload: { type: 'voice-pref', ts: T, accent: 'en-GB', uri: 'cloud:en-GB-SoniaNeural', name: 'en-GB-SoniaNeural', lang: 'en-GB' } }]);

    expect(await page.evaluate(() => CLOUD.cloudPullVoicePref())).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem('ielts-voice')), '云音色 id 跨端稳定，直接用').toBe('cloud:en-GB-SoniaNeural');
    expect(await page.evaluate(() => localStorage.getItem('ielts-accent'))).toBe('en-GB');
    const meta = await readMeta(page);
    expect(meta.name).toBe('en-GB-SoniaNeural');
  });

  test('本机更新者胜：对端旧记录不覆盖本机，本机选择补推上云', async ({ page }) => {
    await installVoiceStub(page);
    // 本机已有一份更新的选择（ts 未来）
    const localTs = Date.now() + 120000;
    await page.addInitScript((ts) => {
      localStorage.setItem('ielts-voice', 'fake-gb-1');
      localStorage.setItem('ielts-voice-meta', JSON.stringify({ uri: 'fake-gb-1', name: 'Daniel', lang: 'en-GB', ts }));
      localStorage.setItem('ielts-accent', 'en-GB');
    }, localTs);
    await stubData(page);
    await page.goto(`${rootUrl}/index.html#/home`);
    await waitAppReady(page);

    const oldTs = Date.now() - 500000;
    await installFakeCloud(page, [{ event_id: 'vp-remote-old', ts: oldTs, type: 'voice-pref',
      payload: { type: 'voice-pref', ts: oldTs, accent: 'en-US', uri: 'Samantha', name: 'Samantha', lang: 'en-US' } }]);

    const applied = await page.evaluate(() => CLOUD.cloudPullVoicePref());
    expect(applied, '对端旧记录不该被套用').toBe(false);
    expect(await page.evaluate(() => localStorage.getItem('ielts-voice')), '本机选择不被覆盖').toBe('fake-gb-1');
    expect(await page.evaluate(() => localStorage.getItem('ielts-accent')), '口音也不该被旧记录带走').toBe('en-GB');

    await expect.poll(async () => page.evaluate(() => {
      const w = window as unknown as { __upserts: unknown[][] };
      return w.__upserts.map((u) => ((u[0] as { payload?: { uri?: string } }).payload || {}).uri).filter(Boolean);
    }), { message: '本机更新应补推上云', timeout: 8000 }).toContain('fake-gb-1');
  });

  test('迁移：旧版裸 ielts-voice 加载后自动补 meta（name/lang/ts）', async ({ page }) => {
    await installVoiceStub(page);
    await page.addInitScript(() => { localStorage.setItem('ielts-voice', 'fake-us-1'); });
    await stubData(page);
    await page.goto(`${rootUrl}/index.html#/home`);
    await waitAppReady(page);

    await expect.poll(async () => {
      const m = await readMeta(page);
      return m && m.name === 'Samantha' && m.lang === 'en-US' && m.ts > 0;
    }, { message: '旧版裸 URI 要补全为可携带记录', timeout: 8000 }).toBe(true);
  });

  test('刷新后不丢：重载再进随身听，播放用的还是选定的音色', async ({ page }) => {
    await installVoiceStub(page);
    await stubData(page);
    await page.goto(`${rootUrl}/index.html#/home`);
    await waitAppReady(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await page.reload();
    await waitAppReady(page);

    await openVoicePop(page);
    await page.locator('#voicePop .vp-item[data-voice-uri="fake-us-1"]').click();
    await page.waitForTimeout(200);

    await page.reload();
    await waitAppReady(page);
    await page.goto(`${rootUrl}/index.html#/listen`);
    await expect(page.locator('.ls-card')).toBeVisible();
    await page.locator('.ls-play').click();
    await expect.poll(async () => page.evaluate(() => {
      const s = (window as unknown as { __spoken: { uri: string }[] }).__spoken;
      return s.length ? s[s.length - 1].uri : '';
    }), { message: '刷新后播放要用选定音色', timeout: 8000 }).toBe('fake-us-1');
  });
});
