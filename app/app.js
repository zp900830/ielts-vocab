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
    const card = e.target.closest('.art-card');
    if (card && card.dataset.a != null) openArticle(Number(card.dataset.a));
  });

  /* ---- 3.0 首页：六张文章卡片（M1 Task 3） ----
     ROOT2 是 TASK IIFE 的内部状态，外壳读不到，只能经 TASK.state() / TASK.sentWordsOf 拿。
     熟练度这里**只算第一项**（通读完成度 × 40%）；② 正确率与精读次数在 Task 5/6 补，
     统一由 Task 7 收口 —— 别提前把另两项塞进来。 */
  function rel(ts) {                       // 相对时间，复用影子跟读口径
    if (!ts) return '还没学过';
    const d = Math.floor((Date.now() - ts) / 864e5);
    return d <= 0 ? '今天' : d === 1 ? '昨天' : d + ' 天前';
  }
  // 当前阶段的文案（§3.3 / §9.4）。M1 只有三档可达：未开始 / 通读中 / 已学完
  // （② 未上线，通读满即终态；`熟练` ≥80% 要等 Task 7 补齐另两项权重后才会出现）。
  const STAGE_LABEL = { todo: '未开始', reading: '通读中', read: '已学完', pro: '熟练' };
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
    // ② 正确率 / 精读次数：走事件流（M1 先只算通读完成度，② 与精读在 Task 5/6 补）
    const progress = total ? Math.round(Math.min(ever / total, 1) * 40) : 0;   // 只算 40% 那项
    const stage = ever === 0 ? 'todo' : (ever >= total ? 'read' : 'reading');
    let lastAt = 0; scope.forEach((i) => { const s = st.sents[i]; if (s && s.lastReadAt > lastAt) lastAt = s.lastReadAt; });
    // `total` = 句数（进度分母）；`wordTotal` = 词数（掌握分母，与 c.graduated 同单位）
    // `ever` = 这一篇里读过的句数 —— 横幅「还剩 N 句」与卡片进度共用这一份派生，别各算各的。
    return { progress, stage, grad: c.graduated, total, lastAt, wordTotal: words.size, ever };
  }
  function renderHome(view) {
    // 数据未就绪时先占位：initApp 拉完数据会再调一次 route()（见 app/index.html）。
    if (typeof dataReady === 'undefined' || !dataReady) {
      view.innerHTML = '<p class="sm">正在载入…</p>';
      return;
    }
    const cards = SECTIONS.map((s, a) => {
      const x = articleStat(a);
      return `<button class="art-card" data-a="${a}" data-stage="${x.stage}">
        <div class="a-head"><div class="a-title">${esc(s.title)}</div>
          <span class="a-stage">${STAGE_LABEL[x.stage] || '未开始'}</span></div>
        <div class="a-en">${esc((TIT_EN[s.title] || '').replace(/^\s*·\s*/, ''))}</div>
        <div class="a-bar"><i style="width:${x.progress}%"></i></div>
        <div class="a-meta"><span class="a-pct">${x.progress}%</span>
          <span>已毕业 ${x.grad} / ${x.wordTotal} 词</span>
          <span>${rel(x.lastAt)}</span></div>
      </button>`;
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
  // 该继续哪一篇：第一篇没「已学完」的；全读完就回到第一篇（M1 按篇队列 Task 5 才落地）。
  function nextArticle() {
    for (let a = 0; a < SECTIONS.length; a++) if (articleStat(a).stage !== 'read') return a;
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
  window.APP3 = Object.assign(window.APP3, { openArticle });

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
