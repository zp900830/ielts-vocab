// 辨析卡的折叠箭头（2026-10-08 用户截图圈出来：「这个箭头忒小了，都快看不见了」）。
// 两个宿主各一枚：精读段末的 .cmp-card .cmp-caret、随身听抽屉里的 .cmp .chev。
// 锁三件事：字号够大、颜色不再是 --muted 而是 --ink2、字形仍是 ▾ 字符。
// 字形这条不是洁癖：换成图标字体（ri-arrow-*）后，这枚箭头的宽度就寄托在 webfont 上 ——
// 字体没到手时字形宽度塌成 0、整枚消失（门禁已知的一类假红），而可点性提示恰恰只有它。
// 2026-10-10 起图标字体已自托管（不再「一断 CDN 就塌」），这条守卫继续留着：
// 它锁的是「箭头不许依赖 webfont」本身，与字体从哪来无关。
import { test, expect } from '../../fixtures';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const rootUrl = process.env.E2E_ROOT_URL || '';

const CARDS: Record<string, string> = (() => {
  const sections = [{
    title: '地球与生命', zh: '地球与生命', subheads: ['第一卷'],
    paragraphs: [['The [[atmo:atmo]] lifted his [[mood:mood]].', 'Plain sky today.']],
    sentZh: ['大气与心情。', '今天天晴。'],
    paraZh: [''],
  }];
  const vocab = {
    atmo: { m: 'n. 大气', p: 'ˈætməsfɪə', note: '同义词：air',
      cmp: { type: 'compare', group: 'atmo-mood', title: 'atmo 是地方的气，mood 是人的气。', items: [
        { w: 'atmo', pos: 'n.', sense: 'n. 大气', eg: 'thin atmo' },
        { w: 'mood', pos: 'n.', sense: 'n. 心情', eg: 'good mood' }],
        rows: [{ label: '用在哪', atmo: '地方/气氛', mood: '人的情绪' }] } },
    mood: { m: 'n. 心情', p: 'muːd',
      cmp: { type: 'compare', group: 'atmo-mood', title: 'atmo 是地方的气，mood 是人的气。', items: [
        { w: 'atmo', pos: 'n.', sense: 'n. 大气', eg: 'thin atmo' },
        { w: 'mood', pos: 'n.', sense: 'n. 心情', eg: 'good mood' }],
        rows: [{ label: '用在哪', atmo: '地方/气氛', mood: '人的情绪' }] } },
  };
  return { 'sections.json': JSON.stringify(sections), 'vocab.json': JSON.stringify(vocab), 'chapters.json': '[]' };
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
        && typeof TASK !== 'undefined';
    } catch (e) { return false; }
  });
}
declare const SECTIONS: unknown[];
declare const TASK: { resetV2(): void };

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

const caretStyles = (page: import('@playwright/test').Page, sel: string) =>
  page.evaluate((s) => Array.from(document.querySelectorAll(s)).map((n) => {
    const cs = getComputedStyle(n);
    return { size: parseFloat(cs.fontSize), color: cs.color, text: (n.textContent || '').trim() };
  }), sel);

async function expectVisibleCarets(page: import('@playwright/test').Page, sel: string, host: string) {
  const list = await caretStyles(page, sel);
  expect(list.length, `${host}里要有箭头可量`).toBeGreaterThanOrEqual(1);
  const ink2 = await resolveVar(page, '--ink2');
  list.forEach((st, i) => {
    expect(st.size, `${host}第 ${i + 1} 枚字号 ${st.size}px，太小就等于没有`).toBeGreaterThanOrEqual(18);
    expect(st.text, `${host}第 ${i + 1} 枚不许换成图标字体（断 CDN 时字形宽度塌成 0）`).toBe('▾');
    expect(st.color, `${host}第 ${i + 1} 枚颜色要从 --muted 提到 --ink2`).toBe(ink2);
  });
}

