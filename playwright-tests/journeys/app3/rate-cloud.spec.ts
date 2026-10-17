// 2026-10-17 用户报：0.75x 云端语音加载不出来，其余档正常。
// 根因方向：服务端只稳定支持「≥1」的原生档，0.75 是后加的慢速档，请求被拒。
// 本文件把修法锁死（改法见 index.html 的 cloudSynthRate）：
// ① 云端合成只按原生档 1 / 1.25 / 1.5 请求，其余档位不外发；
// ② 差速由 <audio>.playbackRate 补（0.75 档：合成 1x、播放 0.75）；
// ③ 0.75 与 1x 共用同一份缓存（同一句在倍速间切换不再各合成一遍）；
// ④ 菜单扩到 7 档（0.5 / 0.75 / 1 / 1.25 / 1.5 / 1.75 / 2）。
import { test, expect } from '../../fixtures';
import type { Page } from '@playwright/test';

declare function cloudSynthRate(r: number): number;
declare const CLOUD: {
  URL: string;
  KEY: string;
  _au: HTMLAudioElement | null;
  _auEl: HTMLAudioElement | null;
  session(): Promise<{ access_token: string } | null>;
  play(text: string, voiceId: string, rate: number, my: number,
       cb?: () => void, fallback?: (e: unknown) => void, fresh?: boolean): void;
  stop(keepKey?: string): void;
};
declare const speakToken: number;
declare function pickRate(r: number): void;
declare function toggleRateMenu(e?: Event): void;

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

async function gotoApp(page: Page) {
  await stubData(page);
  await page.goto(`${rootUrl}/index.html#/home`);
  await page.waitForFunction(() => {
    try { return typeof SECTIONS !== 'undefined' && SECTIONS.length > 0; } catch (e) { return false; }
  });
}

