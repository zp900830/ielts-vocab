/* Round G 取证探针：影子跟读全站「进度条」+ Round F 遗留的两族对比度。
   用法：
     python3 -m http.server 8971 --bind 127.0.0.1 --directory shadow   # 避开 8931/8932
     node work/round_g_probe.mjs              # 量当前工作树
     node work/round_g_probe.mjs --base       # 量 HEAD 复原的副本（反向验证：闸门必须先对旧代码响）
   三条纪律（Round F 用过的，这里一条都不能少）：
     ① 「0 越界」只有在确实捞到站点时才有意义 —— 每一档都打印捞到几处，一处没捞到算"没量到"；
     ② 拖动能不能用不看法、看事实：真按 pointer 拖一次，量当前句有没有跟着走；
     ③ 判据先拿已知会挂的东西验一遍，再拿它去判新的。 */
import { createRequire } from 'module';
const require = createRequire(new URL('../playwright-tests/package.json', import.meta.url));
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const BASE_URL = arg('--url', 'http://127.0.0.1:8971');
const BASE = process.argv.includes('--base');
const URL_PATH = BASE ? '/__base_g_shadow.html' : '/index.html';

/* ---------- 共用的颜色数学 ---------- */
const COLORJS = `
  const __parse = (s) => { const m = /rgba?\\(([^)]+)\\)/.exec(s || ''); if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x));
    return [p[0] || 0, p[1] || 0, p[2] || 0, p.length > 3 ? p[3] : 1]; };
  const __over = (fg, bg) => [fg[0]*fg[3] + bg[0]*(1-fg[3]), fg[1]*fg[3] + bg[1]*(1-fg[3]),
    fg[2]*fg[3] + bg[2]*(1-fg[3]), 1];
  const __lum = (c) => { const a = c.slice(0,3).map((v) => { v /= 255;
      return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); });
    return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2]; };
  const __ratio = (a, b) => +(((Math.max(__lum(a), __lum(b)) + 0.05) / (Math.min(__lum(a), __lum(b)) + 0.05)).toFixed(2));
  const __greenInk = (c) => c[1] > 60 && c[1] - c[0] > 20 && c[1] - c[2] > 12;
  const __bgStack = (el) => {
    const re = /rgba?\\([^)]+\\)/g; const layers = []; let host = el, base = null;
    while (host) {
      const cs = getComputedStyle(host);
      let m; const ims = [];
      while ((m = re.exec(cs.backgroundImage || ''))) { const c = __parse(m[0]); if (c) ims.push(c); }
      if (ims.length) layers.push(ims);
      const solid = __parse(cs.backgroundColor);
      if (solid && solid[3] >= 0.999) { base = solid; break; }
      if (solid && solid[3] > 0) layers.push([solid]);
      host = host.parentElement;
    }
    const acc = base || [255,255,255,1]; const outs = [];
    const flat = (i, cur) => { if (i < 0) { outs.push(cur); return; } layers[i].forEach((s) => flat(i-1, __over(s, cur))); };
    flat(layers.length - 1, acc);
    return outs;
  };
`;

