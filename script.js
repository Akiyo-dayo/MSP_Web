document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    // --- Mobile Navigation Logic ---
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            document.body.classList.toggle('nav-open');
        });
    }

    if (navLinks) {
        navLinks.addEventListener('click', () => {
            document.body.classList.remove('nav-open');
        });
    }

    // --- Join group CTA (open QQ invite) ---
    const joinCta = document.getElementById('join-cta');
    if (joinCta) {
        joinCta.addEventListener('click', (e) => {
            e.preventDefault();
            // Replace the URL below with your actual QQ group invite link (e.g. https://qm.qq.com/cgi-bin/qm/qr?k=YOUR_KEY)
            const qqInviteUrl = 'https://qm.qq.com/q/c5vmQFB7Ko';
            // Try opening in a new tab/window. On mobile, QQ may intercept and open the app if installed.
            window.open(qqInviteUrl, '_blank');
            // Optionally, you can also navigate directly: window.location.href = qqInviteUrl;
        });
    }

    // --- Support CTA (same as join group) ---
    const supportCta = document.getElementById('support-cta');
    if (supportCta) {
        supportCta.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'NachoMc/donate.html';
        });
    }

    // --- 访问统计功能 ---
    let API_BASE_URL = '';

    // 1. 判断当前是在 线上域名 还是 本地开发
    if (window.location.hostname.includes('akiyo.fun')) {
        // 线上环境：使用相对路径，让 Nginx 处理 /api/
        API_BASE_URL = '/api'; 
        console.log('Mode: Production (Nginx)');
    } else {
        // 本地环境：强制连本地 Python (端口 5000)
        API_BASE_URL = 'http://127.0.0.1:5000/api';
        console.log('Mode: Local Debug (Port 5000)');
    }
    
    // 更新系统状态显示
    function updateSystemStatus(status) {
        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        
        if (!statusIndicator || !statusText) return;
        
        // 移除所有状态类
        statusIndicator.classList.remove('status-checking', 'status-online', 'status-offline');
        
        // 添加对应的状态类和文字
        switch(status) {
            case 'checking':
                statusIndicator.classList.add('status-checking');
                statusText.textContent = '检测中...';
                break;
            case 'online':
                statusIndicator.classList.add('status-online');
                statusText.textContent = '系统在线';
                break;
            case 'offline':
                statusIndicator.classList.add('status-offline');
                statusText.textContent = '系统离线';
                break;
        }
    }
    
    // 设置加载状态
    function setLoadingState(isLoading) {
        const totalVisitsEl = document.getElementById('total-visits');
        const todayVisitsEl = document.getElementById('today-visits');
        const totalUsersEl = document.getElementById('total-users');
        
        if (totalVisitsEl && todayVisitsEl) {
            if (isLoading) {
                totalVisitsEl.classList.add('loading');
                todayVisitsEl.classList.add('loading');
                if (totalUsersEl) totalUsersEl.classList.add('loading');
            } else {
                totalVisitsEl.classList.remove('loading');
                todayVisitsEl.classList.remove('loading');
                if (totalUsersEl) totalUsersEl.classList.remove('loading');
            }
        }
    }
    
    // 记录本次访问
    async function recordVisit() {
        updateSystemStatus('checking');
        setLoadingState(true);
        
        try {
            const response = await fetch(`${API_BASE_URL}/visit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                updateStatsDisplay(data);
                updateSystemStatus('online');
            } else {
                throw new Error('请求失败');
            }
        } catch (error) {
            console.log('无法连接到统计服务器，显示离线状态');
            updateSystemStatus('offline');
            updateStatsDisplay({ total_visits: '---', today_visits: '---', total_users: '---' });
        } finally {
            setLoadingState(false);
        }
    }
    
    // 更新统计数据显示
    function updateStatsDisplay(data) {
        const totalVisitsEl = document.getElementById('total-visits');
        const todayVisitsEl = document.getElementById('today-visits');
        const totalUsersEl = document.getElementById('total-users');
        
        if (totalVisitsEl && todayVisitsEl) {
            // 添加数字动画效果
            totalVisitsEl.style.opacity = '0';
            todayVisitsEl.style.opacity = '0';
            if (totalUsersEl) totalUsersEl.style.opacity = '0';
            
            setTimeout(() => {
                totalVisitsEl.textContent = data.total_visits;
                todayVisitsEl.textContent = data.today_visits;
                // Ensure total_users is displayed, fallback to 0 if undefined
                if (totalUsersEl) totalUsersEl.textContent = (data.total_users !== undefined) ? data.total_users : 0;
                
                totalVisitsEl.style.transition = 'opacity 0.3s ease';
                todayVisitsEl.style.transition = 'opacity 0.3s ease';
                totalVisitsEl.style.opacity = '1';
                todayVisitsEl.style.opacity = '1';
                
                if (totalUsersEl) {
                    totalUsersEl.style.transition = 'opacity 0.3s ease';
                    totalUsersEl.style.opacity = '1';
                }
            }, 150);
        }
    }
    
    // 定期更新统计数据（每30秒）
    async function refreshStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/stats`);
            if (response.ok) {
                const data = await response.json();
                updateStatsDisplay(data);
                updateSystemStatus('online');
            } else {
                throw new Error('请求失败');
            }
        } catch (error) {
            console.log('统计数据更新失败');
            updateSystemStatus('offline');
        }
    }
    
    // 页面加载时记录访问
    recordVisit();
    
    // 每30秒刷新一次统计数据
    setInterval(refreshStats, 30000);

    // ---------- Fix anchor offset for fixed header & back-to-top button ----------
    // Set CSS variable --header-height to actual header height so CSS can offset anchors
    function updateHeaderHeightCSSVar() {
        const header = document.querySelector('header');
        const headerHeight = header ? header.offsetHeight : 72;
        document.documentElement.style.setProperty('--header-height', headerHeight + 'px');
    }

    // Initialize and update on resize
    updateHeaderHeightCSSVar();
    window.addEventListener('resize', updateHeaderHeightCSSVar);

    // Back-to-top button behavior
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        function checkScrollForTopBtn() {
            if (window.scrollY > 200) backToTopBtn.classList.add('visible');
            else backToTopBtn.classList.remove('visible');
        }

        checkScrollForTopBtn();
        window.addEventListener('scroll', checkScrollForTopBtn);

        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- Scroll Reveal Animation ---
    const revealObserverOptions = {
        threshold: 0.1, // Trigger when 10% of the element is visible (more sensitive)
        rootMargin: "0px 0px -20px 0px" // Trigger slightly earlier before it's fully in view
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        // Filter intersecting entries
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        
        // Sort by DOM order to ensure sequential animation (top to bottom)
        visibleEntries.sort((a, b) => {
            return (a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1;
        });

        // Apply staggered animation
        visibleEntries.forEach((entry, index) => {
            setTimeout(() => {
                entry.target.classList.add('active');
                
                // Cleanup animation classes after transition finishes to restore original hover effects
                // This ensures that the slow transition of the reveal animation doesn't persist
                setTimeout(() => {
                    entry.target.classList.remove('reveal', 'active');
                }, 1000); // Wait slightly longer than the 0.8s transition
                
            }, index * 150); // 150ms delay between each item in the batch
            observer.unobserve(entry.target);
        });
    }, revealObserverOptions);

    // Function to initialize scroll reveal
    function initScrollReveal() {
        // Select elements to animate
        // Note: We animate .highlight items individually, so we don't animate the .highlights container to avoid double-fading.
        // Added .plugin-category to the list for guide page animation
        const revealElements = document.querySelectorAll('.hero, .card, .highlight, .plugin-category');
        revealElements.forEach(el => {
            el.classList.add('reveal'); // Add initial hidden state
            revealObserver.observe(el);
        });
    }

    // Image overlay (lightbox) handlers for buttons with class 'show-image-btn'
    const imageOverlay = document.createElement('div');
    imageOverlay.id = 'image-overlay';
    imageOverlay.innerHTML = `
        <div class="overlay-inner"><img src="" alt="Preview"></div>
        <button class="overlay-close">关闭</button>
    `;
    document.body.appendChild(imageOverlay);

    const overlayImg = imageOverlay.querySelector('img');
    const overlayClose = imageOverlay.querySelector('.overlay-close');

    function showImageOverlay(src) {
        overlayImg.src = src;
        imageOverlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    function hideImageOverlay() {
        imageOverlay.classList.remove('visible');
        document.body.style.overflow = '';
        overlayImg.src = '';
    }

    overlayClose.addEventListener('click', hideImageOverlay);
    overlayImg.addEventListener('click', hideImageOverlay);
    imageOverlay.addEventListener('click', (e) => {
        if (e.target === imageOverlay) hideImageOverlay();
    });

    document.querySelectorAll('.show-image-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const img = btn.getAttribute('data-img');
            if (img) showImageOverlay(img);
        });
    });

    // Splash Screen Logic
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        // Check if splash has been shown in this session
        if (sessionStorage.getItem('splashShown')) {
            splashScreen.style.display = 'none';
            initScrollReveal(); // Start animation immediately if splash is skipped
        } else {
            // Ensure splash screen stays for at least 1.5 seconds for animation to play
            // or until page is fully loaded, whichever is later
            const minSplashTime = 1500;
            const startTime = Date.now();

            const hideSplash = () => {
                splashScreen.classList.add('hidden');
                setTimeout(() => {
                    splashScreen.style.display = 'none';
                    sessionStorage.setItem('splashShown', 'true');
                    initScrollReveal(); // Start animation after splash is hidden
                }, 600);
            };

            window.addEventListener('load', () => {
                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.max(0, minSplashTime - elapsedTime);
                setTimeout(hideSplash, remainingTime);
            });
            
            // Fallback: Force hide after 5 seconds in case load event doesn't fire
            setTimeout(() => {
                if (!splashScreen.classList.contains('hidden')) {
                    hideSplash();
                }
            }, 5000);
        }
    } else {
        initScrollReveal(); // Start animation if no splash screen exists
    }

    // --- Thanks list toggle functionality ---
    const thanksToggleBtn = document.getElementById('thanks-toggle');
    const thanksList = document.getElementById('thanks-list');
    
    if (thanksToggleBtn && thanksList) {
        thanksToggleBtn.addEventListener('click', () => {
            const isCollapsed = thanksList.classList.contains('collapsed');
            
            if (isCollapsed) {
                // Expand
                thanksList.classList.remove('collapsed');
                thanksToggleBtn.classList.add('expanded');
                thanksToggleBtn.setAttribute('aria-label', '收起插件列表');
            } else {
                // Collapse
                thanksList.classList.add('collapsed');
                thanksToggleBtn.classList.remove('expanded');
                thanksToggleBtn.setAttribute('aria-label', '展开插件列表');
                
                // Scroll the thanks card into view smoothly when collapsing
                setTimeout(() => {
                    const thanksCard = thanksToggleBtn.closest('.thanks-card');
                    if (thanksCard) {
                        thanksCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }, 100);
            }
        });
    }
});
