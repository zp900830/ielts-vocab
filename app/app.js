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
    if (b) { location.hash = '#/' + b.dataset.route; }
  });
  window.addEventListener('hashchange', route);
  window.APP3 = Object.assign(window.APP3 || {}, { route, current: () => cur });
  document.addEventListener('DOMContentLoaded', route);
  route();
})();
