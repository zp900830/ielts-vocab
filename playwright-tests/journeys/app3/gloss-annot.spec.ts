/* ① 字距方案 B（注音式·只词义）回归锁 —— 2026-10-12 用户选定，交接单
   docs/superpowers/specs/2026-10-12-字距方案B-注音式（只词义）.md。

   病根：桌面档 .sec .para 是 text-align:justify；行内小字块 .gl（/音标/ 词义，nowrap、30~200px）
   不可断行 → 含长小字的行被拉出巨大词间空格（实测最大 48.1px，正常 ≈4.7px），越窄越凶。
   方案 B：词义改悬在词正上方（.wg 定位壳 + 绝对定位 .gl，10.5px、居中、不占行宽）；
   音标不进注音（点词弹层 / 词卡里照旧）；两档正文改左对齐、行距 2.35。

   反向验证（开发期已做）：把 .sec .para 换回 justify + .sec .gl 回行内（去掉 .wg 定位）
   → 用例 1 的最大词间空格回到 ~几十 px，必须红。定稿观感 work/gl5_v2_desktop.png / _mobile.png。 */
import { test, expect } from '../../fixtures';
import { waitShadowReady } from '../../utils/app-ready';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
};
declare const VOCAB: Record<string, { p?: string; uk?: string; us?: string; m?: string }>;
// AB 交互（全局作用域，正文点选链路）：测试走真实产品路径设 A 点
declare const sents: HTMLElement[];
declare function toggleAB(): void;
declare function abTap(i: number): boolean;
declare function abCancel(silent?: boolean): void;

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 进阅读（任务模式 = 唯一露出正文 .layout 的视图）。用真实数据：48px 基线就是在真实
   篇章上实测的，字距锁必须对同一现场生效（stub 的短句可能复现不出 justify 拉缝）。 */
async function enterArticle(page: import('@playwright/test').Page) {
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitShadowReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitShadowReady(page);
  await page.locator('.art-card').first().click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  await expect(page.locator('.sec .para').first()).toBeVisible();
  // 字体晚到会改量值：等字体就绪再量（方案B 的夹紧也挂了 fonts.ready 兜底）
  await page.evaluate(() => document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : true);
}

