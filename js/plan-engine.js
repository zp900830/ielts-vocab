/* 学习计划引擎：纯逻辑，不碰 DOM、不发请求。宿主是 index.html 的 TASK 模块。
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
  /* 12 而不是 20：2026-09-21 拍板（决策记录 scheduling-decisions-round3 第 1 条）——
     后半程那几档长间隔是「已经会了还在反复考」，拉长工期最多、加固记忆最少。
     配套的另一半是保温：到 12 次的词会按 GRADUATED_INTERVALS[0] 回池，
     所以"毕业"不再是"永不再见"，门槛降下来才不会变成假阳性。
     出处 docs/superpowers/plans/2026-09-22-保温第一期.md §4 Task 2。
     2026-10-10 删挖空选词（用户裁定：状态系统连 UI 一起删）：这里只剩
     「接触满 12 次 → 进保温长间隔」，不再有任何「答对过 ②」的门槛。 */
  const MASTER_REPS = 12;   // 接触满 12 次 → 进保温（长间隔回池）
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

  function newWord() {
    return { reps: 0, due: 0, firstSeenAt: 0, lastContactAt: 0, lastContactDay: '' };
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
        const sKey = String(ev.s);
        st.sents[ev.s] = { lastReadAt: Math.max(st.sents[ev.s] ? st.sents[ev.s].lastReadAt : 0, ev.ts || 0) };
        if (!daySents.has(day)) daySents.set(day, new Set());
        daySents.get(day).add(sKey);
        const creditKey = ev.w + '|' + sKey + '|' + day;
        /* 毕业词再被读到也照样进账（Task 2.5）。原来这里挡着 `before !== 'graduated'` 是
           "毕业 = 永不再见"的另一半：事件不进来，引擎就算把词排回池子，due 也永远不顺延，
           同一句会被天天重排。回炉这一遍是实打实的一次接触 —— reps 继续加、
           due 走 wordInterval 排 14 天。 */
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
      } else if (ev.type === 'quiz') {
        /* 历史 ② 答题事件（该功能 2026-10-10 整体删除）只进日账 —— 让「总学习次数 / 趋势」
           里的历史数字保持原样；词槽不再因它发生任何变化（原来的 ok3/语境/err/leech/晋升
           都随状态系统一起删了）。 */
        const d = touchDaily(st, day);
        d.quizDone = (d.quizDone || 0) + 1;
        if (ev.ok) d.correct = (d.correct || 0) + 1;
      } else if (ev.type === 'relearn') {
        /* 「重学」（词详情按钮）：把这颗词拉回主动轮换 —— 接触次数压回 3 以内，
           之后 due 按新次数自然重排。原版还要清晋升凭据，那些字段已随状态系统删除。 */
        const slot = st.words[ev.w];
        if (slot) slot.reps = Math.min(slot.reps || 0, 3);
      } else if (ev.type === 'dayplan') {
        if (ev.day && ev.minutes) touchDaily(st, ev.day).minutes = ev.minutes;
      }
    }

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
    /* 预算 = 纯通读时间 —— 规格 2026-09-22 D10 定下、2026-10-10 ② 删除后继续成立。
       他原话：「这个时间用通读时间算，我希望是快速刷词」。别把任何「做题时间」加回预算。 */
    const budget = Math.max(0, (o.todayMinutes || 0) * 60);
    const boundary = Number.isInteger(o.boundaryHour) ? o.boundaryHour : 4;
    const ws = (state && state.words) || {};
    const today = dayKey(now, boundary);
    /* 3.0：按篇排。scope 给定时只从这些全局句号里挑；省略 = 全量（v2.0 行为，逐字不变）。
       闸就设在这一层：三池（due/grow/fresh）只收 scope 内的句，下游 take / 兜底 / 队列
       自然全在 scope 内，不需要在每一处 push 上重复判。 */
    const scope = (o.scope instanceof Set) ? o.scope : null;
    const inScope = (i) => !scope || scope.has(i);

    // 每个词只算一次：一次都没接触 → C；接触满 12 次 → 保温（到期才回 A，带每日配额）；
    // 其余按 due：已过 → A，没到 → B。（2026-10-10 删状态系统：分类只看 reps/due，不看 stage。）
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
        if (!st || !(st.reps > 0)) { inPool[w] = 'C'; fresh.push({ w: w, i: i }); continue; }
        /* 满 12 次的词不再"永不再见"（保温第一期 Task 2）：到点了回 A 池，带 g:1 标记，
           下面按每日配额限量接收。没到点（due 还在 14 天内）的直接跳过 —— 注意
           **不许把它塞进 B 池**：B 池的 take 在配额循环之外，塞进去就等于绕开上限。
           优先级说明：计划里写"回炉句低于未毕业词"，真按字面把回炉排到新词之后，
           稳态下 A 池天天满 → 保温一句也排不进去，功能直接等于零。实测那一版
           （回炉与到期词同池按 due 排序、但每天最多 cap 句「专为它新排」）才是
           work/保温预算-实测 §8 量出来的语义，保护新词靠的是 cap 这个上限。 */
        if (st.reps >= MASTER_REPS) {
          if ((st.due || 0) > now) continue;
          /* dueWords【不加】：界面上那格是「N 个词到期 · K 个词是回炉保温」，两个数是两批人，
             加进去就重复计数。更要紧的是下面兜底那句靠它判断"今天还有没有正事" ——
             把保温算成正事，等于让兜底绕过配额上限（见 floor 处注释）。 */
          inPool[w] = 'A';
          due.push({ w: w, i: i, due: st.due || 0, g: 1 });
          continue;
        }
        if (st.lastContactDay === today) continue;         // 今天已经见过，不重复占位
        inPool[w] = (st.due || 0) <= now ? 'A' : 'B';
        if (inPool[w] === 'A') { dueWords++; due.push({ w: w, i: i, due: st.due || 0 }); }
        else grow.push({ w: w, i: i });
      }
    }
    due.sort(function (a, b) { return a.due - b.due || a.i - b.i; });

    const chosen = new Map();                              // 句号 → {i, pool, sec}
    let left = budget, droppedA = 0;
    function take(i, pool, sec) {
      const cost = sec;                                       // 一句的代价 = 通读时间（2026-10-10 起 ② 已删，预算就是纯通读）
      if (left < cost) return false;
      let cur = chosen.get(i);
      if (cur) { if (cur.pool === 'C' && pool !== 'C') { left -= cur.sec - sec; cur.pool = pool; cur.sec = sec; } return true; }
      chosen.set(i, { i: i, kind: 'sent', pool: pool, sec: sec, words: wordsOf(i).slice() });
      left -= cost;
      return true;
    }
    /* 刷句模式（2026-10-10 用户定名，原「手动」）：scope 内的句**按句号顺序全装、绝不跳句**。
       「手动更像是刷句模式——连续刷，我希望快速刷完，不需要你定什么时候到期，我刷完一轮
       再刷一轮」。所以这里不走三池挑选（那是记忆模式的事），scope 本身就是今天的队列：
       全局时上游 todayPlan 已把 scope 算成 [接力起点, 起点+N-1]（N = 分钟数 ÷ 25s/句，见宿主
       globalPromiseN），按篇时是「书签在这篇里就接着刷、否则整篇重刷」（刻意不受 N 截断，
       与按篇的整篇承诺同口径）。pool 仍标 C/A（句里有没见过的词 = 新），供正文
       task-new/task-review 染色与「新词」计数，不再驱动挑选顺序。不做预算裁剪：
       预算体现在窗口尺寸上，这里再裁一次会出现「按篇队列比承诺短一截」的对不上。 */
    if (o.linear) {
      for (let i = 0; i < total; i++) {
        if (!inScope(i)) continue;
        const list = wordsOf(i);
        let hasFresh = false;
        for (let j = 0; j < list.length; j++) { const st = ws[list[j]]; if (!st || !(st.reps > 0)) { hasFresh = true; break; } }
        chosen.set(i, { i: i, kind: 'sent', pool: hasFresh ? 'C' : 'A', sec: secNew, words: list.slice() });
      }
    }
    /* 到期句（含回炉句）先取，再取新词，最后加深句 —— 与 work/baowen_probe.mjs 量那批数时
       用的顺序逐字一致，改了顺序就等于换了成本模型，实测那张表不再适用。
       刷句模式不走这段（上面已照单全收），三池只用来算 stats。 */
    const plan = o.plan || (state && state.plan) || null;
    const baowenCap = resolveBaowenCap(plan, o.todayMinutes);
    let baowenSent = 0, retentionDropped = 0;
    const retainedWords = {};
    if (!o.linear) for (let n = 0; n < due.length; n++) {
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
    if (!o.linear && (!plan || !plan.pausedNew)) {
      const roomy = left >= 0.6 * budget || chosen.size === 0 && budget === 0;
      if (roomy) for (let n = 0; n < fresh.length; n++) if (!take(fresh[n].i, 'C', secNew)) break;
      for (let n = 0; n < grow.length; n++) take(grow[n].i, 'B', secReview);
    }

    const queue = [];
    Array.from(chosen.keys()).sort(function (a, b) { return a - b; })
      .forEach(function (i) { queue.push(chosen.get(i)); });

    /* 2026-10-10 删挖空选词：原来这里在队列之后生成两批 ② 题目（一句一题 + 例句二次确认题），
       并把题数与 kSlots 报进 stats —— 整段随功能删除，items 字段一并取消，
       今天的队列就是 queue 本身（句子）。 */

    let floor = false;
    if (!o.linear && !queue.length && (dueWords || fresh.length || grow.length)) {
      /* 兜底那句只从【未满 12 次】的活儿里挑。到点回炉的词是被 cap 拦下来的，不是"预算装不下"：
         兜底的本意是「预算小到一句都排不出，别让他今天没得读」，拿它绕过保温上限，
         等于把「每天不到 15 分钟不保温」这条口径偷偷改成"其实每天还是排一句"。 */
      const seedDue = due.filter(function (e) { return !e.g; });
      const seedWord = seedDue.length ? seedDue[0] : (grow.length ? grow[0] : fresh[0]);
      const i = seedWord.i;
      chosen.set(i, { i: i, kind: 'sent', pool: seedDue.length ? 'A' : 'C',
                      sec: seedDue.length ? secReview : secNew, words: wordsOf(i).slice() });
      queue.push(chosen.get(i));
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
      queue: queue,
      words: Array.from(new Set(queue.reduce(function (a, q) { return a.concat(q.words); }, []))),
      stats: {
        // D10：预算与用量都只算通读时间，所以 usedSec = readSec ≤ budget 由构造保证。
        budgetSec: budget, usedSec: readSec,
        dueWords: dueWords, newWords: newTaken, newPool: fresh.length, droppedA: droppedA,
        floor: floor, day: today,
        todayMinutes: o.todayMinutes || 0,
        /* 保温负载：界面上那句「今天 K 个词是回炉保温」只能从这里取，不许 UI 自己数队列
           （一份逻辑一份实现）。baowenSent 是**句**、且只算"专为回炉新排的"，与配额同单位；
           retentionWords 是**词**，含免费搭车的那些，所以它会 ≥ baowenSent。 */
        baowenCap: baowenCap, baowenSent: baowenSent, retentionWords: baowenWords,
        retentionDropped: retentionDropped,
        /* 刷句模式标记：宿主据此换文案（「连刷 N 句不跳句」而不是「到期/新词进队列」）。 */
        linear: !!o.linear,
      },
    };
  }

  /* ---------- 完工估算（规格 2026-09-21 §4.1 + 2026-09-22 D10）---------- */
  /* 「过完一遍」= 这个词被通读到过至少一次（有一条算进账的接触事件）。
     2026-09-22 他把工期口径改成这个：原话「我希望是快速刷词」「这个时间用通读时间算」。
     判据不是「接触满 12 次进保温」—— 那会把「一年只过完 48 个词」这种数摆到界面上，
     而他每天实打实读进去几十个词，那个数与他的体感差一个量级，压力全来自这里。
     保温中的词仍然看得到（今日面板的回炉数），但那是 state 里数出来的真值，不由这个模型许诺。
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
     做法是照真流程走一遍：逐日用现成 assemble 排队列 → 队列翻成 contact 事件
     → 只把新事件续算进同一份 state（Task 1 的 opts.state）→ 数过完的词。
     两条不能省：
       ① 必须深拷 state（见下面 replay 前那行注释）。
       ② 不许在这里另写「每天几个词」的公式。宁可慢，也不能有两份真值。 */
  function estimateDays(state, minutes, opts) {
    const o = opts || {};
    const boundary = Number.isInteger(o.boundaryHour) ? o.boundaryHour : 4;
    const total = o.totalSents || 0;
    const wordsOf = typeof o.wordsOf === 'function' ? o.wordsOf : function () { return []; };
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

  /* ---------- 出题机器（fourChoice / blankQuiz / meaningQuiz / recallQuiz）已随
     「② 挖空选词」整体删除（2026-10-10 用户裁定）。历史 quiz 事件仍会在 replay 里
     进日账（保住总学习次数/趋势的历史读数），但不再有任何出题与判分。 ---------- */

  /* ---------- 老进度迁移：句子记的功搬到词上 ----------
     折扣是刻意的：一句读 6 遍 ≠ 句里每个词有效接触 6 次；不打折会让一批词被凭空算成
     「接触满 12 次」。封顶 3 是同一条道理：见到 ≠ 认得，压回主动轮换由排期自己接手。 */
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
      const reps = Math.min(3, Math.floor(raw / 2));   // 封顶 3：见到 ≠ 认得，压回主动轮换
      if (!reps) return;
      const words = list(i);
      // 「被压回来」按词计数：老口径已经算到巩固/掌握档，或读得多到会被误判成满 12 次的
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
    // 2026-10-06「只复习不见新词」开关已从两个应用删除：迁移老计划时不再继承 1.0 的 paused，
    // 否则存量用户会被锁进"只复习"且再无开关可关。
    const planNew = { todayMinutes: minutes, boundaryHour: 4, startDate: startDate,
                      endDate: null, pausedNew: false };
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

  /* 2026-10-10 删状态系统：countStagesOf 连同宿主的 countStages 一起删除 ——
     词槽只剩 reps/lastContact/due 这些排期账，没有「阶段」可数。 */

  window.ShadowPlan = {
    DAY_MS, WORD_INTERVALS, GRADUATED_INTERVALS, MASTER_REPS,
    BAOWEN_CAP_SENTS, BAOWEN_MIN_MINUTES, resolveBaowenCap,
    dayKey, dayDiff, wordInterval, emptyState,
    eventId, mkContact, newWord, replay, wordState,
    assemble, migrate,
    countPassed, estimateDays,
    articleScope, wordArticle,
  };
})();