test.describe('辨析卡的折叠箭头看得见', () => {
  test('精读段末那张卡：箭头 ≥18px、颜色是 --ink2、字形仍是 ▾', async ({ page }) => {
    await stubData(page, CARDS);
    await page.goto(`${rootUrl}/index.html#/home`);
    await waitAppReady(page);
    await page.evaluate(() => TASK.resetV2());          // 无计划 = 常规阅读，卡片照样挂段末
    await page.locator('.art-card').first().click();
    await expect(page.locator('.cmp-card .cmp-caret'), '辨析卡要渲染出来才有箭头可量').toHaveCount(1);
    await expectVisibleCarets(page, '.cmp-card .cmp-caret', '精读');
  });

  test('随身听抽屉里那枚同口径（两宿主一把尺子）', async ({ page }) => {
    await stubData(page, CARDS);
    await page.goto(`${rootUrl}/index.html#/listen`);
    await waitAppReady(page);
    await page.locator('#lcFab').click();
    await expect(page.locator('#lcDrawer .cmp .chev').first(), '抽屉卡片里有辨析块').toBeVisible();
    await expectVisibleCarets(page, '#lcDrawer .cmp .chev', '抽屉');
  });
});

/* 辨析卡显示清洗（2026-10-12 用户：「同时展示多个词性，n. n.」「不要 79、78 这种在文章中
   哪里哪里的信息，标的很乱一堆标号」）：渲染层剥掉数据里的「写卡维护语」——
   ① sense 去掉与 pos 重复的词性前缀（素材本来就写着 pos:"n." + sense:"n. 大气"，
      清洗前渲染成 "n. n. 大气"）；
   ② 「（879）」「（卡上例句）」「（课文 474 走 n.）」类句号/出处注不上卡面。
   数据文件里的维护语保持不动（对写卡仍有价值），只在显示前剥。 */
test('辨析卡显示清洗：无「n. n.」重复词性、无句号编号与「卡上」出处注', async ({ page }) => {
  const DIRTY: Record<string, string> = (() => {
    const sections = [{
      title: '地球与生命', zh: '地球与生命', subheads: ['第一卷'],
      paragraphs: [['The [[atmo:atmo]] lifted his [[mood:mood]].', 'Plain sky today.']],
      sentZh: ['大气与心情。', '今天天晴。'],
      paraZh: [''],
    }];
    const mkCmp = {
      type: 'compare', group: 'atmo-mood', title: 'atmo 是地方的气，mood 是人的气。',
      items: [
        { w: 'atmo', pos: 'n.（卡上释义只有名词一档）', sense: 'n. 大气（879）', core: '地之气（卡上例句）', scene: '那地方的那股气（卡上例句）；门上那块匾（1251）' },
        { w: 'mood', pos: 'n. 与 v.', sense: 'n. 心情', core: '人的情绪' },
      ],
      rows: [{ label: '用在哪（课文 474 走 n.）', atmo: '地方/气氛（卡词伙）', mood: '人的情绪（本书 3 处）' }],
    };
    const vocab = {
      atmo: { m: 'n. 大气', p: 'ˈætməsfɪə', cmp: mkCmp },
      mood: { m: 'n. 心情', p: 'muːd', cmp: mkCmp },
    };
    return { 'sections.json': JSON.stringify(sections), 'vocab.json': JSON.stringify(vocab), 'chapters.json': '[]' };
  })();
  await stubData(page, DIRTY);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => TASK.resetV2());
  await page.locator('.art-card').first().click();
  const block = page.locator('.cmp-block');
  await expect(block).toBeVisible();
  /* 读 textContent（不是 innerText）：卡片默认折叠态，innerText 不输出 display:none 的卡体，
     而清洗锁的靶子（卡体里的 pos/sense/scene）恰在折叠区里。 */
  const text = await block.evaluate((el) => el.textContent || '');
  expect(text, 'pos+sense 不许重复成「n. n.」').not.toMatch(/n\.\s+n\./);
  expect(text, '句号编号「（879）」不许上卡面').not.toMatch(/[（(]\s*\d{1,4}\s*[）)]/);
  /* 「课文」不进靶子：它是卡片正文的常用词（「课文里它挂在什么上」这类维度标题、
     「课文译文自己把 damp 处理成「潮」」这类辨析句），一律禁它会连正文一起误杀
     （2026-10-12 回归）。真维护注限定为「卡上系 / 本书系」，以及**括号内**的
     「（课文 474 走 n.）」「（课文译文）」这类出处注。 */
  expect(text, '「卡上」「本书」等维护注不许上卡面').not.toMatch(/卡上|卡词伙|本书/);
  expect(text, '编号数字（1251 / 3）不许上卡面').not.toMatch(/\b1251\b|\b879\b/);
  expect(text, '清洗后正文本体还在').toContain('n. 大气');
  expect(text, 'pos 的括号备注剥掉后保留词性本体').toContain('n. 与 v.');
});

