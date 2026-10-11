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
    icons: {}
  };

  function queueMorph(iconEl, name) {
    function apply() {
      if (!morphIcons.icons[name]) return;
      iconEl.icon = morphIcons.icons[name];
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
        if (navEl) queueMorph(navEl, 'menu');
        if (themeEl) queueMorph(themeEl, isDark ? 'moon' : 'sun');
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

  function applyTheme(next, persist) {
    isDark = next === 'dark';
    document.documentElement.setAttribute('data-theme', next);
    // 只有「用户自己点切换」才写入偏好；跟随系统变化时不落盘，
    // 否则系统第一次切深色就会把偏好写死，之后再也不会跟随系统
    if (persist !== false) {
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
    }
    // 主题切换期间允许大范围颜色过渡（见 theme.css .theme-fade）
    var root = document.documentElement;
    root.classList.add('theme-fade');
    setTimeout(function () { root.classList.remove('theme-fade'); }, 420);
    // morph 到对应图标
    if (morphReady && morphIcons.icons.sun && morphIcons.icons.moon) {
      var themeEl = document.getElementById('mi-theme');
      if (themeEl && themeEl.morphTo) themeEl.morphTo(isDark ? morphIcons.icons.moon : morphIcons.icons.sun, 'smooth');
    }
  }

  // ---------- click icon spin（首页图标 + 顶部菜单按钮，移动端无 hover 用点击触发） ----------
  (function () {
    var els = document.querySelectorAll('.about-icon, .nav-toggle');
    els.forEach(function (el) {
      el.addEventListener('click', function () {
        var svg = el.querySelector('morph-icon > svg') || el.querySelector('svg');
        if (!svg || svg.classList.contains('icon-spin')) return;
        svg.classList.add('icon-spin');
        svg.addEventListener('animationend', function () { svg.classList.remove('icon-spin'); }, { once: true });
      });
    });
  })();

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
      // 点击导航链接、搜索按钮、主题切换按钮都自动收起菜单
      if (e.target.closest('.nav-link') || e.target.closest('.search-toggle') || e.target.closest('.theme-toggle')) close();
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
      if (!hasManual) applyTheme(mql.matches ? 'dark' : 'light', false);
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
      '.post-footer, .archive-post, .tag-cloud-item'
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
    var activeChartRO = null; // 灯箱内 echarts 的 ResizeObserver
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
      // 键盘可达性：焦点移进灯箱，Tab/读屏不会仍停在背后的页面上
      if (closeBtn) closeBtn.focus();
    }

    function closeCurrent() {
      if (activeChartRO) { activeChartRO.disconnect(); activeChartRO = null; }
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

    // 正文图片可用键盘打开（相册页有自己的灯箱，排除 .gallery-item）
    function decorateImages() {
      document.querySelectorAll('.post-content img').forEach(function (img) {
        if (img.closest('.gallery-item') || img.closest('a') || img.getAttribute('data-lb-ready')) return;
        img.setAttribute('data-lb-ready', '1');
        img.tabIndex = 0;
        img.setAttribute('role', 'button');
        img.setAttribute('aria-label', '查看大图' + (img.alt ? '：' + img.alt : ''));
        img.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); imageLb(img); }
        });
      });
    }
    decorateImages();
    document.addEventListener('mono:routechange', decorateImages);

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
      function onWheel(e) {
        e.preventDefault();
        scale = Math.min(4, Math.max(0.5, scale * (e.deltaY < 0 ? 1.12 : 0.9)));
        apply();
      }
      function onDblClick(e) {
        e.preventDefault();
        if (scale > 1) { scale = 1; tx = 0; ty = 0; }
        else { scale = 2; }
        apply();
      }
      function onMouseDown(e) {
        if (scale <= 1) return;
        dragging = true; sx = e.clientX; sy = e.clientY; stx = tx; sty = ty;
      }
      function onMouseMove(e) {
        if (!dragging) return;
        tx = stx + (e.clientX - sx);
        ty = sty + (e.clientY - sy);
        apply();
      }
      function onMouseUp() { dragging = false; }
      stage.addEventListener('wheel', onWheel, { passive: false });
      stage.addEventListener('dblclick', onDblClick);
      stage.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      // 这些监听挂在常驻的 stage / window 上，关闭时必须摘掉，
      // 否则每开一次 mermaid 灯箱就多一层（N 次后每次 mousemove 跑 N 份）
      activeCleanup = function () {
        stage.removeEventListener('wheel', onWheel);
        stage.removeEventListener('dblclick', onDblClick);
        stage.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        scale = 1; tx = 0; ty = 0;
      };
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

      function ensureEcharts(cb, fail) {
        if (window.echarts) { cb(); return; }
        var sc = document.createElement('script');
        sc.onload = cb;
        // CDN 不可达时不能把空灯箱留在屏幕上：退回原位图，或直接关掉
        sc.onerror = fail;
        sc.src = 'https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.min.js';
        document.head.appendChild(sc);
      }
      function fallback() {
        var cv = ecContainer.querySelector('canvas');
        if (cv) canvasLb(cv);
        else close();
      }
      ensureEcharts(function () {
        if (!window.echarts) { fallback(); return; }
        var theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'mono-dark' : 'mono';
        var chart = echarts.init(wrap, theme);
        chart.setOption(cfg);
        activeChart = chart;
        activeChartRO = new ResizeObserver(function () { chart.resize(); });
        activeChartRO.observe(wrap);
      }, fallback);
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

      // 相册页有自己的灯箱与键盘逻辑：不要被正文灯箱重复接管
      if (t.closest('.gallery-item')) return;
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
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      // 灯箱内可聚焦元素只有关闭按钮：Tab 不能跑到遮罩后的页头上
      if (e.key === 'Tab') {
        e.preventDefault();
        if (closeBtn) closeBtn.focus();
      }
    });
  })();

  // ---------- search ----------
  (function () {
    var overlay = document.getElementById('search-overlay');
    var input = document.getElementById('search-input');
    var results = document.getElementById('search-results');
    var empty = document.getElementById('search-empty');
    var closeBtn = document.getElementById('search-close');
    var clearBtn = document.getElementById('search-clear');
    var toggles = document.querySelectorAll('.search-toggle');
    if (!overlay || !input || !results || !empty) return;

    var INDEX_URL = overlay.getAttribute('data-search-url');
    var indexCache = null;
    var indexLoading = false;
    var currentItems = [];
    var activeIndex = -1;
    var lastFocus = null;

    // search.xml 用 search.format=striptags 生成（见 _config.yml）。CDATA 里的正文
    // 仍会留下 &#x2F; &gt; 这类实体，直接展示会变成乱码，这里先解码。
    function decodeEntities(s) {
      return String(s == null ? '' : s)
        .replace(/&#x([0-9a-f]+);/gi, function (_, hex) { return String.fromCodePoint(parseInt(hex, 16)); })
        .replace(/&#(\d+);/g, function (_, dec) { return String.fromCodePoint(Number(dec)); })
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&');
    }

    // search.xml 用 search.format=striptags 生成（见 _config.yml），content 已经是纯文本。
    // 这里不再走 innerHTML：省一次解析，也避免正文里的 < > 被当成标签解析掉。
    function plainText(s) {
      return String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
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
          posts.push({ title: t ? t.textContent : '', url: u ? u.textContent : '', text: plainText(decodeEntities(c ? c.textContent : '')) });
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
      var scored = [];
      posts.forEach(function (p) {
        var t = p.title.toLowerCase(), x = p.text.toLowerCase();
        if (!terms.every(function (w) { return t.indexOf(w) >= 0 || x.indexOf(w) >= 0; })) return;
        // 标题命中比正文命中更重要（搜 prometheus 时《Prometheus 指标类型》应排前面）
        var score = 0;
        terms.forEach(function (w) {
          if (t.indexOf(w) >= 0) score += 2;
          if (x.indexOf(w) >= 0) score += 1;
        });
        scored.push({ post: p, score: score });
      });
      scored.sort(function (a, b) { return b.score - a.score; });
      return scored.map(function (item) { return item.post; });
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
      if (clearBtn) clearBtn.hidden = !input.value;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () { render(input.value); }, 110);
    });
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        input.value = '';
        clearBtn.hidden = true;
        render('');
        input.focus();
      });
    }

    function openSearch() {
      // 灯箱开着时不再叠一层搜索（两个遮罩都会锁 body overflow，Esc 也只能关掉一层）
      var lightbox = document.getElementById('lightbox');
      if (lightbox && lightbox.classList.contains('open')) return;
      lastFocus = document.activeElement;
      if (!lastFocus || lastFocus === document.body || lastFocus === document.documentElement) {
        lastFocus = document.querySelector('.search-toggle');
      }
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      setTimeout(function () { input.focus(); }, 20);
      if (!indexCache && !indexLoading) {
        loadIndex().then(function () { if (input.value.trim()) render(input.value); })
          .catch(function () { indexLoading = false; empty.hidden = false; empty.textContent = '搜索索引加载失败，请稍后重试'; });
      }
    }
    function closeSearch(restoreFocus) {
      var wasOpen = overlay.classList.contains('open');
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      input.value = ''; results.innerHTML = ''; empty.hidden = true; currentItems = [];
      if (clearBtn) clearBtn.hidden = true;
      // 只在用户主动关闭时把焦点还给触发按钮；SPA 切页（点搜索结果）后不要抢焦点
      if (wasOpen && restoreFocus !== false && lastFocus && lastFocus.isConnected && lastFocus.focus) lastFocus.focus();
      lastFocus = null;
    }
    toggles.forEach(function (b) { b.addEventListener('click', function () {
      overlay.classList.contains('open') ? closeSearch(false) : openSearch();
    }); });
    closeBtn.addEventListener('click', function () { closeSearch(true); });
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) closeSearch(true); });
    // 点击搜索结果会被 SPA 路由接走（无整页刷新）：必须在这里关闭遮罩，
    // 否则遮罩会盖住刚打开的文章，且 body 的 overflow:hidden 一直留着
    document.addEventListener('mono:routechange', function () { closeSearch(false); });

    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        overlay.classList.contains('open') ? closeSearch(true) : openSearch();
        return;
      }
      var isOpen = overlay.classList.contains('open');
      if (e.key === 'Escape' && isOpen) { e.preventDefault(); closeSearch(true); return; }
      // 焦点陷阱：Tab 在输入框 / 清空 / Esc / 结果链接之间循环，不会跑到遮罩后的页头
      if (e.key === 'Tab' && isOpen) {
        var nodes = overlay.querySelectorAll('input, button, a[href]');
        var focusables = Array.prototype.filter.call(nodes, function (el) { return el.getClientRects().length > 0; });
        if (focusables.length) {
          var first = focusables[0], last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
        return;
      }
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

  // ---------- menu scope（博客区/相册区导航过滤）----------
  // 规则：/blog* → blog scope（博客/分类/标签）；/album* → 只留首页与搜索；
  //       其余（首页 personal）→ site scope。首页链接在任何区域常驻（相册页原本全隐藏，
  //       会变成没有出口的死路）；主题切换全局右上角。routechange 事件带 detail.url。
  function applyMenuScope(ev) {
    var raw = (ev && ev.detail && ev.detail.url) || location.href;
    var path;
    try { path = new URL(raw, location.href).pathname; } catch (e) { path = location.pathname; }
    var scope;
    if (path.indexOf('/blog') === 0) scope = 'blog';
    else if (path.indexOf('/album') === 0) scope = 'album';
    else scope = 'site';
    var links = document.querySelectorAll('.nav-link[data-scope]');
    var current = null;
    var currentLen = -1;
    links.forEach(function (a) {
      var hrefPath = '/';
      try { hrefPath = new URL(a.getAttribute('href'), location.href).pathname; } catch (e) {}
      var isHomeLink = hrefPath === '/';
      var show = isHomeLink || (scope !== 'album' && a.getAttribute('data-scope') === scope);
      a.style.display = show ? '' : 'none';
      a.removeAttribute('aria-current');
      if (!show) return;
      // 取前缀最长的可见链接作为当前栏目（文章页归到「博客」，标签/分类详情归到对应栏目）
      var matches = (path === hrefPath) || (hrefPath !== '/' && path.indexOf(hrefPath) === 0);
      if (matches && hrefPath.length > currentLen) { current = a; currentLen = hrefPath.length; }
    });
    if (current) current.setAttribute('aria-current', 'page');

    // 搜索/主题按钮：相册页也保留，否则移动端只剩一个主题切换
    var nav = document.getElementById('site-nav');
    if (nav) {
      var search = nav.querySelector('.search-toggle');
      if (search) search.style.display = '';
      var theme = nav.querySelector('.theme-toggle');
      if (theme) theme.style.display = '';
    }
  }
  applyMenuScope();
  document.addEventListener('mono:routechange', applyMenuScope);

  // ---------- SPA router ----------
  // 站内导航用 fetch + DOMParser 替换 main-content（不整页跳转）：
  // - WebGL 背景 canvas / header / footer / 全局脚本 全程保留
  // - 浏览器缓存 HTML（fetch 默认走缓存），切换即缓存命中
  // - pushState 无刷新；popstate（前进后退）同样用缓存内容恢复
  // - 过渡动画只作用于 main-content：header/footer 不参与淡出淡入，
  //   否则整页一起闪一下，看起来和整页刷新没有区别
  (function () {
    var mainEl = document.getElementById('main-content');
    if (!mainEl) return;

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // 当前已渲染路由（path + search）——用来区分「真·路由切换」与「同页锚点跳转」
    var currentRoute = location.pathname + location.search;
    // 浏览器后退时恢复离开前的滚动位置（SPA 默认会回到顶部）
    var scrollMemo = Object.create(null);

    function fadeIn() {
      if (reduced) return;
      mainEl.classList.remove('page-out');
      mainEl.classList.add('page-in');
      setTimeout(function () { mainEl.classList.remove('page-in'); }, 450);
    }
    fadeIn();

    // 提取新页的 main 内容并应用
    function applyHtml(html, url) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var newMain = doc.querySelector('#main-content');
      if (!newMain) return false;
      var isHome = (url.pathname === '/' || url.pathname === '/index.html');
      mainEl.innerHTML = newMain.innerHTML;
      currentRoute = url.pathname + url.search;
      // 旧页面里的灯箱/搜索可能把 body 锁了 overflow（节点已被替换，自己解不开）
      document.body.style.overflow = '';
      // 更新 title 与 data-noheader（首页隐藏 header/footer）
      document.title = doc.title || document.title;
      // 读屏播报新页面标题；焦点移到正文，避免键盘用户 Tab 又从页头开始
      var announcer = document.getElementById('route-announcer');
      if (announcer) announcer.textContent = doc.title || '';
      mainEl.focus({ preventScroll: true });
      document.body.toggleAttribute('data-noheader', isHome);
      window.__MONO_BG.isHome = isHome;
      // innerHTML 注入的 <script> 不执行：手动提取并执行页面内嵌脚本
      // （album 等页面的图库/灯箱逻辑依赖它）
      var scripts = newMain.querySelectorAll('script');
      scripts.forEach(function (s) {
        var ns = document.createElement('script');
        if (s.src) {
          ns.src = s.src;
          ns.async = false;
        } else {
          ns.textContent = s.textContent;
        }
        document.body.appendChild(ns);
      });
      // 通知各模块重新初始化（mermaid/echarts/code 包装/目录等）
      document.dispatchEvent(new CustomEvent('mono:routechange', { detail: { url: url.href, isHome: isHome } }));
      return true;
    }

    // 滚动到 URL hash 对应的章节（scroll-padding-top 会避开吸顶 header）
    function scrollToHash(hash) {
      if (!hash || hash.length < 2) return;
      var id = hash.slice(1);
      try { id = decodeURIComponent(id); } catch (e) {}
      var el = document.getElementById(id);
      if (el) el.scrollIntoView();
    }

    function navigateTo(href, opts) {
      opts = opts || {};
      var url;
      try { url = new URL(href, location.href); } catch (e) { return; }
      scrollMemo[currentRoute] = window.scrollY;

      // 首页进出：背景已经在跑，无需动；仅切换 main
      var doFetch = function () {
        var fetchOpt = { credentials: 'same-origin' };
        fetch(url.href, fetchOpt)
          .then(function (r) { if (!r.ok) throw new Error('fetch ' + r.status); return r.text(); })
          .then(function (html) {
            mainEl.classList.add('page-out');
            setTimeout(function () {
              if (!applyHtml(html, url)) { window.location.href = url.href; return; }
              mainEl.classList.remove('page-out');
              fadeIn();
              if (opts.push !== false) history.pushState({ monoRoute: url.href }, '', url.href);
              // pushState 不会触发原生锚点滚动，带 #hash 的内链要自己滚到章节
              if (url.hash) scrollToHash(url.hash);
              else window.scrollTo(0, 0);
            }, 200);
          })
          .catch(function () {
            // fetch 失败（离线/网络）→ 整页跳转兜底
            window.location.href = url.href;
          });
      };

      // 淡出后进入；若当前已是淡出态（快速连点）直接 fetch
      if (mainEl.classList.contains('page-out')) { doFetch(); return; }
      if (reduced) { doFetch(); return; }
      mainEl.classList.add('page-out');
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
      // 同一路由：带 #hash 的交回浏览器原生锚点滚动；不带 hash 的（例如再点一次
      // 当前栏目）只回到顶部，绝不能放行默认行为——那会整页重新加载
      if (url.pathname === location.pathname && url.search === location.search) {
        if (url.hash) return;
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
        return;
      }

      e.preventDefault();
      navigateTo(url.href);
    }, true);

    // 前进/后退：用浏览器缓存恢复（无 fetch）
    window.addEventListener('popstate', function (e) {
      var url = (e.state && e.state.monoRoute) || location.href;
      var target;
      try { target = new URL(url, location.href); } catch (err) { return; }
      // 同页锚点（点目录/脚注等 #hash 链接）也会触发 popstate：
      // 这不是路由切换，交给浏览器原生锚点滚动，绝不能重渲染再把页面拉回顶部
      if (target.pathname + target.search === currentRoute) return;
      scrollMemo[currentRoute] = window.scrollY;
      fetch(url, { credentials: 'same-origin' })
        .then(function (r) {
          // 目标可能已经不存在：整页跳转交给 404 页，别静默停在旧内容上
          if (!r.ok) { window.location.reload(); return ''; }
          return r.text();
        })
        .then(function (html) {
          if (html && applyHtml(html, new URL(url))) {
            var memo = scrollMemo[target.pathname + target.search];
            if (target.hash) scrollToHash(target.hash);
            else if (typeof memo === 'number') window.scrollTo(0, memo);
            else window.scrollTo(0, 0);
          }
        })
        .catch(function () { window.location.reload(); });
    });
  })();

  // ---------- boot ----------
  isDark = currentTheme() === 'dark';
  setupMorphIcons();
})();
