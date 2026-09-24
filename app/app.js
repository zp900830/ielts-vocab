/* 3.0 外壳路由。#/home 与文章任务模式有内容；#/stats|#/words|#/listen 给「建设中」占位。
   「我的」不再是路由（用户 2026-09-24）：改成左下角常驻用户卡 + 向上弹出的浮窗，见文件末尾。 */
(function () {
  const ROUTES = ['home', 'stats', 'words', 'listen'];
  const TODO_META = {
    stats: ['学习数据', 'ri-bar-chart-2-line'],
    words: ['单词本', 'ri-book-2-line'],
    listen: ['随身听', 'ri-headphone-line'],
  };
  let cur = 'home';
  function route() {
    const h = (location.hash || '#/home').replace(/^#\//, '').split('/')[0];
    cur = ROUTES.includes(h) ? h : 'home';
    document.querySelectorAll('.sidenav .nav-item').forEach(b =>
      b.classList.toggle('on', b.dataset.route === cur));
    const view = document.getElementById('appView');
    if (cur === 'home' && window.APP3 && window.APP3.renderHome) { updateMeCard(); return window.APP3.renderHome(view); }
    if (cur === 'home') { view.innerHTML = '<p class="sm">正在载入…</p>'; return; }
    // W5-1：占位屏给像样的版式（居中、灰字、标题层级 + 图标），不再是裸 <h3>+<p>。
    const meta = TODO_META[cur];
    view.innerHTML = `<div class="app-todo"><div class="at-ico" aria-hidden="true"><i class="${meta[1]}"></i></div>` +
      `<h3>${meta[0]}</h3><p>这一屏在 3.0 的后续里程碑里交付 —— 先挑一篇文章，从头学到收工。</p></div>`;
  }
  document.addEventListener('click', (e) => {
    // 左下角用户卡：点它开/关「我的」浮窗（不是切页）。浮窗自己的按钮在 wireMePop 里代理。
    const me = e.target.closest('#meCard');
    if (me) { toggleMePop(); return; }
    const b = e.target.closest('.nav-item');
    if (b) { location.hash = '#/' + b.dataset.route; return; }
    // 卡片是 renderHome 每次重渲的，所以走事件代理而不是逐张绑。
    // 入口 2 的「答题」按钮与卡片里的 .a-open 是同级真按钮，必须先判「答题」——
    // 否则它会被卡片判定（.a-open 也在 .art-card 里）接走（§4.4）。
    const quiz = e.target.closest('.a-quiz');
    if (quiz && quiz.dataset.a != null) { openQuiz(Number(quiz.dataset.a)); return; }
    const card = e.target.closest('.art-card');
    if (card && card.dataset.a != null) openArticle(Number(card.dataset.a));
  });
  // W5-4：卡片不再是 role=button 的 div —— 打开正文交给内部的真按钮 .a-open，
  // Enter/Space 由浏览器原生派发 click，这里不再需要自己补键盘激活。

  /* ---- 3.0 首页：六张文章卡片（M1 Task 3） ----
     ROOT2 是 TASK IIFE 的内部状态，外壳读不到，只能经 TASK.state() / TASK.sentWordsOf 拿。
     熟练度按 §9.2 三项收口（Task 7）：通读完成度 ×40 + ② 正确率 ×35 + 精读重复度 ×25。 */
  function rel(ts) {                       // 相对时间，复用影子跟读口径
    if (!ts) return '还没学过';
    const d = Math.floor((Date.now() - ts) / 864e5);
    return d <= 0 ? '今天' : d === 1 ? '昨天' : d + ' 天前';
  }
  // 当前阶段的文案（§3.3 / §9.4）。通读满还没做题 = 「可答题」；`已学完` 留给"通读 + ② 各一遍"。
  // 2026-09-24 用户：圈号 ①/② 全部去掉 —— 阶段靠文字读，别只剩一个圈。
  const STAGE_LABEL = { todo: '未开始', reading: '通读中', read: '可答题',
                        quiz: '做题中', done: '已学完', pro: '熟练' };
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
    /* W8：`ever` 读的是 `lastReadAt > 0`（这辈子碰过这句，不是"今天读没读"），与 §9.4 的
       `everRead` 定义和任务条 ① 的分子同源；§9.3/§9.4 把通读完成度定义在"有没有碰过"上，
       改成"今天读过"会让跨天后卡片退回未读，与「已学完」判据打架。保留 lifetime。 */
    // W5-3：卡片胶囊与「答题」按钮口径一致 —— 只有「② 可答题（read）」与「② 做题（quiz）」
    // 才出「答题」入口；`已学完`/`熟练` 的卡片不再显示（免得与胶囊说的"已经完事儿了"打架）。
    const quizReady = stage === 'read' || stage === 'quiz';
    // `total` = 句数（进度分母）；`wordTotal` = 词数（掌握分母，与 c.graduated 同单位）
    // `ever` = 这一篇里读过的句数 —— 横幅「还剩 N 句」与卡片进度共用这一份派生，别各算各的。
    return { progress, stage, grad: c.graduated, total, lastAt, wordTotal: words.size, ever, quizReady };
  }
  function renderHome(view) {
    // 数据未就绪时先占位：initApp 拉完数据会再调一次 route()（见 app/index.html）。
    if (typeof dataReady === 'undefined' || !dataReady) {
      view.innerHTML = '<p class="sm">正在载入…</p>';
      return;
    }
    const cards = SECTIONS.map((s, a) => {
      const x = articleStat(a);
      // W5-4：卡片是容器；内部只放真按钮（.a-open 打开正文 / .a-quiz 直达 ②），不再互相嵌套。
      return `<article class="art-card" data-a="${a}" data-stage="${x.stage}">
        <button class="a-open" data-a="${a}" type="button" aria-label="进入《${esc(s.title)}》任务模式">
          <span class="a-head"><span class="a-title">${esc(s.title)}</span>
            <span class="a-stage">${STAGE_LABEL[x.stage] || '未开始'}</span></span>
          <span class="a-en">${esc((TIT_EN[s.title] || '').replace(/^\s*·\s*/, ''))}</span>
          <span class="a-bar"><i style="width:${x.progress}%"></i></span>
          <span class="a-meta"><span class="a-pct">${x.progress}%</span>
            <span>已毕业 ${x.grad} / ${x.wordTotal} 词</span>
            <span>${rel(x.lastAt)}</span></span>
        </button>
        ${x.quizReady ? `<button class="a-quiz" data-a="${a}" type="button">答题</button>` : ''}
      </article>`;
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
  // 该继续哪一篇：第一篇「还没通读完」的；六篇全读满返回 -1（W5-7：别假装回第 1 篇还有 1 句）。
  function nextArticle() {
    for (let a = 0; a < SECTIONS.length; a++) { const x = articleStat(a); if (x.ever < x.total) return a; }
    return -1;
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
    let main, go, sum = '', goWords = false;
    if (!hasPlan) {
      main = '还没有学习计划';
      go = '设置你每天的学习时间';
    } else {
      const s = (typeof TASK !== 'undefined' && TASK.todayStats) ? TASK.todayStats() : { streak: 0, graduated: 0, targetWords: 0, planned: 0, done: 0 };
      /* W5-2：刚建计划当天 streak=0，写「连续 0 天」像中断，改口「今天开始」；有天数才报连续。 */
      sum = (s.streak > 0 ? `连续 ${s.streak} 天` : '今天开始') +
            ` · 已毕业 ${s.graduated} / ${s.targetWords} 词`;
      const nextA = nextArticle();
      if (s.planned > 0 && s.done >= s.planned) {
        const extra = s.done - s.planned;
        main = extra > 0 ? `今天的量读完了 · 多读了 ${extra} 句` : '今天的量读完了';
      } else if (nextA < 0) {
        /* W5-7：六篇都读完了，别再返回第 1 篇说「继续学《地球与生命》· 还剩 1 句」这种假话。 */
        main = '六篇都读完了 · 去单词本复习一下';
        goWords = true;
      } else {
        /* T4：文章名与「还剩」必须读同一篇。以前名字取 nextArticle()、句数取全局 todayStats，
           于是会写「继续学《第一篇》· 还剩 [全局] 句」。改成这一篇自己还没读过的句数
           （total - ever），与卡片进度同一个派生量。 */
        const x = articleStat(nextA);
        main = `继续学《${esc(SECTIONS[nextA].title)}》· 还剩 ${Math.max(1, x.total - x.ever)} 句`;
      }
      go = goWords ? '看词本' : '继续学';
    }
    el.innerHTML = `<div class="hb-text"><span class="hb-main">${main}</span>` +
      (sum ? `<span class="hb-sum">${sum}</span>` : '') +
      `</div><button class="b-go" type="button"><i class="ri-play-fill" aria-hidden="true"></i>${go}</button>`;
    el.querySelector('.b-go').onclick = () => {
      if (!hasPlan) return openSetup();
      if (goWords) { location.hash = '#/words'; return; }
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

  /* ---- 左下角用户卡 + 「我的」浮窗（用户 2026-09-24）----
     「我的」从一级导航拿出来：桌面侧栏底部常驻一张用户卡，点它向上弹浮窗；手机端这张卡
     就是 TabBar 的第 5 格。浮窗内容按 PRD §8.1：账号 / 学习摘要 / 当前状态 / 数据管理 /
     主题（深浅色）/ 计划设置。深色开关从一级页面顶栏挪到这里（顶栏随之去掉）。 */
  function meAccount() {
    const mail = (typeof CLOUD !== 'undefined' && CLOUD._userMail) || '';
    return { mail, logged: !!mail, nickname: mail ? mail.split('@')[0] : '我的' };
  }
  function updateMeCard() {
    const card = document.getElementById('meCard');
    if (!card) return;
    const acc = meAccount();
    // 2026-09-24：未登录显示「登录」按钮（不是头像）；已登录显示头像 + 账号。
    card.innerHTML = acc.logged
      ? `<span class="me-avatar" aria-hidden="true"><i class="ri-user-3-fill"></i></span>`
        + `<span class="me-meta"><span class="me-name">${esc(acc.nickname)}</span><span class="me-tag">免费</span></span>`
      : `<span class="me-login">登录</span>`;
    card.setAttribute('aria-label', acc.logged ? `我的 · ${acc.nickname}` : '登录 / 我的');
  }
  function renderMePop() {
    const pop = document.getElementById('mePop');
    if (!pop) return;
    updateMeCard();
    const acc = meAccount();
    const s = (typeof TASK !== 'undefined' && TASK.todayStats) ? TASK.todayStats() : { streak: 0, graduated: 0, targetWords: 0 };
    const state = (typeof TASK !== 'undefined' && TASK.state) ? TASK.state() : null;
    const days = state && state.daily ? Object.keys(state.daily).length : 0;
    const cfg = (typeof TASK !== 'undefined' && TASK.planConfig) ? TASK.planConfig() : null;
    const hasPlan = !!(typeof TASK !== 'undefined' && TASK.hasPlan);
    const a = nextArticle();
    const focus = a >= 0 ? a : 0;
    const title = SECTIONS[focus] ? SECTIONS[focus].title : '';
    const planDay = cfg && cfg.startDate ? Math.floor((Date.now() - Date.parse(cfg.startDate)) / 864e5) + 1 : 1;
    const dark = document.body.classList.contains('dark');
    const MINS = [5, 10, 15, 20, 30, 45, 60];
    const BOUND = [[0, '0点'], [2, '2点'], [3, '3点'], [4, '4点'], [5, '5点'], [6, '6点']];
    pop.innerHTML = `
      <div class="mp-head">
        <span class="mp-avatar" aria-hidden="true"><i class="ri-user-3-fill"></i></span>
        <div class="mp-id"><div class="mp-name">${esc(acc.logged ? acc.nickname : '未登录')}</div>
          <div class="mp-sub">${esc(acc.logged ? acc.mail : '登录后跨设备同步')}</div></div>
        <span class="mp-badge">免费</span>
      </div>
      <button class="mp-cta" type="button" data-me-cta>${hasPlan ? `继续学《${esc(title)}》` : '设置学习计划'}</button>
      <div class="mp-card">
        <div class="mp-nums">
          <div><b>${days}</b><span>累计天数</span></div>
          <div><b>${s.streak}</b><span>连续天数</span></div>
          <div><b>${s.graduated}</b><span>已毕业词</span></div>
        </div>
        <div class="mp-status">${hasPlan ? `正在学《${esc(title)}》· 第 ${planDay} 天` : '还没有学习计划'}</div>
      </div>
      <div class="mp-list">
        <div class="mp-row"><span class="mp-label">口音</span>
          <button class="accent-btn" id="btnAccent" type="button" onclick="toggleAccent()" title="点击切换英式/美式" aria-label="切换英式美式发音">${accent === 'en-GB' ? '🇬🇧 英式' : '🇺🇸 美式'}</button></div>
        <div class="mp-row"><span class="mp-label">音色</span>
          <div class="voice-pick" id="voicePick">
            <button class="voice-btn" id="voiceBtn" type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="选择朗读音色" onclick="toggleVoicePop(event)">
              <span class="vb-label" id="voiceLabel">音色</span><i class="ri-arrow-down-s-line" aria-hidden="true"></i>
            </button>
            <div class="voice-pop" id="voicePop" role="listbox" aria-label="选择朗读音色" hidden></div>
          </div></div>
        <div class="mp-row"><span class="mp-label">深色模式</span>
          <button class="tr-msw${dark ? ' on' : ''}" type="button" role="switch" aria-checked="${dark}" data-me-theme aria-label="深色模式"><span class="knob" aria-hidden="true"></span></button></div>
        ${cfg ? `
        <div class="mp-row"><span class="mp-label">每天分钟数</span><div class="ps-opts">
          ${MINS.map(m => `<button class="ps-opt${m === cfg.minutes ? ' sel' : ''}" data-me-min="${m}">${m}</button>`).join('')}</div></div>
        <div class="mp-row"><span class="mp-label">几点换一天</span><div class="ps-opts">
          ${BOUND.map(o => `<button class="ps-opt${String(o[0]) === String(cfg.boundary) ? ' sel' : ''}" data-me-bound="${o[0]}">${o[1]}</button>`).join('')}</div></div>
        <div class="mp-row"><span class="mp-label">新词</span><div class="ps-opts">
          <button class="ps-opt${cfg.pausedNew ? '' : ' sel'}" data-me-new="0">正常</button>
          <button class="ps-opt${cfg.pausedNew ? ' sel' : ''}" data-me-new="1">只复习</button></div></div>` : ''}
        <div class="mp-row"><span class="mp-label">数据</span><div class="ps-opts">
          <button class="ps-opt" data-me-export>导出备份</button>
          <button class="ps-opt" data-me-import>导入恢复</button></div></div>
      </div>
      <div class="mp-foot">${acc.logged
        ? `<button class="mp-logout" type="button" data-me-logout>退出登录</button>`
        : `<div class="mp-login-form">
             <input id="meEmail" type="email" placeholder="邮箱" autocomplete="email" aria-label="邮箱">
             <input id="mePass" type="password" placeholder="密码" autocomplete="current-password" aria-label="密码">
             <div class="row"><button type="button" data-me-login>登录</button><button type="button" data-me-signup>注册</button></div>
           </div>`}</div>
      <input type="file" id="meImportFile" accept="application/json,.json" style="display:none">`;
    // 音色选择器（③ 挪进来）：重渲后 #voicePop 是新元素，要重新渲染 + 重新绑事件代理。
    try { if (typeof renderVoicePop === 'function') renderVoicePop(); } catch (e) {}
    wireVoicePop();
  }
  // 浮窗开在用户卡正上方（桌面 300px 宽；手机通栏 bottom-sheet），高度夹在卡片上沿以内。
  function positionMePop() {
    const pop = document.getElementById('mePop');
    const card = document.getElementById('meCard');
    if (!pop || !card) return;
    const r = card.getBoundingClientRect();
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    if (mobile) { pop.style.left = '8px'; pop.style.width = Math.max(200, window.innerWidth - 16) + 'px'; }
    else { pop.style.left = Math.max(8, r.left) + 'px'; pop.style.width = '300px'; }
    pop.style.top = 'auto';
    pop.style.bottom = Math.max(8, window.innerHeight - r.top + 8) + 'px';
    pop.style.maxHeight = Math.max(220, r.top - 16) + 'px';
  }
  function openMePop() {
    const pop = document.getElementById('mePop');
    if (!pop) return;
    renderMePop();
    pop.hidden = false;
    positionMePop();
    const card = document.getElementById('meCard');
    if (card) card.setAttribute('aria-expanded', 'true');
  }
  function closeMePop() {
    const pop = document.getElementById('mePop');
    if (pop) pop.hidden = true;
    const card = document.getElementById('meCard');
    if (card) card.setAttribute('aria-expanded', 'false');
  }
  function toggleMePop() {
    const pop = document.getElementById('mePop');
    if (pop && !pop.hidden) closeMePop(); else openMePop();
  }
  async function meLogin() { try { if (typeof cloudLogin === 'function') await cloudLogin({ email: 'meEmail', pass: 'mePass' }); } catch (e) {} renderMePop(); positionMePop(); }
  async function meSignup() { try { if (typeof cloudSignup === 'function') await cloudSignup({ email: 'meEmail', pass: 'mePass' }); } catch (e) {} }
  async function meLogout() { try { if (typeof cloudLogout === 'function') await cloudLogout(); } catch (e) {} renderMePop(); positionMePop(); }
  // 浮窗 innerHTML 每次重渲，逐颗绑会漏 → 用事件代理，只绑一次。
  function wireMePop() {
    const pop = document.getElementById('mePop');
    if (!pop || pop._wired) return;
    pop._wired = true;
    pop.addEventListener('click', (e) => {
      const t = e.target.closest('[data-me-cta],[data-me-theme],[data-me-min],[data-me-bound],[data-me-new],[data-me-export],[data-me-import],[data-me-login],[data-me-signup],[data-me-logout]');
      if (!t) return;
      // 有些按钮点完会 renderMePop() 重渲（主题/分钟/日界/新词）—— 重渲会把 e.target 从 DOM 摘下来，
      // 事件继续冒泡到 document 的「点外面收掉」监听时，target 已不在 #mePop 里，会被误判成点外面。
      // 所以这里先 stopPropagation，别让 document 那道再看到它。
      e.stopPropagation();
      if (t.hasAttribute('data-me-cta')) {
        closeMePop();
        if (typeof TASK !== 'undefined' && TASK.hasPlan) { const n = nextArticle(); openArticle(n >= 0 ? n : 0); }
        else openSetup();
      } else if (t.hasAttribute('data-me-theme')) { if (typeof toggleDark === 'function') toggleDark(); renderMePop(); }
      else if (t.hasAttribute('data-me-min')) { TASK.setMinutes(Number(t.dataset.meMin)); renderMePop(); positionMePop(); }
      else if (t.hasAttribute('data-me-bound')) { TASK.setBoundary(Number(t.dataset.meBound)); renderMePop(); }
      else if (t.hasAttribute('data-me-new')) { TASK.setPauseNew(t.dataset.meNew === '1'); renderMePop(); }
      else if (t.hasAttribute('data-me-export')) { TASK.exportBackup(); }
      else if (t.hasAttribute('data-me-import')) { TASK.importBackup('meImportFile'); }
      else if (t.hasAttribute('data-me-login')) { meLogin(); }
      else if (t.hasAttribute('data-me-signup')) { meSignup(); }
      else if (t.hasAttribute('data-me-logout')) { meLogout(); }
    });
  }
  window.APP3 = Object.assign(window.APP3, { renderMePop, openMePop, closeMePop, toggleMePop, meLogin, meLogout, updateMeCard });
  // 点浮窗外面收掉；Esc 也收。
  document.addEventListener('click', (e) => {
    const pop = document.getElementById('mePop');
    if (!pop || pop.hidden) return;
    if (!e.target.isConnected) return;   // 已被重渲摘下的节点，别当成「点外面」
    if (e.target.closest('#mePop') || e.target.closest('#meCard')) return;
    closeMePop();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMePop(); });
  window.addEventListener('resize', () => { const pop = document.getElementById('mePop'); if (pop && !pop.hidden) positionMePop(); });
  wireMePop();
  updateMeCard();
  setTimeout(updateMeCard, 1500);   // CLOUD.boot 异步恢复登录态：稍后把卡上昵称补一次

  window.APP3 = Object.assign(window.APP3, { route, current: () => cur });
  window.addEventListener('hashchange', route);
  document.addEventListener('DOMContentLoaded', route);
  route();
})();
