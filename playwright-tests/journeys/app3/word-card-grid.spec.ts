/* 句下词卡网格（.nb-group / .notebar）布局回归锁。
   2026-10-10 用户二轮反馈「长长短短、高高矮矮」定稿：桌面固定 2 列、同排等高（stretch）、
   行尾落单的卡标 .nb-lone 占满整行（渲染端列游标判定，宽卡 nb-wide 会重置游标）。
   本文件用几何断言锁死这三条：①同排等宽等高；②任何一行不许出现「半宽卡 + 死空」；
   ③落单/长卡必须占满。手机档（≤700px）回落单列也锁一条。 */
import { test, expect } from '../../fixtures';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
};

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 词表：note 长度刻意跨过 60 字阈值（>60 → nb-wide 占整行），覆盖 5 种排布：
   [短,短] / [短,短,短] / [长,短] / [短,长] / [单卡无note]。 */
const VOCAB_STUB: Record<string, { m: string; note?: string }> = {
  paira: { m: 'n. 甲', note: '词伙：paira thing, paira idea' },
  pairb: { m: 'n. 乙', note: '词伙：pairb thing' },
  tri1: { m: 'n. 一', note: '词伙：tri1 one thing' },
  tri2: { m: 'n. 二', note: '词伙：tri2 two things' },
  tri3: { m: 'n. 三', note: '词伙：tri3 three things' },
  longw: { m: 'v. 长注', note: '同义词：threaten（威胁恐吓）；risk（人主动冒险风险）；jeopardize（危及于某阶段，正式用法）；endanger（危及生命健康安全）' },
  afterw: { m: 'n. 后', note: '词伙：afterw thing' },
  shortw: { m: 'n. 短', note: '词伙：shortw thing' },
  widelast: { m: 'v. 长注二', note: '同义词：aa（其一说明）；bb（其二说明）；cc（其三说明）；dd（其四说明）；ee（其五说明）；ff（其六说明）；gg（其七说明）；hh（其八说明）' },
  solo: { m: 'n. 独' },
};

const SENTENCES = [
  'First [[paira:paira]] then [[pairb:pairb]] appear here.',
  'Then [[tri1:tri1]], [[tri2:tri2]] and [[tri3:tri3]] follow.',
  'A [[longw:longw]] plus [[afterw:afterw]] here.',
  'Now [[shortw:shortw]] before [[widelast:widelast]] ends.',
  'Finally a [[solo:solo]] word.',
];

const SECTIONS_STUB = JSON.stringify([
  {
    title: '地球与生命', zh: '地球与生命', subheads: [''],
    paragraphs: [SENTENCES],
    sentZh: [SENTENCES.map((_, i) => `第 ${i} 句的中文译文。`)],
    paraZh: [''],
  },
]);

async function stubData(page: import('@playwright/test').Page) {
  await page.route('**/data/sections.json*', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: SECTIONS_STUB }));
  await page.route('**/data/vocab.json*', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(VOCAB_STUB) }));
  await page.route('**/data/chapters.json*', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
}

async function waitAppReady(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    try {
      return typeof SECTIONS !== 'undefined' && SECTIONS.length > 0
        && typeof TASK !== 'undefined' && !!(TASK.state() && TASK.state().daily);
    } catch (e) { return false; }
  });
}

async function enterArticle(page: import('@playwright/test').Page) {
  await stubData(page);
  await page.addInitScript(() => { (window as unknown as { __e2eAuthBypass: boolean }).__e2eAuthBypass = true; });
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);
  await page.locator('.art-card').first().click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  await page.waitForFunction(() => document.querySelectorAll('.nb-group').length > 0);
}

/* 组内几何：以组为坐标系返回每张卡的相对位置与尺寸（px）。 */
type Card = { x: number; y: number; w: number; h: number };
type Group = { inner: number; cards: Card[] };
async function groupGeometry(page: import('@playwright/test').Page): Promise<Group[]> {
  return page.evaluate(() => {
    const padX = (el: HTMLElement) => {
      const cs = getComputedStyle(el);
      return parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    };
    return Array.from(document.querySelectorAll('.nb-group')).map((g) => {
      const ge = g as HTMLElement;
      const gr = ge.getBoundingClientRect();
      const inner = ge.clientWidth - padX(ge);
      const cards = Array.from(ge.querySelectorAll('.notebar')).map((c) => {
        const r = (c as HTMLElement).getBoundingClientRect();
        return { x: r.left - gr.left, y: r.top - gr.top, w: r.width, h: r.height };
      });
      return { inner, cards };
    });
  });
}

function rowsOf(cards: Card[]): Card[][] {
  const rows: Card[][] = [];
  for (const c of cards) {
    const row = rows.find((r) => Math.abs(r[0].y - c.y) < 4);
    if (row) row.push(c); else rows.push([c]);
  }
  return rows;
}

test.describe('句下词卡网格（2026-10-10 定稿：2 列等高 + 落单占满）', () => {
  test('桌面：同排等宽等高、行不留死空、落单/长卡占满', async ({ page }) => {
    await enterArticle(page);
    const groups = await groupGeometry(page);
    expect(groups.length, '5 句各有一组词卡').toBe(5);

    for (const [gi, g] of groups.entries()) {
      expect(g.cards.length, `组 ${gi} 有卡`).toBeGreaterThan(0);
      for (const c of g.cards) {
        const ratio = c.w / g.inner;
        expect(ratio, `组 ${gi} 卡宽占比 ${ratio.toFixed(2)}，只能是半宽或满宽`)
          .toBeGreaterThan(0.38);
      }
      for (const row of rowsOf(g.cards)) {
        if (row.length === 1) {
          expect(row[0].w / g.inner, `组 ${gi} 落单卡必须占满整行（不许半宽 + 死空）`)
            .toBeGreaterThan(0.85);
        } else {
          for (const c of row) {
            expect(Math.abs(c.h - row[0].h), `组 ${gi} 同排卡等高（高高矮矮回归锁）`)
              .toBeLessThanOrEqual(3);
            expect(Math.abs(c.w - row[0].w), `组 ${gi} 同排卡等宽（长长短短回归锁）`)
              .toBeLessThanOrEqual(3);
          }
        }
      }
      const last = g.cards[g.cards.length - 1];
      const lastRow = rowsOf(g.cards).find((r) => r.indexOf(last) >= 0)!;
      expect(lastRow.length > 1 || last.w / g.inner > 0.85,
        `组 ${gi} 行尾不许留死空`).toBeTruthy();
    }

    /* 渲染端列游标的直接锁：5 组里恰好 4 张 .nb-lone（tri3 / afterw / shortw（下一张是宽卡，
       会被搁浅） / solo），2 张 .nb-wide（longw / widelast）。 */
    expect(await page.locator('.nb-group .notebar.nb-lone').count(), 'nb-lone 数').toBe(4);
    expect(await page.locator('.nb-group .notebar.nb-wide').count(), 'nb-wide 数').toBe(2);
  });

  test('手机档（≤700px）回落单列：每张卡都占满', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterArticle(page);
    const groups = await groupGeometry(page);
    expect(groups.length).toBe(5);
    for (const [gi, g] of groups.entries()) {
      for (const c of g.cards) {
        expect(c.w / g.inner, `组 ${gi} 手机档单列必须满宽`)
          .toBeGreaterThan(0.85);
      }
    }
  });
});
