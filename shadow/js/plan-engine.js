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

  window.ShadowPlan = {
    DAY_MS, WORD_INTERVALS, GRADUATED_INTERVALS, STAGES, MASTER_REPS, LEECH_ERR,
    dayKey, dayDiff, wordInterval, emptyState,
  };
})();