/* 辨析卡正文不许被清洗误删（2026-10-12 用户报「这个空白单元格是何意，占一行面积什么也没有」）：
   原「整段删除」规则把「课文里…」当写卡维护语 —— 全库回放 466 个被删段里 463 个以「课文」
   开头、3 个以「卡片上」开头，逐条看全是正文句，真维护注 0 条；后果是 89 张卡的维度标题行
   变空白行、both 整格消失/截断、core/scene 被清空。这条锁住：维度标题与 both/core 的正文句
   完整保留，括号里的出处注仍剥。反向验证：把整段删除层加回去，维度标题断言立刻变空串。 */
test('辨析卡正文清洗不许误删：维度标题与 both/core 正文完整、「（课文译文）」类括号注仍剥', async ({ page }) => {
  const DATA: Record<string, string> = (() => {
    const sections = [{
      title: '衣食住行', zh: '衣食住行', subheads: ['第二卷'],
      paragraphs: [['A black school [[belt:belt]] needs holes, and a torn [[strap:strap]] hangs loose.', '校服腰带要打洞，撕破的包带垂着。']],
      sentZh: ['黑色校服腰带需要打洞，撕破的包带垂着。'],
      paraZh: [''],
    }];
    const mkCmp = {
      type: 'compare', group: 'belt-strap', title: 'belt 是腰带，strap 是带子。',
      summary: '辨析：belt 束在身上，strap 挂在包上。简单记：belt 要打洞、strap 挂在包上',
      items: [
        { w: 'belt', pos: 'n.', sense: 'n. 腰带', core: '课文里唯一那条要打洞的' },
        { w: 'strap', pos: 'n.', sense: 'n. 带子', core: '包上垂着的那条' },
      ],
      diff: [
        { dim: '课文里它挂在什么上', label: '区别', belt: '束在身上', strap: '包上撕破了就垂着' },
        { dim: '课文里同场的邻居', label: '区别', both: '课文里"长条"有 6 张卡片；belt、strap 是成品上的一部分' },
        { dim: '中文各走哪一路', label: '搭配', both: '「又冷又潮」（课文译文）' },
      ],
    };
    const vocab = {
      belt: { m: 'n. 腰带', p: 'belt', cmp: mkCmp },
      strap: { m: 'n. 带子', p: 'stræp', cmp: mkCmp },
    };
    return { 'sections.json': JSON.stringify(sections), 'vocab.json': JSON.stringify(vocab), 'chapters.json': '[]' };
  })();
  await stubData(page, DATA);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => TASK.resetV2());
  await page.locator('.art-card').first().click();
  const block = page.locator('.cmp-block');
  await expect(block).toBeVisible();
  const dims = await block.locator('.nb-dim td').allTextContents();
  expect(dims, '维度标题行必须有文字（误删时这里是空串 = 空白行）').toEqual(
    ['课文里它挂在什么上', '课文里同场的邻居', '中文各走哪一路']);
  const text = await block.evaluate((el) => el.textContent || '');
  expect(text, 'both 格的正文句不许被截断').toContain('6 张卡片');
  expect(text, 'both 格后半句也要在').toContain('成品上的一部分');
  expect(text, 'item.core 里的正文句不许被清空').toContain('课文里唯一那条要打洞的');
  expect(text, '括号里的出处注仍要剥掉').not.toContain('课文译文');
  expect(text, '括号注剥掉后正文本体保留').toContain('又冷又潮');
});