test.describe('字距方案 B · 注音式（只词义）', () => {
  test('核心锁：900px 档句子最大词间空格 ≤ 8px（现状基线 48px；换回 inline+justify 必红）', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 1100 });
    await enterArticle(page);

    const r = await page.evaluate(() => {
      const paras = [...document.querySelectorAll('.sec .para')].filter((p) => (p as HTMLElement).offsetParent);
      let max = 0;
      let spaces = 0;
      for (const p of paras) {
        for (const s of p.querySelectorAll('.sent')) {
          const walker = document.createTreeWalker(s, NodeFilter.SHOW_TEXT);
          let n: Node | null;
          while ((n = walker.nextNode())) {
            // 注音文本不是句文（方案B 前它是行内小字块——拉缝的元凶本体）
            if (n.parentElement && n.parentElement.closest('.gl')) continue;
            const t = n.textContent || '';
            for (let i = 0; i < t.length; i++) {
              if (t[i] !== ' ') continue;
              const range = document.createRange();
              range.setStart(n, i);
              range.setEnd(n, i + 1);
              const w = range.getBoundingClientRect().width;
              spaces++;
              if (w > max) max = w;
            }
          }
        }
      }
      return { max: Math.round(max * 100) / 100, spaces, paras: paras.length };
    });

    expect(r.paras, '必须有可见段落').toBeGreaterThan(0);
    expect(r.spaces, '必须有可量的词间空格').toBeGreaterThan(10);
    expect(r.max, `最大词间空格 ${r.max}px 应 ≤ 8px（justify+行内小字的基线是 ~48px）`).toBeLessThanOrEqual(8);
  });

  test('注音绝对定位、悬浮在词正上方且水平居中（未夹紧样本中心差 ≤3px）', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 1100 });
    await enterArticle(page);

    const r = await page.evaluate(() => {
      const wgs = [...document.querySelectorAll('.sec .para .wg')];
      // 优先挑「没有被夹紧」的样本（marginLeft 空或 0px）：夹紧样本被推过，中心差另有口径
      const pick = (wgs.find((x) => {
        const g = x.querySelector('.gl');
        return g && (!g.style.marginLeft || g.style.marginLeft === '0px');
      }) || wgs[0]) as HTMLElement | undefined;
      if (!pick) return null;
      const gl = pick.querySelector('.gl') as HTMLElement;
      const w = pick.querySelector('.w') as HTMLElement;
      const cs = getComputedStyle(gl);
      const gr = gl.getBoundingClientRect();
      const wr = w.getBoundingClientRect();
      return {
        count: wgs.length,
        pos: cs.position,
        visible: gr.width > 0 && wr.width > 0,
        centerDiff: Math.abs((gr.left + gr.width / 2) - (wr.left + wr.width / 2)),
        aboveWord: wr.top - gr.bottom,          // 注音底边到词顶的间距（≈3px）
      };
    });

    expect(r, '正文里必须有注音').not.toBeNull();
    expect(r!.count, '注音（.wg 壳）数量').toBeGreaterThan(0);
    expect(r!.pos, '注音必须绝对定位（不占行宽）').toBe('absolute');
    expect(r!.visible, '样本注音可见').toBe(true);
    expect(r!.centerDiff, '注音水平中心应≈词中心').toBeLessThanOrEqual(3);
    expect(r!.aboveWord, '注音悬在词顶上方（间隔≈3px）').toBeGreaterThanOrEqual(0);
    expect(r!.aboveWord, '注音与词之间不留大空').toBeLessThanOrEqual(10);
  });

  test('音标不进注音（.sec .gl 里的 gl-p 不可见）；点词弹层仍显示音标', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 1100 });
    await enterArticle(page);

    // 注音里就算带了 gl-p（lcMini 同源模板），在 .sec 里也必须藏住
    const gpDisplay = await page.evaluate(() => {
      const gp = document.querySelector('.sec .gl .gl-p') as HTMLElement | null;
      return gp ? getComputedStyle(gp).display : 'absent';
    });
    expect(['none', 'absent'], '注音内的音标必须不可见').toContain(gpDisplay);

    // 点一个「词库里有音标」的词 → 弹层里音标照旧（音标只是不进注音，不是没了）
    const clicked = await page.evaluate(() => {
      const el = [...document.querySelectorAll('.sec .para .w')].find((x) => {
        const info = VOCAB[(x as HTMLElement).dataset.w || ''];
        return !!(info && (info.p || info.uk || info.us));
      }) as HTMLElement | undefined;
      if (!el) return null;
      el.click();
      return el.dataset.disp || el.dataset.w || '';
    });
    expect(clicked, '正文里应能找到带音标的词').toBeTruthy();
    await expect(page.locator('#pop')).toBeVisible();
    const uk = (await page.locator('#ppUK').textContent()) || '';
    const us = (await page.locator('#ppUS').textContent()) || '';
    expect(`${uk} ${us}`, `点词弹层必须还有音标（点了 ${clicked}）`).toMatch(/\/.+\//);
  });

  test('hide-gl 拨杆：注音整体隐藏，aria-checked 跟着翻', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 1100 });
    await enterArticle(page);

    const gl = page.locator('.sec .gl').first();
    await expect(gl).toBeVisible();
    await page.locator('#btnGloss').click();
    await expect(page.locator('body')).toHaveClass(/hide-gl/);
    await expect(gl).toBeHidden();
    await expect(page.locator('#btnGloss')).toHaveAttribute('aria-checked', 'false');

    // 拨回来照旧（注音不因开关而残坏）
    await page.locator('#btnGloss').click();
    await expect(page.locator('body')).not.toHaveClass(/hide-gl/);
    await expect(gl).toBeVisible();
  });

  test('手机档（390px）：注音不出栏（每个注音都被夹在所在段落的左右边内）', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterArticle(page);

    // 夹紧是渲染后的异步补夹（双 rAF），poll 到「无越界」为止再定稿
    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const paras = [...document.querySelectorAll('.sec .para')].filter((p) => (p as HTMLElement).offsetParent);
            let bad = 0;
            for (const p of paras) {
              const pr = p.getBoundingClientRect();
              for (const g of p.querySelectorAll('.wg > .gl')) {
                const gr = g.getBoundingClientRect();
                if (!gr.width) continue;
                if (gr.left < pr.left - 1 || gr.right > pr.right + 1) bad++;
              }
            }
            return bad;
          }),
        { message: '手机档注音必须被夹在段落栏内', timeout: 10000 },
      )
      .toBe(0);

    const total = await page.evaluate(
      () => document.querySelectorAll('.sec .para .wg > .gl').length,
    );
    expect(total, '手机档同样要有注音样本').toBeGreaterThan(0);
  });

  /* AB 交互面 × 注音（2026-10-12 复盘补）：
     A/B 徽标挂在句子首行左缘（::after，left:-4px、宽 22px），句首词的注音居中展开后
     左端会伸进徽标区（开发期实测「Spring」样本 14×8px 重叠）；A-B 循环区间框的 2px
     上边框（top-6 起）同样会横穿 A 句首行注音（注音悬在句子上方 ~14px）。
     修法：clampGloss 对带 ab-a/ab-b 的句子把相交注音下限抬到「徽标右缘 + 4px」；
     updateABRegion 的顶边在 A 句首行带注音时抬到注音上方。两条链都由 paintAB 驱动。
     反向验证：去掉 clampGloss 的让位段，本用例必红（shifted 停在 0px / overlap=true）。 */
  test('AB 徽标让位：设 A 后超宽句首注音右移不重叠，取消后归位', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 1100 });
    await enterArticle(page);
    await page.waitForTimeout(300);   // 首轮夹紧（双 rAF）落定

    const r = await page.evaluate(async () => {
      const raf2 = () => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
      /* 1) 找「未设 A 时注音就会伸进徽标区」的句首词句（含被「栏口夹紧」推过的样本——
         它们同样落在徽标 x 区内）。徽标区 x ∈ [sentL-4, sentL+18]，y 必重叠。 */
      let hit: HTMLElement | null = null;
      outer: for (const p of document.querySelectorAll('.sec .para')) {
        if (!(p as HTMLElement).offsetParent) continue;
        for (const s of p.querySelectorAll('.sent')) {
          const w = s.querySelector('.w');
          if (!w) continue;
          const wg = w.closest('.wg');
          if (!wg || !wg.querySelector('.gl')) continue;
          const txt = (s.textContent || '').replace(/^\s+/, '');
          const d = (w as HTMLElement).getAttribute('data-disp') || '';
          if (!d || !txt.toLowerCase().startsWith(d.toLowerCase())) continue;
          const sl = s.getClientRects()[0].left;
          const gr = (wg.querySelector('.gl') as HTMLElement).getBoundingClientRect();
          if (gr.width && gr.left < sl + 18 && gr.right > sl - 4) { hit = s as HTMLElement; break outer; }
        }
      }
      if (!hit) return null;
      const idx = sents.indexOf(hit);

      /* 2) 真实链路设 A：toggleAB（arm）→ abTap（收 A，paintAB 里触发注音重夹） */
      toggleAB();
      abTap(idx);
      await new Promise((res) => setTimeout(res, 250));
      const gl = hit.querySelector('.wg > .gl') as HTMLElement;
      const f = hit.getClientRects()[0];
      const gr = gl.getBoundingClientRect();
      // 徽标真实尺寸：probe 元素复制 ::after 计算样式
      const after = getComputedStyle(hit, '::after');
      const probe = document.createElement('span');
      (['fontSize', 'fontWeight', 'lineHeight', 'padding', 'fontFamily', 'boxSizing', 'letterSpacing'] as const)
        .forEach((k) => { probe.style[k] = after[k]; });
      probe.textContent = 'A';
      probe.style.cssText += ';position:absolute;visibility:hidden;left:-9999px;top:0;white-space:nowrap;';
      document.body.appendChild(probe);
      const pbr = probe.getBoundingClientRect();
      probe.remove();
      const badge = { left: f.left - 4, top: f.top - 10, right: f.left - 4 + pbr.width, bottom: f.top - 10 + pbr.height };
      const out = {
        disp: hit.querySelector('.w')!.getAttribute('data-disp') || '',
        shifted: getComputedStyle(gl).marginLeft,
        gap: Math.round(gr.left - badge.right),       // 注音左缘 - 徽标右缘
        overlap: gr.left < badge.right && gr.right > badge.left && gr.top < badge.bottom && gr.bottom > badge.top,
        marked: hit.classList.contains('ab-a'),
      };

      /* 3) 续设 B（后两句）→ abMode=3：区间框顶边必须让开 A 句首行注音
            （原 top-6 起的上边框会横穿注音带，修后顶边抬到注音上方） */
      abTap(idx + 2);
      await new Promise((res) => setTimeout(res, 500));   // region transition + 重夹落定
      const rr = (document.getElementById('abRegion') as HTMLElement | null)?.getBoundingClientRect();
      const g2 = gl.getBoundingClientRect();
      const out3 = {
        ...out,
        regionTop: rr ? Math.round(rr.top) : null,
        regionGap: rr ? Math.round(g2.top - (rr.top + 2)) : null,   // 注音顶 - 边框底
        regionCross: !!rr && !(rr.top + 2 <= g2.top || rr.top >= g2.bottom),
      };

      /* 4) 取消 → 注音应归位（重夹回 0），标记移除 */
      abCancel();
      await raf2(); await raf2();
      await new Promise((res) => setTimeout(res, 200));
      const out2 = {
        ...out3,
        mlAfterCancel: getComputedStyle(gl).marginLeft,
        markedAfterCancel: hit.classList.contains('ab-a'),
      };
      return out2;
    });

    expect(r, '真实数据里应有「句首注音会伸进徽标区」的样本（没有则数据/渲染有变，锁需重评）').not.toBeNull();
    expect(r!.marked, '设 A 后句子应挂 ab-a').toBe(true);
    expect(r!.shifted, `让位生效（样本 ${r!.disp}，marginLeft=${r!.shifted}）`).not.toBe('0px');
    expect(r!.gap, `注音左缘应让开徽标右缘（间隙 ${r!.gap}px）。首行位置注音与徽标 y 必重叠，` +
      'x 相交即为真重叠——间隙必须 ≥ 4px').toBeGreaterThanOrEqual(4);
    expect(r!.overlap, 'AB 徽标与注音不得重叠').toBe(false);
    expect(r!.regionCross, `A-B 区间框上边框不得横穿 A 句首行注音（框顶 ${r!.regionTop}px）`).toBe(false);
    expect(r!.regionGap, `区间框上边框底到注音顶应有净空（实测 ${r!.regionGap}px ≥ 2）`).toBeGreaterThanOrEqual(2);
    expect(r!.markedAfterCancel, '取消后 ab-a 应移除').toBe(false);
    expect(r!.mlAfterCancel, '取消后注音应归位（重夹回 0px）').toBe('0px');
  });
});
