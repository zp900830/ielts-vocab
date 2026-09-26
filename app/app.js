/* 3.0 外壳路由。#/home（六张卡片）/ #/stats（学习数据页）/ #/words（单词本）/ #/listen（随身听）
   四个一级页都是真页（M4 起随身听落地）。
   「我的」不再是路由（用户 2026-09-24）：改成左下角常驻用户卡 + 向上弹出的浮窗，见文件末尾。 */
(function () {
  const ROUTES = ['home', 'stats', 'words', 'listen'];
  /* refine3 ⑦：「正在载入…」占位统一出口。薄荷绿三点轻脉冲（纯 CSS，见 index.html 的 .iel-loading），
     尊重 prefers-reduced-motion；role=status 让读屏知道在加载，而不是一片空白。 */
  function loadingHtml() {
    /* 情感化 loading（2026-09-26 用户）：单词卡小精灵（会眨眼轻跳）+ 拟人文案；reduced-motion 降级为静止 */
    return '<div class="iel-loading" role="status" aria-live="polite">'
      + '<span class="ld-buddy" aria-hidden="true"><span class="ld-card"><i class="ld-eye l"></i><i class="ld-eye r"></i><i class="ld-cheek l"></i><i class="ld-cheek r"></i><i class="ld-mouth"></i></span><span class="ld-shadow"></span></span>'
      + '<span class="ld-line"><span class="ld-msg">单词卡马上就来</span>'
      + '<span class="ld-dots" aria-hidden="true"><i></i><i></i><i></i></span></span></div>';
  }
  let cur = 'home';
  let _hlArticle = null;   // 数据页点文章小卡 → 回首页要高亮的那一篇（§5.4）
  /* ---- 3.0 单词本（M3，PRD §6）---- */
  const WB_FILTERS = ['all', 'todo', 'learning', 'mastered'];
  const WB_FILTER_LABEL = { all: '全部', todo: '待掌握', learning: '学习中', mastered: '已掌握' };
  const WORD_STAGE_LABEL = { fresh: '未见面', seen: '已见面', recognized: '文中可辨',
                             owned: '义项直连', graduated: '已毕业' };
  const W_BATCH = 60;              // 增量渲染每批行数
  let _wordIndex = null, _wordIndexOrder = null, _wordIndexFor = null;
  let _wordsShown = W_BATCH, _wordsFilter = null;
  function route() {
    const raw = (location.hash || '#/home').replace(/^#\//, '').split('/');
    const h = raw[0];
    cur = ROUTES.includes(h) ? h : 'home';
    // 离开随身听 → 播放不中断，交给右下角悬浮球继续控制（照搬主站 switchView 的口径）。
    // 只有「从没起播过」才会真正收掉随身听上下文（listenLeave 内部判断）。
    if (cur !== 'listen') { try { if (typeof TASK !== 'undefined' && TASK.listenLeave) TASK.listenLeave(); } catch (e) {} }
    if (cur !== 'home') _hlArticle = null;
    document.querySelectorAll('.sidenav .nav-item').forEach(b =>
      b.classList.toggle('on', b.dataset.route === cur));
    const view = document.getElementById('appView');
    if (cur === 'home' && window.APP3 && window.APP3.renderHome) { updateMeCard(); return window.APP3.renderHome(view); }
    if (cur === 'home') { view.innerHTML = loadingHtml(); return; }
    if (cur === 'stats' && window.APP3 && window.APP3.renderStats) return window.APP3.renderStats(view);
    if (cur === 'stats') { view.innerHTML = loadingHtml(); return; }
    if (cur === 'words' && window.APP3 && window.APP3.renderWords) return window.APP3.renderWords(view, raw[1] || 'all');
    if (cur === 'words') { view.innerHTML = loadingHtml(); return; }
    if (cur === 'listen' && window.APP3 && window.APP3.renderListen) return window.APP3.renderListen(view);
    if (cur === 'listen') { view.innerHTML = loadingHtml(); return; }
    // cur 只可能是 ROUTES 成员，这里只作兜底：回首页。
    return window.APP3.renderHome(view);
  }
  document.addEventListener('click', (e) => {
    // 左下角用户卡：点它开/关「我的」浮窗（不是切页）。浮窗自己的按钮在 wireMePop 里代理。
    const me = e.target.closest('#meCard');
    if (me) { toggleMePop(); return; }
    // 单词本：筛选 / 展开 / 重学 / 播放 / 加载更多（M3，都是每次重渲的节点，走事件代理）。
    const wf = e.target.closest('.wb-filter');
    if (wf) { location.hash = '#/words/' + wf.dataset.f; return; }
    const wrel = e.target.closest('.wd-relearn');
    if (wrel) { try { if (TASK.relearn) TASK.relearn(wrel.dataset.relearn); } catch (err) {} window.APP3.route(); return; }
    const wplay = e.target.closest('.wd-play');
    if (wplay) { playSentence(Number(wplay.dataset.a), Number(wplay.dataset.gi)); return; }
    const wrow = e.target.closest('.wb-row');
    if (wrow) { toggleWordRow(wrow); return; }
    const wm = e.target.closest('.wb-more');
    if (wm) { _wordsShown += W_BATCH; window.APP3.route(); return; }
    // 随身听卡片（M4，每次重渲的节点，走事件代理）
    // 2026-09-25：◀/▶ 改为句级（listenSentenceStep，与文章内 ←/→、播放条同一套 step 语义）；
    // ③ 未展开态移除 循环/AB/倍速/书签（只在展开态的全功能播放条里提供）；② 新增停止。
    const lsPlay = e.target.closest('.ls-play');
    if (lsPlay) { TASK.listenToggle(); return; }
    const lsPrev = e.target.closest('.ls-prev');
    if (lsPrev) { TASK.listenSentenceStep(-1); return; }
    const lsNext = e.target.closest('.ls-next');
    if (lsNext) { TASK.listenSentenceStep(1); return; }
    const lsStop = e.target.closest('.ls-stop');
    if (lsStop) { TASK.listenStop(); return; }
    const lsExp = e.target.closest('.ls-expand, .ls-cover');
    if (lsExp) { TASK.listenExpand(); return; }
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
  // 随身听位置条（M4 §7.2）：<input type=range> 松手才 seek（change，不是 input）
  // —— 拖动途中每条 input 都 playFrom 会把 TTS 反复 cancel 掉。
  document.addEventListener('change', (e) => {
    const sk = e.target && e.target.closest ? e.target.closest('.ls-seek') : null;
    if (sk && typeof TASK !== 'undefined' && TASK.listenSeek) TASK.listenSeek(Number(sk.value) - 1);
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
    /* §7.5：首页卡片「最近学习」也读随身听的最近收听（max(精读 lastReadAt, 收听 last)）。
       听不改 everRead/progress（§7.6），只让「最近」真实反映你刚听过。 */
    const llast = (typeof TASK !== 'undefined' && TASK.listenLast) ? TASK.listenLast(a) : 0;
    if (llast > lastAt) lastAt = llast;
    /* 展示口径（2026-09-26 用户「卡片上的进度对不上」）：卡片/数据页的百分比改用
       **通读完成度**（碰过的句数 ÷ 本篇句数）—— 与任务条「本篇 N/M」、正文里读了几句
       是同一个可核对的数。原来的 progress 是 §9.2 融合熟练度（通读×40+答题×35+重复×25），
       读了 20/339 句只显示 2%，跟用户在别处看到的对不上，只留给阶段判据用。
       同时带上「今天在这篇」的任务量（卡片要显示今日任务进度）。 */
    const readPct = total ? Math.round(Math.min(ever / total, 1) * 100) : 0;
    const td = (typeof TASK !== 'undefined' && TASK.todayOfArticle) ? TASK.todayOfArticle(a) : { planned: 0, done: 0 };
    /* W8：`ever` 读的是 `lastReadAt > 0`（这辈子碰过这句，不是"今天读没读"），与 §9.4 的
       `everRead` 定义和任务条 ① 的分子同源；§9.3/§9.4 把通读完成度定义在"有没有碰过"上，
       改成"今天读过"会让跨天后卡片退回未读，与「已学完」判据打架。保留 lifetime。 */
    // W5-3：卡片胶囊与「答题」按钮口径一致 —— 只有「② 可答题（read）」与「② 做题（quiz）」
    // 才出「答题」入口；`已学完`/`熟练` 的卡片不再显示（免得与胶囊说的"已经完事儿了"打架）。
    /* 2026-09-24 用户实测：今天把通读额度读满后（本篇 337/339、今天 180/180），回首页这张卡片
       既没有「答题」入口、胶囊还写「通读中」—— 而这一篇并不能凭"全篇读完"才进 ②。所以补一条
       **今天**口径的入口：今天额度读满 + 这一篇正是今天读的那篇 + 还没读完整篇 → 也给「答题」。
       它与 §9.4 的 stage（lifetime 派生）互不干扰：stage 与胶囊一个字不改，只在它之上补一颗按钮。 */
    const todayDone = (typeof TASK !== 'undefined' && TASK.todayQuotaDone) ? TASK.todayQuotaDone() : false;
    const todayA = (typeof TASK !== 'undefined' && TASK.todayArticle) ? TASK.todayArticle() : -1;
    const todayQuizReady = todayDone && todayA === a && ever > 0 && ever < total;
    const quizReady = stage === 'read' || stage === 'quiz' || todayQuizReady;
    // `total` = 句数（进度分母）；`wordTotal` = 词数（掌握分母，与 c.graduated 同单位）
    // `ever` = 这一篇里读过的句数 —— 横幅「还剩 N 句」与卡片进度共用这一份派生，别各算各的。
    return { progress, readPct, todayPlanned: td.planned, todayDone: td.done,
             stage, grad: c.graduated, total, lastAt, wordTotal: words.size, ever, quizReady };
  }
  function renderHome(view) {
    // 数据未就绪时先占位：initApp 拉完数据会再调一次 route()（见 app/index.html）。
    if (typeof dataReady === 'undefined' || !dataReady) {
      view.innerHTML = loadingHtml();
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
          <span class="a-bar"><i style="width:${x.readPct}%"></i></span>
          <span class="a-meta"><span class="a-pct">${x.readPct}%</span>
            <span>已毕业 ${x.grad} / ${x.wordTotal} 词</span>
            <span>${rel(x.lastAt)}</span></span>
          ${x.todayPlanned > 0 ? `<span class="a-today" title="今天这篇排到的句数">今天 ${x.todayDone}/${x.todayPlanned} 句</span>` : ''}
        </button>
        ${x.quizReady ? `<button class="a-quiz" data-a="${a}" type="button">答题</button>` : ''}
      </article>`;
    }).join('');
    view.innerHTML = `<h1 class="pg-title">首页</h1><div class="home-banner" id="homeBanner"></div><div class="art-grid">${cards}</div>`;
    // ⚠️ renderBanner 由 Task 4 定义；只跑 Task 3 时它还不存在 —— 必须守卫。
    if (window.APP3.renderBanner) window.APP3.renderBanner(document.getElementById('homeBanner'));
    // §5.4：数据页点了文章小卡 → 回首页把对应卡片高亮一下（不新开屏）。
    // 一次性提示：套上就清掉 _hlArticle，别让后续重渲（如进出任务模式时 exitTaskMode 会再调 route）
    // 又把同一张卡片套回来（评审 Minor：残留高亮）。
    if (_hlArticle != null) {
      const hl = _hlArticle; _hlArticle = null;
      const card = view.querySelector('.art-card[data-a="' + hl + '"]');
      if (card) { card.classList.add('hl'); try { card.scrollIntoView({ block: 'center' }); } catch (e) {} }
    }
  }
  window.APP3 = Object.assign(window.APP3 || {}, { renderHome, articleStat });

  /* ---- 3.0 学习数据页（M2，PRD §5）----
     四问四块（每块标题即问题）+ 单词掌握 + 随身听（M4 起接真数据，§5.7）+ 待加强。
     所有数字从既有 ROOT2 state 派生（§9.4），不新增存储字段。 */
  function renderStats(view) {
    if (typeof dataReady === 'undefined' || !dataReady) { view.innerHTML = loadingHtml(); return; }
    const hasPlan = !!(typeof TASK !== 'undefined' && TASK.hasPlan);
    if (!hasPlan) {
      // §5.2（2026-09-24 用户改口径）：一句话 + 一个按钮，点了打开「我的」浮窗；不内嵌计划表单。
      view.innerHTML = `<div class="st-empty-start">
        <h1>开始你的学习计划</h1>
        <p>学习数据会在你建立计划后出现在这里。每天读多久、新词开关都在「我的」里。</p>
        <button class="st-open-me" type="button">打开「我的」</button>
      </div>`;
      return;
    }
    const ov = statsOverview();
    const wd = statsWords();
    const ls = statsListen();
    const tips = statsTips();
    /* §5（2026-09-24 用户加）：一块「今天」——今日读了几句 / 今日学习时长 / 今天还剩多少。
       数字全部经 TASK.todayProgress() 取（与任务条辅行同一份派生），界面不自己数账。 */
    const tp = (typeof TASK !== 'undefined' && TASK.todayProgress)
      ? TASK.todayProgress() : { done: 0, planned: 0, left: 0, minutes: 0 };
    /* 今天的通读额度读满后，「今天」块给一个与首页卡片同一入口的「去答题」（§4.4 入口 1/2）——
       三处（卡片 / 今天块 / 待加强）指向同一篇、同一个 TASK.openArticleQuiz。 */
    const tqDone = (typeof TASK !== 'undefined' && TASK.todayQuotaDone) ? TASK.todayQuotaDone() : false;
    const tqArt = (typeof TASK !== 'undefined' && TASK.todayArticle) ? TASK.todayArticle() : -1;
    view.innerHTML = `<div class="stats-page">
      <h1 class="pg-title">学习数据</h1>
      <section class="st-block" data-block="today" aria-labelledby="stH0">
        <h2 id="stH0">今天</h2>
        <div class="st-nums" data-cols="3">
          <div class="st-num" data-k="today-sent"><b>${tp.done}</b><span>今日已读句数</span></div>
          <div class="st-num" data-k="today-min"><b>${tp.minutes}</b><span>今日学习时长（分钟）</span></div>
          <div class="st-num" data-k="today-left"><b>${tp.left}</b><span>今天还剩句数</span></div>
        </div>
        ${(tqDone && tqArt >= 0) ? `<button class="st-go" type="button" data-go="quiz" data-a="${tqArt}">去答题</button>` : ''}
      </section>
      <section class="st-block" data-block="overview" aria-labelledby="stH1">
        <h2 id="stH1">我最近学得怎么样？</h2>
        <div class="st-nums" data-cols="5">
          <div class="st-num" data-k="days"><b>${ov.days}</b><span>累计学习天数</span></div>
          <div class="st-num" data-k="minutes"><b>${ov.minutes}</b><span>累计学习时长（分钟）</span></div>
          <div class="st-num" data-k="streak"><b>${ov.streak}</b><span>连续学习天数</span></div>
          <div class="st-num" data-k="arts"><b>${ov.arts}</b><span>完成文章数</span></div>
          <div class="st-num" data-k="acts"><b>${ov.acts}</b><span>总学习次数</span></div>
        </div>
      </section>
      <section class="st-block" data-block="articles" aria-labelledby="stH2">
        <h2 id="stH2">我的文章掌握到了什么程度？</h2>
        <div class="st-arts">${SECTIONS.map((s, a) => {
          const x = articleStat(a);
          return `<button class="st-art" data-a="${a}" type="button" aria-label="《${esc(s.title)}》通读完成度 ${x.readPct}%，回首页看这张卡片">
            <span class="sa-head"><span class="sa-title">${esc(s.title)}</span><span class="sa-pct">${x.readPct}%</span></span>
            <span class="sa-bar"><i style="width:${x.readPct}%"></i></span>
            <span class="sa-meta">${STAGE_LABEL[x.stage] || '未开始'}</span>
          </button>`;
        }).join('')}</div>
      </section>
      <section class="st-block" data-block="words" aria-labelledby="stH3">
        <h2 id="stH3">我的单词掌握到了什么程度？</h2>
        <div class="st-nums" data-cols="4">
          <div class="st-num" data-k="learned"><b>${wd.learned}</b><span>已学习单词</span></div>
          <div class="st-num" data-k="grad"><b>${wd.grad}</b><span>已掌握（已毕业）</span></div>
          <div class="st-num" data-k="leech"><b>${wd.leech}</b><span>待巩固（重点词）</span></div>
          <div class="st-num" data-k="rate"><b>${wd.rate}%</b><span>掌握率</span></div>
        </div>
      </section>
      <section class="st-block" data-block="trend" aria-labelledby="stH4">
        <h2 id="stH4">我的学习是否持续？</h2>
        ${renderStatsTrend()}
      </section>
      <section class="st-block" data-block="listen" aria-labelledby="stH5">
        <h2 id="stH5">随身听</h2>
        <div class="st-nums" data-cols="3">
          <div class="st-num" data-k="listen-sents"><b>${ls.sents}</b><span>累计收听句数</span></div>
          <div class="st-num" data-k="listen-min"><b>${ls.minutes}</b><span>累计收听时长（分钟）</span></div>
          <div class="st-num" data-k="listen-last"><b>${ls.lastAt ? rel(ls.lastAt) : '—'}</b><span>最近收听</span></div>
        </div>
        <ul class="st-listen-arts" aria-label="各篇收听情况">${SECTIONS.map((s, a) => {
          const n = ls.byArticle[a] || 0, at = ls.last[a] || 0;
          return `<li class="st-la" data-a="${a}"><span class="sla-t">《${esc(s.title)}》</span>
            <span class="sla-n">收听 ${n} 句</span><span class="sla-at">${at ? rel(at) : '还没听过'}</span></li>`;
        }).join('')}</ul>
        <button class="st-go" type="button" data-go="listen">去随身听</button>
      </section>
      <section class="st-block" data-block="focus" aria-labelledby="stH6">
        <h2 id="stH6">哪些内容还需要加强？</h2>
        <ul class="st-tips">${tips.map((t) => `<li class="st-tip" data-tip="${t.kind}"${t.a != null ? ` data-a="${t.a}"` : ''}>
          <span class="tip-text">${t.text}</span>
          <button class="tip-go" type="button">${t.go}</button></li>`).join('')}</ul>
      </section>
    </div>`;
  }
  window.APP3 = Object.assign(window.APP3, { renderStats });
  /* §5.3 学习总览：累计天数 / 累计时长 / 连续天数 / 完成文章数 / 总学习次数。
     全部从日账与 articleStat 现算，不落盘。 */
  function statsOverview() {
    const st = (typeof TASK !== 'undefined' && TASK.state) ? TASK.state() : null;
    const daily = (st && st.daily) || {};
    const keys = Object.keys(daily);
    let minutes = 0, acts = 0;
    /* 累计学习时长 = 真实用时（TASK.readMsByDay 出口，2026-09-25 链路排查：以前按计划分钟数
       累加，计划 15 实读 3 也算 15，是假数）。有真实账的天用真实值，没有的旧天回退计划分钟数
       （不然升级后老用户的累计会一夜清零，看着像丢数据）。 */
    const real = (typeof TASK !== 'undefined' && TASK.readMsByDay) ? TASK.readMsByDay() : {};
    keys.forEach((k) => {
      const d = daily[k] || {};
      const realDay = real[k];
      minutes += (realDay != null && realDay > 0) ? Math.round(realDay / 60000) : (d.minutes || 0);
      acts += (d.sentDone || 0) + (d.quizDone || 0);
    });
    const ts = (typeof TASK !== 'undefined' && TASK.todayStats) ? TASK.todayStats() : { streak: 0 };
    let arts = 0;
    for (let a = 0; a < SECTIONS.length; a++) { const s = articleStat(a).stage; if (s === 'done' || s === 'pro') arts++; }
    return { days: keys.length, minutes: minutes, streak: ts.streak, arts: arts, acts: acts };
  }
  window.APP3 = Object.assign(window.APP3, { statsOverview });
  /* §5.5 单词掌握：已学习 / 已毕业 / 重点词 / 掌握率（已毕业 ÷ 目标词总数）。 */
  function statsWords() {
    const c = (typeof TASK !== 'undefined' && TASK.countStages) ? TASK.countStages() : { graduated: 0, leech: 0 };
    const st = (typeof TASK !== 'undefined' && TASK.state) ? TASK.state() : null;
    const learned = (st && st.words) ? Object.keys(st.words).length : 0;
    const total = (typeof TASK !== 'undefined' && TASK.todayStats) ? TASK.todayStats().targetWords : 0;
    return { learned: learned, grad: c.graduated, leech: c.leech, rate: total ? Math.round(c.graduated / total * 100) : 0, total: total };
  }
  window.APP3 = Object.assign(window.APP3, { statsWords });
  /* §5.7 随身听块：真数据（收听句数 / 收听时长 / 最近收听），与 TASK.listenStat 同源。
     不显示「收听掌握度」这类伪造指标 —— 听得多 ≠ 会，掌握看 §5.5 词状态。 */
  function statsListen() {
    const s = (typeof TASK !== 'undefined' && TASK.listenStat)
      ? TASK.listenStat() : { totalSents: 0, totalMs: 0, byArticle: {}, last: {} };
    let lastAt = 0;
    Object.keys(s.last || {}).forEach((a) => { if (s.last[a] > lastAt) lastAt = s.last[a]; });
    return { sents: s.totalSents, minutes: Math.round(s.totalMs / 60000), lastAt: lastAt,
             byArticle: s.byArticle || {}, last: s.last || {} };
  }
  window.APP3 = Object.assign(window.APP3, { statsListen });
  /* §5.6 学习趋势：近 14 天（含今天）的日账。柱 = 每日学习次数，线 = 每日分钟数。
     不引图表库 —— 14 个点手绘够了。 */
  function statsDays() {
    const st = (typeof TASK !== 'undefined' && TASK.state) ? TASK.state() : null;
    const cfg = (typeof TASK !== 'undefined' && TASK.planConfig) ? TASK.planConfig() : null;
    const b = (cfg && Number.isInteger(cfg.boundary)) ? cfg.boundary : 4;
    const daily = (st && st.daily) || {};
    const out = [];
    for (let k = 13; k >= 0; k--) {
      const key = window.ShadowPlan.dayKey(Date.now() - k * window.ShadowPlan.DAY_MS, b);
      const d = daily[key] || {};
      out.push({ key: key, sentDone: d.sentDone || 0, quizDone: d.quizDone || 0, minutes: d.minutes || 0 });
    }
    return out;
  }
  function renderStatsTrend() {
    const days = statsDays();
    const maxAct = Math.max(1, days.reduce((m, d) => Math.max(m, d.sentDone + d.quizDone), 0));
    const maxMin = Math.max(1, days.reduce((m, d) => Math.max(m, d.minutes), 0));
    const bars = days.map((d) => {
      const v = d.sentDone + d.quizDone;
      const h = v ? Math.max(4, Math.round(v / maxAct * 100)) : 0;
      return `<span class="tr-bar${v ? ' has' : ''}" style="height:${h}%" data-day="${d.key}" title="${d.key}：${v} 次"></span>`;
    }).join('');
    const W = 280, H = 60, n = days.length;
    const pt = (i) => ({ x: Math.round(i / (n - 1) * W), y: Math.round(H - days[i].minutes / maxMin * H) });
    const pts = days.map((_, i) => { const p = pt(i); return p.x + ',' + p.y; }).join(' ');
    /* 两个端点用 CSS 圆点，不用 SVG <circle>：SVG 走 preserveAspectRatio="none" 横向拉伸
       去对齐柱状图宽度，<circle> 在宽屏会被拉成椭圆（评审 Minor）。圆点 top% = 端点 y/H。 */
    const dot = (i) => `<span class="tr-dot" style="left:${i === 0 ? 0 : 100}%;top:${Math.round(pt(i).y / H * 100)}%"></span>`;
    const label = '近 14 天学习趋势：' + days.map((d) => `${d.key.slice(5)} 学 ${d.sentDone + d.quizDone} 次、${d.minutes} 分钟`).join('；');
    return `<div class="tr-wrap" role="img" aria-label="${esc(label)}">
      <div class="tr-bars">${bars}</div>
      <div class="tr-linewrap">
        <svg class="tr-line" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
          <polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        </svg>${dot(0)}${dot(n - 1)}
      </div>
      <div class="tr-legend"><span>柱 = 每日学习次数</span><span>线 = 每日学习时长</span></div>
    </div>`;
  }
  window.APP3 = Object.assign(window.APP3, { statsDays });
  /* §5.8「待加强」：2–3 条具体可点的建议（行动导向，不是数据堆砌）。
     A 已开始但没读完 / B 重点词今天到期 / C 久没学；不足 2 条时补「没开始的篇目」/「单词本」。 */
  function statsTips() {
    const tips = [];
    const now = Date.now();
    /* 今天额度读满、且今天读的那篇还没读完 → 建议改成「去答题」，指向与首页卡片、「今天」块
       同一个入口（TASK.openArticleQuiz）。没读满才维持原来的「继续读」。 */
    const tqDone = (typeof TASK !== 'undefined' && TASK.todayQuotaDone) ? TASK.todayQuotaDone() : false;
    const tqArt = (typeof TASK !== 'undefined' && TASK.todayArticle) ? TASK.todayArticle() : -1;
    const tqStat = (tqDone && tqArt >= 0) ? articleStat(tqArt) : null;
    if (tqStat && tqStat.ever > 0 && tqStat.ever < tqStat.total) {
      tips.push({ kind: 'quiz', a: tqArt, text: `《${esc(SECTIONS[tqArt].title)}》今天的通读做完了，去答题`, go: '去答题' });
    } else {
      for (let a = 0; a < SECTIONS.length; a++) {
        const x = articleStat(a);
        if (x.ever > 0 && x.ever < x.total) {
          tips.push({ kind: 'continue', a: a, text: `《${esc(SECTIONS[a].title)}》还差 ${x.total - x.ever} 句读完`, go: '继续' });
          break;
        }
      }
    }
    const st = (typeof TASK !== 'undefined' && TASK.state) ? TASK.state() : null;
    let leechDue = 0;
    if (st && st.words) Object.keys(st.words).forEach((k) => { const w = st.words[k]; if (w && w.leech && (w.due || 0) <= now) leechDue++; });
    if (leechDue > 0) tips.push({ kind: 'leech', text: `有 ${leechDue} 个重点词今天到期`, go: '去复习' });
    let stale = null;
    for (let a = 0; a < SECTIONS.length; a++) {
      const x = articleStat(a);
      if (x.lastAt > 0) {
        const d = Math.floor((now - x.lastAt) / 864e5);
        if (d >= 2 && (!stale || x.lastAt < stale.lastAt)) stale = { a: a, days: d, lastAt: x.lastAt };
      }
    }
    if (stale) tips.push({ kind: 'stale', a: stale.a, text: `已经 ${stale.days} 天没学《${esc(SECTIONS[stale.a].title)}》了`, go: '回去看看' });
    if (tips.length < 2) {
      let firstNew = -1, nNew = 0;
      for (let a = 0; a < SECTIONS.length; a++) { if (articleStat(a).ever === 0) { nNew++; if (firstNew < 0) firstNew = a; } }
      if (nNew > 0) tips.push({ kind: 'start', a: firstNew, text: `还有 ${nNew} 篇没开始`, go: '去首页' });
      if (tips.length < 2) tips.push({ kind: 'words', text: '去单词本按文章复习单词', go: '看词本' });
    }
    return tips.slice(0, 3);
  }
  window.APP3 = Object.assign(window.APP3, { statsTips });
  // §5.4：数据页点文章小卡 → 回首页并把那张卡片高亮（不新开屏/新浮层，§2.4 护栏）。
  function openHomeHighlight(a) {
    _hlArticle = a;
    if (location.hash === '#/home' || !location.hash) window.APP3.route();
    else location.hash = '#/home';
  }
  window.APP3 = Object.assign(window.APP3, { openHomeHighlight });

  // §6.5：词详情 → 回首页 → 进该篇任务模式 → 定位该句并播放。
  function playSentence(a, gi) {
    if (typeof TASK === 'undefined' || !TASK.playSentence) return;
    if (location.hash !== '#/home') location.hash = '#/home';
    TASK.playSentence(a, gi);
  }
  window.APP3 = Object.assign(window.APP3, { playSentence });

  /* ---- 3.0 随身听（M4，PRD §7）---- */
  // 该篇「最近收听」时间戳（账住 TASK 的 LS_ARTICLE.listen；Task 1 尚未实现时返回 0）。
  function listenLast(a) {
    return (typeof TASK !== 'undefined' && TASK.listenLast) ? TASK.listenLast(a) : 0;
  }
  // 默认播哪篇：最近在学的那篇（= 首页「最近学习」最大的那篇）；全没动过 → 第 1 篇。
  function listenDefaultArticle() {
    let best = 0, bestAt = -1;
    for (let a = 0; a < SECTIONS.length; a++) {
      const at = articleStat(a).lastAt || 0;   // articleStat 已含收听 last（§7.5）
      if (at > bestAt) { bestAt = at; best = a; }
    }
    return best;
  }
  // 篇内本地下标 → 段号 → 「卷」号（复用单词本的 volNo，同一判据）。
  function listenVolNo(a, idxLocal) {
    const paras = (SECTIONS[a] && SECTIONS[a].paragraphs) || [];
    let n = 0, pi = 0;
    for (let p = 0; p < paras.length; p++) {
      if (idxLocal < n + paras[p].length) { pi = p; break; }
      n += paras[p].length;
    }
    return (typeof volNo === 'function') ? volNo(a, pi) : 1;
  }
  function renderListen(view) {
    if (typeof dataReady === 'undefined' || !dataReady) { view.innerHTML = loadingHtml(); return; }
    const ctx = (typeof TASK !== 'undefined' && TASK.listenState) ? TASK.listenState() : null;
    const a = (ctx && ctx.a != null) ? ctx.a : listenDefaultArticle();
    if (typeof TASK !== 'undefined' && TASK.listenOpen) TASK.listenOpen(a);
    view.innerHTML = `<div class="listen-page">
      <h1 class="pg-title">随身听</h1>
      <div class="ls-card">
        <button class="ls-cover" type="button" aria-label="展开《${esc(SECTIONS[a].title)}》全文阅读">
          <span class="ls-disc" aria-hidden="true"><i class="ri-headphone-line"></i></span>
          <span class="ls-art">《${esc(SECTIONS[a].title)}》</span>
          <span class="ls-vol">第 ${listenVolNo(a, 0)} 卷</span>
          <span class="ls-now">—</span>
        </button>
        <div class="ls-main">
          <div class="ls-controls" role="group" aria-label="随身听播放控制">
            <button class="ls-prev" type="button" aria-label="上一句" title="上一句"><i class="ri-play-reverse-fill" aria-hidden="true"></i><span>上一句</span></button>
            <button class="ls-play" type="button" aria-label="播放"><i class="ri-play-fill" aria-hidden="true"></i><span>播放</span></button>
            <button class="ls-stop" type="button" aria-label="停止播放" title="停止（记住当前位置，下次继续）"><i class="ri-stop-fill" aria-hidden="true"></i><span>停止</span></button>
            <button class="ls-next" type="button" aria-label="下一句" title="下一句"><span>下一句</span><i class="ri-play-fill" aria-hidden="true"></i></button>
          </div>
          <input class="ls-seek" type="range" min="1" max="1" value="1" step="1" aria-label="句级位置条">
          <p class="ls-info">—</p>
          <button class="ls-expand" type="button" aria-label="展开全文阅读"><i class="ri-book-open-line" aria-hidden="true"></i><span>展开全文阅读</span></button>
        </div>
      </div>
    </div>`;
    updateListenCard();
  }
  // 就地刷新卡片（paint() 每次状态变化都调）：只改文本/属性，不重建 DOM，别抢焦点。
  function updateListenCard() {
    if (cur !== 'listen') return;
    const card = document.querySelector('.ls-card');
    if (!card) return;
    const ctx = (typeof TASK !== 'undefined' && TASK.listenState) ? TASK.listenState() : null;
    if (!ctx) return;
    const a = ctx.a != null ? ctx.a : 0;
    const total = Math.max(1, ctx.total || 0);
    const at = ctx.idx >= 0 ? ctx.idx : 0;
    const now = card.querySelector('.ls-now');
    if (now) now.textContent = ctx.idx >= 0 ? ctx.text : ('开始听《' + SECTIONS[a].title + '》');
    const play = card.querySelector('.ls-play');
    if (play) {
      play.innerHTML = ctx.playing
        ? '<i class="ri-pause-fill" aria-hidden="true"></i><span>暂停</span>'
        : '<i class="ri-play-fill" aria-hidden="true"></i><span>播放</span>';
      play.setAttribute('aria-label', ctx.playing ? '暂停' : '播放');
    }
    // 句级 ◀/▶ 的禁用态：与主站播放条一致（首句 ◀ 禁用 / 末句 ▶ 禁用；未起播 idx=-1 时 ◀ 禁用）
    const prev = card.querySelector('.ls-prev'), next = card.querySelector('.ls-next');
    if (prev) prev.disabled = at <= 0;
    if (next) next.disabled = at >= total - 1;
    const seek = card.querySelector('.ls-seek');
    if (seek) { seek.max = String(total); seek.value = String(at + 1); }
    const info = card.querySelector('.ls-info');
    if (info) info.textContent = `第 ${at + 1} / ${total} 句 · 还剩 ${Math.max(0, total - at - 1)} 句`;
    const art = card.querySelector('.ls-art');
    if (art) art.textContent = `《${SECTIONS[a].title}》`;
    const vol = card.querySelector('.ls-vol');
    if (vol) vol.textContent = `第 ${listenVolNo(a, at)} 卷`;
  }
  window.APP3 = Object.assign(window.APP3, { renderListen, updateListenCard });

  /* ---- 3.0 单词本（M3，PRD §6）----
     宇宙 = 文章标记里出现过的全部目标词（真实数据 3245）。索引一次建好、按 SECTIONS 缓存。 */
  function wordIndex() {
    if (_wordIndex && _wordIndexFor === SECTIONS) return _wordIndex;
    const idx = {}, order = [];
    for (let a = 0; a < SECTIONS.length; a++) {
      const scope = window.ShadowPlan.articleScope(SECTIONS, a);
      scope.forEach((gi) => {
        (TASK.sentWordsOf(gi) || []).forEach((w) => {
          let e = idx[w];
          if (!e) { e = idx[w] = { count: 0, sents: [] }; order.push(w); }
          e.count++; e.sents.push(gi);
        });
      });
    }
    _wordIndex = idx; _wordIndexOrder = order; _wordIndexFor = SECTIONS;
    return idx;
  }
  function wordIndexOrder() { wordIndex(); return _wordIndexOrder; }
  // 全局句号 → {a, pi, ti}
  function sentPos(gi) {
    let n = 0;
    for (let a = 0; a < SECTIONS.length; a++) {
      const paras = SECTIONS[a].paragraphs;
      for (let p = 0; p < paras.length; p++) {
        if (gi < n + paras[p].length) return { a: a, pi: p, ti: gi - n };
        n += paras[p].length;
      }
    }
    return { a: 0, pi: 0, ti: 0 };
  }
  // 段所属「卷」号（subheads 非空处 = 每卷第一段；§6.2 的「第 N 卷」）
  function volNo(a, pi) {
    const sh = (SECTIONS[a] && SECTIONS[a].subheads) || [];
    let v = 0;
    for (let k = 0; k <= pi && k < sh.length; k++) if (sh[k]) v++;
    return Math.max(1, v);
  }
  function volStartPara(a, pi) {
    const sh = (SECTIONS[a] && SECTIONS[a].subheads) || [];
    for (let k = Math.min(pi, sh.length - 1); k >= 0; k--) if (sh[k]) return k;
    return 0;
  }
  // 句在「本卷内」的序号（§6.4 的「第 K 句」）
  function sentNoInVol(a, pi, ti) {
    const start = volStartPara(a, pi);
    let n = 0;
    for (let k = start; k < pi; k++) n += SECTIONS[a].paragraphs[k].length;
    return n + ti + 1;
  }
  function wbStatus(w, st) {
    const s = st && st.words ? st.words[w] : null;
    if (!s) return { stage: 'fresh', leech: false, s: null };
    return { stage: s.stage || 'fresh', leech: !!s.leech, s: s };
  }
  // 四档判据（§6.3，唯一出口：筛选、计数、测试断言同源）
  function inFilter(w, st, filter) {
    if (filter === 'all') return true;
    const x = wbStatus(w, st);
    if (filter === 'todo') return x.stage === 'seen' || x.stage === 'recognized' || x.leech;
    if (filter === 'learning') return x.stage === 'owned';
    if (filter === 'mastered') return x.stage === 'graduated';
    return true;
  }
  function filterWords(filter, st) {
    return wordIndexOrder().filter((w) => inFilter(w, st, filter));
  }
  function countBucket(filter, st) {
    let n = 0;
    const order = wordIndexOrder();
    for (let i = 0; i < order.length; i++) if (inFilter(order[i], st, filter)) n++;
    return n;
  }
  function rowHtml(w, st) {
    const e = wordIndex()[w];
    const pos = sentPos(e.sents[0]);
    const a = pos.a;
    const meta = `${esc(SECTIONS[a].title)} · 第 ${volNo(a, pos.pi)} 卷 · 出现 ${e.count} 次`;
    const x = wbStatus(w, st);
    const pill = x.leech ? '重点词' : (WORD_STAGE_LABEL[x.stage] || '未见面');
    const pillCls = x.leech ? ' leech' : (' s-' + x.stage);
    const relt = (x.s && x.s.lastContactAt) ? rel(x.s.lastContactAt) : '还没学过';
    return `<li class="wb-item">
      <button class="wb-row" type="button" data-w="${esc(w)}" aria-expanded="false">
        <span class="wr-head"><span class="wr-word">${esc(w)}</span><span class="wr-pill${pillCls}">${pill}</span></span>
        <span class="wr-meta">${meta}</span>
        <span class="wr-meta2">${relt}</span>
      </button>
    </li>`;
  }
  function renderWords(view, filter) {
    if (typeof dataReady === 'undefined' || !dataReady) { view.innerHTML = loadingHtml(); return; }
    if (WB_FILTERS.indexOf(filter) < 0) filter = 'all';
    if (_wordsFilter !== filter) { _wordsFilter = filter; _wordsShown = W_BATCH; }
    const st = (typeof TASK !== 'undefined' && TASK.state) ? TASK.state() : null;
    const list = filterWords(filter, st);
    const shown = Math.min(_wordsShown, list.length);
    const filters = WB_FILTERS.map((f) =>
      `<button class="wb-filter" type="button" data-f="${f}" aria-pressed="${f === filter ? 'true' : 'false'}">`
      + `${WB_FILTER_LABEL[f]} <span class="wf-n">${countBucket(f, st)}</span></button>`).join('');
    const rows = list.slice(0, shown).map((w) => rowHtml(w, st)).join('');
    const more = shown < list.length
      ? `<button class="wb-more" type="button">加载更多（还剩 ${list.length - shown} 个）</button>` : '';
    view.innerHTML = `<div class="words-page">
      <h1 class="pg-title">单词本</h1>
      <div class="wb-filters" role="group" aria-label="按掌握状态筛选">${filters}</div>
      <p class="wb-hint">共 ${list.length} 个词${filter === 'all' ? '' : '（当前筛选）'} · 点词行看原文语境</p>
      <ul class="wb-list" aria-label="单词列表">${rows}</ul>
      ${more}
    </div>`;
  }
  window.APP3 = Object.assign(window.APP3, { renderWords });

  // 原文句里把目标词高亮（其它 [[词:形式]] 只留形式），其余文本转义
  function sentenceHtml(raw, word) {
    const re = /\[\[([^\]:]+):([^\]]+)\]\]/g;
    let out = '', last = 0, m;
    while ((m = re.exec(raw))) {
      out += esc(raw.slice(last, m.index));
      out += (String(m[1]).toLowerCase() === String(word).toLowerCase())
        ? '<b class="wd-hl">' + esc(m[2]) + '</b>' : esc(m[2]);
      last = re.lastIndex;
    }
    return out + esc(raw.slice(last));
  }
  function wordDetailHtml(w) {
    const e = wordIndex()[w];
    const st = (typeof TASK !== 'undefined' && TASK.state) ? TASK.state() : null;
    const x = wbStatus(w, st);
    const v = (typeof VOCAB !== 'undefined' && VOCAB[w]) || {};
    const p = String(v.p || v.us || v.uk || '').replace(/^\//, '').replace(/\/$/, '');
    const gi0 = e ? e.sents[0] : 0;
    const pos0 = sentPos(gi0);
    const a0 = pos0.a;
    const raw0 = (SECTIONS[a0] && SECTIONS[a0].paragraphs[pos0.pi] && SECTIONS[a0].paragraphs[pos0.pi][pos0.ti]) || '';
    const steps = ['seen', 'recognized', 'owned', 'graduated'].map((k) =>
      `<span class="wd-step${x.stage === k ? ' on' : ''}">${WORD_STAGE_LABEL[k]}</span>`)
      .join('<i class="wd-arrow" aria-hidden="true">→</i>');
    const ex = v.ex ? `<div class="wd-block"><h2>📝 例句 / 其他语境</h2>
        <p class="wd-ex">${esc(v.ex)}</p>${v.exZh ? `<p class="wd-exzh">${esc(v.exZh)}</p>` : ''}</div>` : '';
    return `<div class="wb-detail" role="region" aria-label="${esc(w)} 详情">
      <div class="wd-top"><span class="wd-word">${esc(w)}</span>
        <span class="wd-stage${x.leech ? ' leech' : ''}">${x.leech ? '重点词' : (WORD_STAGE_LABEL[x.stage] || '未见面')}</span>
        <button class="wd-relearn" type="button" data-relearn="${esc(w)}">重学</button></div>
      ${p ? `<div class="wd-phon">/${esc(p)}/</div>` : ''}
      <div class="wd-mean">${esc(v.m || '（词库中无此词条）')}</div>
      <div class="wd-block"><h2>📖 原文语境</h2>
        <p class="wd-ctx">${sentenceHtml(raw0, w)}</p>
        <p class="wd-src">—— 《${esc(SECTIONS[a0].title)}》第 ${volNo(a0, pos0.pi)} 卷 · 第 ${sentNoInVol(a0, pos0.pi, pos0.ti)} 句</p>
        <button class="wd-play" type="button" data-a="${a0}" data-gi="${gi0}">▶ 播放这句</button></div>
      ${ex}
      <div class="wd-block"><h2>学习状态</h2>
        <div class="wd-path">${steps}</div>
        <p class="wd-stat">接触 ${x.s ? (x.s.reps || 0) : 0} 次 · ② 答对 ${x.s ? (x.s.ok3 || 0) : 0} 次 · ${x.s && x.s.err ? '错误 ' + x.s.err + ' 次' : '无错误'}</p></div>
    </div>`;
  }
  function toggleWordRow(row) {
    const item = row.closest('.wb-item');
    if (!item) return;
    const wasOpen = item.classList.contains('open');
    const list = row.closest('.wb-list');
    if (list) list.querySelectorAll('.wb-item.open').forEach((li) => {
      li.classList.remove('open');
      const dd = li.querySelector('.wb-detail'); if (dd) dd.remove();
      const bb = li.querySelector('.wb-row'); if (bb) bb.setAttribute('aria-expanded', 'false');
    });
    if (wasOpen) return;
    item.classList.add('open');
    row.setAttribute('aria-expanded', 'true');
    const wrap = document.createElement('div');
    wrap.innerHTML = wordDetailHtml(row.dataset.w);
    item.appendChild(wrap.firstElementChild);
  }

  // 数据页的点击（按钮是每次重渲的，走事件代理，只绑一次）
  document.addEventListener('click', (e) => {
    if (e.target.closest('.st-open-me')) { openMePop(); return; }
    const art = e.target.closest('.st-art');
    if (art && art.dataset.a != null) { openHomeHighlight(Number(art.dataset.a)); return; }
    const go = e.target.closest('.st-go, .tip-go');
    if (go) {
      const tip = go.closest('.st-tip');
      const kind = tip ? tip.dataset.tip : go.dataset.go;
      if (kind === 'leech') { location.hash = '#/words/todo'; return; }
      if (kind === 'words') { location.hash = '#/words'; return; }
      if (kind === 'listen') { location.hash = '#/listen'; return; }
      const a = tip && tip.dataset.a != null ? Number(tip.dataset.a)
              : (go.dataset.a != null ? Number(go.dataset.a) : 0);
      /* 「去答题」（今天块 / 待加强）与首页卡片「答题」同一入口：直达该篇 ②。 */
      if (kind === 'quiz') { openQuiz(a); return; }
      openHomeHighlight(a);
    }
  });

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
      /* refine3 ⑤：底部续读条删掉后，「今天还剩 N 句 / 今天覆盖 K 词」这两个原本只有它说的数
         改由首页横幅承接（与任务条辅行、数据页「今天」块同源：TASK.todayProgress / todayCoverWords）。 */
      const tp = (typeof TASK !== 'undefined' && TASK.todayProgress) ? TASK.todayProgress() : null;
      const cover = (typeof TASK !== 'undefined' && TASK.todayCoverWords) ? TASK.todayCoverWords() : 0;
      const nextA0 = nextArticle();
      /* 上次学习位置（2026-09-26 用户：记住的学习位置要在首页顶部的卡片里显示）：
         存档位置属于「继续学」的那一篇时，主行报「上次读到第 X 句」，今天还剩句数并入辅行。 */
      const lastPos = (nextA0 >= 0 && typeof TASK !== 'undefined' && TASK.savedPosForArticle)
        ? TASK.savedPosForArticle(nextA0) : -1;
      const leftToday = tp ? tp.left : 0;
      /* W5-2：刚建计划当天 streak=0，写「连续 0 天」像中断，改口「今天开始」；有天数才报连续。 */
      sum = (s.streak > 0 ? `连续 ${s.streak} 天` : '今天开始') +
            (lastPos >= 0 ? ` · 今天还剩 ${leftToday} 句` : '') +
            ` · 今天覆盖 ${cover} 词 · 已毕业 ${s.graduated} / ${s.targetWords} 词`;
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
        /* 「还剩」用**今天**这本题的剩量（tp.left），不是文章未读总量 —— 续读条删掉后，
           用户需要一眼看到「今天还要读几句」（与任务条辅行、数据页今天块同一个数）；
           文章级未读（x.total - x.ever）留给卡片进度条。tp 取不到时退回文章口径。
           2026-09-26 用户：有记忆位置时报位置（还剩句数已挪到辅行）。 */
        main = lastPos >= 0
          ? `继续学《${esc(SECTIONS[nextA].title)}》· 上次读到第 ${lastPos + 1} 句`
          : `继续学《${esc(SECTIONS[nextA].title)}》· 今天还剩 ${tp ? tp.left : Math.max(1, x.total - x.ever)} 句`;
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
        + `<span class="me-meta"><span class="me-name">${esc(acc.nickname)}</span></span>`
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
    /* 档位（2026-09-26 用户）：加 90/120、去 10/20；选完立刻在下方给出工期（与设置屏同一份估算） */
    const MINS = [5, 15, 30, 45, 60, 90, 120];
    pop.innerHTML = `
      <div class="mp-head">
        <span class="mp-avatar" aria-hidden="true"><i class="ri-user-3-fill"></i></span>
        <div class="mp-id"><div class="mp-name">${esc(acc.logged ? acc.nickname : '未登录')}</div>
          <div class="mp-sub">${esc(acc.logged ? acc.mail : '登录后跨设备同步')}</div></div>
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
        <div class="mp-eta" id="mpEta" role="status">工期算一下…</div>
        <div class="mp-row"><span class="mp-label">新词</span><div class="ps-opts">
          <button class="ps-opt${cfg.pausedNew ? '' : ' sel'}" data-me-new="0">正常</button>
          <button class="ps-opt${cfg.pausedNew ? ' sel' : ''}" data-me-new="1">只复习</button></div></div>
        <div class="mp-row"><button class="link-danger" type="button" data-me-reset-plan aria-label="重置学习计划，只重设计划、保留进度">重置学习计划</button></div>` : ''}
        <div class="mp-row"><span class="mp-label">数据</span><div class="ps-opts">
          <button class="ps-opt" data-me-export>导出备份</button>
          <button class="ps-opt" data-me-import>导入恢复</button></div></div>
      </div>
      <div class="mp-foot">${acc.logged
        ? `<button class="mp-logout" type="button" data-me-logout>退出登录</button>`
        : `<form class="mp-login-form" data-me-form>
             <input id="meEmail" type="email" placeholder="邮箱" autocomplete="email" aria-label="邮箱">
             <input id="mePass" type="password" placeholder="密码" autocomplete="current-password" aria-label="密码">
             <div class="row"><button type="submit" data-me-login>登录</button><button type="button" data-me-signup>注册</button></div>
           </form>`}</div>
      <input type="file" id="meImportFile" accept="application/json,.json" style="display:none">`;
    // 音色选择器（③ 挪进来）：重渲后 #voicePop 是新元素，要重新渲染 + 重新绑事件代理。
    try { if (typeof renderVoicePop === 'function') renderVoicePop(); } catch (e) {}
    wireVoicePop();
    // 工期行（2026-09-26 用户）：换分钟数/重开浮窗都要刷新 —— 与设置屏同一份估算
    refreshMeEta();
    // §10.4：重渲把原焦点节点摘掉（activeElement 掉到 body）—— 浮窗若还开着，把焦点收回浮窗。
    if (!pop.hidden && (document.activeElement === document.body || !pop.contains(document.activeElement))) {
      pop.tabIndex = -1;
      try { pop.focus(); } catch (e) {}
    }
  }
  /* 工期行（2026-09-26 用户拍板）：「我的」里改每天分钟数也要能看到「新词全部过完一遍（需要 N 天）」
     —— 与设置屏/计划页同一份 estimateDays 估算（TASK.etaFor/etaText 出口）。 */
  function refreshMeEta() {
    const el = document.getElementById('mpEta');
    if (!el) return;
    const cfg = (typeof TASK !== 'undefined' && TASK.planConfig) ? TASK.planConfig() : null;
    if (!cfg) { el.textContent = ''; el.hidden = true; return; }
    const m = cfg.minutes;
    el.hidden = false;
    el.textContent = '工期算一下…';
    TASK.etaFor(m).then((r) => {
      if (!el.isConnected) return;
      el.textContent = '按每天 ' + m + ' 分钟：新词全部过完一遍（需要 ' + (r && r.days ? r.days + ' 天' : '更久') + '）';
    });
  }
  /* 浮窗开在用户卡正上方（桌面 360px 宽，2026-09-26 用户加宽；手机通栏 bottom-sheet），
     高度夹在卡片上沿以内。 */
  function positionMePop() {
    const pop = document.getElementById('mePop');
    const card = document.getElementById('meCard');
    if (!pop || !card) return;
    const r = card.getBoundingClientRect();
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    if (mobile) { pop.style.left = '8px'; pop.style.width = Math.max(200, window.innerWidth - 16) + 'px'; }
    else { pop.style.left = Math.max(8, r.left) + 'px'; pop.style.width = '360px'; }
    pop.style.top = 'auto';
    pop.style.bottom = Math.max(8, window.innerHeight - r.top + 8) + 'px';
    pop.style.maxHeight = Math.max(220, r.top - 16) + 'px';
  }
  function openMePop() {
    const pop = document.getElementById('mePop');
    if (!pop) return;
    renderMePop();
    pop.hidden = false;
    pop.setAttribute('aria-modal', 'true');
    positionMePop();
    const card = document.getElementById('meCard');
    if (card) card.setAttribute('aria-expanded', 'true');
    // §10.4：打开即把焦点送进浮窗（键盘用户不必从头 Tab 到它）。
    pop.tabIndex = -1;
    try { pop.focus(); } catch (e) {}
  }
  function closeMePop() {
    const pop = document.getElementById('mePop');
    const wasOpen = !!pop && !pop.hidden;
    if (pop) pop.hidden = true;
    const card = document.getElementById('meCard');
    if (card) card.setAttribute('aria-expanded', 'false');
    // §10.4：关闭把焦点归还触发它的「我的」一行，别让键盘焦点掉到 body。
    if (wasOpen && card) { try { card.focus(); } catch (e) {} }
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
      const t = e.target.closest('[data-me-cta],[data-me-theme],[data-me-min],[data-me-new],[data-me-reset-plan],[data-me-export],[data-me-import],[data-me-signup],[data-me-logout]');
      if (!t) return;
      // 有些按钮点完会 renderMePop() 重渲（主题/分钟/新词）—— 重渲会把 e.target 从 DOM 摘下来，
      // 事件继续冒泡到 document 的「点外面收掉」监听时，target 已不在 #mePop 里，会被误判成点外面。
      // 所以这里先 stopPropagation，别让 document 那道再看到它。
      e.stopPropagation();
      if (t.hasAttribute('data-me-cta')) {
        closeMePop();
        if (typeof TASK !== 'undefined' && TASK.hasPlan) { const n = nextArticle(); openArticle(n >= 0 ? n : 0); }
        else openSetup();
      } else if (t.hasAttribute('data-me-theme')) { if (typeof toggleDark === 'function') toggleDark(); renderMePop(); }
      else if (t.hasAttribute('data-me-min')) { TASK.setMinutes(Number(t.dataset.meMin)); renderMePop(); positionMePop(); refreshMeEta(); }
      else if (t.hasAttribute('data-me-new')) { TASK.setPauseNew(t.dataset.meNew === '1'); renderMePop(); }
      else if (t.hasAttribute('data-me-reset-plan')) { TASK.resetLearningPlan(); renderMePop(); positionMePop(); }
      else if (t.hasAttribute('data-me-export')) { TASK.exportBackup(); }
      else if (t.hasAttribute('data-me-import')) { TASK.importBackup('meImportFile'); }
      else if (t.hasAttribute('data-me-signup')) { meSignup(); }
      else if (t.hasAttribute('data-me-logout')) { meLogout(); }
    });
    // 登录走 <form> 提交：点「登录」（type=submit）与在输入框里按 Enter 是同一条路（§10.4 键盘可达）。
    pop.addEventListener('submit', (e) => {
      const form = e.target.closest('[data-me-form]');
      if (!form) return;
      e.preventDefault();
      e.stopPropagation();
      meLogin();
    });
    // §10.4：Tab 在浮窗内收敛，别让键盘焦点逃到背景里的侧栏/正文。
    pop.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const nodes = Array.prototype.filter.call(
        pop.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
        (el) => !el.disabled && el.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === pop)) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });
  }
  window.APP3 = Object.assign(window.APP3, { renderMePop, openMePop, closeMePop, toggleMePop, meLogin, meLogout, meSignup, updateMeCard });
  // 点浮窗外面收掉；Esc 也收。
  document.addEventListener('click', (e) => {
    const pop = document.getElementById('mePop');
    if (!pop || pop.hidden) return;
    if (!e.target.isConnected) return;   // 已被重渲摘下的节点，别当成「点外面」
    if (e.target.closest('#mePop') || e.target.closest('#meCard') || e.target.closest('.st-open-me')) return;
    closeMePop();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMePop(); });
  window.addEventListener('resize', () => { const pop = document.getElementById('mePop'); if (pop && !pop.hidden) positionMePop(); });
  wireMePop();
  updateMeCard();
  setTimeout(updateMeCard, 1500);   // CLOUD.boot 异步恢复登录态：稍后把卡上昵称补一次

  /* ---- 3.0 随身听悬浮球（切 tab 续播）----
     照搬主站 index.html 的 #lsFab：随身听在播/暂停时离开 #/listen → 右下角浮出玻璃胶囊，
     封面点回随身听、暂停/继续、停止。出现/消失判据与主站一致：
     有篇目 && (playing || 暂停态) && 不在随身听页 && 不在展开态 && 不在任务模式（阅读页等价物）。 */
  function ensureListenMini() {
    let el = document.getElementById('lsMini');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'lsMini';
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', '随身听悬浮控制');
    el.innerHTML =
      '<button class="ls-mini-btn" id="lsMiniPlay" type="button" aria-label="播放"><i class="ri-play-fill" aria-hidden="true"></i></button>' +
      '<button class="ls-mini-btn" id="lsMiniStop" type="button" aria-label="停止播放"><i class="ri-stop-fill" aria-hidden="true"></i></button>' +
      '<button class="ls-mini-cover" id="lsMiniCover" type="button" aria-label="回到随身听" title="回到随身听">' +
        '<span class="ls-mini-vol" id="lsMiniVol"></span>' +
        '<span class="ls-mini-letter" id="lsMiniLetter">🎧</span>' +
      '</button>';
    document.body.appendChild(el);
    el.querySelector('#lsMiniCover').addEventListener('click', () => { location.hash = '#/listen'; });
    el.querySelector('#lsMiniPlay').addEventListener('click', () => { try { TASK.listenToggle(); } catch (e) {} updateListenFab(); });
    el.querySelector('#lsMiniStop').addEventListener('click', () => { try { TASK.listenMiniStop(); } catch (e) {} updateListenFab(); });
    return el;
  }
  // 与底部 TabBar / 「今天 N 句」任务条互斥定位：谁在屏幕上，就浮到谁上面（都不许压住）。
  function positionListenMini() {
    const el = document.getElementById('lsMini');
    if (!el) return;
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    const nav = document.querySelector('.sidenav');
    let bottom = mobile ? ((nav ? nav.offsetHeight : 56) + 12) : 24;
    const bar = document.getElementById('taskBar');
    if (bar && bar.classList.contains('show') && getComputedStyle(bar).display !== 'none') {
      /* 按条子【真实的顶边】让位，别写死 bottom:12 —— M6 N1 起手机续读条会抬到 TabBar 之上
         （bottom 不再是 12），写死 12 会让悬浮球正好压在续读条上。 */
      const r = bar.getBoundingClientRect();
      if (r.height > 0) bottom = Math.max(bottom, (window.innerHeight - r.top) + 12);
    }
    el.style.bottom = bottom + 'px';
  }
  function listenMiniActive() {
    if (typeof TASK === 'undefined' || !TASK.listenState) return false;
    let st = null;
    try { st = TASK.listenState(); } catch (e) { return false; }
    if (!st || !st.ctx) return false;
    if (cur === 'listen') return false;              // 随身听页：卡片本身就是控制面（2026-09-25 用户再确认）
    if (st.expanded) return false;                   // 展开全屏：底部播放条在管
    if (document.body.classList.contains('task-mode')) return false;   // 阅读页等价物
    // ⑤（2026-09-25）：照搬主站 playing||paused —— 暂停算 active（悬浮球留着），
    // 只有「停止」把 active 清掉（媒体链停 + 复位），悬浮球才消失。
    return !!(st.playing || st.active);
  }
  function updateListenFab() {
    const el = ensureListenMini();
    positionListenMini();
    const on = listenMiniActive();
    el.classList.toggle('on', on);
    if (!on) return;
    let st = null;
    try { st = TASK.listenState(); } catch (e) { return; }
    el.classList.toggle('playing', !!st.playing);
    const play = document.getElementById('lsMiniPlay');
    if (play) {
      play.innerHTML = st.playing ? '<i class="ri-pause-fill" aria-hidden="true"></i>' : '<i class="ri-play-fill" aria-hidden="true"></i>';
      play.setAttribute('aria-label', st.playing ? '暂停' : '播放');
    }
    const a = (st.a != null) ? st.a : 0;
    const vol = document.getElementById('lsMiniVol');
    if (vol) vol.textContent = '第 ' + listenVolNo(a, st.idx >= 0 ? st.idx : 0) + ' 卷';
    const title = (SECTIONS[a] && SECTIONS[a].title) || '';
    const letter = document.getElementById('lsMiniLetter');
    if (letter) letter.textContent = title.trim().charAt(0).toUpperCase() || '🎧';
    const cover = document.getElementById('lsMiniCover');
    if (cover) cover.title = title ? ('回到随身听 · 《' + title + '》') : '回到随身听';
  }
  window.addEventListener('resize', () => { try { positionListenMini(); } catch (e) {} });
  window.APP3 = Object.assign(window.APP3, { updateListenFab });

  window.APP3 = Object.assign(window.APP3, { route, current: () => cur });
  window.addEventListener('hashchange', () => { route(); try { updateListenFab(); } catch (e) {} });
  document.addEventListener('DOMContentLoaded', () => { route(); try { updateListenFab(); } catch (e) {} });
  route();
})();
