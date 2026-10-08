// 2026-10-08 用户：「高亮的默认文字黑色对比度不够，文字还不够黑，清晰度不够」（Mac 浏览器上看的）。
// 实测原状：--text #2b3028 在纸底 12.7:1、落在当前句的薄荷高亮底 11.1:1 —— 早就过 WCAG AAA，
// 所以"不够黑"不在颜色深浅这一层，而在①body 的 -webkit-font-smoothing: antialiased 把 macOS
// 的笔画削薄一档，②正文是 Georgia 衬线 18.5px/400，小字号细笔画发虚。
// 他在六档 demo 里选了 E：墨色 #181c15 + 回到 subpixel + 字号涨一档（桌面 19.5 / 窄屏 18.5），行高不动。
// font-weight 500 是实测出来的空操作（Georgia 与 Songti SC 的 400=500 同宽），所以这一把锁钉住 400，
// 免得日后有人照"半粗更清楚"的直觉再加一遍无效样式。
// 没选的 F（中文译文一起黑）不在这一批里 —— 译文仍走 --muted，最后一把锁钉住这件事，
// 免得日后有人"顺手"把 --muted 一起改了。
import { test, expect } from '../../fixtures';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  seedRoundSeenForTest(gis: number[]): number;
  state(): { daily: Record<string, unknown> };
};
declare const SECTIONS: unknown[];

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 第 0 篇 12 句、每句一个独立目标词（够 15 分钟批次落在本篇内），其余 5 篇各 2 句。 */
const SIX: Record<string, string> = (() => {
  const mk = (title: string, ai: number, n: number) => ({
    title, zh: title, subheads: [''],
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
    await page.route(`**/data/${name}*`, (r) =>
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

/* 朗读换成录音笔：进任务模式会自动放第一句，别让它真去叫 TTS。 */
async function installSpeakStub(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const w = window as unknown as { speak: (t: string, cb?: () => void) => void; __cbs: (() => void)[] };
    w.__cbs = [];
    w.speak = (_t: string, cb?: () => void) => { if (cb) w.__cbs.push(cb); };
  });
}

/* 进任务模式并把第 0 句点亮成"已学"。 */
async function openWithFirstRead(page: import('@playwright/test').Page) {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);
  await installSpeakStub(page);
  await page.locator('.art-card').first().click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  await page.evaluate(() => TASK.seedRoundSeenForTest([0]));
  await expect(page.locator('#art .sent').first()).toHaveClass(/lw-known/);
}

const styleOf = (page: import('@playwright/test').Page, sel: string, props: string[]) =>
  page.evaluate(([s, ps]) => {
    const el = document.querySelector(s as string);
    if (!el) return null;
    const cs = getComputedStyle(el);
    const out: Record<string, string> = {};
    (ps as string[]).forEach((p) => { out[p] = cs.getPropertyValue(p); });
    out.webkitFontSmoothing = (cs as unknown as { webkitFontSmoothing: string }).webkitFontSmoothing;
    return out;
  }, [sel, props] as [string, string[]]);

/* 把 CSS 变量解析成浏览器实际用的 rgb() 串：直接比十六进制会因写法不同假红。 */
const resolveVar = (page: import('@playwright/test').Page, name: string) =>
  page.evaluate((v) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${v})`;
    probe.style.display = 'none';
    document.body.appendChild(probe);
    const rgb = getComputedStyle(probe).color;
    probe.remove();
    return rgb;
  }, name);

test('正文这一档按 E 涨号：桌面 19.5px、窄屏 18.5px，并回到 subpixel', async ({ page }) => {
  await openWithFirstRead(page);
  const para = await styleOf(page, '.sec .para', ['font-size', 'font-weight', 'line-height', 'color']);
  expect(para, '正文段落要量得到').not.toBeNull();
  expect(para!['font-size'], '桌面正文从 18.5 提到 19.5').toBe('19.5px');
  expect(para!['font-weight'], 'Georgia / Songti SC 的 400 与 500 同宽，半粗是空操作，别加').toBe('400');
  expect(para!.webkitFontSmoothing, 'body 的 antialiased 在 macOS 上把笔画削薄一档').toBe('auto');
  expect(para!['color'], 'demo E 那一格改的是整段正文的墨色，不只是已学句').toBe('rgb(24, 28, 21)');
  /* 浏览器把 line-height 报成用过的 px，所以这里比倍数：涨号不许顺手把行距也拉走。 */
  expect(parseFloat(para!['line-height']) / parseFloat(para!['font-size']),
    '行高倍数仍是 2.05').toBeCloseTo(2.05, 3);

  await page.setViewportSize({ width: 640, height: 900 });
  const narrow = await styleOf(page, '.sec .para', ['font-size']);
  expect(narrow!['font-size'], '窄屏跟着走同一阶梯：17.5 → 18.5').toBe('18.5px');
});

test('已读句用新墨色 #181c15；未读句仍是 --muted（黑白两档的差别不许被抹平）', async ({ page }) => {
  await openWithFirstRead(page);
  const known = await styleOf(page, '#art .sent.lw-known', ['color']);
  expect(known!.color, '已读句墨色要从 #2b3028 提到 #181c15').toBe('rgb(24, 28, 21)');
  const muted = await resolveVar(page, '--muted');
  const unknown = await styleOf(page, '#art .sent.lw-unknown', ['color']);
  expect(unknown!.color, '未读句必须还是 --muted，否则"已学/未学"就没有对比了').toBe(muted);
});

test('深色模式另给一档：不许把浅底的近黑搬过去', async ({ page }) => {
  await openWithFirstRead(page);
  await page.evaluate(() => document.body.classList.add('dark'));
  const darkText = await resolveVar(page, '--text');
  const known = await styleOf(page, '#art .sent.lw-known', ['color']);
  expect(known!.color, '深色下已读句要跟深色 ink 成对').toBe(darkText);
  expect(known!.color, '不许是浅底那档近黑').not.toBe('rgb(24, 28, 21)');
});

test('译文行不跟着涨号：仍是 14px 的 --muted（F 档没选，别顺手改）', async ({ page }) => {
  await openWithFirstRead(page);
  const zh = await styleOf(page, '#art .sent-zh', ['font-size', 'color']);
  expect(zh!['font-size'], '中文译文跟着涨到 19.5px 会挤掉整屏阅读量').toBe('14px');
  expect(zh!.color, '译文色仍走 --muted').toBe(await resolveVar(page, '--muted'));
});
