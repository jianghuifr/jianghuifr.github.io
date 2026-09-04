// Mono theme app — nav, theme toggle (morphicons), progress, back-to-top,
// scroll reveal, lightbox, search (search.xml). No dependencies.
(function () {
  'use strict';

  var STORAGE_KEY = 'mono-theme';

  // ---------- morphicons: lazy loader (only if header icons exist) ----------
  var morphQueue = [];
  var morphReady = false;
  var morphPromise = null;
  var isDark = false;

  function loadMorphicons() {
    if (morphPromise) return morphPromise;
    morphPromise = import('https://cdn.jsdelivr.net/npm/morphicons@1.7.1/dist/element.js')
      .then(function (mod) {
        mod.defineMorphIcon();
        morphReady = true;
        morphQueue.forEach(function (job) { job(); });
        morphQueue = [];
        return true;
      })
      .catch(function () {
        // CDN 不可用时降级：保留 header 里的内联 SVG 兜底图标，不隐藏。
        morphReady = false;
      });
    return morphPromise;
  }

  var morphIcons = {
    nav: null,
    theme: null,
    icons: {}
  };

  function queueMorph(iconEl, names) {
    // names: {light: 'menu', dark: 'menu'} — 同一元素对应两个图标按状态取
    function apply() {
      if (!morphIcons.icons[names.light]) return;
      iconEl.icon = morphIcons.icons[names.light];
      iconEl.style.display = '';
    }
    if (morphReady) apply();
    else morphQueue.push(apply);
  }

  function setupMorphIcons() {
    var navEl = document.getElementById('mi-nav');
    var themeEl = document.getElementById('mi-theme');
    if (!navEl && !themeEl) return;

    loadMorphicons().then(function () {
      // lucide 数据按需 import（~337B/个）
      function loadIcon(name) {
        return import('https://cdn.jsdelivr.net/npm/lucide@1.8.0/dist/esm/icons/' + name + '.js')
          .then(function (m) { morphIcons.icons[name] = m.default; });
      }
      var needed = [];
      if (navEl) needed.push('menu', 'x');
      if (themeEl) needed.push('sun', 'moon');
      return Promise.all(needed.map(loadIcon)).then(function () {
        if (navEl) queueMorph(navEl, { light: 'menu', dark: 'menu' });
        if (themeEl) queueMorph(themeEl, { light: isDark ? 'moon' : 'sun', dark: isDark ? 'moon' : 'sun' });
      });
    });
  }

  function currentTheme() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(next) {
    isDark = next === 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
    // morph 到对应图标
    if (morphReady && morphIcons.icons.sun && morphIcons.icons.moon) {
      var themeEl = document.getElementById('mi-theme');
      if (themeEl && themeEl.morphTo) themeEl.morphTo(isDark ? morphIcons.icons.moon : morphIcons.icons.sun, 'snappy');
    }
  }

  // ---------- mobile nav ----------
  (function () {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;

    var overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    overlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:99;background:rgba(0,0,0,0.2);';
    document.body.appendChild(overlay);

    function close() {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
      overlay.style.display = 'none';
    }
    function open() {
      toggle.setAttribute('aria-expanded', 'true');
      nav.classList.add('open');
      overlay.style.display = 'block';
    }

    toggle.addEventListener('click', function () {
      nav.classList.contains('open') ? close() : open();
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('.nav-link')) close();
    });
    overlay.addEventListener('click', close);
    window.addEventListener('scroll', function () {
      if (nav.classList.contains('open')) close();
    }, { passive: true });
  })();

  // ---------- theme toggle ----------
  (function () {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
    var mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', function () {
      var hasManual = false;
      try { hasManual = !!localStorage.getItem(STORAGE_KEY); } catch (e) {}
      if (!hasManual) applyTheme(mql.matches ? 'dark' : 'light');
    });
  })();

  // ---------- reading progress + back to top ----------
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  (function () {
    var bar = document.getElementById('reading-progress-bar');
    var topBtn = document.getElementById('back-to-top');
    var ticking = false;
    function update() {
      ticking = false;
      var doc = document.documentElement;
      var y = window.pageYOffset || doc.scrollTop;
      var max = doc.scrollHeight - window.innerHeight;
      if (bar) bar.style.width = (max > 0 ? Math.min(1, y / max) : 0) * 100 + '%';
      if (topBtn) topBtn.classList.toggle('is-visible', y > 420);
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    if (topBtn) {
      topBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }
    update();
  })();

  // ---------- scroll reveal ----------
  (function () {
    var targets = document.querySelectorAll(
      '.post-card, .post-title, .post-content h2, .post-content h3, ' +
      '.post-content img, .post-content table, .post-content blockquote, ' +
      '.post-footer, .archive-post, .page-title, .tag-cloud-item'
    );
    if (!targets.length) return;
    function done(el) {
      el.addEventListener('transitionend', function h(e) {
        if (e.target !== el) return;
        el.classList.remove('reveal', 'is-revealed');
        el.removeEventListener('transitionend', h);
      });
    }
    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-revealed'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          el.classList.add('is-revealed');
          io.unobserve(el);
          done(el);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      targets.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
    }
  })();

  // ---------- lightbox ----------
  // 支持三类内容：普通图片 <img>、mermaid 渲染的 <svg>、echarts 的 <canvas>。
  // echarts 在灯箱内重新初始化（可交互），mermaid 可缩放/平移，关闭按钮/Esc/点背景退出。
  (function () {
    var overlay = document.getElementById('lightbox');
    var stage = document.getElementById('lightbox-stage');
    var caption = document.getElementById('lightbox-caption');
    var closeBtn = document.getElementById('lightbox-close');
    if (!overlay || !stage) return;
    var lastFocus = null;
    var activeChart = null;   // echarts 实例（灯箱内）
    var activeCleanup = null; // 关闭时清理

    function open(content, capText) {
      closeCurrent();
      lastFocus = document.activeElement;
      stage.innerHTML = '';
      stage.appendChild(content);
      caption.textContent = capText || '';
      caption.style.display = capText ? '' : 'none';
      overlay.setAttribute('aria-hidden', 'false');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeCurrent() {
      if (activeChart && activeChart.dispose) activeChart.dispose();
      activeChart = null;
      if (activeCleanup) { activeCleanup(); activeCleanup = null; }
    }

    function close() {
      closeCurrent();
      overlay.setAttribute('aria-hidden', 'true');
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      stage.innerHTML = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    // --- 图片 ---
    function imageLb(img) {
      var c = document.createElement('img');
      c.className = 'lightbox-media';
      c.src = img.currentSrc || img.src;
      c.alt = img.alt || '';
      open(c, img.alt);
    }

    // --- mermaid svg: 深克隆 + 缩放平移 ---
    function svgLb(origin) {
      var s = origin.cloneNode(true);
      s.classList.add('lightbox-media');
      s.removeAttribute('width');
      s.style.maxWidth = '';
      s.style.width = '';
      s.style.height = '';
      s.style.display = 'block';

      var vb = s.getAttribute('viewBox');
      if (vb) {
        var parts = vb.split(/\s+/).map(Number);
        var ratio = parts[3] / parts[2];
        var maxW = Math.min(window.innerWidth - 96, 1600);
        var maxH = window.innerHeight - 130;
        var w = maxW;
        if (ratio > 0 && w * ratio > maxH) w = maxH / ratio;
        s.setAttribute('width', Math.round(w));
        s.setAttribute('height', Math.round(w * ratio));
      }
      open(s, '');

      // 缩放 + 平移（滚轮/双击放大，拖拽移动）
      var scale = 1, tx = 0, ty = 0, dragging = false, sx = 0, sy = 0, stx = 0, sty = 0;
      function apply() {
        s.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
        s.style.transformOrigin = 'center';
        s.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
      }
      stage.addEventListener('wheel', function (e) {
        e.preventDefault();
        scale = Math.min(4, Math.max(0.5, scale * (e.deltaY < 0 ? 1.12 : 0.9)));
        apply();
      }, { passive: false });
      stage.addEventListener('dblclick', function (e) {
        e.preventDefault();
        if (scale > 1) { scale = 1; tx = 0; ty = 0; }
        else { scale = 2; }
        apply();
      });
      stage.addEventListener('mousedown', function (e) {
        if (scale <= 1) return;
        dragging = true; sx = e.clientX; sy = e.clientY; stx = tx; sty = ty;
      });
      window.addEventListener('mousemove', function (e) {
        if (!dragging) return;
        tx = stx + (e.clientX - sx);
        ty = sty + (e.clientY - sy);
        apply();
      });
      window.addEventListener('mouseup', function () { dragging = false; });
      activeCleanup = function () { scale = 1; tx = 0; ty = 0; };
      apply();
    }

    // --- echarts: 灯箱内重新初始化（保留交互：tooltip/缩放） ---
    function echartsLb(ecContainer) {
      var cfgText = ecContainer.getAttribute('data-echarts-config');
      if (!cfgText) {
        // 无编译期配置时退回位图
        var cv = ecContainer.querySelector('canvas');
        if (cv) { canvasLb(cv); return; }
        return;
      }
      var cfg;
      try { cfg = JSON.parse(cfgText); } catch (e) { var cv0 = ecContainer.querySelector('canvas'); if (cv0) canvasLb(cv0); return; }

      var wrap = document.createElement('div');
      wrap.className = 'lightbox-media lightbox-chart';
      wrap.style.width = Math.min(window.innerWidth - 96, 1200) + 'px';
      wrap.style.height = Math.min(window.innerHeight - 130, 700) + 'px';
      open(wrap, '');

      function ensureEcharts(cb) {
        if (window.echarts) { cb(); return; }
        var sc = document.createElement('script');
        sc.onload = cb;
        sc.onerror = function () {};
        sc.src = 'https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.min.js';
        document.head.appendChild(sc);
      }
      ensureEcharts(function () {
        if (!window.echarts) return;
        var theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'mono-dark' : 'mono';
        var chart = echarts.init(wrap, theme);
        chart.setOption(cfg);
        activeChart = chart;
        new ResizeObserver(function () { chart.resize(); }).observe(wrap);
      });
    }

    // --- echarts canvas 位图兜底 ---
    function canvasLb(cv) {
      var c = document.createElement('canvas');
      c.className = 'lightbox-media';
      c.width = cv.width;
      c.height = cv.height;
      c.getContext('2d').drawImage(cv, 0, 0);
      if (cv.style.width) c.style.width = cv.style.width;
      if (cv.style.height) c.style.height = cv.style.height;
      open(c, '');
    }

    // 关闭按钮
    if (closeBtn) closeBtn.addEventListener('click', close);

    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!(t instanceof Element)) return;

      // 灯箱开着时：点遮罩/图注/关闭按钮退出（不拦截图表内部交互）
      if (overlay.classList.contains('open')) {
        if (t === overlay || t === caption || t === closeBtn) { e.preventDefault(); close(); }
        return;
      }

      if (!t.closest('.post-content')) return;

      // echarts 图表
      var ec = t.closest('.echarts');
      if (ec) {
        e.preventDefault();
        // 避免点击图表内部交互（tooltip 等）时误触——仅点击容器非交互区生效
        if (t.tagName === 'CANVAS' || t.closest('.echarts') === ec) { echartsLb(ec); }
        return;
      }

      // mermaid 图
      var mermaidPre = t.closest('pre.mermaid');
      if (mermaidPre) {
        var svg = mermaidPre.querySelector('svg');
        if (svg) { e.preventDefault(); svgLb(svg); }
        return;
      }

      // 普通图片
      if (t.tagName === 'IMG') {
        if (t.closest('a')) return;
        e.preventDefault();
        imageLb(t);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) { e.preventDefault(); close(); }
    });
  })();

  // ---------- search ----------
  (function () {
    var overlay = document.getElementById('search-overlay');
    var input = document.getElementById('search-input');
    var results = document.getElementById('search-results');
    var empty = document.getElementById('search-empty');
    var closeBtn = document.getElementById('search-close');
    var toggles = document.querySelectorAll('.search-toggle');
    if (!overlay || !input || !results || !empty) return;

    var INDEX_URL = overlay.getAttribute('data-search-url');
    var indexCache = null;
    var indexLoading = false;
    var currentItems = [];
    var activeIndex = -1;

    function htmlToText(html) {
      var div = document.createElement('div');
      div.innerHTML = html;
      return (div.textContent || '').replace(/\s+/g, ' ').trim();
    }
    function loadIndex() {
      if (indexCache) return Promise.resolve(indexCache);
      indexLoading = true;
      return fetch(INDEX_URL).then(function (r) {
        if (!r.ok) throw new Error('fetch failed: ' + r.status);
        return r.text();
      }).then(function (text) {
        var doc = new DOMParser().parseFromString(text, 'text/xml');
        if (doc.querySelector('parsererror')) throw new Error('parse failed');
        var posts = [];
        doc.querySelectorAll('entry').forEach(function (entry) {
          var t = entry.querySelector('title'), u = entry.querySelector('url'), c = entry.querySelector('content');
          posts.push({ title: t ? t.textContent : '', url: u ? u.textContent : '', text: htmlToText(c ? c.textContent : '') });
        });
        indexLoading = false;
        indexCache = posts;
        return posts;
      });
    }
    function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function highlight(text, q) {
      var safe = escapeHtml(text);
      var escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return safe.replace(new RegExp(escaped, 'gi'), function (m) { return '<mark>' + m + '</mark>'; });
    }
    function snippet(text, q) {
      var idx = text.toLowerCase().indexOf(q.toLowerCase());
      if (idx < 0) return text.slice(0, 110);
      var start = Math.max(0, idx - 36), end = Math.min(text.length, idx + q.length + 55);
      return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
    }
    function search(posts, q) {
      var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
      if (!terms.length) return [];
      var out = [];
      posts.forEach(function (p) {
        var t = p.title.toLowerCase(), x = p.text.toLowerCase();
        if (terms.every(function (w) { return t.indexOf(w) >= 0 || x.indexOf(w) >= 0; })) out.push(p);
      });
      return out;
    }
    function render(q) {
      activeIndex = -1;
      if (!q.trim()) { currentItems = []; results.innerHTML = ''; empty.hidden = true; return; }
      if (indexLoading) { empty.hidden = false; empty.textContent = '索引加载中…'; results.innerHTML = ''; return; }
      currentItems = indexCache ? search(indexCache, q) : [];
      if (!currentItems.length) {
        empty.hidden = false; empty.textContent = '没有找到与 “' + q + '” 相关的文章'; results.innerHTML = ''; return;
      }
      empty.hidden = true;
      var frag = document.createDocumentFragment();
      currentItems.forEach(function (p) {
        var a = document.createElement('a');
        a.className = 'search-result';
        a.href = p.url;
        var title = document.createElement('div');
        title.className = 'search-result-title';
        title.innerHTML = highlight(p.title, q);
        var snip = document.createElement('div');
        snip.className = 'search-result-snippet';
        snip.innerHTML = highlight(snippet(p.text, q), q);
        a.appendChild(title); a.appendChild(snip);
        frag.appendChild(a);
      });
      results.innerHTML = '';
      results.appendChild(frag);
    }

    var timer = null;
    input.addEventListener('input', function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () { render(input.value); }, 110);
    });

    function openSearch() {
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      setTimeout(function () { input.focus(); }, 20);
      if (!indexCache && !indexLoading) {
        loadIndex().then(function () { if (input.value.trim()) render(input.value); })
          .catch(function () { indexLoading = false; empty.hidden = false; empty.textContent = '搜索索引加载失败，请稍后重试'; });
      }
    }
    function closeSearch() {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      input.value = ''; results.innerHTML = ''; empty.hidden = true; currentItems = [];
    }
    toggles.forEach(function (b) { b.addEventListener('click', function () {
      overlay.classList.contains('open') ? closeSearch() : openSearch();
    }); });
    closeBtn.addEventListener('click', closeSearch);
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) closeSearch(); });

    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        overlay.classList.contains('open') ? closeSearch() : openSearch();
        return;
      }
      var isOpen = overlay.classList.contains('open');
      if (e.key === 'Escape' && isOpen) { e.preventDefault(); closeSearch(); return; }
      if (!isOpen || input !== document.activeElement) return;
      var items = document.querySelectorAll('.search-result');
      if (!items.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = e.key === 'ArrowDown' ? Math.min(activeIndex + 1, items.length - 1) : Math.max(activeIndex - 1, 0);
        items.forEach(function (el, i) { el.classList.toggle('active', i === activeIndex); });
        if (items[activeIndex]) items[activeIndex].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        window.location.href = items[activeIndex].getAttribute('href');
      }
    });
  })();

  // ---------- SPA router ----------
  // 站内导航用 fetch + DOMParser 替换 main-content（不整页跳转）：
  // - WebGL 背景 canvas / header / footer / 全局脚本 全程保留
  // - 浏览器缓存 HTML（fetch 默认走缓存），切换即缓存命中
  // - pushState 无刷新；popstate（前进后退）同样用缓存内容恢复
  (function () {
    var wrapper = document.querySelector('.site-wrapper');
    var mainEl = document.getElementById('main-content');
    if (!wrapper || !mainEl) return;

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var pendingRoute = null; // {url, title, html} 防止快速连点重复 fetch

    function fadeIn() {
      if (reduced) return;
      wrapper.classList.remove('page-out');
      wrapper.classList.add('page-in');
      setTimeout(function () { wrapper.classList.remove('page-in'); }, 450);
    }
    fadeIn();

    // 提取新页的 main 内容并应用
    function applyHtml(html, url) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var newMain = doc.querySelector('#main-content');
      if (!newMain) return false;
      var isHome = (url.pathname === '/' || url.pathname === '/index.html');
      mainEl.innerHTML = newMain.innerHTML;
      // 更新 title 与 data-noheader（首页隐藏 header/footer）
      document.title = doc.title || document.title;
      document.body.toggleAttribute('data-noheader', isHome);
      window.__MONO_BG.isHome = isHome;
      // 通知各模块重新初始化（mermaid/echarts/code 包装/目录等）
      document.dispatchEvent(new CustomEvent('mono:routechange', { detail: { url: url.href, isHome: isHome } }));
      return true;
    }

    function navigateTo(href, opts) {
      opts = opts || {};
      var url;
      try { url = new URL(href, location.href); } catch (e) { return; }

      // 首页进出：背景已经在跑，无需动；仅切换 main
      var doFetch = function () {
        var fetchOpt = { credentials: 'same-origin' };
        fetch(url.href, fetchOpt)
          .then(function (r) { if (!r.ok) throw new Error('fetch ' + r.status); return r.text(); })
          .then(function (html) {
            wrapper.classList.add('page-out');
            setTimeout(function () {
              if (!applyHtml(html, url)) { window.location.href = url.href; return; }
              wrapper.classList.remove('page-out');
              wrapContentAgain();
              fadeIn();
              if (opts.push !== false) history.pushState({ monoRoute: url.href }, '', url.href);
              window.scrollTo(0, 0);
            }, 200);
          })
          .catch(function () {
            // fetch 失败（离线/网络）→ 整页跳转兜底
            window.location.href = url.href;
          });
      };

      // 淡出后进入；若当前已是淡出态（快速连点）直接 fetch
      if (wrapper.classList.contains('page-out')) { doFetch(); return; }
      if (reduced) { doFetch(); return; }
      wrapper.classList.add('page-out');
      setTimeout(doFetch, 140);
    }

    // 拦截普通内链（与外链/锚点/新标签/下载区分）
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (e.button !== undefined && e.button !== 0)) return;
      var a = e.target instanceof Element ? e.target.closest('a') : null;
      if (!a) return;
      if (a.target && a.target !== '_self') return;
      if (a.hasAttribute('download')) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;
      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && (url.hash || url.search === location.search)) return;

      e.preventDefault();
      navigateTo(url.href);
    }, true);

    // 前进/后退：用浏览器缓存恢复（无 fetch）
    window.addEventListener('popstate', function (e) {
      var url = (e.state && e.state.monoRoute) || location.href;
      fetch(url, { credentials: 'same-origin' })
        .then(function (r) { return r.text(); })
        .then(function (html) {
          if (applyHtml(html, new URL(url))) {
            wrapContentAgain();
            window.scrollTo(0, 0);
          }
        })
        .catch(function () { window.location.reload(); });
    });
  })();

  // SPA 切换后重新包装代码块（micro-lighter 等）由 code.js 监听 mono:routechange 处理；
  // 此函数由 code.js 覆盖（见 code.js 末尾）
  function wrapContentAgain() {
    if (window.__monoWrapContent) window.__monoWrapContent();
  }

  // ---------- boot ----------
  isDark = currentTheme() === 'dark';
  setupMorphIcons();
})();
