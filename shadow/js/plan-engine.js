/* 学习计划引擎：纯逻辑，不碰 DOM、不发请求。宿主是 shadow/index.html 的 TASK 模块。
   真值只有一份 —— 事件日志；词状态、每天完成度、连续天数一律从日志重放现算，
   这样界面不会出现「三个数字互相打架」，换设备也不需要合并策略。 */
(function () {
  'use strict';

  const DAY_MS = 864e5;
  // 第 n 次接触后隔几天再见。前几档是 0（当天回锅），毕业后进 14 → 30。
  const WORD_INTERVALS = [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 5, 5, 5, 5, 5, 7, 7, 7, 7, 7];
  const GRADUATED_INTERVALS = [14, 30];
  const STAGES = ['fresh', 'seen', 'recognized', 'owned', 'graduated'];
  const MASTER_REPS = 20;   // 接触够 20 次且 ③ 答对过 → 已毕业
  const LEECH_ERR = 3;      // 连错 3 次 → 重点词（强制回炉，但不隐藏）

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
    if (kind === 'mc4zh') { if (ok) w.ok3++; return; }
    if (!ok) return;
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
    const st = emptyState();
    st.plan = o.plan || null;
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
        if (!credited.has(creditKey) && before !== 'graduated') {
          credited.add(creditKey);
          slot.reps++;
          slot.lastContactAt = ev.ts || 0;
          slot.lastContactDay = day;
          if (!slot.firstSeenAt) slot.firstSeenAt = ev.ts || 0;
        }
        slot.stage = stageOf(slot);
        slot.due = (ev.ts || 0) + wordInterval(slot.reps) * DAY_MS;
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
    const secQuiz = (o.secQuiz || 6) / rate;
    const budget = Math.max(0, (o.todayMinutes || 0) * 60);
    const boundary = Number.isInteger(o.boundaryHour) ? o.boundaryHour : 4;
    const ws = (state && state.words) || {};
    const today = dayKey(now, boundary);

    // 每个未毕业词只算一次：due 已过 → A；见过但没到期 → B；连一面都没见 → C
    const due = [], grow = [], fresh = [];
    let dueWords = 0;
    const inPool = {};
    for (let i = 0; i < total; i++) {
      const list = wordsOf(i);
      for (let j = 0; j < list.length; j++) {
        const w = list[j];
        if (inPool[w]) continue;
        const st = ws[w];
        if (!st || st.stage === 'fresh') { inPool[w] = 'C'; fresh.push({ w: w, i: i }); continue; }
        if (st.stage === 'graduated') continue;
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
      const cost = sec + 2 * secQuiz;                      // 一句的代价 = 读 + ② ③ 各一题
      if (left < cost) return false;
      let cur = chosen.get(i);
      if (cur) { if (cur.pool === 'C' && pool !== 'C') { left -= cur.sec - sec; cur.pool = pool; cur.sec = sec; } return true; }
      chosen.set(i, { i: i, kind: 'sent', pool: pool, sec: sec, words: wordsOf(i).slice() });
      left -= cost;
      return true;
    }
    for (let n = 0; n < due.length; n++) {
      if (!take(due[n].i, 'A', secReview)) droppedA++;
    }
    const plan = o.plan || (state && state.plan) || null;
    if (!plan || !plan.pausedNew) {
      const roomy = left >= 0.6 * budget || chosen.size === 0 && budget === 0;
      if (roomy) for (let n = 0; n < fresh.length; n++) if (!take(fresh[n].i, 'C', secNew)) break;
      for (let n = 0; n < grow.length; n++) take(grow[n].i, 'B', secReview);
    }

    const queue = [];
    Array.from(chosen.keys()).sort(function (a, b) { return a - b; })
      .forEach(function (i) { queue.push(chosen.get(i)); });

    const items = [];
    queue.forEach(function (q) {
      const w = pickWord(q, ws, due);
      if (!w) return;
      items.push({ kind: 'quiz', pass: 2, s: q.i, w: w, pool: q.pool });
      items.push({ kind: 'quiz', pass: 3, s: q.i, w: w, pool: q.pool });
    });
    // 二次确认题（k）：课文语境已经对过、例句语境还没对的词，补一道例句题
    let kSlots = 0;
    queue.forEach(function (q) {
      q.words.forEach(function (w) {
        const st = ws[w];
        if (!st || st.stage === 'graduated') return;
        if (!(st.ctx[String(q.i)] > 0) || st.ctx.ex > 0) return;
        if (left < secQuiz) return;
        left -= secQuiz; kSlots++;
        items.push({ kind: 'quiz', pass: 2, s: 'ex', w: w, pool: q.pool });
      });
    });

    let floor = false;
    if (!queue.length && (dueWords || fresh.length || grow.length)) {
      const seedWord = due.length ? due[0] : (grow.length ? grow[0] : fresh[0]);
      const i = seedWord.i;
      chosen.set(i, { i: i, kind: 'sent', pool: due.length ? 'A' : 'C',
                      sec: due.length ? secReview : secNew, words: wordsOf(i).slice() });
      queue.push(chosen.get(i));
      items.push({ kind: 'quiz', pass: 2, s: i, w: seedWord.w, pool: 'A' });
      items.push({ kind: 'quiz', pass: 3, s: i, w: seedWord.w, pool: 'A' });
      floor = true;
    }

    const readSec = queue.reduce(function (a, q) { return a + q.sec; }, 0);
    return {
      queue: queue, items: items,
      words: Array.from(new Set(queue.reduce(function (a, q) { return a.concat(q.words); }, []))),
      stats: {
        // 每句按 (句时 + 2×secQuiz) 预留、k 槽按 1×secQuiz 预留，
        // 所以 usedSec = readSec + items×secQuiz ≤ budget 由构造保证
        budgetSec: budget, usedSec: readSec + items.length * secQuiz,
        dueWords: dueWords, newWords: fresh.length, droppedA: droppedA,
        floor: floor, day: today, kSlots: kSlots,
        todayMinutes: o.todayMinutes || 0,
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

  /* ---------- 出题 ----------
     ② 永远遮目标词（原则 3）。第一期没有裁决过的辨析组，所以只出回忆题 ——
     回忆题结构上不存在双解，宁可不给选项也不出错题（原则 8）。 */
  function parseSenses(m) {
    return String(m || '').split(/[；;]/).map(function (x) { return x.trim(); }).filter(Boolean);
  }
  function posOf(m) {
    const x = String(m || '').match(/^\s*(n|v|vt|vi|adj|adv|prep|conj|pron|num|int|abbr)\./i);
    return x ? x[1].toLowerCase() + '.' : '';
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
  /* ③ 看英文选中文：正确答案取卡上第一个义项，干扰项取同段其它目标词的义项。
     义项重叠（互相包含）的两个不算干扰项 —— 那是「两个都对」。凑不满四个就不出这道题。 */
  function meaningQuiz(o) {
    const card = o.card || {};
    const answer = (o.answer || '').trim() || (parseSenses(card.m)[0] || '').trim();
    if (!answer) return null;
    const norm = function (s) { return String(s).replace(/[，。、,.;；：:\s]/g, ''); };
    const ak = norm(answer);
    const opts = [answer];
    const pool = Object.keys(o.paraCards || {});
    for (let i = 0; i < pool.length && opts.length < 4; i++) {
      const key = pool[i];
      if (key === o.word) continue;
      const src = o.paraCards[key];
      const senses = parseSenses(typeof src === 'string' ? src : src.m);
      for (let j = 0; j < senses.length; j++) {
        const sk = norm(senses[j]);
        if (!sk || sk === ak || sk.indexOf(ak) >= 0 || ak.indexOf(sk) >= 0) continue;
        if (opts.indexOf(senses[j]) >= 0) continue;
        opts.push(senses[j]);
        break;
      }
    }
    if (opts.length < 4) return null;
    const seed = String(o.sent) + '|' + String(o.word);
    const shuffled = opts.map(function (x, i2) { return { x: x, k: hash32(seed + i2) % 997 }; })
      .sort(function (a, b) { return a.k - b.k; })
      .map(function (v) { return v.x; });
    return { kind: 'mc4zh', s: o.sent, w: String(o.word).toLowerCase(),
             prompt: o.sentZh || '', opts: shuffled, answer: answer };
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

  window.ShadowPlan = {
    DAY_MS, WORD_INTERVALS, GRADUATED_INTERVALS, STAGES, MASTER_REPS, LEECH_ERR,
    dayKey, dayDiff, wordInterval, emptyState,
    eventId, mkContact, mkQuiz, mkPromote, newWord, stageOf, replay, wordState,
    assemble, recallQuiz, meaningQuiz, judgeRecall, editDistance, parseSenses, hash32, migrate,
  };
})();
