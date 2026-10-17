// 2026-10-17 用户报：句子发音加载慢，点单个单词的发音更慢、要等更久。
// 慢的根子不是「下载」—— 云端合成一句一请求，一次往返 1~3 秒几乎全是固定开销
// （取 session + 边缘函数接单 + Azure 合成启动），单词的音频只有几 KB，省不下任何一段。
// 除了这个固有成本，代码里还有四处「自己坑自己」，本文件逐条锁住：
//
// ① 同一句连点两下 = 从头再来：点词卡会自动读一次，手快再点「发音」时第一次的合成还在飞，
//    旧 stop() 无条件 abort 掉它，第二下只能从零合成（还常被当成失败降级本地音色）。
//    修法：stop(keepKey) 认出「正在合成的就是马上要播的这句」就放过，交给 synth 的 _pend 复用。
// ② 词条与句子共用一个 120 条 FIFO 缓存池：读长文时 8 句预取一推进，刚点过的词被挤出去，
//    下次再点又是冷启动。修法：按「≤2 个词」分池（词 400 / 句 100）+ 命中移到队尾的真 LRU。
// ③ 入口预热从 idx+1 起（只热下一句），当前句永远冷 —— 那正是按 ▶ 最先要的一句。
//    修法：warmupCloudAhead 从当前句起。
// ④ 点句播放时 playFrom 里的 stop() 会把刚发出的预热（悬停/入口）掐成 stale 再重合成，
//    预热白做。修法：stop 带上这一句的 clipKey。
import { test, expect } from '../../fixtures';
import { stubCloudVoice } from '../../utils/cloud-stub';
import type { Page } from '@playwright/test';

declare const CLOUD: {
  _on: boolean;
  _au: { src: string } | null;
  _auEl: HTMLAudioElement | null;
  cache: Map<string, string>;
  _cacheSet(key: string, url: string): void;
  _fetchTTS: (t: string, v: string, r: number, s?: AbortSignal) => Promise<Blob>;
  _ensureAudio: () => HTMLAudioElement;
  play(text: string, voiceId: string, rate: number, my: number,
       cb?: () => void, fallback?: (e: unknown) => void, fresh?: boolean): void;
  stop(keepKey?: string): void;
};
declare let speakToken: number;
declare const TASK: { resetV2(): void; initPlan(minutes: number): void; state(): unknown };
declare const SECTIONS: unknown[];
declare let idx: number;
declare function warmupCloudAhead(): void;
declare function playFrom(i: number): void;
declare function plainEN(t: string): string;
declare function sentRaw(i: number): string;
declare let selVoiceURI: string;
declare let rate: number;

const rootUrl = process.env.E2E_ROOT_URL || '';

const SIX: Record<string, string> = (() => {
  const mk = (title: string, ai: number, n: number) => ({
    title,
    zh: title,
    subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) => `Sentence ${i} about [[w${(ai + i) % 4}:w${(ai + i) % 4}]].`)],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
    paraZh: [''],
  });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  const vocab: Record<string, { m: string }> = {};
  for (let i = 0; i < 4; i++) vocab['w' + i] = { m: 'n. 词' + i };
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i, i === 0 ? 12 : 2))),
    'vocab.json': JSON.stringify(vocab),
    'chapters.json': '[]',
  };
})();

