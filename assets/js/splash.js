/* ============================================================
   深空联合 · 开屏启动序列
   星野跃迁 → 九星汇聚成徽 → 徽记故障闪烁 → 标题揭示
   ============================================================ */
(function () {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;

  const SKIPPED = sessionStorage.getItem('spacetrekSplashShown') &&
                  !new URLSearchParams(location.search).has('splash');
  if (SKIPPED) {
    splash.style.display = 'none';
    return;
  }

  document.body.style.overflow = 'hidden';

  const canvas = document.getElementById('splash-canvas');
  const ctx = canvas.getContext('2d');
  const bootEl = splash.querySelector('.splash-boot');
  const pctEl = splash.querySelector('.splash-progress .pct');
  const flashEl = splash.querySelector('.splash-flash');
  const coreEl = splash.querySelector('.splash-core');
  const emblemEl = splash.querySelector('.splash-emblem');
  const titleEl = splash.querySelector('.splash-title');

  let W = 0, H = 0, CX = 0, CY = 0, DPR = 1;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    CX = W / 2; CY = H / 2;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  /* ---------- 星野 ---------- */
  const STAR_COUNT = 240;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * 2 - 1,          // -1..1 (相对中心)
      y: Math.random() * 2 - 1,
      z: Math.random() * 0.9 + 0.1,      // 深度
      tw: Math.random() * Math.PI * 2,   // 闪烁相位
    });
  }

  /* ---------- 九星（从徽记原图连通域实测的精确星位） ---------- */
  const NINE_STARS = [
    { x: 0.870, y: -0.166, s: 1.01 }, { x: 0.872, y: 0.239, s: 1.01 }, { x: 0.721, y: 0.390, s: 1.01 },
    { x: 0.518, y: 0.443, s: 1.01 }, { x: 0.721, y: -0.316, s: 1.00 }, { x: 0.314, y: 0.387, s: 1.00 },
    { x: 0.926, y: 0.036, s: 1.00 }, { x: 0.312, y: -0.315, s: 0.99 }, { x: 0.520, y: -0.370, s: 0.99 },
  ].map((p, i) => ({
    ...p,
    sx: (Math.random() < 0.5 ? -1 : 1) * (0.9 + Math.random() * 0.7),  // 起点（屏外，归一化）
    sy: (Math.random() < 0.5 ? -1 : 1) * (0.9 + Math.random() * 0.7),
    delay: i * 0.09,
  }));

  /* 徽记真实位置（响应式，随窗口/设备宽度变化） */
  let emCache = null;
  function emblemGeom() {
    if (!emCache) {
      const r = emblemEl.getBoundingClientRect();
      emCache = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, half: r.width / 2 };
    }
    return emCache;
  }
  window.addEventListener('resize', () => { emCache = null; });

  /* ---------- 时间轴（秒） ---------- */
  const T = {
    bootEnd: 1.7,
    warpStart: 1.9,
    flashAt: 4.15,
    convergeStart: 4.25,
    convergeEnd: 5.7,
    coreAt: 5.85,
    hintAt: 7.0,
    autoEnd: 10.5,
  };

  const bootLines = [
    ['> SPACETREK COLLECTIVE // 深空联合 终端接入', 0.05],
    ['> 频率校准 ............ <span class="ok">OK</span>', 0.45],
    ['> 拉贝尔曲线同步 ...... <span class="ok">OK</span>', 0.85],
    ['> 星栈链路建立 ........ <span class="ok">LINKED</span>', 1.25],
    ['> 目的地: 拉海洛 · 月弦阁中继站', 1.55],
  ];
  let bootShown = 0;

  let start = null;
  let finished = false;
  let coreShown = false;
  let flashed = false;

  function ease(t) { return t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3); }

  function drawFourStar(x, y, r, alpha, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    const inner = r * 0.18;
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 2) * i;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.lineTo(Math.cos(a + Math.PI / 4) * inner, Math.sin(a + Math.PI / 4) * inner);
    }
    ctx.closePath();
    ctx.fillStyle = '#cfeeff';
    ctx.shadowColor = 'rgba(126,214,255,0.9)';
    ctx.shadowBlur = r * 1.6;
    ctx.fill();
    ctx.restore();
  }

  function frame(now) {
    if (finished) return;
    if (start === null) start = now;
    const t = (now - start) / 1000;

    ctx.clearRect(0, 0, W, H);

    /* 背景渐变 */
    const g = ctx.createRadialGradient(CX, CY * 0.9, 0, CX, CY, Math.max(W, H));
    g.addColorStop(0, '#081326');
    g.addColorStop(1, '#01040a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    /* 启动日志 */
    for (let i = bootShown; i < bootLines.length; i++) {
      if (t >= bootLines[i][1]) {
        bootEl.innerHTML += (bootShown ? '\n' : '') + bootLines[i][0];
        bootShown++;
      }
    }

    /* 进度百分比 */
    let pct;
    if (t < T.warpStart) pct = (t / T.warpStart) * 36;
    else if (t < T.flashAt) pct = 36 + ((t - T.warpStart) / (T.flashAt - T.warpStart)) * 46;
    else if (t < T.coreAt) pct = 82 + ((t - T.flashAt) / (T.coreAt - T.flashAt)) * 18;
    else pct = 100;
    pctEl.textContent = String(Math.min(100, Math.floor(pct))).padStart(3, '0') + '%';

    /* 跃迁系数 */
    let warp = 0;
    if (t >= T.warpStart && t < T.flashAt) {
      warp = ease((t - T.warpStart) / (T.flashAt - T.warpStart));
    }

    /* 星野 */
    const fadeOut = coreShown ? Math.max(0, 1 - (t - T.coreAt) * 1.4) : 1;
    for (const s of stars) {
      if (warp > 0) s.z -= 0.012 * (1 + warp * 14) * s.z;
      else s.z -= 0.0006;
      if (s.z <= 0.02) { s.z = 1; s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; }
      const px = CX + (s.x / s.z) * CX * 0.9;
      const py = CY + (s.y / s.z) * CY * 0.9;
      if (px < -50 || px > W + 50 || py < -50 || py > H + 50) continue;
      const size = Math.max(0.4, (1 - s.z) * 2.1);
      const twinkle = 0.55 + 0.45 * Math.sin(s.tw + t * 3);
      ctx.globalAlpha = twinkle * fadeOut * (warp > 0 ? Math.min(1, warp + 0.35) : 1);
      if (warp > 0.08) {
        /* 跃迁拖尾 */
        const tail = warp * 90 * (1 - s.z + 0.25);
        const dx = px - CX, dy = py - CY;
        const len = Math.hypot(dx, dy) || 1;
        ctx.strokeStyle = 'rgba(160,220,255,0.85)';
        ctx.lineWidth = size;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - (dx / len) * tail, py - (dy / len) * tail);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#bfe6ff';
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    /* 白闪 */
    if (!flashed && t >= T.flashAt) {
      flashed = true;
      flashEl.classList.add('flash');
    }

    /* 九星汇聚（终点对齐徽记真实星位，适配任意屏幕尺寸） */
    if (t >= T.convergeStart) {
      const g = emblemGeom();
      const spread = Math.max(W, H) * 0.75;
      const starBase = g.half * 0.055;
      for (const st of NINE_STARS) {
        const p = ease((t - T.convergeStart - st.delay) / (T.convergeEnd - T.convergeStart));
        if (p <= 0) continue;
        const x = g.cx + st.sx * (1 - p) * spread + st.x * p * g.half;
        const y = g.cy + st.sy * (1 - p) * spread + st.y * p * g.half;
        drawFourStar(x, y, st.s * starBase * (0.7 + 0.5 * p), Math.min(1, p * 2) * fadeOut, p * 0.6);
      }
      /* 星环绘制 */
      const ringP = ease((t - T.convergeStart - 0.3) / 1.1);
      if (ringP > 0) {
        ctx.save();
        ctx.globalAlpha = ringP * fadeOut;
        ctx.strokeStyle = 'rgba(126,214,255,0.75)';
        ctx.lineWidth = 1.4;
        ctx.shadowColor = 'rgba(126,214,255,0.8)';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(g.cx, g.cy, g.half * 1.28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ringP);
        ctx.stroke();
        ctx.restore();
      }
    }

    /* 核心（徽记+标题）揭示 */
    if (!coreShown && t >= T.coreAt) {
      coreShown = true;
      coreEl.classList.add('show');
      emblemEl.classList.add('glitch');
      titleEl.innerHTML = titleEl.textContent.trim().split('').map((c, i) =>
        `<span class="char" style="animation-delay:${0.12 * i}s">${c}</span>`).join('');
      bootEl.style.transition = 'opacity .8s'; bootEl.style.opacity = '0';
    }

    if (t >= T.hintAt) splash.classList.add('hint-on');
    if (t >= T.autoEnd) return finish();

    requestAnimationFrame(frame);
  }

  function finish() {
    if (finished) return;
    finished = true;
    sessionStorage.setItem('spacetrekSplashShown', '1');
    splash.classList.add('splash-done');
    document.body.style.overflow = '';
    setTimeout(() => { splash.style.display = 'none'; }, 1100);
  }

  splash.querySelector('.splash-skip').addEventListener('click', (e) => { e.stopPropagation(); finish(); });
  splash.addEventListener('click', () => { if (coreShown) finish(); });
  window.addEventListener('keydown', () => { if (coreShown) finish(); }, { once: false });

  requestAnimationFrame(frame);
})();
