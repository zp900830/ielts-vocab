/* 3.0 外壳路由。M1 只有 #/home 与文章任务模式有内容，其余四屏先给「建设中」占位。 */
(function () {
  const ROUTES = ['home', 'stats', 'words', 'listen', 'me'];
  let cur = 'home';
  function route() {
    const h = (location.hash || '#/home').replace(/^#\//, '').split('/')[0];
    cur = ROUTES.includes(h) ? h : 'home';
    document.querySelectorAll('.sidenav .nav-item').forEach(b =>
      b.classList.toggle('on', b.dataset.route === cur));
    const view = document.getElementById('appView');
    if (cur === 'home' && window.APP3 && window.APP3.renderHome) return window.APP3.renderHome(view);
    if (cur === 'home') { view.innerHTML = '<p class="sm">正在载入…</p>'; return; }
    view.innerHTML = '<div class="app-todo"><h3>' +
      ({ stats: '学习数据', words: '单词本', listen: '随身听', me: '我的' })[cur] +
      '</h3><p class="sm">这一屏在 3.0 的后续里程碑里交付。</p></div>';
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.nav-item');
    if (b) { location.hash = '#/' + b.dataset.route; return; }
    // 卡片是 renderHome 每次重渲的，所以走事件代理而不是逐张绑。
    // 入口 2 的「答题」按钮长在卡片里，必须先于卡片判定 —— 否则会被 openArticle 接走（§4.4）。
    const quiz = e.target.closest('.a-quiz');
    if (quiz && quiz.dataset.a != null) { openQuiz(Number(quiz.dataset.a)); return; }
    const card = e.target.closest('.art-card');
    if (card && card.dataset.a != null) openArticle(Number(card.dataset.a));
  });
  // 卡片改成 div + role="button"（里面要放「答题」真按钮，按钮不能套按钮），
  // 所以 Enter / Space 的激活要自己补回来。
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    const t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('.a-quiz')) return;               // 真按钮自己会派发 click
    const card = t.closest('.art-card');
    if (!card || card.dataset.a == null) return;
    e.preventDefault();
    openArticle(Number(card.dataset.a));
  });

  /* ---- 3.0 首页：六张文章卡片（M1 Task 3） ----
     ROOT2 是 TASK IIFE 的内部状态，外壳读不到，只能经 TASK.state() / TASK.sentWordsOf 拿。
     熟练度按 §9.2 三项收口（Task 7）：通读完成度 ×40 + ② 正确率 ×35 + 精读重复度 ×25。 */
  function rel(ts) {                       // 相对时间，复用影子跟读口径
    if (!ts) return '还没学过';
    const d = Math.floor((Date.now() - ts) / 864e5);
    return d <= 0 ? '今天' : d === 1 ? '昨天' : d + ' 天前';
  }
  // 当前阶段的文案（§3.3 / §9.4）。通读满还没做题 = 「② 可答题」；`已学完` 留给"通读 + ② 各一遍"。
  const STAGE_LABEL = { todo: '未开始', reading: '通读中', read: '② 可答题',
                        quiz: '② 做题', done: '已学完', pro: '熟练' };
  function articleStat(a) {
    const st = (typeof TASK !== 'undefined' && TASK.state()) || window.ShadowPlan.emptyState();
    const wordsOf = (typeof TASK !== 'undefined' && TASK.sentWordsOf) || function () { return []; };
    const scope = window.ShadowPlan.articleScope(SECTIONS, a);
    const total = scope.size;
    let ever = 0;
    const words = new Set();   // 该篇出现过的**不同目标词**（去重）——「已毕业 X / Y 词」的 Y
    scope.forEach((i) => {
      const s = st.sents[i]; if (s && s.lastReadAt > 0) ever++;
      wordsOf(i).forEach((w) => words.add(w));
    });
    const c = window.ShadowPlan.countStagesOf(st, scope, wordsOf);
    /* ② 正确率走**引擎的 quiz 事件**（type:'quiz'、按本篇全局句号过滤），不是 UI 游标：
       补考会往同一个空再记一条事件，§9.2 的分母就是「quiz 总数」（题数，不是不同的空数
       —— T6 台账里那条口径）。'ex' 例句题的 s 是字符串，进不了 scope，天然不计。 */
    const evs = ((typeof TASK !== 'undefined' && TASK.events) ? TASK.events() : [])
      .filter(e => e.type === 'quiz' && scope.has(e.s));
    const quizOf = evs.length, quizOk = evs.filter(e => e.ok).length;
    const quizRate = quizOf ? quizOk / quizOf : 0;
    /* 精读次数（§7.6）：只数任务模式的完成（taskSentenceFinished 累加），随身听不计。
       这份按篇账住 3.0 自己的 key（TASK.repsOf 跨天求和），不在共享的 ielts.shadow.v2 里 ——
       否则一开 /shadow/ 就被它的 recompute2 抹掉（同源共享的必然，见 index.html 的 LS_ARTICLE）。 */
    const reps = (typeof TASK !== 'undefined' && TASK.repsOf) ? TASK.repsOf(a) : 0;
    /* §9.4 的「② 批次答过一遍」凭据：finishPass(2) 时按篇记一笔（TASK.articlePass2Done）。
       它问的是「这一篇今天那批题走完了没有」，**不是**「全篇每句都答对」——一遍 ② 只考当天
       队列那 ~20–40 题，拿它去比全篇句数（339）永远到不了「已学完」（终审 I1）。 */
    const pass2Done = (typeof TASK !== 'undefined' && TASK.articlePass2Done) ? TASK.articlePass2Done(a) : false;
    const progress = total
      ? Math.round(Math.min(ever / total, 1) * 40 + quizRate * 35 + Math.min(reps / (total * 2), 1) * 25)
      : 0;
    /* 当前阶段（§9.4）：通读满一遍 + 这一篇的 ② 批次答过一遍 = 已学完；
       熟练 = 已学完 且 熟练度 ≥ 80%（§9.2 的 caveat）。
       注意「② 一遍」用 pass2Done（finishPass(2) 的凭据），不用 quizOk ≥ 句数 —— 后者要求
       答对全篇每一句，而一遍 ② 只覆盖当天队列那几十题，永远到不了「已学完」。 */
    let stage;
    if (ever === 0) stage = 'todo';
    else if (ever < total) stage = 'reading';
    else if (quizOf === 0) stage = 'read';
    else if (!pass2Done) stage = 'quiz';
    else stage = 'done';
    if (stage === 'done' && progress >= 80) stage = 'pro';
    let lastAt = 0; scope.forEach((i) => { const s = st.sents[i]; if (s && s.lastReadAt > lastAt) lastAt = s.lastReadAt; });
    // `total` = 句数（进度分母）；`wordTotal` = 词数（掌握分母，与 c.graduated 同单位）
    // `ever` = 这一篇里读过的句数 —— 横幅「还剩 N 句」与卡片进度共用这一份派生，别各算各的。
    return { progress, stage, grad: c.graduated, total, lastAt, wordTotal: words.size, ever,
      quizReady: total > 0 && ever >= total };
  }
  function renderHome(view) {
    // 数据未就绪时先占位：initApp 拉完数据会再调一次 route()（见 app/index.html）。
    if (typeof dataReady === 'undefined' || !dataReady) {
      view.innerHTML = '<p class="sm">正在载入…</p>';
      return;
    }
    const cards = SECTIONS.map((s, a) => {
      const x = articleStat(a);
      // 卡片用 div 而不是 button：通读完成后里面要放一颗真的「答题」按钮（按钮不能套按钮）。
      // role/tabindex 保住键盘可达，Enter/Space 的激活在上面的 keydown 代理里补。
      return `<div class="art-card" data-a="${a}" data-stage="${x.stage}" role="button" tabindex="0">
        <div class="a-head"><div class="a-title">${esc(s.title)}</div>
          <span class="a-stage">${STAGE_LABEL[x.stage] || '未开始'}</span></div>
        <div class="a-en">${esc((TIT_EN[s.title] || '').replace(/^\s*·\s*/, ''))}</div>
        <div class="a-bar"><i style="width:${x.progress}%"></i></div>
        <div class="a-meta"><span class="a-pct">${x.progress}%</span>
          <span>已毕业 ${x.grad} / ${x.wordTotal} 词</span>
          <span>${rel(x.lastAt)}</span></div>
        ${x.quizReady ? `<button class="a-quiz" data-a="${a}" type="button">答题</button>` : ''}
      </div>`;
    }).join('');
    view.innerHTML = `<div class="home-banner" id="homeBanner"></div><div class="art-grid">${cards}</div>`;
    // ⚠️ renderBanner 由 Task 4 定义；只跑 Task 3 时它还不存在 —— 必须守卫。
    if (window.APP3.renderBanner) window.APP3.renderBanner(document.getElementById('homeBanner'));
  }
  window.APP3 = Object.assign(window.APP3 || {}, { renderHome, articleStat });

  /* ---- 3.0 顶部「今天该做什么」横幅（M1 Task 4，§3.5）----
     四类：没计划 / 有计划没做完 / 有计划做完 / 连续+毕业摘要（后两者叠加）。
     数字一律经 TASK 出口取（todayStats / articleStat），界面不自己数账。 */
  let _bannerEl = null, _setupWired = false;
  // 该继续哪一篇：第一篇「还没通读完」的；全读满就回到第一篇（§9.4：通读满是 read/quiz/done/pro，都跳过）。
  function nextArticle() {
    for (let a = 0; a < SECTIONS.length; a++) { const x = articleStat(a); if (x.ever < x.total) return a; }
    return 0;
  }
  function openSetup() {
    if (typeof TASK === 'undefined' || !TASK.openPanel) return;
    TASK.openPanel();          // 没计划时 openPanel() 渲的就是 v2.0 设置屏（renderSetup 进 #todayPanel）
    const panel = document.getElementById('todayPanel');
    if (!panel) return;
    if (!_setupWired) {
      _setupWired = true;
      // 建完计划后 renderSetup 会把面板换成「今天」视图 —— 关掉它，把横幅改口成「继续学」。
      panel.addEventListener('click', (e) => {
        if (!e.target.closest('.ps-start')) return;
        setTimeout(() => { if (TASK.closePanel) TASK.closePanel(); if (_bannerEl && _bannerEl.isConnected) renderBanner(_bannerEl); }, 0);
      });
    }
  }
  function renderBanner(el) {
    if (!el) return;
    _bannerEl = el;
    const hasPlan = !!(typeof TASK !== 'undefined' && TASK.hasPlan);
    let main, go, sum = '';
    if (!hasPlan) {
      main = '还没有学习计划';
      go = '设置你每天的学习时间';
    } else {
      const s = (typeof TASK !== 'undefined' && TASK.todayStats) ? TASK.todayStats() : { streak: 0, graduated: 0, targetWords: 0, planned: 0, done: 0 };
      sum = `连续 ${s.streak} 天 · 已毕业 ${s.graduated} / ${s.targetWords} 词`;
      if (s.planned > 0 && s.done >= s.planned) {
        const extra = s.done - s.planned;
        main = extra > 0 ? `今天的量读完了 · 多读了 ${extra} 句` : '今天的量读完了';
      } else {
        const a = nextArticle();
        /* T4：文章名与「还剩」必须读同一篇。以前名字取 nextArticle()、句数取全局 todayStats，
           于是会写「继续学《第一篇》· 还剩 [全局] 句」。改成这一篇自己还没读过的句数
           （total - ever），与卡片进度同一个派生量。 */
        const x = articleStat(a);
        main = `继续学《${esc(SECTIONS[a].title)}》· 还剩 ${Math.max(1, x.total - x.ever)} 句`;
      }
      go = '继续学';
    }
    el.innerHTML = `<div class="hb-text"><span class="hb-main">${main}</span>` +
      (sum ? `<span class="hb-sum">${sum}</span>` : '') +
      `</div><button class="b-go" type="button">${go}</button>`;
    el.querySelector('.b-go').onclick = () => {
      if (!hasPlan) return openSetup();
      if (window.APP3.openArticle) return window.APP3.openArticle(nextArticle());
      if (typeof TASK !== 'undefined' && TASK.enterTaskMode) TASK.enterTaskMode();
    };
  }
  window.APP3 = Object.assign(window.APP3, { renderBanner });

  /* 点文章卡片 → 进这一篇的任务模式（M1 Task 5）。
     真正的切换在 TASK 里（只有它拿得到队列、currentChapter 与正文渲染），外壳这层
     只把「点了哪一篇」递过去 —— 这样 currentArticle 与队列仍只有一份实现。 */
  function openArticle(a) {
    if (typeof TASK === 'undefined' || !TASK.openArticle) return;
    TASK.openArticle(a);
  }
  /* 入口 2（§4.4）：首页卡片「答题」→ 直达该篇 ②。批次由 TASK.openArticleQuiz 现建，
     与「① 后进 ②」同源 —— 不要求先跑一遍 ①。 */
  function openQuiz(a) {
    if (typeof TASK === 'undefined' || !TASK.openArticleQuiz) return;
    TASK.openArticleQuiz(a);
  }
  window.APP3 = Object.assign(window.APP3, { openArticle, openQuiz });

  /* ---- ② 文内挖空 + 浮窗（M1 Task 6）----
     实现全在 TASK 里（只有它拿得到 quizList / 正文 .sent / 游标），外壳这层只把它挂到
     APP3 上，给外部与 Playwright 一个稳定出口，别在第二处重写一套。 */
  window.APP3 = Object.assign(window.APP3, {
    maskArticle: () => TASK.maskArticle(),
    openBlank: (bi) => TASK.openBlank(bi),
    nextBlank: () => TASK.nextBlank(),
    currentBlank: () => TASK.currentBlank(),
    closeBlankPop: () => TASK.closeBlankPop(),
  });

  window.APP3 = Object.assign(window.APP3, { route, current: () => cur });
  window.addEventListener('hashchange', route);
  document.addEventListener('DOMContentLoaded', route);
  route();
})();