/* ---------- 族 ①：绿字压浅底（Round F 报「待拍板」的第二族） ---------- */
const greenInkSweep = (page) => page.evaluate(`(() => {${COLORJS}
  const out = [];
  document.querySelectorAll('*').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const txt = (el.textContent || '').trim();
    if (!txt) return;                                    // 只看有字的：图标另算
    if (el.querySelector('i[class*="ri-"]') && txt.length < 2) return;
    const fill = cs.webkitTextFillColor;
    if (fill && /rgba?\\([^)]*,\\s*0(\\.0+)?\\s*\\)|transparent/.test(fill)) return;
    const fg = __parse(cs.color); if (!fg || fg[3] < 0.5) return;
    if (!__greenInk(fg)) return;                          // 这一族只管"字是绿的"
    /* 正文（.sec 里）那一族不着墨：词头绿是教学法编码，一页几百个 span，改它等于改阅读体验本身。
       首版没排除，一次量出 8165 处、其中 8150 处是正文 —— 那会把外壳的账全部冲淡。见 §四「已知未修」。 */
    if (el.closest('.sec')) return;
    /* 深浅底都量。第一版只挑浅底，于是深色那一档永远"一处都没捞到"—— 绿字压深底同样是 4.5:1 的账，
       不能因为"这族叫绿字压浅底"就放过另一半。 */
    const bgs = __bgStack(el);
    if (!bgs.length) return;
    const px = parseFloat(cs.fontSize);
    const large = px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
    const need = large ? 3 : 4.5;
    let worst = Infinity, worstBg = null;
    bgs.forEach((b) => { const v = __ratio(fg, b); if (v < worst) { worst = v; worstBg = b; } });
    out.push({ sel: el.id ? '#' + el.id : (el.className && typeof el.className === 'string'
        ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : el.tagName.toLowerCase()),
      text: txt.slice(0, 10), color: cs.color, bg: 'rgb(' + worstBg.slice(0,3).map(Math.round).join(',') + ')',
      size: cs.fontSize, weight: cs.fontWeight, ratio: worst, need, pass: worst >= need });
  });
  return out;
})()`);

/* ---------- 族 ②：A/B 角标 —— 颜色写在 ::after 上，得按伪元素取 ---------- */
const badgeSweep = (page) => page.evaluate(`(() => {${COLORJS}
  const out = [];
  ['ab-a', 'ab-b'].forEach((cls) => {
    const el = document.querySelector('.sent.' + cls);
    if (!el) { out.push({ sel: '.sent.' + cls + '::after', skip: '没有这个节点（A-B 没设上）' }); return; }
    const cs = getComputedStyle(el, '::after');
    const fg = __parse(cs.color); const bg = __parse(cs.backgroundColor);
    if (!fg || !bg) { out.push({ sel: '.sent.' + cls + '::after', skip: '取不到颜色' }); return; }
    const px = parseFloat(cs.fontSize);
    const need = px >= 24 ? 3 : 4.5;                     // 角标是 11px 的字，没有大字豁免
    out.push({ sel: '.sent.' + cls + '::after', text: cs.content, color: cs.color,
      bg: cs.backgroundColor, size: cs.fontSize, ratio: __ratio(fg, bg), need,
      pass: __ratio(fg, bg) >= need });
  });
  return out;
})()`);

/* ---------- 三处进度面：几何 + 可达性 + 真拖一次 ---------- */
/* 判据按"这一根该不该能拖"分两套：能拖的要 ≥24px 热区、轨道静止就看得见、
   滑块不用 hover 也在、role/tabindex 齐；只读的那根（今日面板）只管看得见。 */
const SURFACES = [
  { name: '播放条 #seekTrack', sel: '#seekTrack', knob: '#seekKnob', rail: '#seekRail', drag: true },
  { name: '任务条进度面', sel: '#tbSeek, .tb-prog', knob: '#tbKnob', rail: '#tbSeek .tb-rail, .tb-prog', drag: true },
  { name: '今日面板 .tp-prog', sel: '.tp-prog', knob: null, rail: '.tp-prog', drag: false },
];

/* ⚠️ 这里必须把整段拼成字符串再交给 evaluate：Playwright 会把「函数形式」的回调按源码搬到浏览器里
   重新执行，闭包外的 COLORJS 跟不过去 —— 上一版就是死在这（ReferenceError: COLORJS is not defined）。 */
