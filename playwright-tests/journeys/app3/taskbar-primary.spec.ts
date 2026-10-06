/* 2026-10-06 用户两张截图，三件事各锁一条（全部在 390×844 移动端量）：
   ① 推进键 #tbNext 不许和其余胶囊同形却孤零零掉到第二行 —— 它得**看起来就是主按钮**：
      带回文字、比谁都宽，落单就自己撑满整行。
   ② 「再来一遍这句」(#tbAgain) 与「每句重复几遍」(#btnLoop) 过去都是 ri-repeat-line，
      窄屏纯图标下完全分不出；锁图标不同 + 名字不同。
   ③ 快速跳转的章节下拉在单篇视图里被 filter 成当前章，只剩一项；锁「列出全部章节」
      且跳去别的章真的换章、落到该章那一句。
   ④ 次级排（循环/AB/倍速/书签/跳转/上一句/再来）过去是两套皮：dock 来的绿字小胶囊 +
      任务条自带的黑字大圆键（用户：「icon 黑的黑绿的绿，大的大，小的小」）。
      锁整排同墨色、同底色、同边框、同图标号、同高度，绿色只留给推进键。 */
import { test, expect } from '../../fixtures';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  readDone(i: number): void;
  active: boolean;
  queue: { i: number }[];
};
declare const SECTIONS: { title: string; paragraphs: string[][] }[];
declare function toggleJumpPop(force?: boolean): void;
declare function syncJumpHint(): void;
declare function jumpGo(): void;
declare function chapterSentCount(i: number): number;
declare function computeChapterStart(i: number): number;
declare const currentChapter: number;   // let，同 realm 可见
declare const idx: number;
declare const sents: unknown[];

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 六篇，句数刻意不等（第 0 篇 12 句，其余 2 句）：跳章要能验出「句号是本篇内的第几句」。 */
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

/* 首屏必须等 loadData + TASK.init 落地（同一套 waitAppReady 口径，见 task.spec.ts 注释）。 */
async function waitAppReady(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    try {
      return typeof SECTIONS !== 'undefined' && SECTIONS.length > 0
        && typeof TASK !== 'undefined' && !!(TASK.state() && TASK.state().daily);
    } catch (e) { return false; }
  });
}

async function enterRead(page: import('@playwright/test').Page) {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/app/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);
  await page.locator('.art-card').first().click();
  await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'read');
}

test.use({ viewport: { width: 390, height: 844 } });

