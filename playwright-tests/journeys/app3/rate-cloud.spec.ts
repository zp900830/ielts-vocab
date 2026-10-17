// 2026-10-17 用户报：0.75x 云端语音加载不出来，其余档正常。
// 根因方向：服务端只稳定支持「≥1」的原生档，0.75 是后加的慢速档，请求被拒。
// 本文件把修法锁死（改法见 index.html 的 cloudSynthRate）：
// ① 云端合成只按原生档 1 / 1.25 / 1.5 请求，其余档位不外发；
// ② 差速由 <audio>.playbackRate 补（0.8 档：合成 1x、播放 0.8）；
// ③ 0.8 与 1x 共用同一份缓存（同一句在倍速间切换不再各合成一遍）；
// ④ 菜单 = 预设 5.0/3.0/2.0/1.5/1.2/1.0/0.8 + 自定义（0.1~5.0，步进 0.1）。
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
declare function openRateCustom(e?: Event): void;
declare function backToRateMenu(e?: Event): void;
declare const rate: number;
declare function setRate(r: number): void;
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
  test('映射表：0.8 → 1x，1.2 → 1.25x，2/3/5 → 1.5x', async ({ page }) => {
    await gotoApp(page);
    const got = await page.evaluate(() => [
      cloudSynthRate(0.8), cloudSynthRate(1), cloudSynthRate(1.2),
      cloudSynthRate(1.5), cloudSynthRate(2), cloudSynthRate(3), cloudSynthRate(5),
    ]);
    expect(got, '云端合成档位表（服务端只认这三档）').toEqual([1, 1, 1.25, 1.5, 1.5, 1.5, 1.5]);
  });

  test('0.8x：请求体 rate=1，播放倍率 0.8，且与 1x 共用缓存', async ({ page }) => {
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
      CLOUD.play('A rate probe sentence.', 'en-GB-SoniaNeural', 0.8, speakToken, () => {}, () => {});
    });

    await expect.poll(() => bodies.length, { message: '0.8 档应发起一次合成', timeout: 8000 }).toBe(1);
    expect(bodies[0].rate, '0.8 不许原样发给服务端（服务端不支持 → 整句加载失败）').toBe(1);
    await expect.poll(() => page.evaluate(() => {
      const au = CLOUD._auEl as HTMLAudioElement | null;
      return au ? Number(au.playbackRate.toFixed(3)) : -1;
    }), { message: '差速要在播放层补齐', timeout: 5000 }).toBe(0.8);

    // 换到 1x：同一句、同一合成档 → 直接命中缓存，不该再发一次合成
    const before1x = bodies.length;
    await page.evaluate(() => {
      CLOUD.play('A rate probe sentence.', 'en-GB-SoniaNeural', 1, speakToken, () => {}, () => {});
    });
    await page.waitForTimeout(400);
    const cacheKeys = await page.evaluate(() => Array.from(CLOUD.cache.keys()));
    expect(bodies.length - before1x, '1x 复用了 0.8 那份 1x 音频，不该再合成').toBe(0);
    expect(cacheKeys, '缓存坐标按合成档记：0.8 与 1x 是同一条').toContain('r2|en-GB-SoniaNeural|1.00|A rate probe sentence.');
    await expect.poll(() => page.evaluate(() => {
      const au = CLOUD._auEl as HTMLAudioElement | null;
      return au ? Number(au.playbackRate.toFixed(3)) : -1;
    }), { message: '1x 播放倍率必须回到 1（不许沿用上一句的 0.8）', timeout: 5000 }).toBe(1);
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