/* 辨析卡清洗哨兵（2026-10-12 事故后补）：清洗**只许动括号里的注**，不许碰正文。
   全库口径：220 张卡的每个展示字段，去掉括号后的正文在清洗后一字不掉
   （修后实测 8099 个字段保留率全部 100%；事故形态是 dim 保留率 0%、both 掉到 ~47%）。
   用 TASK.cmpCleanForTest 调**真函数** —— 不在测试里复刻正则（复刻迟早与实现漂移）。 */
test('辨析卡清洗哨兵：全库 220 卡的非括号正文一字不掉', async ({ page }) => {
  const V = JSON.parse(readFileSync(resolve(process.cwd(), '..', 'data', 'vocab.json'), 'utf8')) as
    Record<string, { cmp?: Record<string, unknown> } | undefined>;
  const fields: string[] = [];
  const push = (v: unknown): void => { if (typeof v === 'string' && v.trim()) fields.push(v); };
  let cards = 0;
  for (const v of Object.values(V)) {
    const c = v?.cmp;
    if (!c || typeof c !== 'object') continue;
    cards += 1;
    push(c.title); push(c.summary);
    for (const it of ((c.items as Array<Record<string, unknown>> | undefined) ?? [])) {
      push(it.pos); push(it.sense); push(it.core); push(it.scene);
    }
    for (const r of ((c.diff as Array<Record<string, unknown>> | undefined) ?? [])) {
      push(r.dim); push(r.label); push(r.both);
      for (const [k, val] of Object.entries(r)) {
        if (k === 'dim' || k === 'label' || k === 'both') continue;
        push(val);
      }
    }
  }
  expect(cards, '辨析卡数量基线').toBe(220);
  expect(fields.length, '字段量兜底（防「扫了个空」的假绿）').toBeGreaterThan(3000);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  const bad = await page.evaluate((list: string[]) => {
    /* 裸 TASK：页面的 TASK 是全局词法绑定（let/const 顶层），不是 window 属性 ——
       window.TASK 取不到（2026-10-12 又一次踩到）。 */
    const T = TASK as unknown as { cmpCleanForTest(s: string): string };
    const nonParen = (s: string) => s.replace(/[（(][^）)]*[）)]/g, '');
    const out: string[] = [];
    for (const s of list) {
      const base = nonParen(s).trim();
      if (!base) continue;                       // 整条就是括注的字段：清空是合法的，不参与
      const c = T.cmpCleanForTest(s);
      if (!c) { out.push(`正文被清空：「${s.slice(0, 30)}」`); continue; }
      const rate = c.length / base.length;
      if (rate < 0.9) out.push(`正文缩水到 ${Math.round(rate * 100)}%：「${s.slice(0, 30)}」`);
    }
    return out;
  }, fields);
  expect(bad, `清洗碰了正文（只许删括号里的注）：\n${bad.slice(0, 10).join('\n')}`).toEqual([]);
});