test.describe('任务条：推进键是主按钮 / 再来与循环可分 / 快速跳转能换章', () => {
  test('① 推进键带文字、独占一行并拉满整排，不与任何按钮叠影', async ({ page }) => {
    await enterRead(page);
    const geo = await page.evaluate(() => {
      /* 只比这一排真正露在外面的控件：.loop-menu / .ab-menu 那些下拉项收起来时是
         opacity:0 但仍占位，拿它们比叠影会把「菜单压在按钮上」误报成撞车。 */
      const shown = (el: Element) => (el as HTMLElement).offsetParent !== null
        && !el.closest('.loop-menu, .rate-menu, .ab-menu');
      const box = (el: Element) => {
        const b = el.getBoundingClientRect();
        return { id: el.id || (el.textContent || '').trim().slice(0, 4),
          x: +b.left.toFixed(1), y: +(b.top + b.height / 2).toFixed(1),
          w: +b.width.toFixed(1), h: +b.height.toFixed(1),
          r: +b.right.toFixed(1), bot: +b.bottom.toFixed(1),
          text: (el.textContent || '').trim() };
      };
      const btns = [...document.querySelectorAll('#taskBar button')].filter(shown).map(box)
        .filter((o) => o.id !== 'tbExit');
      const bar = document.getElementById('taskBar')!.getBoundingClientRect();
      const overlaps: string[] = [];
      for (let i = 0; i < btns.length; i++) {
        for (let j = i + 1; j < btns.length; j++) {
          const a = btns[i], c = btns[j];
          const ox = Math.min(a.r, c.r + 0) - Math.max(a.x, c.x);
          const oy = Math.min(a.bot, c.bot) - Math.max(a.y - a.h / 2, c.y - c.h / 2);
          if (ox > 1 && oy > 1) overlaps.push(`${a.id}×${c.id}`);
        }
      }
      const next = btns.find((o) => o.id === 'tbNext') || null;
      return {
        btns, overlaps, next,
        barW: +bar.width.toFixed(1), barR: +bar.right.toFixed(1),
        sameRow: next ? btns.filter((o) => o.id !== 'tbNext' && Math.abs(o.y - next.y) < 10).length : -1,
      };
    });
    expect(geo.btns.length, '这一排至少要有几颗按钮才谈得上叠影').toBeGreaterThan(3);
    expect(geo.overlaps, '任何两颗按钮不许互相压住').toEqual([]);
    const next = geo.next as { w: number; h: number; r: number; text: string };
    // 「按钮形式都一样，凭什么只有它掉到第二行」的解法：让它一看就是主操作，而不是被挤下去
    expect(next.text, '窄屏推进键要带文字，不再是一颗光秃图标').toMatch(/下一句|放这一句|开始答题/);
    geo.btns.filter((o) => o.id !== 'tbNext').forEach((o) => {
      expect(next.w, `推进键必须比「${o.id}」宽（实测 ${next.w} vs ${o.w}）`).toBeGreaterThan(o.w);
    });
    expect(geo.sameRow, '推进键独占一行：这一排不许有别的按钮和它同一行').toBe(0);
    expect(next.w, '独占一行就要拉满整排，不是居中一枚小胶囊')
      .toBeGreaterThanOrEqual(geo.barW - 30);
    expect(next.h, '推进键触区仍要 ≥44').toBeGreaterThanOrEqual(44);
    expect(next.r, '推进键不许越出任务条右缘').toBeLessThanOrEqual(geo.barR + 1);
  });

  test('② 「再来一遍这句」与「每句重复几遍」图标与名字都不同', async ({ page }) => {
    await enterRead(page);
    const icons = await page.evaluate(() => ({
      againIcon: document.querySelector('#tbAgain i')!.className,
      loopIcon: document.querySelector('#btnLoop i')!.className,
    }));
    expect(icons.againIcon).toContain('ri-loop-left-line');
    expect(icons.loopIcon).toContain('ri-repeat-line');
    expect(icons.againIcon, '两颗不许再共用同一个循环图标').not.toEqual(icons.loopIcon);
    await expect(page.locator('#tbAgain')).toHaveAttribute('aria-label', /再来一遍这句/);
    await expect(page.locator('#btnLoop')).toHaveAttribute('aria-label', /每句重复几遍/);
    // 运行时 updateTaskBar 会重写 #tbAgain 的 innerHTML，图标不能只改静态 DOM
    await expect(page.locator('#tbAgain i')).toHaveClass(/ri-loop-left-line/);
  });

  test('③ 快速跳转列出全部章节，跳章真的换章并落到该章那一句', async ({ page }) => {
    await enterRead(page);
    // 任务模式里播放条那颗跳转键在 docked 那一排；直接开弹窗更稳（同一支函数）
    await page.evaluate(() => toggleJumpPop(true));
    await expect(page.locator('#jumpPop')).toBeVisible();
    const n = await page.evaluate(() => SECTIONS.length);
    expect(n).toBeGreaterThan(2);
    await expect(page.locator('#jumpCh option')).toHaveCount(n);
    // 单篇视图里停在第 0 篇：提示说的是**目标章**的全局句区间，不是「第 1–N 句」的错话
    const hint3 = await page.evaluate(() => {
      const sel = document.getElementById('jumpCh') as HTMLSelectElement;
      sel.value = '2'; syncJumpHint();
      return {
        text: document.getElementById('jumpHint')!.textContent || '',
        total: chapterSentCount(2), start: computeChapterStart(2),
      };
    });
    expect(hint3.text).toContain(`第3章共 ${hint3.total} 句`);
    expect(hint3.text).toContain(`全文第 ${hint3.start + 1}–${hint3.start + hint3.total} 句`);

    await page.locator('#jumpN').fill('2');
    await page.evaluate(() => jumpGo());
    await expect(page.locator('#jumpPop')).toBeHidden();
    const landed = await page.evaluate(() => ({ ch: currentChapter, i: idx, len: sents.length }));
    expect(landed.ch, '跳到别的章必须真的换章').toBe(2);
    expect(landed.len, '换章后正文只剩目标章').toBe(hint3.total);
    expect(landed.i, '单篇视图里句号是本地下标：第 2 句 = 下标 1').toBe(1);
  });

  test('④ 次级排同排同皮：墨色/底色/边框/图标号/高度全一致，绿只留给推进键', async ({ page }) => {
    await enterRead(page);
    const row = await page.evaluate(() => {
      const sels = ['#btnLoop', '#btnAB', '#rateCycle', '#markBtn',
        '#taskBar .jump-btn', '#tbPrev', '#tbAgain'];
      return sels.map((s) => {
        const el = document.querySelector(s) as HTMLElement | null;
        // 跳转键在 ① 通读态是藏起来的（能力在弹窗里），不参与「同排」比较
        if (!el || el.offsetParent === null) return null;
        const cs = getComputedStyle(el);
        const ic = el.querySelector('i');
        const parts = (getComputedStyle(el, '::after').inset || '0px')
          .split(/\s+/).map((x) => Math.abs(parseFloat(x) || 0));
        const r = el.getBoundingClientRect();
        return {
          s, color: cs.color, bg: cs.backgroundColor, border: cs.borderTopColor,
          h: +r.height.toFixed(1), touchH: +(r.height + 2 * (parts[0] || 0)).toFixed(1),
          icon: ic ? getComputedStyle(ic).fontSize : null,
        };
      }).filter((o): o is NonNullable<typeof o> => o !== null);
    });
    const first = row[0];
    row.forEach((o) => {
      expect(o.color, `${o.s} 墨色要和整排一致（${o.color} vs ${first.color}）`).toBe(first.color);
      expect(o.bg, `${o.s} 底色要和整排一致（${o.bg} vs ${first.bg}）`).toBe(first.bg);
      expect(o.border, `${o.s} 边框要和整排一致（${o.border} vs ${first.border}）`).toBe(first.border);
      expect(Math.abs(o.h - first.h), `${o.s} 高度要和整排一致（${o.h} vs ${first.h}）`)
        .toBeLessThanOrEqual(1);
      if (o.icon) expect(o.icon, `${o.s} 图标号要和整排一致（mobileBtnIcons 的行内 14px 必须被压住）`).toBe('16px');
      expect(o.touchH, `${o.s} 视觉改矮后有效触区仍要 ≥44`).toBeGreaterThanOrEqual(44);
    });
    expect(first.color, '整排不许再是 .btn 那支绿').not.toBe('rgb(10, 125, 93)');
    const cta = await page.evaluate(() => getComputedStyle(document.getElementById('tbNext')!).color);
    expect(cta, '推进键仍要是自己的 CTA 色，不和次级排同色').not.toBe(first.color);
  });
});