test.describe('倍速菜单与自定义倍数', () => {
  test('档位齐全、点 0.8 后按钮与激活项同步', async ({ page }) => {
    await gotoApp(page);
    const labels = await page.locator('.rate-menu button').evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).textContent!.trim()));
    expect(labels).toEqual(['5.0x', '3.0x', '2.0x', '1.5x', '1.2x', '1.0x', '0.8x', '自定义']);

    await page.evaluate(() => pickRate(0.8));
    await expect(page.locator('#rateCycle')).toContainText('0.8x');
    const active = await page.locator('.rate-menu [data-mrate].active').evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).dataset.mrate));
    expect(active, '激活项只能有一个').toEqual(['0.8']);

    /* 单列竖排（2026-10-17 用户定版；8 项靠 max-height 兜住小屏）。 */
    const layout = await page.evaluate(() => {
      const m = document.querySelector('.rate-menu') as HTMLElement;
      const cs = getComputedStyle(m);
      return { display: cs.display, dir: cs.flexDirection, maxH: cs.maxHeight };
    });
    expect(layout.display).toBe('flex');
    expect(layout.dir).toBe('column');
    expect(layout.maxH, '小屏要能滚，不能顶出视口').not.toBe('none');

    await page.evaluate(() => pickRate(5));
    await expect(page.locator('#rateCycle')).toContainText('5.0x');

    // 旧版存过 0.75 的用户：读回来必须归到 0.1 步进，别出现「显示 0.8x、实际 0.75x」
    const migrated = await page.evaluate(() => { setRate(0.75); return { r: rate, label: document.getElementById('rateCycle')!.textContent!.trim() }; });
    expect(migrated).toEqual({ r: 0.8, label: '0.8x' });
  });

  test('自定义：0.1~5.0 步进 0.1，松手落地，自定义值不硬凑预设高亮', async ({ page }) => {
    await gotoApp(page);
    const range = await page.evaluate(() => {
      openRateCustom();
      const rg = document.getElementById('rcRange') as HTMLInputElement;
      return { min: rg.min, max: rg.max, step: rg.step, val: rg.value,
        menuHidden: (document.querySelector('.rate-menu') as HTMLElement).hidden,
        panelShown: !(document.getElementById('rateCustom') as HTMLElement).hidden };
    });
    expect(range, '滑块口径：0.1 ~ 5.0，步进 0.1').toMatchObject({ min: '0.1', max: '5', step: '0.1', val: '1' });
    expect(range.menuHidden, '打开自定义时预设列表要收起').toBe(true);
    expect(range.panelShown).toBe(true);

    // 拖到 1.3：input 只更新气泡，change（松手）才落地
    const bubble = await page.evaluate(() => {
      const rg = document.getElementById('rcRange') as HTMLInputElement;
      rg.value = '1.3';
      rg.dispatchEvent(new Event('input', { bubbles: true }));
      return document.getElementById('rcBubble')!.textContent;
    });
    expect(bubble).toBe('1.3x');
    expect(await page.locator('#rateCycle').textContent(), '未松手前不许改实际倍速').toContain('1.0x');

    await page.evaluate(() => {
      const rg = document.getElementById('rcRange') as HTMLInputElement;
      rg.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(page.locator('#rateCycle')).toContainText('1.3x');
    expect(await page.locator('.rate-menu [data-mrate].active').count(), '1.3 不属于任何预设').toBe(0);
    expect(await page.evaluate(() => rate), '松手后实际倍速要落地').toBe(1.3);

    // 最低档也要走得通（playRate 下限不能把 0.1 抬成 0.25）
    await page.evaluate(() => {
      const rg = document.getElementById('rcRange') as HTMLInputElement;
      rg.value = '0.1';
      rg.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(page.locator('#rateCycle')).toContainText('0.1x');

    // 返回：面板收起、列表回来，且 0.1 没有任何预设高亮
    await page.evaluate(() => backToRateMenu());
    expect(await page.evaluate(() => ({
      panel: (document.getElementById('rateCustom') as HTMLElement).hidden,
      menu: (document.querySelector('.rate-menu') as HTMLElement).hidden,
    }))).toEqual({ panel: true, menu: false });
  });

  test('自定义 0.1x：播放倍率不许被下限抬成 0.25', async ({ page }) => {
    const bodies: Array<{ rate: number }> = [];
    await page.route('**/functions/v1/tts', (r) => {
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
      openRateCustom();
      const rg = document.getElementById('rcRange') as HTMLInputElement;
      rg.value = '0.1';
      rg.dispatchEvent(new Event('change', { bubbles: true }));
      CLOUD.play('A very slow probe.', 'en-GB-SoniaNeural', rate, speakToken, () => {}, () => {});
    });

    await expect.poll(() => bodies.length, { message: '0.1x 也要能合成', timeout: 8000 }).toBeGreaterThan(0);
    expect(bodies[0].rate, '0.1 走 1x 合成').toBe(1);
    await expect.poll(() => page.evaluate(() => {
      const au = CLOUD._auEl as HTMLAudioElement | null;
      return au ? Number(au.playbackRate.toFixed(3)) : -1;
    }), { message: '0.1x = 1x 音频 × 0.1（不能被 0.25 下限抬速）', timeout: 5000 }).toBe(0.1);
  });
});
