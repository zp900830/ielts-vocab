// 样式完整性（排查报告 B 批踩过的坑）：CSS 注释一旦提前收尾，后面那条规则会被解析器整条吞掉，
// 而文件里花括号依然是平的 —— 语法检查、人工 review 都看不出来，只有浏览器知道。
// 这里把源码 <style> 里的每条叶子选择器拿去和 CSSOM 对账：源码有、CSSOM 没有 = 被吞了。
import { test, expect } from '../../fixtures';
import { waitShadowReady } from '../../utils/app-ready';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const rootUrl = process.env.E2E_ROOT_URL || '';
const SRC = resolve(__dirname, '../../../app/index.html');

/** 词法扫一遍 <style>：跳过注释与字符串，收每条叶子规则的 prelude（含其 @media 上下文）。 */
function leafSelectors(css: string): { sel: string; media: string[] }[] {
  const out: { sel: string; media: string[] }[] = [];
  const stack: { pre: string; open: number }[] = [];
  let i = 0;
  while (i < css.length) {
    const c = css[i];
    if (c === '/' && css[i + 1] === '*') {
      const j = css.indexOf('*/', i + 2);
      if (j < 0) throw new Error('注释未闭合');
      i = j + 2; continue;
    }
    if (c === '"' || c === "'") {
      let k = i + 1;
      while (k < css.length) { if (css[k] === '\\') { k += 2; continue; } if (css[k] === c) break; k++; }
      i = k + 1; continue;
    }
    if (c === '{') {
      const start = stack.length ? stack[stack.length - 1].open + 1 : 0;
      const pre = css.slice(start, i).split('}').pop()!.trim();
      stack.push({ pre, open: i });
      i++; continue;
    }
    if (c === '}') {
      const top = stack.pop();
      if (!top) throw new Error('多余右花括号');
      const body = css.slice(top.open + 1, i);
      if (!body.includes('{')) out.push({ sel: top.pre, media: stack.map((s) => s.pre).filter((p) => p.startsWith('@')) });
      i++; continue;
    }
    i++;
  }
  if (stack.length) throw new Error('块未闭合：' + stack.map((s) => s.pre.slice(0, 40)).join(' | '));
  return out;
}

// 注释里带 :hover / 冒号的 prose 会被当成选择器；真选择器一定不含换行前的中文 prose 尾。
// 只比「看起来像选择器」的：以字母/#/./[/: 开头，且不含 */。
function looksLikeSelector(pre: string): boolean {
  const s = pre.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  if (!s || s.startsWith('@')) return false;
  if (s.includes('*/') || s.includes('/*')) return false;
  if (/^(from|to|\d+(\.\d+)?%)$/.test(s)) return false;   // @keyframes 的帧选择器另说
  return /^[#.\[:a-zA-Z*>]/.test(s) && !/[。；，——]/.test(s);
}

// CSSOM 序列化会补/吞空格、大小写归一，还会把 `*::before` 写回成 `::before`（Chromium 实测）。
// 比之前两边都压成无空白小写，并抹掉伪元素前那颗多余的 `*`。
const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase().replace(/\*::/g, '::');

test('app/index.html 没有规则被 CSS 解析器吞掉', async ({ page }) => {
  const html = readFileSync(SRC, 'utf8');
  const css = html.slice(html.indexOf('<style>') + 7, html.indexOf('</style>'));
  const srcRules = leafSelectors(css)
    .map((r) => ({
      sel: r.sel.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim(),
      media: r.media,
    }))
    .filter((r) => looksLikeSelector(r.sel) && !r.media.some((m) => m.startsWith('@keyframes')));
  expect(srcRules.length, '源码里应能解析出叶子规则').toBeGreaterThan(600);

  // 真实加载一次，读浏览器解析后的样式表
  await page.goto(`${rootUrl}/app/index.html`);
  await waitShadowReady(page);
  const collected = await page.evaluate(() => {
    const sels: string[] = [];
    const walk = (rules: CSSRuleList) => {
      for (const r of Array.from(rules)) {
        if (r instanceof CSSStyleRule && r.selectorText) sels.push(r.selectorText.replace(/\s+/g, ' ').trim());
        else if (r instanceof CSSMediaRule) walk(r.cssRules);
        else if (r instanceof CSSSupportsRule) walk(r.cssRules);
        else if (r instanceof CSSKeyframesRule) walk(r.cssRules);
      }
    };
    for (const sh of Array.from(document.styleSheets)) {
      let rules: CSSRuleList | null = null;
      try { rules = sh.cssRules; } catch { rules = null; }
      if (rules) walk(rules);
    }
    return sels;
  });
  const set = new Set(collected.map(norm));
  const missing = srcRules.filter((r) => !set.has(norm(r.sel)));
  expect(
    missing.map((m) => `${m.media.join(' > ') || '-'} :: ${m.sel}`).slice(0, 25),
    '以下规则在源码里写着，但浏览器解析时丢掉了（多半是上面某条注释提前收尾）'
  ).toEqual([]);
});
