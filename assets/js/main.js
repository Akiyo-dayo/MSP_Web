/* ============================================================
   深空联合主题 · 站点公共脚本
   星野背景 / 抽屉 / 揭示动画 / 状态组件(含本地演示回退)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 常驻星野背景 ---------- */
  const sf = document.getElementById('starfield');
  if (sf) {
    const ctx = sf.getContext('2d');
    let W, H, stars = [];
    function resize() {
      W = sf.width = window.innerWidth;
      H = sf.height = window.innerHeight;
      stars = Array.from({ length: Math.floor(W * H / 9000) }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.3 + 0.3,
        tw: Math.random() * Math.PI * 2,
        sp: Math.random() * 0.12 + 0.03,
      }));
    }
    resize();
    window.addEventListener('resize', resize);
    (function loop(t) {
      ctx.clearRect(0, 0, W, H);
      const time = t / 1000;
      for (const s of stars) {
        s.y += s.sp;
        if (s.y > H + 2) { s.y = -2; s.x = Math.random() * W; }
        ctx.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(s.tw + time * 0.9));
        ctx.fillStyle = '#a8d8f8';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(loop);
    })(0);
  }

  /* ---------- 揭示动画 ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));

  /* ---------- 抽屉 ---------- */
  const drawer = document.getElementById('site-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    if (backdrop) {
      backdrop.hidden = false;
      backdrop.classList.toggle('open', open);
    }
    document.querySelectorAll('.side-drawer-trigger').forEach((b) =>
      b.setAttribute('aria-expanded', String(open)));
    document.body.style.overflow = open ? 'hidden' : '';
  }
  document.querySelectorAll('.side-drawer-trigger').forEach((b) =>
    b.addEventListener('click', () => setDrawer(true)));
  const closeBtn = document.getElementById('close-drawer');
  if (closeBtn) closeBtn.addEventListener('click', () => setDrawer(false));
  if (backdrop) backdrop.addEventListener('click', () => setDrawer(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setDrawer(false); });

  /* ---------- 返回顶部 ---------- */
  const btt = document.getElementById('back-to-top');
  if (btt) {
    window.addEventListener('scroll', () => {
      btt.classList.toggle('show', window.scrollY > 420);
    }, { passive: true });
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---------- Bot 状态（API 不可用时回退演示数据） ---------- */
  const isProd = window.location.hostname.includes('akiyo.fun');
  const API_BASE = isProd ? '/api/bot' : 'http://127.0.0.1:5001';

  const DEMO_ACCOUNTS = [
    { name: '小千·主节点', qq_number: '10001', status: 'ok', region: 'astr', last_unban_date: '2026-05-20' },
    { name: '小千·二号机', qq_number: '10002', status: 'ok', region: 'astr', last_unban_date: '2026-06-30' },
    { name: '小千·NA镜像', qq_number: '10003', status: 'temp', region: 'na', unban_date: '2026-08-02', note: '演示' },
  ];

  function fetchAccounts() {
    return fetch(`${API_BASE}/accounts`, { signal: AbortSignal.timeout(4500) })
      .then((r) => { if (!r.ok) throw new Error('bad'); return r.json(); })
      .then((d) => ({ accounts: Array.isArray(d) ? d : [], demo: false }))
      .catch(() => ({ accounts: DEMO_ACCOUNTS, demo: true }));
  }

  /* Hero 状态圆环 */
  const heroWidget = document.getElementById('hero-status-widget');
  if (heroWidget) {
    fetchAccounts().then(({ accounts, demo }) => {
      const total = accounts.length;
      const ok = accounts.filter((a) => a.status === 'ok').length;
      const ratio = total ? ok / total : 0;
      const circle = document.getElementById('hero-progress-circle');
      const text = document.getElementById('hero-status-ratio-circle');
      const desc = document.getElementById('hero-status-desc');
      const pills = document.getElementById('status-pills-row');
      if (text) text.textContent = `${ok} / ${total}`;
      if (circle) requestAnimationFrame(() => {
        circle.style.strokeDashoffset = String(264 * (1 - ratio));
        circle.style.stroke = ratio === 1 ? 'var(--aurora)' : 'var(--ice)';
      });
      if (desc) desc.textContent = demo
        ? '本地预览 · 演示数据（线上将同步真实状态）'
        : (ratio === 1 ? '全部节点频率稳定' : `${total - ok} 个节点异常`);
      if (pills) {
        pills.innerHTML = accounts.slice(0, 4).map((a) =>
          `<span class="status-pill ${a.status === 'ok' ? 'ok' : 'bad'}">${a.name || '节点'}</span>`).join('');
      }
    });
    const openDrawerStatus = document.getElementById('open-drawer-status');
    if (openDrawerStatus) openDrawerStatus.addEventListener('click', () => setDrawer(true));
  }

  /* 抽屉状态列表 */
  const drawerList = document.getElementById('drawer-status-list');
  if (drawerList) {
    fetchAccounts().then(({ accounts, demo }) => {
      const net = document.getElementById('drawer-network-status');
      const summary = document.getElementById('drawer-status-summary');
      const indicator = document.getElementById('status-indicator');
      const statusText = document.getElementById('status-text');
      const abnormal = accounts.filter((a) => a.status !== 'ok');

      /* 顶部状态指示器：同步真实结果，结束“频率检测中” */
      if (indicator && statusText) {
        indicator.classList.remove('status-checking', 'status-ok', 'status-bad');
        if (demo) {
          indicator.classList.add('status-ok');
          statusText.textContent = '演示模式 · 频率模拟中';
        } else if (abnormal.length === 0) {
          indicator.classList.add('status-ok');
          statusText.textContent = '频率稳定 · 全部节点在线';
        } else {
          indicator.classList.add('status-bad');
          statusText.textContent = `频率波动 · ${abnormal.length} 个节点异常`;
        }
      }

      if (net) net.textContent = demo ? 'MODE: LOCAL PREVIEW · 演示数据' : 'MODE: ONLINE';
      if (summary) summary.textContent = demo
        ? '线上环境将显示真实异常账号'
        : (abnormal.length ? `当前 ${abnormal.length} 个账号不可用` : '全部账号运行正常');
      drawerList.innerHTML = abnormal.length
        ? abnormal.map((a) => `
            <div class="drawer-status-item">
              <div class="st-name">${a.name || '未命名账号'}</div>
              <div class="st-info">QQ: ${a.qq_number || a.qq || '-'} · ${
                a.status === 'temp' ? '临时冻结' : a.status === 'offline' ? '离线' : '永久封禁'
              }</div>
            </div>`).join('')
        : '<div class="drawer-loading">✦ 频率稳定 · 无异常账号</div>';
    });

    /* 访问统计：生产环境先记录访问(POST /api/visit)，响应即最新统计；失败回退 GET /api/stats */
    const visitUrl = isProd ? '/api/visit' : 'http://127.0.0.1:5000/api/visit';
    const statsUrl = isProd ? '/api/stats' : 'http://127.0.0.1:5000/api/stats';
    const applyStats = (d) => {
      setText('total-visits', d.total_visits ?? d.totalVisits);
      setText('today-visits', d.today_visits ?? d.todayVisits);
      setText('total-users', d.total_users ?? d.totalUsers);
    };
    fetch(visitUrl, { method: 'POST', signal: AbortSignal.timeout(4000) })
      .then((r) => { if (!r.ok) throw new Error('bad'); return r.json(); })
      .then(applyStats)
      .catch(() => fetch(statsUrl, { signal: AbortSignal.timeout(4000) })
        .then((r) => r.json())
        .then(applyStats)
        .catch(() => {
          setText('total-visits', '--');
          setText('today-visits', '--');
          setText('total-users', '--');
        }));
    function setText(id, v) {
      const el = document.getElementById(id);
      if (el) el.textContent = v == null ? '--' : v;
    }
  }
})();
