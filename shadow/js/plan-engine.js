/* 学习计划引擎：纯逻辑，不碰 DOM、不发请求。宿主是 shadow/index.html 的 TASK 模块。
   真值只有一份 —— 事件日志；词状态、每天完成度、连续天数一律从日志重放现算，
   这样界面不会出现「三个数字互相打架」，换设备也不需要合并策略。 */
(function () {
  'use strict';

  const DAY_MS = 864e5;
  // 第 n 次接触后隔几天再见。前几档是 0（当天回锅）；毕业后恒取 GRADUATED_INTERVALS[0]。
  const WORD_INTERVALS = [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 5, 5, 5, 5, 5, 7, 7, 7, 7, 7];
  /* [1]=30 到今天仍然取不到（wordInterval 只要 reps 过门槛就返回 [0]）。保温上线后
     毕业词的 reps 会继续长，也还是取不到 —— 它是死档不是漏档，调研已证改它对结果零影响。
     留着是因为删它要改索引语义，而本期正在改的东西够多了。 */
  const GRADUATED_INTERVALS = [14, 30];
  const STAGES = ['fresh', 'seen', 'recognized', 'owned', 'graduated'];
  /* 12 而不是 20：2026-09-21 拍板（决策记录 scheduling-decisions-round3 第 1 条）——
     后半程那几档长间隔是「已经会了还在反复考」，拉长工期最多、加固记忆最少。
     配套的另一半是保温：毕业词现在会按 GRADUATED_INTERVALS[0] 回池，
     所以"毕业"不再是"永不再见"，门槛降下来才不会变成假阳性。
     出处 docs/superpowers/plans/2026-09-22-保温第一期.md §4 Task 2。 */
  const MASTER_REPS = 12;   // 接触够 12 次且 ②（挖空选择）答对过 → 已毕业
  const LEECH_ERR = 3;      // 连错 3 次 → 重点词（强制回炉，但不隐藏）
  /* 保温配额：**每天最多为「毕业词回炉」新排几句**（不是几个词 —— 预算按句算，
     界面上也是句数，说成词数会和句数对不上）。
     8 这一档不是猜的：判据是「使总工期比不保温时拖长 ≤10% 的最大档」，
     数在 work/保温预算-实测-2026-09-22.md §8（现行成本模型复测：15 分钟档 238→257 天，+8.0%）。
     ⚠️ 上限是**防塌**，不是优化：3245 个词按 14 天回访，稳态约 232 个词/天到期，
     不设上限就是新词当天被挤光 —— 实测「不限配额」那一列连每天 60 分钟都三年到不了终点。
     也别把它当成"每 14 天真的能复习一遍"：cap 句/天 ≈ 十几个词/天，一个毕业词平均
     约 300 天才轮到一次。第一期兑现的是"毕业不再永别"，不是遗忘曲线本身。 */
  const BAOWEN_CAP_SENTS = 8;
  const BAOWEN_MIN_MINUTES = 15;   // 每天不到 15 分钟不保温（实测：5 分钟档一保温就 +13%~+46%）

  /* 今天这一档到底给不给保温 —— 唯一一份判据，assemble 与界面都从这里取，
     界面不许自己写「15 分钟」这个数。
     minutes 传当天真实预算：档位口径是"今天有多少分钟"，而 plan.todayMinutes 可能是
     上一次存下的旧值（estimateDays 就是拿入参 minutes 天天覆盖它的）。两者不一致时以分钟数为准。 */
  function resolveBaowenCap(plan, minutes) {
    const p = plan || {};
    const m = Number.isFinite(minutes) ? minutes : (Number(p.todayMinutes) || 0);
    if (m < BAOWEN_MIN_MINUTES) return 0;
    const raw = p.baowenCap;
    if (raw === undefined || raw === null || raw === '') return BAOWEN_CAP_SENTS;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, Math.min(64, Math.floor(n))) : BAOWEN_CAP_SENTS;
  }

  const pad = (n) => String(n).padStart(2, '0');

  // 「今天」的唯一入口。默认凌晨 4 点日界：熬夜到 3 点不该算断更，
  // 也不该一睁眼看到两天的任务。
  function dayKey(ts, boundaryHour) {
    const b = Number.isInteger(boundaryHour) ? boundaryHour : 4;
    const d = new Date(ts - b * 3600e3);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function dayDiff(a, b) {
    return Math.round((Date.parse(b + 'T12:00:00') - Date.parse(a + 'T12:00:00')) / DAY_MS);
  }

  function wordInterval(reps) {
    if (reps >= MASTER_REPS) return GRADUATED_INTERVALS[0];
    return WORD_INTERVALS[Math.max(0, Math.min(reps, WORD_INTERVALS.length - 1))];
  }

  function emptyState() {
    return { v: 2, plan: null, words: {}, sents: {}, daily: {}, eventsSeen: 0, migratedAt: 0 };
  }

  /* ---------- 事件：只追加，不改写 ----------
     id 必须是内容的纯函数：两台设备各自生成同一条事实会得到同一个 id，
     重放时天然去重，所以不需要合并策略、也不需要 update。 */
  function eventId(ev) {
    const s = [ev.type, ev.w || '', ev.s === undefined ? '' : ev.s, ev.day || '',
               ev.ts, ev.ok === undefined ? '' : (ev.ok ? 1 : 0), ev.kind || '',
               ev.to || ''].join('|');
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h.toString(16) + '-' + s.length.toString(16);
  }

  const mkContact = (w, s, at, day) => ({ type: 'contact', w, s, day, ts: at });
  const mkQuiz = (w, s, kind, ok, at, day) => ({ type: 'quiz', w, s, kind, ok, day, ts: at });
  const mkPromote = (w, from, to, at, day) => ({ type: 'promote', w, from, to, day, ts: at });

  function newWord() {
    return { stage: 'fresh', reps: 0, err: 0, due: 0, ctx: {}, ok3: 0,
             firstSeenAt: 0, lastContactAt: 0, lastContactDay: '', leech: false };
  }

  // 一次 ② 答对记在「语境」上：课文句是句索引，卡上例句是 'ex'。
  // 两个不同语境各对一次才算「文中可辨」—— 原则 3：同一个词得在两处都站得住。
  function bumpCtx(w, sentKey, kind, ok) {
    if (!ok) return;
    // 两步制（docs/superpowers/specs/2026-09-22-任务模式两步制.md D1）：
    // 毕业凭据 mc4zh 事件由 ②「挖空选择」产生（原来是 ③「看英文选中文」）。
    // 事件类型名、ok3 字段名、stageOf 的判据都没动 —— 改的只是「谁产生它」。
    // ② 答对同时也把这一个语境记上：认得出（语境账）与义项直连（ok3）是同一道题给的凭据。
    if (kind === 'mc4zh') w.ok3++;
    const k = String(sentKey);
    w.ctx[k] = (w.ctx[k] || 0) + 1;
  }

  function stageOf(w) {
    if (w.reps >= MASTER_REPS && w.ok3 >= 1) return 'graduated';
    if (w.ok3 >= 1) return 'owned';
    let n = 0;
    for (const k in w.ctx) if (w.ctx[k] > 0) n++;
    if (n >= 2) return 'recognized';
    if (w.reps >= 1) return 'seen';
    return 'fresh';
  }

  function touchDaily(st, day) { return st.daily[day] || (st.daily[day] = {}); }

  /* 全量重放。千级事件是毫秒级，换来的是「只有一个真相」：
     界面任何数字都不可能有第二个来源，换设备只要把日志补齐就一致。 */
  function replay(events, opts) {
    const o = opts || {};
    const boundary = Number.isInteger(o.boundaryHour) ? o.boundaryHour : 4;
    const wordsOf = typeof o.wordsOf === 'function' ? o.wordsOf : function () { return []; };
    // 续算：传了 state 就在它上面接着走。不传时行为与旧实现逐字一致（从空重建）。
    // 传了 state 就**不再动它的 plan** —— 续算方自己保证 plan 已经在那份拷贝里。
    const st = o.state || Object.assign(emptyState(), { plan: o.plan || null });
    const ids = new Set();
    const credited = new Set();          // 词 + 句 + 日 只记一次接触
    const daySents = new Map();          // dayKey → Set<句号>

    for (let n = 0; n < events.length; n++) {
      const ev = events[n] || {};
      const id = ev.id || eventId(ev);
      if (ids.has(id)) continue;
      ids.add(id);
      st.eventsSeen++;
      const day = ev.day || dayKey(ev.ts || 0, boundary);

      if (ev.type === 'contact') {
        if (!ev.w) continue;
        const slot = st.words[ev.w] || (st.words[ev.w] = newWord());
        const before = slot.stage;
        const sKey = String(ev.s);
        st.sents[ev.s] = { lastReadAt: Math.max(st.sents[ev.s] ? st.sents[ev.s].lastReadAt : 0, ev.ts || 0) };
        if (!daySents.has(day)) daySents.set(day, new Set());
        daySents.get(day).add(sKey);
        const creditKey = ev.w + '|' + sKey + '|' + day;
        /* 毕业词再被读到也照样进账（Task 2.5）。原来这里挡着 `before !== 'graduated'` 是
           "毕业 = 永不再见"的另一半：事件不进来，引擎就算把词排回池子，due 也永远不顺延，
           同一句会被天天重排。回炉这一遍是实打实的一次接触 —— reps 继续加、
           stage 只升不降（答错也不倒退，那是 Task 5 等他拍的），due 走 wordInterval 排 14 天。 */
        if (!credited.has(creditKey)) {
          credited.add(creditKey);
          slot.reps++;
          slot.lastContactAt = ev.ts || 0;
          slot.lastContactDay = day;
          if (!slot.firstSeenAt) slot.firstSeenAt = ev.ts || 0;
          /* due 必须跟着 reps 一起落在 guard 里面。原先它写在 guard 外面，
             于是「同一天把同一句再读一遍」虽然不加 reps，却把 due 又往后推了一截 ——
             既让排期漂移，也让「同 w|s|day 的重复 contact 对重放是空操作」这条不成立
             （事件流的安全合并、以及任何按这个前提做的压缩，都会因此改账）。
             一次接触 = 一天一次，这是 §5.1 的口径。 */
          slot.due = (ev.ts || 0) + wordInterval(slot.reps) * DAY_MS;
        }
        slot.stage = stageOf(slot);
        if (slot.stage !== before) touchDaily(st, day).promote = (touchDaily(st, day).promote || 0) + 1;
      } else if (ev.type === 'quiz') {
        if (!ev.w) continue;
        const slot = st.words[ev.w] || (st.words[ev.w] = newWord());
        const before = slot.stage;
        bumpCtx(slot, ev.s, ev.kind, !!ev.ok);
        // 只有答对才清错误计数：读到不等于会了 —— 否则「连错三次进重点词」永远凑不满
        if (ev.ok) slot.err = 0;
        if (!ev.ok) {
          slot.err++;
          slot.leech = slot.err >= LEECH_ERR;
          slot.due = ev.ts || 0;         // 今天之内再见一次；状态不倒退
        }
        slot.stage = stageOf(slot);
        const d = touchDaily(st, day);
        d.quizDone = (d.quizDone || 0) + 1;
        if (ev.ok) d.correct = (d.correct || 0) + 1;
        if (slot.stage !== before) d.promote = (d.promote || 0) + 1;
      } else if (ev.type === 'relearn') {
        const slot = st.words[ev.w];
        if (slot) {
          slot.ctx = {}; slot.ok3 = 0; slot.err = 0; slot.leech = false;
          slot.reps = Math.min(slot.reps, 3);
          slot.stage = stageOf(slot);
        }
      } else if (ev.type === 'promote') {
        const d = touchDaily(st, day);
        d.promote = (d.promote || 0) + 1;
      } else if (ev.type === 'dayplan') {
        if (ev.day && ev.minutes) touchDaily(st, ev.day).minutes = ev.minutes;
      }
    }

    for (const key in st.words) st.words[key].stage = stageOf(st.words[key]);
    daySents.forEach(function (set, day) { touchDaily(st, day).sentDone = set.size; });
    return st;
  }

  function wordState(st, key) {
    return (st && st.words && st.words[key]) || newWord();
  }

  /* ---------- 三池装配 ----------
     A 到期复习 / C 新词 / B 加深。时间预算是唯一输入，句数与题数是它的结果。
     装不下的部分今天不排、明天重算 —— 状态里没有任何 debt 字段（原则 5）。 */
  function assemble(state, opts) {
    const o = opts || {};
    const now = o.now || Date.now();
    const total = o.totalSents || 0;
    const wordsOf = typeof o.wordsOf === 'function' ? o.wordsOf : function () { return []; };
    const rate = o.rate || 1;
    const secNew = (o.secNew || 25) / rate;
    const secReview = (o.secReview || 8) / rate;
    /* 预算里【没有】做题时间 —— 规格 2026-09-22 D10。他原话：「这个时间用通读时间算，
       不加挖空选词了，我希望是快速刷词」「挖词 20 几个词我可以 5 分钟左右选完，因为不用通读全文了」。
       题照旧出、照旧答（② 是毕业凭据），只是不再占每天分钟数：一句读完顺手选一空，
       不必回头再读全文，所以它不该出现在工期算式里。别把它加回去。 */
    const budget = Math.max(0, (o.todayMinutes || 0) * 60);
    const boundary = Number.isInteger(o.boundaryHour) ? o.boundaryHour : 4;
    const ws = (state && state.words) || {};
    const today = dayKey(now, boundary);
    /* 3.0：按篇排。scope 给定时只从这些全局句号里挑；省略 = 全量（v2.0 行为，逐字不变）。
       闸就设在这一层：三池（due/grow/fresh）只收 scope 内的句，下游 take / 兜底 / 队列
       自然全在 scope 内，不需要在每一处 push 上重复判。 */
    const scope = (o.scope instanceof Set) ? o.scope : null;
    const inScope = (i) => !scope || scope.has(i);

    // 每个未毕业词只算一次：due 已过 → A；见过但没到期 → B；连一面都没见 → C
    const due = [], grow = [], fresh = [];
    let dueWords = 0;
    const inPool = {};
    for (let i = 0; i < total; i++) {
      if (!inScope(i)) continue;
      const list = wordsOf(i);
      for (let j = 0; j < list.length; j++) {
        const w = list[j];
        if (inPool[w]) continue;
        const st = ws[w];
        if (!st || st.stage === 'fresh') { inPool[w] = 'C'; fresh.push({ w: w, i: i }); continue; }
        /* 毕业词不再"永不再见"（保温第一期 Task 2）：到点了回 A 池，带 g:1 标记，
           下面按每日配额限量接收。没到点（due 还在 14 天内）的直接跳过 —— 注意
           **不许把它塞进 B 池**：B 池的 take 在配额循环之外，塞进去就等于绕开上限。
           优先级说明：计划里写"回炉句低于未毕业词"，真按字面把回炉排到新词之后，
           稳态下 A 池天天满 → 保温一句也排不进去，功能直接等于零。实测那一版
           （回炉与到期词同池按 due 排序、但每天最多 cap 句「专为它新排」）才是
           work/保温预算-实测 §8 量出来的语义，保护新词靠的是 cap 这个上限。 */
        if (st.stage === 'graduated') {
          if ((st.due || 0) > now) continue;
          /* dueWords【不加】：界面上那格是「N 个词到期 · K 个词是回炉保温」，两个数是两批人，
             加进去就重复计数。更要紧的是下面兜底那句靠它判断"今天还有没有正事" ——
             把保温算成正事，等于让兜底绕过配额上限（见 floor 处注释）。 */
          inPool[w] = 'A';
          due.push({ w: w, i: i, due: st.due || 0, leech: false, g: 1 });
          continue;
        }
        if (st.lastContactDay === today) continue;         // 今天已经见过，不重复占位
        inPool[w] = (st.due || 0) <= now ? 'A' : 'B';
        if (inPool[w] === 'A') { dueWords++; due.push({ w: w, i: i, due: st.due || 0, leech: !!st.leech }); }
        else grow.push({ w: w, i: i });
      }
    }
    due.sort(function (a, b) { return (b.leech ? 1 : 0) - (a.leech ? 1 : 0) || a.due - b.due || a.i - b.i; });

    const chosen = new Map();                              // 句号 → {i, pool, sec}
    let left = budget, droppedA = 0;
    function take(i, pool, sec) {
      const cost = sec;                                       // 一句的代价 = 只算通读（D10：② 挖空选词不占预算）
      if (left < cost) return false;
      let cur = chosen.get(i);
      if (cur) { if (cur.pool === 'C' && pool !== 'C') { left -= cur.sec - sec; cur.pool = pool; cur.sec = sec; } return true; }
      chosen.set(i, { i: i, kind: 'sent', pool: pool, sec: sec, words: wordsOf(i).slice() });
      left -= cost;
      return true;
    }
    /* 到期句（含回炉句）先取，再取新词，最后加深句 —— 与 work/baowen_probe.mjs 量那批数时
       用的顺序逐字一致，改了顺序就等于换了成本模型，实测那张表不再适用。 */
    const plan = o.plan || (state && state.plan) || null;
    const baowenCap = resolveBaowenCap(plan, o.todayMinutes);
    let baowenSent = 0, retentionDropped = 0;
    const retainedWords = {};
    for (let n = 0; n < due.length; n++) {
      const e = due[n];
      if (!e.g) { if (!take(e.i, 'A', secReview)) droppedA++; continue; }
      /* riding：这句已经因为别的词被排进来了 → 这个回炉词免费搭车，**不吃配额**
         （否则"今天为复习排的那句里正好也有它"要白占一句，保温量凭空少一截）。
         riding 必须在 take 之前判 —— take 之后这句就已经在 chosen 里，分不出是谁带进来的。 */
      const riding = chosen.has(e.i);
      if (!riding && baowenSent >= baowenCap) { droppedA++; retentionDropped++; continue; }
      if (!take(e.i, 'A', secReview)) { droppedA++; continue; }
      if (!riding) baowenSent++;
      retainedWords[e.w] = 1;
    }
    const baowenWords = Object.keys(retainedWords).length;
    if (!plan || !plan.pausedNew) {
      const roomy = left >= 0.6 * budget || chosen.size === 0 && budget === 0;
      if (roomy) for (let n = 0; n < fresh.length; n++) if (!take(fresh[n].i, 'C', secNew)) break;
      for (let n = 0; n < grow.length; n++) take(grow[n].i, 'B', secReview);
    }

    const queue = [];
    Array.from(chosen.keys()).sort(function (a, b) { return a - b; })
      .forEach(function (i) { queue.push(chosen.get(i)); });

    const items = [];
    // 两步制：一句只出一题（② 挖空选择）。原来这里的 pass:3 是「③ 看英文选中文」，整步已删。
    queue.forEach(function (q) {
      const w = pickWord(q, ws, due);
      if (!w) return;
      items.push({ kind: 'quiz', pass: 2, s: q.i, w: w, pool: q.pool });
    });
    // 二次确认题（k）：课文语境已经对过、例句语境还没对的词，补一道例句题
    let kSlots = 0;
    queue.forEach(function (q) {
      q.words.forEach(function (w) {
        const st = ws[w];
        if (!st || st.stage === 'graduated') return;
        if (!(st.ctx[String(q.i)] > 0) || st.ctx.ex > 0) return;
        // D10 后题不占预算，例句题的上限天然就是「今天读到的这些词」，不会自己长出来。
        kSlots++;
        // from = 这道例句题是从哪一句排进队列的：宿主拿它去找同段/同辨析组的干扰项
        items.push({ kind: 'quiz', pass: 2, s: 'ex', w: w, pool: q.pool, from: q.i });
      });
    });

    let floor = false;
    if (!queue.length && (dueWords || fresh.length || grow.length)) {
      /* 兜底那句只从【未毕业】的活儿里挑。毕业词是被 cap 拦下来的，不是"预算装不下"：
         兜底的本意是「预算小到一句都排不出，别让他今天没得读」，拿它绕过保温上限，
         等于把「每天不到 15 分钟不保温」这条口径偷偷改成"其实每天还是排一句"。 */
      const seedDue = due.filter(function (e) { return !e.g; });
      const seedWord = seedDue.length ? seedDue[0] : (grow.length ? grow[0] : fresh[0]);
      const i = seedWord.i;
      chosen.set(i, { i: i, kind: 'sent', pool: seedDue.length ? 'A' : 'C',
                      sec: seedDue.length ? secReview : secNew, words: wordsOf(i).slice() });
      queue.push(chosen.get(i));
      items.push({ kind: 'quiz', pass: 2, s: i, w: seedWord.w, pool: 'A' });
      floor = true;
    }

    const readSec = queue.reduce(function (a, q) { return a + q.sec; }, 0);
    // 「今天进了几个新词」= 真的被排进队列的 C 池词，不是全库还没见过面的词。
    // 报后者会在第一天显示「3245 个新词」，等于把整本词表说成今天的任务。
    var newTaken = 0, takenSeen = {};
    queue.forEach(function (q) {
      q.words.forEach(function (w) { if (inPool[w] === 'C' && !takenSeen[w]) { takenSeen[w] = 1; newTaken++; } });
    });
    return {
      queue: queue, items: items,
      words: Array.from(new Set(queue.reduce(function (a, q) { return a.concat(q.words); }, []))),
      stats: {
        // D10：预算与用量都只算通读时间，所以 usedSec = readSec ≤ budget 由构造保证。
        // 做题时间故意不进来（他 2026-09-22 的原话与理由见上面 secNew 那段注释）。
        budgetSec: budget, usedSec: readSec,
        dueWords: dueWords, newWords: newTaken, newPool: fresh.length, droppedA: droppedA,
        floor: floor, day: today, kSlots: kSlots,
        todayMinutes: o.todayMinutes || 0,
        /* 保温负载：界面上那句「今天 K 个词是回炉保温」只能从这里取，不许 UI 自己数队列
           （一份逻辑一份实现）。baowenSent 是**句**、且只算"专为回炉新排的"，与配额同单位；
           retentionWords 是**词**，含免费搭车的那些，所以它会 ≥ baowenSent。 */
        baowenCap: baowenCap, baowenSent: baowenSent, retentionWords: baowenWords,
        retentionDropped: retentionDropped,

      },
    };
  }

  function pickWord(q, ws, due) {
    const ranked = q.words.map(function (w) { return { w: w, st: ws[w] }; })
      .filter(function (x) { return x.st && x.st.stage !== 'graduated'; });
    if (!ranked.length) return q.words[0] || '';
    ranked.sort(function (a, b) {
      return (b.st.leech ? 1 : 0) - (a.st.leech ? 1 : 0) || (a.st.due || 0) - (b.st.due || 0);
    });
    return ranked[0].w;
  }

  /* ---------- 完工估算（规格 2026-09-21 §4.1 + 2026-09-22 D10）---------- */
  /* 「过完一遍」= 这个词被通读到过至少一次（有一条算进账的接触事件）。
     2026-09-22 他把工期口径改成这个：原话「我希望是快速刷词」「这个时间用通读时间算」。
     判据不是毕业（reps≥门槛 且答对过 ②）—— 那会把「一年只过完 48 个词」这种数摆到界面上，
     而他每天实打实读进去几十个词，那个数与他的体感差一个量级，压力全来自这里。
     毕业数仍然看得到，但那是 state 里数出来的真值（countStages），不由这个模型许诺。
     引擎里没有现成计数器，只能遍历 —— 3245 个槽一天一次，量级毫秒，别为它加字段。 */
  function countPassed(st) {
    let n = 0;
    const ws = (st && st.words) || {};
    for (const k in ws) {
      const w = ws[k];
      if ((w.reps || 0) > 0 || (w.firstSeenAt || 0) > 0) n++;
    }
    return n;
  }

  /* 「照每天 N 分钟，把整本词表通读一遍大约要多久」—— 全项目唯一一份算式，界面四处都调这里。
     做法是照真流程走一遍：逐日用现成 assemble 排队列 → 队列翻成 contact/quiz 事件
     → 只把新事件续算进同一份 state（Task 1 的 opts.state）→ 数过完的词。
     两条不能省：
       ① 必须深拷 state（见下面 replay 前那行注释）。
       ② 不许在这里另写「每天几个词」的公式。宁可慢，也不能有两份真值。 */
  function estimateDays(state, minutes, opts) {
    const o = opts || {};
    const boundary = Number.isInteger(o.boundaryHour) ? o.boundaryHour : 4;
    const total = o.totalSents || 0;
    const wordsOf = typeof o.wordsOf === 'function' ? o.wordsOf : function () { return []; };
    const accuracy = typeof o.accuracy === 'number' ? o.accuracy : 0.85;
    // 用 Number.isFinite 而不是 `||`：`o.maxDays || 1095` 会把合法的 0 吃掉，
    // 于是「只许跑 0 天」这个输入永远传不进来（封顶分支因此在测试里根本走不到）。
    const maxDays = Number.isFinite(o.maxDays) ? o.maxDays : 1095;
    const horizon = Number.isFinite(o.horizonDays) ? o.horizonDays : 365;
    const start = Number.isFinite(o.now) ? o.now : Date.now();
    const allWords = o.totalWords || 0;
    const plan = o.plan || (state && state.plan) || null;
    const asOpts = { totalSents: total, wordsOf: wordsOf, boundaryHour: boundary, plan: plan,
                     secNew: o.secNew, secReview: o.secReview, rate: o.rate };
    // 深拷是调用方的责任、不是 replay 的（Task 1 契约测试锁死了这个分工）：估算要在
    // 上千个模拟日的循环里天天调 replay，让 replay 内部拷一份 3245 词的表等于白拷一千遍；
    // 但不拷直接喂活状态，replay 原地续算会把他真实进度算坏。两个都不能要，所以拷在这里。
    let st = JSON.parse(JSON.stringify(state || emptyState()));
    st.plan = plan;
    const passedNow = countPassed(st);
    let daysUsed = 0, done = allWords > 0 && passedNow >= allWords, atHorizon = null, empty = false;
    for (let day = 0; !done && day <= maxDays; day++) {
      const now = start + day * DAY_MS;
      const dayName = dayKey(now, boundary);
      // 里程碑与完工日是同一次前向行走上的两个读数（§4.1），绝不为了「一年后过完几个」再跑一遍。
      if (day === horizon) atHorizon = { days: horizon, passed: countPassed(st), at: now };
      asOpts.now = now; asOpts.todayMinutes = minutes;
      const r = assemble(st, asOpts);
      const fresh = [];
      for (let i = 0; i < r.queue.length; i++) {
        const q = r.queue[i];
        for (let j = 0; j < q.words.length; j++) fresh.push(mkContact(q.words[j], q.i, now, dayName));
      }
      for (let i = 0; i < r.items.length; i++) {
        const it = r.items[i];
        // 两步制后只剩一种题：② 挖空选择（它接手原 ③ 的毕业凭据，事件类型仍叫 mc4zh）
        const kind = 'mc4zh';
        // 确定性抽签：同一个（天, 词, 题种）永远同结果；换成 Math.random 单调性测试会随机红。
        // 注意 hash32 只吃字符串 —— 直接喂数字会被它内部当空串（恒返回 5381），accuracy 就失效了。
        const ok = (hash32(day + '|' + it.w + '|' + it.s + '|' + kind) % 1000) < accuracy * 1000;
        fresh.push(mkQuiz(it.w, it.s, kind, ok, now, dayName));
      }
      if (!fresh.length) { empty = true; break; }   // 今天一个都排不出来 → 再等下去也不会多过完一个词，别再空转
      st = replay(fresh, { state: st, boundaryHour: boundary, wordsOf: wordsOf, plan: plan });
      if (allWords > 0 && countPassed(st) >= allWords) {
        done = true; daysUsed = day + 1;
        // 完工早于里程碑日：过完只进不退（读到过就是读到过），收口时的读数即一年后的答案，
        // 就地补记这一次行走的读数 —— 这不是第二遍模拟，也不写死任何日期算法。
        if (!atHorizon) atHorizon = { days: horizon, passed: countPassed(st), at: start + horizon * DAY_MS };
      }
    }
    return {
      passedNow: passedNow, total: allWords,
      done: done, days: done ? daysUsed : null, doneAt: done ? start + daysUsed * DAY_MS : null,
      atHorizon: atHorizon, capped: !done && !empty, empty: empty,
    };
  }

  /* ---------- 出题（两步制：只有 ② 挖空选择会真的弹题） ----------
     ② 永远遮目标词（原则 3 / D6：只遮目标词，不遮词伙、不遮搭配）。
     ②③ 历史上共用「四选一」这套判据，今天仍然共用一份实现（fourChoice），
     只是方向相反：③ 遮中文义项、② 遮英文词。别再写第二台出题机器。 */
  /* 义项 / 词性两张记忆表：② 的第三档候选池是整本词表（3245 条），
     每建一道题都要问一遍「这条卡是什么词性、有几个义项」。不缓存的话
     一道题就是三千次正则切分，手机上点下一题会卡一下。键是卡上 m 那个字符串，
     整本最多几千个不同值，不会一直长。 */
  const _senseMemo = Object.create(null);
  const _posMemo = Object.create(null);
  function parseSenses(m) {
    return _senseMemo[String(m || '')] || (_senseMemo[String(m || '')] =
      String(m || '').split(/[；;]/).map(function (x) { return x.trim(); }).filter(Boolean));
  }
  function posOf(m) {
    const x = String(m || '').match(/^\s*(n|v|vt|vi|adj|adv|prep|conj|pron|num|int|abbr)\./i);
    return x ? x[1].toLowerCase() + '.' : '';
  }
  // 卡上标了哪些词性：'n. 大气；v. 氛围' 两个都要算，只取第一条会把兼类词判死
  function posSetOf(m) {
    const ck = String(m || '');
    if (_posMemo[ck]) return _posMemo[ck];
    const out = [], re = /\b(n|v|vt|vi|adj|adv|prep|conj|pron|num|int|abbr)\./ig;
    let x;
    while ((x = re.exec(ck))) {
      const p = x[1].toLowerCase() + '.';
      if (out.indexOf(p) < 0) out.push(p);
    }
    _posMemo[ck] = out;
    return out;
  }
  function normSense(s) { return String(s || '').replace(/[，。、,.;；：:\s]/g, ''); }
  // 两条中文义项互相包含 = 这两个词在这个空里都可能对 = 双解题，不许当干扰项
  function sensesClash(a, b) {
    const x = normSense(a), y = normSense(b);
    if (!x || !y) return false;
    return x === y || x.indexOf(y) >= 0 || y.indexOf(x) >= 0;
  }
  function colFirstOf(note) {
    if (typeof note !== 'string') return '';
    const parts = String(note).split('；');
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i].trim();
      if (p.indexOf('词伙：') === 0) return p.slice(3).split(',')[0].trim().split(/\s+/)[0] || '';
    }
    return '';
  }
  function recallQuiz(o) {
    const w = String(o.word || '').toLowerCase();
    const card = o.card || {};
    return {
      kind: 'recall', s: o.sent, w: w,
      blank: w ? w.charAt(0) + ' _'.repeat(Math.max(0, w.length - 1)) : '_ _ _',
      zh: o.sentZh || '', initial: w.charAt(0), len: w.length,
      pos: posOf(card.m), colFirst: colFirstOf(card.note), answer: w,
    };
  }
  function editDistance(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = [];
    for (let j = 0; j <= n; j++) prev.push(j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }
  // 忽略大小写与首尾空格，容忍 1 个字符的误差（屈折、单复数、手滑）
  function judgeRecall(input, answer) {
    const a = String(input || '').trim().toLowerCase();
    const b = String(answer || '').trim().toLowerCase();
    if (!a || !b) return false;
    return a === b || editDistance(a, b) <= 1;
  }
  function hash32(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h;
  }
  /* ---------- 四选一机器（②③ 共用这一份，别再写第二套） ----------
     答案 + 至多三个干扰项 → 洗牌 → 凑不满四个就返回 null。
     o = { kind, sent, word, answer, sentZh, pool, accept(cand), label(cand, chosen) }
       · pool    候选（已经按优先级排好：辨析组在前、补池在后）
       · accept  这道候选能不能进选项（词性闸 L2 / 双解闸 L3）
       · label   选项上显示什么：③ 显示中文义项，② 显示英文词头
     被否掉的候选、以及没有 accept/label 判据的候选都不许占坑 —— 错选项比没选项危险得多。 */
  function fourChoice(o) {
    const answer = String(o.answer || '').trim();
    if (!answer) return null;
    const opts = [answer];
    const pool = o.pool || [];
    for (let i = 0; i < pool.length && opts.length < 4; i++) {
      const cand = pool[i];
      if (!cand || String(cand.key) === String(o.word)) continue;
      if (o.accept && !o.accept(cand)) continue;
      const label = o.label ? o.label(cand, opts) : cand.key;
      if (!label || opts.indexOf(label) >= 0) continue;
      opts.push(label);
    }
    if (opts.length < 4) return null;
    const bySeed = function (s) {
      return opts.map(function (x, i2) { return { x: x, k: hash32(s + i2) % 997 }; })
        .sort(function (a, b) { return a.k - b.k; })
        .map(function (v) { return v.x; });
    };
    const base = bySeed(String(o.sent) + '|' + String(o.word));
    let order = base;
    /* o.salt：换一种排法，但只换排法 —— 候选池、三道闸、答案本体一个都不动。
       目前唯一的用处是 ② 的遍内补考（同一个人对同一排四个词是有视觉记忆的，
       位置本身会替他把答案递到手边）。换种子有 1/24 的概率恰好洗回原样，
       等于没换，所以撞上就整体左旋一格 —— 仍是这四个词，仍是确定性输出。 */
    if (o.salt) {
      order = bySeed(String(o.sent) + '|' + String(o.word) + '|' + o.salt);
      if (order.join('\u0000') === base.join('\u0000')) order = order.slice(1).concat(order[0]);
    }
    return { kind: o.kind, s: o.sent, w: String(o.word).toLowerCase(),
             prompt: o.sentZh || '', opts: order, answer: answer };
  }
  /* 【界面已无入口】③「看英文选中文」整步删除（2026-09-22 两步制）。这个方向的出题留着，
     一是 blankQuiz 与它共用 fourChoice，二是它的单测就是那台机器的判据回归。
     义项重叠（互相包含）的两个不算干扰项 —— 那是「两个都对」。凑不满四个就不出这道题。 */
  function meaningQuiz(o) {
    const card = o.card || {};
    const answer = (o.answer || '').trim() || (parseSenses(card.m)[0] || '').trim();
    if (!answer) return null;
    const cards = o.paraCards || {};
    return fourChoice({
      kind: 'mc4zh', sent: o.sent, word: o.word, answer: answer, sentZh: o.sentZh,
      pool: Object.keys(cards).map(function (key) {
        const src = cards[key];
        return { key: key, senses: parseSenses(typeof src === 'string' ? src : src.m) };
      }),
      label: function (cand, chosen) {
        for (let j = 0; j < cand.senses.length; j++) {
          const s = cand.senses[j];
          if (!sensesClash(answer, s) && chosen.indexOf(s) < 0) return s;
        }
        return '';
      },
    });
  }
  /* ②「挖空选择」：句中把目标词挖成空格，给 4 个英文候选（1 真 3 干扰），
     题干下方给中文译文并把「这个词在这一句里的意思」下划线标出来 —— 那条下划线就是
     把答案锁成唯一性的提示，也是判干扰项的尺子。
     o = { sent, word, sense, sentZh, card, groupCards, paraCards }
       · groupCards 该词所在【已裁决辨析组】（vocab.cmp）的其它成员 —— 第一优先（D5）
       · paraCards  同段其它目标词 —— 组里凑不够三个才用（PRD §7.2 的两档供给）
     干扰项三闸：① 必须是目标词（有卡，宿主只送有卡的）② 词性与这一句要求的相同（L2）
                ③ 它的任一条义项与本句这个意思重叠 → 填进去也可能对 → 踢掉（L3 的机械部分）
     过完三闸凑不满四个 → 返回 null：这道题【不出】，该句只走 ① 通读（D4：宁缺毋滥，
     不降级成默写 —— 答对了也不知道是不是蒙的，答错了还白记一次 err）。 */
  function blankQuiz(o) {
    const word = String(o.word || '').toLowerCase();
    const card = o.card || {};
    // 这一句里的意思：宿主按上下文挑好（行内小字那套判断），挑不出来就不出题
    const sense = String(o.sense || '').trim() || (parseSenses(card.m)[0] || '').trim();
    if (!word || !sense) return null;
    const wantPos = posOf(sense) || posOf(card.m);
    const mOf = function (c) { return typeof c === 'string' ? c : (c && c.m); };
    const pool = [];
    const seen = Object.create(null);
    const push = function (k, m) {
      if (k === word || seen[k]) return;
      seen[k] = 1;
      pool.push({ key: k, m: m });
    };
    const add = function (cards) {
      Object.keys(cards || {}).forEach(function (key) { push(String(key).toLowerCase(), mOf(cards[key])); });
    };
    add(o.groupCards);      // 1) 已裁决辨析组的成员优先：这一遍顺手又练了一次辨析
    add(o.paraCards);       // 2) 不足三个才轮到同段目标词
    /* 3) 全书同词性补池。少了这一档，「同段恰好没第二个同词性目标词」的词一局题都出不了：
       实测 188 个词（5.8%）在它们出现过的每一句里都凑不满四选一，而 estimateDays 的模拟
       默认每道排进来的题都出得出来 —— 那四处「全部过约 X 年 X 月」就成了空头承诺。
       顺序按 hash32(词头|候选) 定：同一个词永远拿到同一批候选（确定性，探针与测试要复算），
       换个词就换一批（否则全书都拿数组开头那三个词当干扰项，做十句就背下选项了）。 */
    if (o.bookCards) {
      const bk = Object.keys(o.bookCards)
        .map(function (key) {
          const k = String(key).toLowerCase();
          return { key: k, m: mOf(o.bookCards[key]), h: hash32(word + '|' + k) };
        })
        .filter(function (c) { return c.key !== word; })
        .sort(function (a, b) { return a.h - b.h; });
      for (let i = 0; i < bk.length; i++) push(bk[i].key, bk[i].m);
    }
    const q = fourChoice({
      kind: 'mc4zh', sent: o.sent, word: word, answer: word, sentZh: o.sentZh, pool: pool,
      salt: o.salt,
      accept: function (cand) {
        const senses = parseSenses(cand.m);
        if (!senses.length) return false;
        for (let j = 0; j < senses.length; j++) if (sensesClash(sense, senses[j])) return false;
        if (wantPos) return posSetOf(cand.m).indexOf(wantPos) >= 0;
        return posSetOf(cand.m).length > 0;         // 连答案的词性都判不出来 → 无法保证同词性 → 不进选项
      },
    });
    if (!q) return null;
    q.sense = sense;
    q.pos = wantPos;
    return q;
  }

  /* ---------- 老进度迁移：句子记的功搬到词上 ----------
     折扣是刻意的：一句读 6 遍 ≠ 句里每个词有效接触 6 次；不打折会让一批词被凭空判毕业。
     迁移期没有任何检索凭据，所以最高只能到「已见面」—— recognized 以上一律重新考。 */
  function migrate(oldPlan, oldProg, now, wordsOf) {
    const at = now || Date.now();
    const plan = (oldPlan && typeof oldPlan === 'object') ? oldPlan : {};
    const prog = (oldProg && typeof oldProg === 'object') ? oldProg : {};
    const events = [];
    const report = { contacts: 0, words: 0, cappedWords: 0, minutes: 0, droppedCycle: 0 };
    const list = typeof wordsOf === 'function' ? wordsOf : function () { return []; };
    const sents = (prog.sentences && typeof prog.sentences === 'object') ? prog.sentences : {};

    Object.keys(sents).forEach(function (sk) {
      const i = parseInt(sk, 10);
      if (!Number.isInteger(i) || i < 0) return;
      const rec = (sents[sk] && typeof sents[sk] === 'object') ? sents[sk] : {};
      const raw = Math.max(0, Number(rec.reps) || 0);
      const reps = Math.min(3, Math.floor(raw / 2));   // 封顶 3：见到 ≠ 认得，剩下的靠重考
      if (!reps) return;
      const words = list(i);
      // 「被压回来」按词计数：老口径已经算巩固/掌握，或读得多到会被误判毕业的
      if (raw >= 6 || rec.phase === 'solid' || rec.phase === 'mastered') report.cappedWords += words.length;
      const last = Number(rec.lastRead) || Number(rec.nextDue) || at;
      for (let n = 0; n < reps; n++) {
        const ts = Math.max(0, last - (reps - 1 - n) * DAY_MS);
        const day = dayKey(ts, 4);
        for (let j = 0; j < words.length; j++) { events.push(mkContact(words[j], i, ts, day)); report.contacts++; }
      }
    });
    const touched = {};
    for (let n = 0; n < events.length; n++) touched[events[n].w] = 1;
    report.words = Object.keys(touched).length;
    report.droppedCycle = Math.max(0, Number(prog.cycleCount) || 0);
    const minutes = Math.max(5, Math.min(180, Math.round(Number(plan.dailyMinutes) || 15)));
    report.minutes = minutes;

    const startDate = /^\d{4}-\d{2}-\d{2}$/.test(String(plan.startDate || '')) ? plan.startDate : dayKey(at, 4);
    const planNew = { todayMinutes: minutes, boundaryHour: 4, startDate: startDate,
                      endDate: null, pausedNew: !!plan.paused };
    const state = replay(events, { boundaryHour: 4, wordsOf: list, plan: planNew });
    state.plan = planNew;
    state.migratedAt = at;
    state.legacy = {
      streak: Math.max(0, Number(prog.streak) || 0), cycleCount: report.droppedCycle,
      lastDay: String(prog.lastDay || ''), pace: (prog.pace && typeof prog.pace === 'object') ? prog.pace : null,
    };
    // 老 daily 的历史只留「那天到过、到过多少句次」，不冒充新口径的句数
    const daily = (prog.daily && typeof prog.daily === 'object') ? prog.daily : {};
    Object.keys(daily).forEach(function (d) {
      const src = daily[d] || {};
      if (Number(src.reps) > 0) state.daily[d] = Object.assign({ legacyReps: Number(src.reps) }, state.daily[d] || {});
    });
    return { events: events, state: state, report: report };
  }

  /* ---- 3.0 按篇化：scope + 三张派生索引 ----
     引擎不认识 SECTIONS（它是纯函数模块），所以篇章归属一律由调用方把 sections 传进来。 */

  // 该篇的全局句号集合。sections[].paragraphs[].length 就是每段的句数，与 index.html 的
  // computeChapterStart / chapterSentCount 同一套口径（跨章句号 = 前面所有篇的句数之和 + 本句在篇内的序号）。
  function articleScope(sections, article) {
    const out = new Set();
    if (!Array.isArray(sections) || !sections[article]) return out;
    let base = 0;
    for (let a = 0; a < article; a++) {
      for (const p of sections[a].paragraphs) base += p.length;
    }
    let n = 0;
    for (const p of sections[article].paragraphs) n += p.length;
    for (let k = 0; k < n; k++) out.add(base + k);
    return out;
  }

  // 词 → 出现在哪几篇。真来源是课文里的 [[词:形式]] 标记，sections[].paragraphs[][] 里存的就是原始串。
  function wordArticle(sections, word) {
    const hits = new Set();
    if (!Array.isArray(sections) || !word) return [];
    const needle = '[[' + word + ':';
    for (let a = 0; a < sections.length; a++) {
      for (const p of sections[a].paragraphs) {
        for (const raw of p) {
          if (typeof raw === 'string' && raw.indexOf(needle) >= 0) { hits.add(a); break; }
        }
      }
    }
    return Array.from(hits).sort((x, y) => x - y);
  }

  // 只在 scope 内的句子里统计词（scope 为 null/省略 → 全量）。
  // ⚠️ 引擎里**没有** countStages —— 那个函数长在 shadow/index.html 里（它还要 ALL_TARGET_WORDS
  //    才能算 fresh）。所以这里从零数，**别去调 countStages**，否则 ReferenceError。
  //    也不返回 fresh（引擎不知道目标词总数，fresh 由调用方拿总数减）。
  function countStagesOf(state, scope, wordsOf) {
    const c = { seen: 0, recognized: 0, owned: 0, graduated: 0, leech: 0 };
    const ws = (state && state.words) || {};
    let keys;
    if (!scope || typeof wordsOf !== 'function') {
      keys = Object.keys(ws);
    } else {
      const inScope = new Set();
      scope.forEach(i => wordsOf(i).forEach(w => inScope.add(w)));
      keys = Object.keys(ws).filter(k => inScope.has(k));
    }
    keys.forEach(k => {
      const x = ws[k];
      c[x.stage] = (c[x.stage] || 0) + 1;
      if (x.leech) c.leech++;
    });
    return c;
  }

  window.ShadowPlan = {
    DAY_MS, WORD_INTERVALS, GRADUATED_INTERVALS, STAGES, MASTER_REPS, LEECH_ERR,
    BAOWEN_CAP_SENTS, BAOWEN_MIN_MINUTES, resolveBaowenCap,
    dayKey, dayDiff, wordInterval, emptyState,
    eventId, mkContact, mkQuiz, mkPromote, newWord, stageOf, replay, wordState,
    assemble, recallQuiz, meaningQuiz, blankQuiz, judgeRecall, editDistance, parseSenses, hash32, migrate,
    countPassed, estimateDays,
    articleScope, wordArticle, countStagesOf,
  };
})();