const surfaceProbe = (page, list) => page.evaluate(`(() => {${COLORJS}
  const L = ${JSON.stringify(list)};
  const out = [];
  L.forEach((k) => {
    const el = document.querySelector(k.sel);
    if (!el) { out.push({ name: k.name, skip: '节点不存在' }); return; }
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) { out.push({ name: k.name, skip: '0×0，这一档不在屏上' }); return; }
    const rail = k.rail ? document.querySelector(k.rail) : null;
    const railH = rail ? parseFloat(getComputedStyle(rail).height) : null;
    const railVis = rail ? (() => { const c = getComputedStyle(rail);
      return parseFloat(c.opacity) > 0.05 && c.visibility !== 'hidden' && c.display !== 'none'; })() : null;
    const knob = k.knob ? document.querySelector(k.knob) : null;
    const knobVis = knob ? parseFloat(getComputedStyle(knob).opacity) > 0.05 : null;
    const hidden = el.getAttribute('aria-hidden') === 'true';
    /* 命中区 = 自身盒子 ∪ ::before/::after 的外扩（拖动热区常挂在伪元素上，如 #seekTrack::before） */
    let hitH = r.height;
    ['::before', '::after'].forEach((pe) => {
      const c = getComputedStyle(el, pe);
      if (!c.content || c.content === 'none') return;
      const t = parseFloat(c.top), b = parseFloat(c.bottom);
      if (Number.isFinite(t) && Number.isFinite(b) && c.height !== 'auto') {
        hitH = Math.max(hitH, r.height - t - b);
      }
    });
    const role = el.getAttribute('role'), tab = el.getAttribute('tabindex');
    const reasons = [];
    if (k.drag) {
      if (hitH < 24) reasons.push('热区只有 ' + hitH + 'px');
      if (railVis === false) reasons.push('轨道看不见');
      if (knob === null) reasons.push('没有滑块');
      else if (knobVis !== true) reasons.push('滑块要 hover 才出现');
      if (hidden) reasons.push('整根 aria-hidden');
      if (role !== 'slider') reasons.push('role≠slider');
      if (tab !== '0') reasons.push('键盘到不了');
      if (cs.pointerEvents === 'none') reasons.push('pointer-events:none');
    } else if (railVis === false || railH === null) reasons.push('轨道看不见');
    out.push({ name: k.name, w: +r.width.toFixed(1), h: +r.height.toFixed(1), hitH: +hitH.toFixed(1),
      railH, railVis, knobVis, role, tab, ariaHidden: el.getAttribute('aria-hidden'),
      valnow: el.getAttribute('aria-valuenow'), pointer: cs.pointerEvents, cursor: cs.cursor,
      why: reasons.join('、') || 'ok', pass: reasons.length === 0 });
  });
  return out;
})()`);

/* 真拖：从 20% 拖到 80%，看当前句是否跟着走 —— "能不能用"只看这个，不看有没有绑事件 */
async function dragTest(page, sel, label) {
  const box = await page.evaluate((s) => { const el = document.querySelector(s);
    if (!el) return null; const r = el.getBoundingClientRect();
    return (r.width && r.height) ? { x: r.x, y: r.y, w: r.width, h: r.height } : null; }, sel);
  if (!box) return { label, skip: '拖不动：目标不在屏上' };
  /* 先让屏幕上确实有一句在播。没有基线，「拖完换了句」就无从判起 —— 判"能不能用"之前，
     得先证明这一页处在能用的那个状态下。 */
  if (await page.evaluate(() => ![...document.querySelectorAll('.sent')].some(e => e.classList.contains('playing')))) {
    const pb = await page.$('#btnPlay');
    if (pb) {
      await pb.click().catch(() => {});
      await page.waitForFunction(() => [...document.querySelectorAll('.sent')].some(e => e.classList.contains('playing')),
        null, { timeout: 8000 }).catch(() => {});
    }
  }
  const before = await page.evaluate(() => { const s = [...document.querySelectorAll('.sent')];
    const i = s.findIndex((e) => e.classList.contains('playing'));
    return { i, txt: i >= 0 ? s[i].innerText.slice(0, 24) : '', n: s.length }; });
  const y = box.y + box.h / 2;
  await page.mouse.move(box.x + box.w * 0.2, y);
  await page.mouse.down();
  for (const f of [0.35, 0.55, 0.8]) { await page.mouse.move(box.x + box.w * f, y); await page.waitForTimeout(60); }
  await page.mouse.up();
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => { const s = [...document.querySelectorAll('.sent')];
    const i = s.findIndex((e) => e.classList.contains('playing'));
    return { i, txt: i >= 0 ? s[i].innerText.slice(0, 24) : '' }; });
  const aria = await page.evaluate((s) => { const el = document.querySelector(s);
    return el ? { role: el.getAttribute('role'), now: el.getAttribute('aria-valuenow'), text: el.getAttribute('aria-valuetext') } : null; }, sel);
  const moved = after.i !== before.i && after.i >= 0;
  return { label, before: before.i, after: after.i, moved, aria,
    sample: after.txt, need: `拖到 80% 应落到第 ${Math.round(0.8 * (before.n - 1))} 句` };
}

