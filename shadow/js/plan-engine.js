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

  window.ShadowPlan = {
    DAY_MS, WORD_INTERVALS, GRADUATED_INTERVALS, STAGES, MASTER_REPS, LEECH_ERR,
    dayKey, dayDiff, wordInterval, emptyState,
    eventId, mkContact, mkQuiz, mkPromote, newWord, stageOf, replay, wordState,
  };
})();