/* 0.2s 静音 WAV：足够让 <audio> 走完 load 流程，不会真的「响」 */
function silentWav(): Buffer {
  const rate = 8000, n = Math.floor(0.2 * rate);
  const data = Buffer.alloc(n * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

test.describe('云端倍速：只发原生档 + playbackRate 补差', () => {
  test('映射表：0.5/0.75 → 1x，1.75/2 → 1.5x，中间三档原样', async ({ page }) => {
    await gotoApp(page);
    const got = await page.evaluate(() => [
      cloudSynthRate(0.5), cloudSynthRate(0.75), cloudSynthRate(1),
      cloudSynthRate(1.25), cloudSynthRate(1.5), cloudSynthRate(1.75), cloudSynthRate(2),
    ]);
    expect(got, '云端合成档位表（服务端只认这三档）').toEqual([1, 1, 1, 1.25, 1.5, 1.5, 1.5]);
  });

  test('0.75x：请求体 rate=1，播放倍率 0.75，且与 1x 共用缓存', async ({ page }) => {
    const bodies: Array<{ text: string; voice: string; rate: number }> = [];
    await page.route('**/functions/v1/tts', (r) => {
      // 只统计 POST：跨域请求的 OPTIONS 预检没有 body，算进来就会把「复用缓存」误判成二次合成
      /* 只认「合成」请求：同一端点还兼着 {"action":"status"} 的登录态查询，不能算进合成次数 */
      if (r.request().method() === 'POST') {
        try {
          const b = r.request().postDataJSON();
          if (b && typeof b.text === 'string') bodies.push(b);
        } catch (e) {}
      }
      return r.fulfill({ status: 200, contentType: 'audio/wav', body: silentWav() });
    });
    await gotoApp(page);

    await page.evaluate(() => {
      CLOUD.URL = 'https://sb.test';
      CLOUD.KEY = 'test-key';
      CLOUD.session = async () => ({ access_token: 'test-token' });
      CLOUD.play('A rate probe sentence.', 'en-GB-SoniaNeural', 0.75, speakToken, () => {}, () => {});
    });

    await expect.poll(() => bodies.length, { message: '0.75 档应发起一次合成', timeout: 8000 }).toBe(1);
    expect(bodies[0].rate, '0.75 不许原样发给服务端（服务端不支持 → 整句加载失败）').toBe(1);
    await expect.poll(() => page.evaluate(() => {
      const au = CLOUD._auEl as HTMLAudioElement | null;
      return au ? Number(au.playbackRate.toFixed(3)) : -1;
    }), { message: '差速要在播放层补齐', timeout: 5000 }).toBe(0.75);

    // 换到 1x：同一句、同一合成档 → 直接命中缓存，不该再发一次合成
    const before1x = bodies.length;
    await page.evaluate(() => {
      CLOUD.play('A rate probe sentence.', 'en-GB-SoniaNeural', 1, speakToken, () => {}, () => {});
    });
    await page.waitForTimeout(400);
    const cacheKeys = await page.evaluate(() => Array.from(CLOUD.cache.keys()));
    expect(bodies.length - before1x, '1x 复用了 0.75 那份 1x 音频，不该再合成').toBe(0);
    expect(cacheKeys, '缓存坐标按合成档记：0.75 与 1x 是同一条').toContain('r2|en-GB-SoniaNeural|1.00|A rate probe sentence.');
    await expect.poll(() => page.evaluate(() => {
      const au = CLOUD._auEl as HTMLAudioElement | null;
      return au ? Number(au.playbackRate.toFixed(3)) : -1;
    }), { message: '1x 播放倍率必须回到 1（不许沿用上一句的 0.75）', timeout: 5000 }).toBe(1);
  });

  test('2x：请求体 rate=1.5，播放倍率 1.333（任何档位都不外发未支持值）', async ({ page }) => {
    const bodies: Array<{ rate: number }> = [];
    await page.route('**/functions/v1/tts', (r) => {
      /* 只认「合成」请求：同一端点还兼着 {"action":"status"} 的登录态查询，不能算进合成次数 */
      if (r.request().method() === 'POST') {
        try {
          const b = r.request().postDataJSON();
          if (b && typeof b.text === 'string') bodies.push(b);
        } catch (e) {}
      }
      return r.fulfill({ status: 200, contentType: 'audio/wav', body: silentWav() });
    });
    await gotoApp(page);

    await page.evaluate(() => {
      CLOUD.URL = 'https://sb.test';
      CLOUD.KEY = 'test-key';
      CLOUD.session = async () => ({ access_token: 'test-token' });
      CLOUD.play('A fast rate probe.', 'en-GB-SoniaNeural', 2, speakToken, () => {}, () => {});
    });

    await expect.poll(() => bodies.length, { message: '2x 档应发起合成', timeout: 8000 }).toBeGreaterThan(0);
    for (const b of bodies) expect([1, 1.25, 1.5], '任何档位都不许把未支持值发给服务端').toContain(b.rate);
    expect(bodies[0].rate, '2x 选最近的受支持档 1.5').toBe(1.5);
    await expect.poll(() => page.evaluate(() => {
      const au = CLOUD._auEl as HTMLAudioElement | null;
      return au ? Number(au.playbackRate.toFixed(3)) : -1;
    }), { message: '2x = 1.5x 音频 × 1.333', timeout: 5000 }).toBe(1.333);
  });
});

test.describe('倍速菜单 7 档', () => {
  test('档位齐全、点 0.75 后按钮与激活项同步', async ({ page }) => {
    await gotoApp(page);
    const labels = await page.locator('.rate-menu [data-mrate]').evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).textContent!.trim()));
    expect(labels).toEqual(['0.5x', '0.75x', '1x', '1.25x', '1.5x', '1.75x', '2x']);

    await page.evaluate(() => pickRate(0.75));
    await expect(page.locator('#rateCycle')).toContainText('0.75x');
    const active = await page.locator('.rate-menu [data-mrate].active').evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).dataset.mrate));
    expect(active, '激活项只能有一个').toEqual(['0.75']);

    /* 7 档比原来多 3 行：竖排时 1280×720 已顶到视口上沿（首项 top=0），矮一点就点不到最慢档。
       所以菜单必须是两列 grid（4 行）；这条锁住的不是"好看"，是"点得到"。 */
    const cols = await page.evaluate(() => {
      const m = document.querySelector('.rate-menu') as HTMLElement;
      const cs = getComputedStyle(m);
      /* 隐藏态下 computed 会原样回 repeat(...)，只有真正布局后才展开成 px 列表 —— 直接认声明里的 2 */
      return { display: cs.display, raw: cs.gridTemplateColumns };
    });
    expect(cols.display, '倍速菜单必须用 grid（竖排 7 行会顶出视口）').toBe('grid');
    expect(cols.raw, '两列铺开').toMatch(/repeat\(2\b/);

    await page.evaluate(() => pickRate(0.5));
    await expect(page.locator('#rateCycle')).toContainText('0.5x');
  });
});
