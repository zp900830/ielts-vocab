#!/usr/bin/env node
'use strict';
/* gl5-shots.cjs —— ① 字距问题：现状 + 三个「保留行内词义」的新方案实景图。
   不占行宽的两条路（注音式·上），和「降扰动」的一条路（柔性行内）。
   用法：先起服务器 node playwright-tests/scripts/serve.cjs 8941 .，
   再 NODE_PATH=playwright-tests/node_modules node work/gl5-shots.cjs
   产出：work/gl5_<变体>_<视口>.png + work/gl5_compare_<视口>.png（拼版） */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://127.0.0.1:8941';
const OUT = path.resolve(__dirname);

const VARIANTS = [
  { key: 'v0', label: '现状（对照片：行内「音标＋词义」，桌面两端对齐）', css: '' },
  { key: 'v1', label: '新方案 A｜注音式（音标＋词义，挂在词正上方，不占行宽、不再撑行）', css: `
    .sec .para { text-align: left; line-height: 2.5; padding-top: 13px; }
    .sec .wg { position: relative; }
    .sec .gl { position: absolute; left: 50%; bottom: calc(100% + 3px); transform: translateX(-50%);
      margin: 0; font-size: 10.5px; line-height: 1.1; white-space: nowrap; pointer-events: none;
      color: var(--muted); }
    .sec .gl-p { font-size: 9px; opacity: .8; }
  ` },
  { key: 'v2', label: '新方案 B｜注音式·只留词义（音标进点词弹层，注音更短更轻）', css: `
    .sec .para { text-align: left; line-height: 2.35; padding-top: 13px; }
    .sec .wg { position: relative; }
    .sec .gl { position: absolute; left: 50%; bottom: calc(100% + 3px); transform: translateX(-50%);
      margin: 0; font-size: 10.5px; line-height: 1.1; white-space: nowrap; pointer-events: none;
      color: var(--muted); }
    .sec .gl-p { display: none; }
  ` },
  { key: 'v3', label: '新方案 C｜柔性行内（仍贴词后；去两端对齐＋小字 11px＋可在词义间断行）', css: `
    .sec .para { text-align: left; }
    .sec .gl { font-size: 11px; white-space: normal; }
  ` },
];

