(() => {
  const THEME_KEY = 'newSiteTheme';

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function calculateStableTime(dateStr) {
    if (!dateStr) return '刚刚';
    const start = new Date(dateStr);
    const now = new Date();
    const diffMs = now - start;

    if (Number.isNaN(start.getTime()) || diffMs < 0) return '刚刚';

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}天${hours}小时`;
    return `${hours}小时`;
  }

  function initTheme() {
    const toggle = document.getElementById('theme-toggle');
    const saved = localStorage.getItem(THEME_KEY);
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    const initial = saved || (prefersLight ? 'light' : 'dark');
    let isSwitchingTheme = false;

    const renderToggle = (isLight) => {
      if (!toggle) return;
      const icon = isLight ? '☀️' : '🌙';
      const label = isLight ? '浅色' : '深色';
      toggle.innerHTML = `<span class="theme-toggle-icon" aria-hidden="true">${icon}</span><span class="theme-toggle-label">${label}</span>`;
    };

    const applyTheme = (theme) => {
      const isLight = theme === 'light';
      document.body.classList.toggle('theme-light', isLight);
      document.body.classList.toggle('theme-dark', !isLight);
      document.documentElement.style.colorScheme = isLight ? 'light' : 'dark';
      renderToggle(isLight);
    };

    applyTheme(initial);

    if (toggle) {
      toggle.addEventListener('click', () => {
        if (isSwitchingTheme) return;
        const next = document.body.classList.contains('theme-light') ? 'dark' : 'light';
        isSwitchingTheme = true;
        document.body.classList.add('theme-switching');
        document.body.classList.add('theme-dissolve');
        toggle.classList.add('is-animating');

        const swapTheme = () => {
          localStorage.setItem(THEME_KEY, next);
          applyTheme(next);
        };

        requestAnimationFrame(() => {
          swapTheme();
        });

        window.setTimeout(() => {
          document.body.classList.remove('theme-dissolve');
          document.body.classList.remove('theme-switching');
          toggle.classList.remove('is-animating');
          isSwitchingTheme = false;
        }, 400);
      });
    }
  }

  function initNavTextGuard() {
    const path = (window.location.pathname || '').toLowerCase();
    if (path.endsWith('/guide.html') || path.endsWith('/status.html')) {
      return;
    }

    const navAnchors = document.querySelectorAll('.topbar .nav a');
    if (!navAnchors.length) return;

    const fallbackLabelByHref = [
      { match: 'guide.html', label: '功能' },
      { match: '#features', label: '功能' },
      { match: '#bot-intro', label: '说明' },
      { match: '#pricing', label: '价格' },
      { match: 'status.html', label: '状态' },
      { match: '#policy', label: '条例' },
      { match: '#contact', label: '联系' },
    ];

    navAnchors.forEach((anchor) => {
      const current = anchor.textContent ? anchor.textContent.trim() : '';
      if (current) return;

      const href = anchor.getAttribute('href') || '';
      const matched = fallbackLabelByHref.find((item) => href.includes(item.match));
      anchor.textContent = matched ? matched.label : '导航';
    });
  }

  function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    const syncState = () => {
      if (window.scrollY > 360) {
        btn.classList.add('show');
      } else {
        btn.classList.remove('show');
      }
    };

    window.addEventListener('scroll', syncState, { passive: true });
    syncState();

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function initStatusIndicator() {
    const indicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const totalVisitsEl = document.getElementById('total-visits');
    const todayVisitsEl = document.getElementById('today-visits');
    const totalUsersEl = document.getElementById('total-users');

    if (!indicator || !statusText) return;

    let API_BASE = '';
    if (window.location.hostname.includes('akiyo.fun')) {
      API_BASE = '/api';
    } else {
      API_BASE = 'http://127.0.0.1:5000/api';
    }

    const setState = (state) => {
      indicator.classList.remove('status-checking', 'status-online', 'status-offline');
      indicator.classList.add(state);
      if (state === 'status-online') statusText.textContent = '系统在线';
      if (state === 'status-offline') statusText.textContent = '系统离线';
      if (state === 'status-checking') statusText.textContent = '检测中...';
    };

    const fillStats = (data) => {
      if (totalVisitsEl) totalVisitsEl.textContent = data.total_visits ?? '--';
      if (todayVisitsEl) todayVisitsEl.textContent = data.today_visits ?? '--';
      if (totalUsersEl) totalUsersEl.textContent = data.total_users ?? '--';
    };

    setState('status-checking');

    fetch(`${API_BASE}/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((r) => {
        if (!r.ok) throw new Error('visit failed');
        return r.json();
      })
      .then((data) => {
        fillStats(data || {});
        setState('status-online');
      })
      .catch(() => {
        setState('status-offline');
        fillStats({});
      });
  }

  function initCustomScrollbar() {
    const existing = document.querySelector('.custom-scrollbar-track');
    if (existing) return;

    const track = document.createElement('div');
    track.className = 'custom-scrollbar-track';
    track.setAttribute('aria-hidden', 'true');

    const thumb = document.createElement('div');
    thumb.className = 'custom-scrollbar-thumb';
    track.appendChild(thumb);
    document.body.appendChild(track);

    const minThumb = 36;
    let dragging = false;
    let dragOffset = 0;
    let activePointerId = null;
    let dragMetrics = null;
    let rafId = 0;
    let pendingClientY = 0;

    const getMetrics = () => {
      const doc = document.documentElement;
      const viewport = window.innerHeight;
      const scrollHeight = Math.max(doc.scrollHeight, document.body.scrollHeight);
      const maxScroll = Math.max(0, scrollHeight - viewport);

      const trackRect = track.getBoundingClientRect();
      const trackHeight = trackRect.height;
      const thumbHeight = Math.max(minThumb, (viewport / scrollHeight) * trackHeight);
      const maxThumbTop = Math.max(0, trackHeight - thumbHeight);
      return { maxScroll, trackHeight, thumbHeight, maxThumbTop };
    };

    const syncThumb = () => {
      const { maxScroll, thumbHeight, maxThumbTop } = getMetrics();
      if (maxScroll <= 1) {
        track.classList.remove('visible');
        return;
      }
      track.classList.add('visible');
      const progress = window.scrollY / maxScroll;
      const thumbTop = progress * maxThumbTop;
      thumb.style.height = `${thumbHeight}px`;
      thumb.style.transform = `translateY(${thumbTop}px)`;
    };

    const scrollToThumb = (clientY, metrics = null) => {
      const rect = track.getBoundingClientRect();
      const { maxScroll, maxThumbTop } = metrics || getMetrics();
      if (maxScroll <= 0) return;

      const y = clientY - rect.top - dragOffset;
      const nextTop = Math.max(0, Math.min(maxThumbTop, y));
      const ratio = maxThumbTop > 0 ? nextTop / maxThumbTop : 0;
      window.scrollTo({ top: ratio * maxScroll, behavior: 'auto' });
    };

    track.addEventListener('pointerdown', (e) => {
      const thumbRect = thumb.getBoundingClientRect();
      dragOffset = thumbRect.height / 2;
      scrollToThumb(e.clientY);
      e.preventDefault();
    });

    window.addEventListener('resize', syncThumb);
    window.addEventListener('scroll', syncThumb, { passive: true });
    syncThumb();
  }

  function initReveal() {
    const revealNodes = document.querySelectorAll('[data-reveal]');

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            const animatedNode = entry.target.hasAttribute('data-animated') ? entry.target : entry.target.querySelector('[data-animated]');
            setTimeout(() => {
              entry.target.setAttribute('data-animated', 'true');
              if (animatedNode) {
                animatedNode.setAttribute('data-animated', 'true');
              }

              if (entry.target.classList.contains('card-grid-reveal')) {
                entry.target.classList.remove('card-grid-reveal', 'visible');
                entry.target.classList.add('is-ready');
              }
            }, 1200); // Wait for the initial staggered animations to finish
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.16,
        rootMargin: '0px 0px -8% 0px',
      }
    );

    revealNodes.forEach((node) => revealObserver.observe(node));

    const cleanupEntranceClass = () => {
      window.setTimeout(() => {
        document.querySelectorAll('.on-entrance').forEach((node) => {
          node.classList.remove('on-entrance');
        });
      }, 900);
    };

    if (document.readyState === 'complete') {
      cleanupEntranceClass();
    } else {
      window.addEventListener('load', cleanupEntranceClass, { once: true });
    }

    // For nav-items, set animated to true after initial animation
    const topbar = document.querySelector('.topbar[data-animated]');
    if (topbar) {
      setTimeout(() => {
        topbar.setAttribute('data-animated', 'true');
      }, 1200); // Wait for the slide-left-in animations
    }
  }

  function initDrawer() {
    const drawer = document.getElementById('site-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    const blurMask = document.getElementById('drawer-blur-mask');
    const openSideBtn = document.getElementById('side-drawer-trigger');
    const openSideBtnMobile = document.querySelector('.side-drawer-trigger-mobile');
    const openHeroBtn = document.getElementById('open-drawer-hero');
    const openStatusBtn = document.getElementById('open-drawer-status');
    const closeBtn = document.getElementById('close-drawer');

    if (!drawer || !backdrop || (!openSideBtn && !openSideBtnMobile) || !closeBtn) return;

    const setExpanded = (expanded) => {
      if (openSideBtn) openSideBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      if (openSideBtnMobile) openSideBtnMobile.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      if (openHeroBtn) {
        openHeroBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      }
    };

    const openDrawer = () => {
      backdrop.hidden = false;
      if (blurMask) blurMask.hidden = false;
      requestAnimationFrame(() => {
        backdrop.classList.add('show');
        if (blurMask) blurMask.classList.add('show');
        drawer.classList.add('open');
      });
      drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      setExpanded(true);
    };

    const closeDrawer = () => {
      backdrop.classList.remove('show');
      if (blurMask) blurMask.classList.remove('show');
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      setExpanded(false);
      document.body.style.overflow = '';
      setTimeout(() => {
        if (!drawer.classList.contains('open')) {
          backdrop.hidden = true;
          if (blurMask) blurMask.hidden = true;
        }
      }, 360);
    };

    if (openSideBtn) openSideBtn.addEventListener('click', openDrawer);
    if (openSideBtnMobile) openSideBtnMobile.addEventListener('click', openDrawer);
    if (openHeroBtn) openHeroBtn.addEventListener('click', openDrawer);
    const heroStatusWidget = document.getElementById('hero-status-widget');
    if (heroStatusWidget) {
      heroStatusWidget.style.cursor = 'pointer';
      heroStatusWidget.addEventListener('click', (e) => {
        if (e.target.closest('#open-drawer-status')) return;
        window.location.href = './status.html';
      });
    }
    if (openStatusBtn) openStatusBtn.addEventListener('click', openDrawer);
    closeBtn.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);
    if (blurMask) blurMask.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        closeDrawer();
      }
    });

    let API_BASE = '';
    if (window.location.hostname.includes('akiyo.fun')) {
      API_BASE = '/api/bot';
      const network = document.getElementById('drawer-network-status');
      if (network) network.textContent = 'Mode: Online';
    } else {
      API_BASE = 'http://127.0.0.1:5001';
      const network = document.getElementById('drawer-network-status');
      if (network) network.textContent = 'Mode: Local Debug';
    }

    const statusList = document.getElementById('drawer-status-list');
    const statusSummary = document.getElementById('drawer-status-summary');
    const statusPillsRow = document.getElementById('status-pills-row');
    const heroRatioCircle = document.getElementById('hero-status-ratio-circle');
    const heroProgressCircle = document.getElementById('hero-progress-circle');
    const heroDesc = document.getElementById('hero-status-desc');
    const apiUrl = `${API_BASE}/accounts`;
    const remoteTotalUrl = `${API_BASE}/remote_total`;

    const renderHeroRatio = (activeCount, totalLocalCount) => {
      if (!heroRatioCircle) return;
      heroRatioCircle.textContent = `${activeCount} / ${totalLocalCount}`;
    };

    if (heroRatioCircle) {
      heroRatioCircle.textContent = '-- / --';
    }
    if (statusPillsRow) {
      statusPillsRow.innerHTML = '';
    }

    fetch(apiUrl)
      .then((r) => r.json())
      .then((data) => {
        if (!statusList) return;
        statusList.innerHTML = '';

        if (!Array.isArray(data) || data.length === 0) {
          if (statusSummary) {
            statusSummary.textContent = '当前无可用统计数据';
          }
          statusList.innerHTML = '<div class="drawer-empty">暂无账号状态数据</div>';
          return;
        }

        const abnormalAccounts = data.filter((item) => item.status !== 'ok');
        const availableCount = data.length - abnormalAccounts.length;
        const totalCount = data.length;

        renderHeroRatio(availableCount, totalCount);
        if (statusPillsRow) {
          statusPillsRow.innerHTML = '';
        }

        fetch(remoteTotalUrl)
          .then((r) => r.json())
          .then((remoteData) => {
            if (!statusPillsRow) return;
            if (remoteData?.success === true && remoteData?.total != null) {
              statusPillsRow.innerHTML = `
                <span class="pill-item">🌐 总计 <b>${remoteData.total}</b></span>
              `;
              return;
            }
            statusPillsRow.innerHTML = '';
          })
          .catch(() => {
            if (!statusPillsRow) return;
            statusPillsRow.innerHTML = '';
          });

        if (heroProgressCircle) {
          const circumference = 2 * Math.PI * 42; // 263.89
          const percent = totalCount === 0 ? 0 : availableCount / totalCount;
          const offset = circumference - percent * circumference;
          heroProgressCircle.style.strokeDashoffset = offset;
          
          if (percent > 0.8) {
            heroProgressCircle.style.stroke = '#8fd1ff';
          } else if (percent > 0.5) {
            heroProgressCircle.style.stroke = '#f4c15d';
          } else {
            heroProgressCircle.style.stroke = '#ff8383';
          }
        }
        
        if (heroDesc) {
          heroDesc.textContent = abnormalAccounts.length
            ? `当前异常 ${abnormalAccounts.length} 个账号，点击查看`
            : '当前全部账号可正常使用。';
        }

        if (statusSummary) {
          statusSummary.textContent = `异常账号 ${abnormalAccounts.length} / 总账号 ${data.length}`;
        }

        if (abnormalAccounts.length === 0) {
          statusList.innerHTML = '<div class="drawer-empty">当前全部账号运行正常</div>';
          return;
        }

        const items = abnormalAccounts
          .map((item) => {
            const safeName = escapeHtml(item.name || '未命名账号');
            const safeQQ = escapeHtml(item.qq || '-');
            const safeNote = item.note ? `<span class="status-note">${escapeHtml(item.note)}</span>` : '';

            if (item.status === 'temp') {
              const unban = escapeHtml(item.unban_date || '待更新');
              return `
                <article class="status-item">
                  <div class="status-head">
                    <div>
                      <div class="status-name">${safeName}</div>
                      ${safeNote}
                    </div>
                    <span class="status-badge temp">⏳ 临时冻结</span>
                  </div>
                  <div class="status-qq">QQ: ${safeQQ}</div>
                  <div class="status-detail">📅 预计解封: ${unban}</div>
                </article>
              `;
            }

            if (item.status === 'offline') {
              return `
                <article class="status-item">
                  <div class="status-head">
                    <div>
                      <div class="status-name">${safeName}</div>
                      ${safeNote}
                    </div>
                    <span class="status-badge offline">⚫ 离线</span>
                  </div>
                  <div class="status-qq">QQ: ${safeQQ}</div>
                  <div class="status-detail">当前账号处于离线维护状态</div>
                </article>
              `;
            }

            return `
              <article class="status-item">
                <div class="status-head">
                  <div>
                    <div class="status-name">${safeName}</div>
                    ${safeNote}
                  </div>
                  <span class="status-badge ban">🚫 永久封禁</span>
                </div>
                <div class="status-qq">QQ: ${safeQQ}</div>
                <div class="status-detail">此账号已被永久停用</div>
              </article>
            `;
          })
          .join('');

        statusList.innerHTML = items;
      })
      .catch(() => {
        if (!statusList) return;
        if (heroRatioCircle) {
          heroRatioCircle.textContent = '-- / --';
        }
        if (heroProgressCircle) {
          heroProgressCircle.style.strokeDashoffset = 263.89;
          heroProgressCircle.style.stroke = '#ff8383';
        }
        if (heroDesc) {
          heroDesc.textContent = '状态服务连接失败，请稍后重试。';
        }
        if (statusPillsRow) {
          statusPillsRow.innerHTML = `
            <span class="pill-item">🟢 在线 <b>--</b></span>
            <span class="pill-item">🤖 公用 <b>--</b></span>
            <span class="pill-item">🌐 总计 <b>-</b></span>
          `;
        }
        if (statusSummary) {
          statusSummary.textContent = '状态服务不可达';
        }
        statusList.innerHTML = '<div class="drawer-error">状态数据加载失败，请稍后重试</div>';
      });
  }

  const splashScreen = document.getElementById('splash-screen');
  if (!splashScreen || sessionStorage.getItem('newSiteSplashShown')) {
    initNavTextGuard();
    initTheme();
    initBackToTop();
    initStatusIndicator();
    initCustomScrollbar();
    initDrawer();
    initReveal();
    return;
  }

  const minSplashTime = 1300;
  const splashStart = Date.now();

  const hideSplash = () => {
    splashScreen.classList.add('hidden');
    setTimeout(() => {
      splashScreen.style.display = 'none';
      sessionStorage.setItem('newSiteSplashShown', 'true');
      initNavTextGuard();
      initTheme();
      initBackToTop();
      initStatusIndicator();
      initCustomScrollbar();
      initDrawer();
      initReveal();
    }, 620);
  };

  window.addEventListener('load', () => {
    const elapsed = Date.now() - splashStart;
    const wait = Math.max(0, minSplashTime - elapsed);
    setTimeout(hideSplash, wait);
  });

  setTimeout(() => {
    if (!splashScreen.classList.contains('hidden')) {
      hideSplash();
    }
  }, 5000);
})();