/* 辨析卡**数据层**清洗（2026-10-12 用户：「对全部的辨析卡进行排查重构优化……全局排查，
   仔细核对」（内容/结构/排版））。上一轮只在渲染层剥维护语；这一轮把维护语从数据本体
   （data/vocab.json，220 卡 / 5505 字段）里全量清掉，渲染层那几条从此只是兜底网。
   锁三类用户真会看到的东西：
   ① 写卡维护语（卡上/词伙/书证/落点/回列/未打标记/grep…）；
   ② 编号删除后悬空的助词（（的、，的、的的、连都…）；
   ③ 结构粘连（（、」「、）」「、、」「（；」）。
   扫的只有展示字段（title/summary/items 的 pos/sense/core/scene/diff）——
   eg 是门禁 16 的出处锚、w/p/at 是运行时键，扫进去只会制造假红。
   裸「档/卡」带排除集：搭档/高档/归档、卡车/卡着/卡得/卡在/卡死 都是合法中文，不算命中。
   反向验证（2026-10-12 实测）：同一组模式对清洗前原文（work/vocab_backup_2026-10-12.json）
   命中 11291 处（卡上系 3351、裸卡 3820、本书系 1534、裸档 1068…），对清洗后数据全为 0。
   「悬空/粘连」两族只在删除管线的中间态出现（本轮修复全程的计数在 work/ 探针里），清洗后同为 0。 */
test('辨析卡数据层清洗：220 张卡的展示字段里无维护语、无编号悬空残片', () => {
  const V = JSON.parse(readFileSync(resolve(process.cwd(), '..', 'data', 'vocab.json'), 'utf8')) as
    Record<string, { cmp?: Record<string, unknown> } | undefined>;
  const buf: string[] = [];
  const walk = (o: unknown): void => {
    if (typeof o === 'string') { buf.push(o); return; }
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (o && typeof o === 'object') { Object.values(o as Record<string, unknown>).forEach(walk); }
  };
  let cards = 0;
  for (const v of Object.values(V)) {
    const c = v?.cmp;
    if (!c || typeof c !== 'object') continue;
    cards += 1;
    walk([c.title, c.summary, c.diff]);
    for (const it of ((c.items as Array<Record<string, unknown>> | undefined) ?? [])) {
      walk([it.pos, it.sense, it.core, it.scene]);
    }
  }
  const blob = buf.join('\n');
  expect(cards, '辨析卡数量基线：220 张（数据被回滚到旧版时这条会先红）').toBe(220);
  expect(blob.length, '文本量兜底（防「扫了个空」的假绿）').toBeGreaterThan(200000);

  const violations: string[] = [];
  const probe = (name: string, re: RegExp): void => {
    const m = blob.match(re);
    if (m) violations.push(`${name}×${(blob.match(re) || []).length}（如「${m[0]}」）`);
  };
  probe('维护语·卡上系', /卡上|卡词伙|卡有|卡里/);
  probe('维护语·本书系', /本书|全书|全库|书证/);
  probe('维护语·术语系', /词伙|落点|栏位|槽位|句框/);
  probe('维护语·标记系', /未打标记|没打标记|打了标记|已\s*grep|可\s*grep/);
  probe('维护语·台账系', /硬约束|只报备|不进表|回列|借位|词头卡|同格同架/);
  /* 2026-10-12：原书草稿的「该段原文（章N 段M）」表标题曾被落地器错位当成 summary 内容
     （belt/dwelling/exterior 三卡的「辨析：…简单记：…」两槽位都填了它）——已补写正确文案，
     这里立闸防再写回。 */
  probe('维护语·出处占位', /该段原文/);
  probe('裸档（搭档/高档/归档除外）', /(?<!掉)(?<!了)(?<![搭高归])档(?![位次案])/);
  probe('裸卡（卡片/卡车/卡住…除外）', /(?<!卡)卡(?![片车住着得死在])/);
  probe('叠字助词', /的的|了了|是是/);
  probe('连字悬空', /连(?=[都也就])/);
  probe('括号悬空助词', /（(?:的|了|是)(?=[\u4e00-\u9fa5])/);
  probe('标点后悬空「的」', /[，、；：]\s*的(?=[\u4e00-\u9fa5])|——\s*的/);
  probe('结构粘连', /[、，]\s*）|（[、；，]|、、|，，|；；/);
  probe('「与…同」缺参照', /与\s*同(?=[型源])/);
  expect(violations, `数据层清洗出现回退（${violations.join('；')}）`).toEqual([]);
});