async function captureFor(ctx, viewport, tag, mode) {
  const page = await ctx.newPage();          // 每档独立页面：上一档点进文章后，同页 hash 导航回不去首页
  await page.setViewportSize(viewport);
  await page.goto(`${BASE}/index.html#/home`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.art-card', { timeout: 20000 });
  await page.locator('.art-card').first().click();
  // 等「可见的带小字段落」出现（文章里有预渲染隐藏区块，不能按全量等）
  await page.waitForFunction(() =>
    [...document.querySelectorAll('.sec .para')].some((p) => p.offsetParent && p.querySelector('.gl')),
    null, { timeout: 20000 });
  await page.waitForTimeout(400);

  /* 选段：
     - gap 模式（桌面档）：实测**基线 justify 下最大的词间空格宽**，挑「巨缝」最凶的一段
       —— 这才是用户报的「突然增加字节距」的最直接标本；
     - dense 模式（手机档）：挑小字最密、高度适中的一段。
     两个模式都在**可见段落**里选（文章有预渲染隐藏区块）。 */
  const pick = await page.evaluate((mode) => {
    const all = [...document.querySelectorAll('.sec .para')];
    const vis = all.filter((p) => p.offsetParent);

    const maxSpace = (p) => {
      const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
      let maxW = 0, n;
      while ((n = walker.nextNode())) {
        const t = n.textContent;
        for (let i = 0; i < t.length; i++) {
          if (t[i] === ' ') {
            const r = document.createRange();
            r.setStart(n, i); r.setEnd(n, i + 1);
            const w = r.getBoundingClientRect().width;
            if (w > maxW) maxW = w;
          }
        }
      }
      return Math.round(maxW);
    };

    let best = -1, bestScore = -1, bestN = 0, gap = 0;
    vis.forEach((p) => {
      const i = all.indexOf(p);
      const n = p.querySelectorAll('.gl').length;
      const h = p.getBoundingClientRect().height;
      if (!p.querySelector('.gl')) return;       // 至少带一个小字
      let score;
      if (mode === 'gap') {
        // 巨缝最凶的段落往往只有一两个长小字，且可能很高——不设数量/高度门槛，纯按实测最大空格宽
        const g = maxSpace(p);
        score = g * 10 + n;
        if (score > bestScore) { bestScore = score; best = i; bestN = n; gap = g; }
      } else {
        if (h < 120 || h > 1400) return;
        score = n * 100 - Math.abs(h - 360);
        if (score > bestScore) { bestScore = score; best = i; bestN = n; }
      }
    });
    if (best < 0) { // 兜底：第一个可见且带小字的
      const p = vis.find((x) => x.querySelector('.gl')) || vis[0] || all[0];
      best = all.indexOf(p);
      bestN = p ? p.querySelectorAll('.gl').length : 0;
    }
    return { idx: best, n: bestN, visCount: vis.length, maxSpace: gap };
  }, mode);

  console.log(`[${tag}] 选段 idx=${pick.idx} 小字数=${pick.n} 最大词间空=${pick.maxSpace}px`);

  /* 注音式需要一个「词+小字」的共同定位容器：DOM 里 .gl 是 .w 的**兄弟**（不是子节点），
     纯 CSS 定位不到。预览里用 JS 包一层 .wg 模拟（生产实现时对应改 wrapWords 的输出结构，
     并同步 refreshGloss / elContext 的取节点方式）。包壳对所有变体布局中性。 */
  await page.evaluate(() => {
    document.querySelectorAll('.sec .w').forEach((w) => {
      const gl = w.nextElementSibling;
      if (gl && gl.classList.contains('gl')) {
        const box = document.createElement('span');
        box.className = 'wg';
        w.parentNode.insertBefore(box, w);
        box.appendChild(w);
        box.appendChild(gl);
      }
    });
  });

  const shots = [];
  for (const v of VARIANTS) {
    await page.evaluate((css) => {
      let el = document.getElementById('__gl5');
      if (!el) { el = document.createElement('style'); el.id = '__gl5'; document.head.appendChild(el); }
      el.textContent = css;
      void document.body.offsetHeight;
    }, v.css);
    await page.waitForTimeout(120);
    /* 注音夹紧：注音以词为中心展开，行首/行尾词的注音会越出栏口被裁（实测 mantle 被切左半）。
       居中放不下的往栏内推——生产实装同款（渲染后算一次 rect 即可，不用逐帧）。 */
    if (v.key === 'v1' || v.key === 'v2') {
      await page.evaluate(() => {
        document.querySelectorAll('.sec .para').forEach((p) => {
          const pr = p.getBoundingClientRect();
          p.querySelectorAll('.wg').forEach((wg) => {
            const gl = wg.querySelector('.gl');
            if (!gl) return;
            gl.style.marginLeft = '0px';
            const gr = gl.getBoundingClientRect();
            let shift = 0;
            if (gr.left < pr.left + 2) shift = pr.left + 2 - gr.left;
            else if (gr.right > pr.right - 2) shift = pr.right - 2 - gr.right;
            if (shift) gl.style.marginLeft = Math.round(shift) + 'px';
          });
        });
      });
    } else {
      await page.evaluate(() => {
        document.querySelectorAll('.gl').forEach((g) => { g.style.marginLeft = ''; });
      });
    }
    await page.waitForTimeout(80);
    /* 视口截图（不裁整元素）：大段落可到 1500px+，整元素截图在拼版里太高；
       统一「滚到段首再拍一屏」，四个变体同一滚动位置、同一高度，横向可比。 */
    await page.evaluate((idx) => {
      const p = document.querySelectorAll('.sec .para')[idx];
      if (p) { p.scrollIntoView({ block: 'start' }); window.scrollBy(0, -14); }
    }, pick.idx);
    await page.waitForTimeout(120);
    const file = path.join(OUT, `gl5_${v.key}_${tag}.png`);
    await page.screenshot({ path: file });
    shots.push({ file, label: v.label });
  }
  await page.close();
  return shots;
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    serviceWorkers: 'block',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: 'zh-CN',
  });
  // 登录门禁的官方 E2E 后门（fixtures 同款注入；生产环境此值为空）
  await ctx.addInitScript(() => { window.__e2eAuthBypass = true; });

  const mobile = await captureFor(ctx, { width: 390, height: 844 }, 'mobile', 'dense');
  const desktop = await captureFor(ctx, { width: 900, height: 1100 }, 'desktop', 'gap');

  // 拼版：每个视口一张对照图
  for (const [tag, shots] of [['mobile', mobile], ['desktop', desktop]]) {
    const rows = shots.map((s) => {
      const uri = 'file://' + s.file;
      return `<figure><figcaption>${s.label}</figcaption><img src="${uri}"></figure>`;
    }).join('\n');
    const sheet = `<!doctype html><meta charset="utf-8"><style>
      body { margin: 0; padding: 18px 20px 28px; background: #fbfbf9; font: 14px/1.4 -apple-system, "PingFang SC", sans-serif; color: #222; }
      h1 { font-size: 16px; margin: 0 0 14px; }
      h1 span { font-weight: 400; color: #777; font-size: 13px; }
      figure { margin: 0 0 18px; padding: 12px 14px; background: #fff; border: 1px solid #e7e5e0; border-radius: 12px; }
      figcaption { font-size: 13px; color: #444; margin-bottom: 8px; }
      img { max-width: 100%; display: block; }
    </style>
    <h1>① 字距方案对照 · ${tag === 'mobile' ? '手机档 390px' : '桌面档 900px'} <span>同一段落、同一内容，只换排版规则</span></h1>
    ${rows}`;
    const html = path.join('/tmp', `gl5_sheet_${tag}.html`);
    fs.writeFileSync(html, sheet);
    const p2 = await ctx.newPage();
    await p2.setViewportSize({ width: tag === 'mobile' ? 460 : 1000, height: 1200 });
    await p2.goto('file://' + html);
    await p2.waitForTimeout(300);
    await p2.screenshot({ path: path.join(OUT, `gl5_compare_${tag}.png`), fullPage: true });
    await p2.close();
    console.log(`[${tag}] 拼版 → gl5_compare_${tag}.png`);
  }

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