async function stubData(page: Page) {
  for (const [name, body] of Object.entries(SIX)) {
    await page.route(`**/data/${name}*`, (r) => r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

async function waitReady(page: Page) {
  await page.waitForFunction(() => {
    try {
      return typeof SECTIONS !== 'undefined' && SECTIONS.length > 0
        && typeof TASK !== 'undefined' && !!TASK.state();
    } catch (e) { return false; }
  });
}

/* 进到「已在任务模式读第 0 篇」：那时 sents 有 12 句、入口预热也已跑过一轮。 */
async function prepareArticle(page: Page) {
  await page.addInitScript(() => {
    /* 清云端音频缓存（内存 + IndexedDB）：入口预热会先把前 8 句塞进去，不清掉，
       后面看到的就全是缓存命中，断言等于没测（预热起点 / 复用）。 */
    (window as unknown as { __clearCloudCache: (c: unknown) => Promise<void> }).__clearCloudCache = async (cloud: any) => {
      try { cloud.cache.clear(); cloud._pend.clear(); } catch (e) { /* 还没建 */ }
      try {
        const db = await cloud._db();
        if (!db) return;
        await new Promise((res) => {
          const tx = db.transaction('clips', 'readwrite');
          tx.objectStore('clips').clear();
          tx.oncomplete = res; tx.onerror = res; tx.onabort = res;
        });
      } catch (e) { /* 没 IDB 就只清内存 */ }
    };
  });
  await stubData(page);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.evaluate(() => { localStorage.setItem('ielts-voice', 'cloud:test-voice'); });
  await page.reload();
  await waitReady(page);
  await stubCloudVoice(page);
}

async function openFirstArticle(page: Page) {
  await page.locator('.art-card').first().click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
}

test.describe('云端发音延迟：不重复合成、不互相挤掉', () => {
  test('同一句连点两下：只合成一次，第二下复用还在飞的那份且不降级', async ({ page }) => {
    test.setTimeout(30000);
    await stubData(page);
    await page.goto(`${rootUrl}/index.html#/home`);
    await waitReady(page);
    const r = await page.evaluate(async () => {
      const cloud = CLOUD as unknown as {
        URL: string; KEY: string;
        session: () => Promise<{ access_token: string }>;
        _fetchTTS: (t: string, v: string, r: number, s?: AbortSignal) => Promise<Blob>;
        _ensureAudio: () => HTMLAudioElement;
        play: (t: string, v: string, r: number, my: number, cb?: () => void, fb?: (e: unknown) => void) => void;
        _au: unknown;
      };
      const w = window as unknown as { __n: number; __fb: string[]; __src: string; __aborted: boolean };
      w.__n = 0; w.__fb = []; w.__src = ''; w.__aborted = false;
      cloud.URL = 'https://sb.test';
      cloud.KEY = 'test-key';
      cloud.session = async () => ({ access_token: 'test-token' });
      /* 合成 500ms，并且真的响应 abort（必须响应 —— 旧代码的病症正是「第二下 abort 掉第一下」，
         stub 不理 signal 就永远看不出这个 bug）。 */
      cloud._fetchTTS = async (_t: string, _v: string, _r: number, signal?: AbortSignal) => {
        w.__n++;
        return await new Promise<Blob>((res, rej) => {
          const to = setTimeout(() => res(new Blob(['x'], { type: 'audio/mpeg' })), 500);
          if (signal) signal.addEventListener('abort', () => {
            clearTimeout(to);
            w.__aborted = true;
            const e = new Error('aborted'); e.name = 'AbortError';
            rej(e);
          });
        });
      };
      // 假 <audio>：不依赖真解码/自动播放策略，只看「音频有没有挂上去」
      const audio = {
        paused: false, ended: false, src: '', playbackRate: 1, defaultPlaybackRate: 1, preservesPitch: true,
        onended: null, onerror: null, onpause: null,
        play: () => Promise.resolve(), pause: () => {}, setAttribute: () => {}, addEventListener: () => {},
      };
      cloud._ensureAudio = () => audio as unknown as HTMLAudioElement;
      const fb = (e: unknown) => w.__fb.push(String((e as Error) && (e as Error).message));
      const first = ++speakToken;
      cloud.play('latency probe', 'v', 1, first, () => {}, fb);
      await new Promise((res) => setTimeout(res, 120)); // 第一下还在合成中
      const second = ++speakToken;
      cloud.play('latency probe', 'v', 1, second, () => {}, fb);
      await new Promise((res) => setTimeout(res, 1400));
      w.__src = String(audio.src).slice(0, 5);
      return { n: w.__n, fb: w.__fb, src: w.__src, hasAu: !!cloud._au, aborted: w.__aborted };
    });
    expect(r.aborted, '第二下不许把第一下正在飞的合成 abort 掉').toBe(false);
    expect(r.n, '同一句连点两下只许合成一次（第二下复用 _pend，不许 abort 重开）').toBe(1);
    expect(r.fb, '第二下不许因为把自己那一份 abort 掉而降级本地').toEqual([]);
    expect(r.src, '音频要真的挂到 <audio> 上').toBe('blob:');
    expect(r.hasAu, '播放态要成立').toBe(true);
  });

  test('词池与句池分开：长文预取不会把刚点过的词条挤掉', async ({ page }) => {
    await stubData(page);
    await page.goto(`${rootUrl}/index.html#/home`);
    await waitReady(page);
    const r = await page.evaluate(() => {
      const cloud = CLOUD as unknown as { cache: Map<string, string>; _cacheSet(k: string, u: string): void };
      const mk = () => URL.createObjectURL(new Blob(['x'], { type: 'audio/mpeg' }));
      for (let i = 0; i < 30; i++) cloud._cacheSet(`r2|v|1.00|word${i}`, mk());
      for (let i = 0; i < 150; i++) cloud._cacheSet(`r2|v|1.00|Sentence number ${i} about life.`, mk());
      const keys = Array.from(cloud.cache.keys());
      return {
        words: keys.filter((k) => /word\d+$/.test(k)).length,
        sents: keys.filter((k) => /about life\.$/.test(k)).length,
      };
    });
    expect(r.words, '30 个词条一条都不许被句子挤掉').toBe(30);
    expect(r.sents, '句池仍按老上限 100 条封顶').toBeLessThanOrEqual(100);
  });

  test('入口预热包含当前句（按 ▶ 最先要的那句），而不是只热下一句', async ({ page }) => {
    test.setTimeout(40000);
    await prepareArticle(page);
    await page.evaluate(() => {
      const cloud = CLOUD as any;
      const w = window as unknown as { __f: string[] };
      w.__f = [];
      cloud._fetchTTS = async (t: string) => {
        w.__f.push(t.slice(0, 30));
        return new Blob(['x'], { type: 'audio/mpeg' });
      };
    });
    await openFirstArticle(page);
    await page.waitForTimeout(800); // 让入口那一轮预热先落定

    const got = await page.evaluate(async () => {
      const w = window as unknown as { __f: string[]; __clearCloudCache: (c: unknown) => Promise<void> };
      const cloud = CLOUD as any;
      w.__f = [];
      await w.__clearCloudCache(cloud);
      // 续读位挪到第 2 句：预热必须从这一句起，而不是 3
      idx = 2;
      warmupCloudAhead();
      await new Promise((res) => setTimeout(res, 500));
      return w.__f.slice();
    });
    const nums = got.map((t) => {
      const m = /Sentence (\d+) about/.exec(t);
      return m ? Number(m[1]) : -1;
    });
    expect(nums, '当前句（第 2 句）必须已经被预热').toContain(2);
    expect(nums, '后面几句照旧预热').toContain(3);
  });

  test('点句播放不掐掉刚发出的预热请求（预热才不白花）', async ({ page }) => {
    test.setTimeout(40000);
    await prepareArticle(page);
    await page.evaluate(() => {
      (CLOUD as any)._fetchTTS = async () => new Blob(['x'], { type: 'audio/mpeg' });
    });
    await openFirstArticle(page);
    await page.waitForTimeout(800);

    const r = await page.evaluate(async () => {
      const w = window as unknown as {
        __req: string[]; __aborted: number; __audios: number;
        __clearCloudCache: (c: unknown) => Promise<void>;
      };
      const cloud = CLOUD as any;
      w.__req = []; w.__aborted = 0; w.__audios = 0;
      await w.__clearCloudCache(cloud);
      // 预热 600ms 才回来，且真的响应 abort —— 点句播放发生在它还在飞的时候
      cloud._fetchTTS = async (t: string, _v: string, _r: number, signal?: AbortSignal) => {
        w.__req.push(t);
        return await new Promise<Blob>((res, rej) => {
          const to = setTimeout(() => res(new Blob(['x'], { type: 'audio/mpeg' })), 600);
          if (signal) signal.addEventListener('abort', () => {
            clearTimeout(to); w.__aborted++;
            const e = new Error('aborted'); e.name = 'AbortError'; rej(e);
          });
        });
      };
      const audio = {
        paused: false, ended: false, src: '', playbackRate: 1, defaultPlaybackRate: 1, preservesPitch: true,
        onended: null, onerror: null, onpause: null,
        play: () => { w.__audios++; return Promise.resolve(); }, pause: () => {}, setAttribute: () => {}, addEventListener: () => {},
      };
      cloud._ensureAudio = () => audio;
      const txt = plainEN(sentRaw(3));
      cloud.prefetch(txt, selVoiceURI.slice(6), rate);  // 模拟「悬停/入口预热刚发出去」
      await new Promise((res) => setTimeout(res, 120));
      playFrom(3);                                      // 同一句被点播
      await new Promise((res) => setTimeout(res, 1800));
      return {
        forThis: w.__req.filter((t) => t === txt).length,
        aborted: w.__aborted,
        audios: w.__audios,
      };
    });
    expect(r.aborted, '预热请求不许被点播时的 stop 掐掉').toBe(0);
    expect(r.forThis, '同一句只合成一次（点播复用预热那份，说明两边的缓存键一致）').toBe(1);
    expect(r.audios, '复用来的音频要真的放出去').toBeGreaterThan(0);
  });
});