async function run() {
  const browser = await chromium.launch();
  let bad = 0, skipped = 0;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultNavigationTimeout(30000);
  try {
    await page.goto(BASE_URL + URL_PATH, { waitUntil: 'commit' });
    await page.waitForSelector('.audiobar', { timeout: 30000 });
  } catch (e) {
    console.log(`⚠️ 页面打不开（${e.message.split('\n')[0]}）—— 整轮没量到`);
    await browser.close(); process.exit(2);
  }
  /* 等正文真渲染出来再量：数据是 fetch 回来的，只等 .audiobar 会出现"量了一个还没启动完的空壳"——
     第一版就是这么量出"播放条拖了不动"的，那条是脚本在撒谎，不是应用的毛病。 */
  try {
    await page.waitForFunction(() => document.querySelectorAll('.sent').length > 5, null, { timeout: 30000 });
  } catch (e) {
    console.log(`⚠️ 正文 30 秒没渲染出来（.sent 不足 6 句）—— 整轮没量到`);
    await browser.close(); process.exit(2);
  }
  await page.waitForTimeout(600);

  const show = (title, list) => {
    if (!list.length) { console.log(`\n⚠️ [${title}] 一处都没捞到 —— 不是"全过"，是没量到`); skipped++; return; }
    const fails = list.filter((x) => x.skip || !x.pass);
    console.log(`\n[${title}] 捞到 ${list.length} 处，越界/没量到 ${fails.length} 处`);
    list.forEach((x) => {
      if (x.skip) { console.log(`   ⚠️ ${x.name || x.sel}：${x.skip}`); skipped++; return; }
      if (!x.pass) bad++;
      const contrast = x.ratio !== undefined ? `${x.color} 压 ${x.bg} → ${x.ratio}（需 ${x.need}）` : '';
      const geo = x.w !== undefined
        ? `${x.w}×${x.h}px，热区 ${x.hitH}px，轨道 ${x.railH}px${x.railVis ? '' : '（不可见）'}`
          + `${x.knob !== undefined && x.knobVis !== null ? `，滑块${x.knobVis ? '可见' : '要 hover 才出现'}` : ''}`
          + `，role=${x.role || '无'} tabindex=${x.tab === null ? '无' : x.tab}`
        : '';
      console.log(`   ${x.pass ? '✓' : '✗'} ${x.name || x.sel}${x.text ? ` 「${x.text}」` : ''} ${[contrast, geo, x.why && x.why !== 'ok' ? x.why : ''].filter(Boolean).join(' | ')}`);
    });
  };

  /* --- 常规模式：播放条 + 绿字族 --- */
  const g1 = await greenInkSweep(page);
  show('常规模式 / 绿字压浅底（桌面）', g1);
  const s1 = await surfaceProbe(page, SURFACES.filter((k) => k.name.indexOf('播放条') === 0));
  show('常规模式 / 播放条进度面', s1);
  const drag1 = await dragTest(page, '#seekTrack', '播放条拖动 20%→80%');
  console.log(`\n[播放条真拖] ${JSON.stringify(drag1)}`);
  if (drag1.skip || !drag1.moved) { console.log('   ✗ 拖了不动 —— 这就是"无法使用"'); bad++; }
  else console.log('   ✓ 当前句跟着走了');

  /* --- A-B 角标 + 循环徽标 --- */
  await page.evaluate(() => { try { toggleAB(); abTap(2); abTap(6); } catch (e) {}
    try { setLoopCount(3); } catch (e) {} });
  await page.waitForTimeout(500);
  const b1 = await badgeSweep(page);
  show('A-B 角标（::after）', b1);
  const lc = await page.evaluate(`(() => {${COLORJS}
    const el = document.getElementById('loopCount');
    if (!el || getComputedStyle(el).display === 'none') return [{ sel: '#loopCount', skip: '徽标没显示出来' }];
    const cs = getComputedStyle(el), fg = __parse(cs.color), bg = __parse(cs.backgroundColor);
    const need = 4.5, v = __ratio(fg, bg);
    return [{ sel: '#loopCount', text: el.textContent, color: cs.color, bg: cs.backgroundColor,
      size: cs.fontSize, ratio: v, need, pass: v >= need }];
  })()`);
  show('单句循环徽标', lc);
  await page.evaluate(() => { try { abCancel(true); setLoopCount(0); } catch (e) {} });
  await page.waitForTimeout(300);

  /* --- 深色：同一批站点再量一遍（两族的值在两个主题下是不同的） --- */
  await page.evaluate(() => { try { toggleDark(); } catch (e) {} });
  await page.waitForTimeout(400);
  if (!(await page.evaluate(() => document.body.classList.contains('dark')))) {
    console.log('\n⚠️ 深色模式没切上 —— 深色这一档等于没量'); skipped++;
  } else {
    show('深色 / 绿字压浅底', await greenInkSweep(page));
    await page.evaluate(() => { try { toggleAB(); abTap(2); abTap(6); setLoopCount(3); } catch (e) {} });
    await page.waitForTimeout(400);
    show('深色 / A-B 角标', await badgeSweep(page));
    show('深色 / 循环徽标', await lc2(page));
    await page.evaluate(() => { try { abCancel(true); setLoopCount(0); } catch (e) {} });
  }
  async function lc2(p) { return p.evaluate(`(() => {${COLORJS}
    const el = document.getElementById('loopCount');
    if (!el || getComputedStyle(el).display === 'none') return [{ sel: '#loopCount', skip: '徽标没显示出来' }];
    const cs = getComputedStyle(el), fg = __parse(cs.color), bg = __parse(cs.backgroundColor);
    const v = __ratio(fg, bg);
    return [{ sel: '#loopCount', text: el.textContent, color: cs.color, bg: cs.backgroundColor,
      size: cs.fontSize, ratio: v, need: 4.5, pass: v >= 4.5 }];
  })()`); }
  await page.evaluate(() => { try { toggleDark(); } catch (e) {} });
  await page.waitForTimeout(300);

  /* --- 任务模式：底栏那一根 --- */
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); TASK.enterTaskMode(); });
  await page.waitForTimeout(900);
  if (!(await page.evaluate(() => document.body.classList.contains('task-mode')))) {
    console.log('\n⚠️ 没进任务模式 —— 底栏那一档没量到'); skipped++;
  } else {
    show('任务模式 / 底栏进度面', await surfaceProbe(page, SURFACES.filter((k) => k.name.indexOf('任务条') === 0)));
    const drag2 = await dragTest(page, '#tbSeek, .tb-prog', '任务条拖动 20%→80%');
    console.log(`\n[任务条真拖] ${JSON.stringify(drag2)}`);
    if (drag2.skip || !drag2.moved) { console.log('   ✗ 拖了不动 —— 「进度条无法使用」的现场'); bad++; }
    else console.log('   ✓ 当前句跟着走了');
  }

  /* --- 今日面板 --- */
  await page.evaluate(() => { try { TASK.exitTaskMode(); } catch (e) {} });
  await page.waitForTimeout(400);
  await page.evaluate(() => { const b = document.getElementById('btnToday'); if (b) b.click(); });
  await page.waitForTimeout(700);
  const open = await page.evaluate(() => { const p = document.querySelector('.today-panel');
    return !!p && p.classList.contains('open'); });
  if (!open) console.log('\n⚠️ 今日面板没开 —— .tp-prog 这一档没量到');
  else {
    show('今日面板 / 进度轨道', await surfaceProbe(page, SURFACES.filter((k) => k.name.indexOf('今日面板') === 0)));
    show('今日面板 / 绿字压浅底', await greenInkSweep(page));
  }

  console.log(`\n================ 越界 ${bad} 处，没量到 ${skipped} 档 ================`);
  await browser.close();
  process.exit(bad ? 1 : 0);
}
run();
