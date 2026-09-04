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
  // svg/canvas 先克隆/复制位图，不动原节点 —— 原图表的 echarts 实例、
  // mermaid 交互不受影响。
  (function () {
    var overlay = document.getElementById('lightbox');
    var stage = document.getElementById('lightbox-stage');
    var caption = document.getElementById('lightbox-caption');
    if (!overlay || !stage) return;
    var lastFocus = null;

    function open(content, capText) {
      lastFocus = document.activeElement;
      stage.innerHTML = '';
      stage.appendChild(content);
      caption.textContent = capText || '';
      caption.style.display = capText ? '' : 'none';
      overlay.setAttribute('aria-hidden', 'false');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function close() {
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

    // --- mermaid svg: 深克隆（含内联样式/viewBox），限制滚动容器 ---
    function svgLb(origin) {
      var s = origin.cloneNode(true);
      s.classList.add('lightbox-media');
      // svg 无固有尺寸时 max-width:100% 不生效（会塌缩成 0），
      // 必须给出显式基准尺寸：按 viewBox 比例放大到视口限制内的最大宽
      s.removeAttribute('width');
      s.style.maxWidth = '';
      s.style.width = '';
      s.style.height = '';
      s.style.display = 'block';

      var vb = s.getAttribute('viewBox');
      var rect = origin.getBoundingClientRect();
      if (vb) {
        var parts = vb.split(/\s+/).map(Number);
        var ratio = parts[3] / parts[2]; // h / w
        var maxW = Math.min(window.innerWidth - 64, 1600);
        var maxH = window.innerHeight - 96;
        var w = maxW;
        if (ratio > 0 && w * ratio > maxH) w = maxH / ratio;
        s.setAttribute('width', Math.round(w));
        s.setAttribute('height', Math.round(w * ratio));
      } else if (rect.width) {
        s.setAttribute('width', Math.round(rect.width));
        s.setAttribute('height', Math.round(rect.height));
      }
      open(s, '');
    }

    // --- echarts canvas: drawImage 复制位图（cloneNode 会丢像素） ---
    function canvasLb(cv) {
      var c = document.createElement('canvas');
      c.className = 'lightbox-media';
      c.width = cv.width;
      c.height = cv.height;
      var ctx = c.getContext('2d');
      ctx.drawImage(cv, 0, 0);
      // 保持原始 css 尺寸（echarts 把逻辑尺寸写在 style 上）
      if (cv.style.width) c.style.width = cv.style.width;
      if (cv.style.height) c.style.height = cv.style.height;
      open(c, '');
    }

    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!(t instanceof Element)) return;

      // 灯箱开着时：点内容本体 / 遮罩 / 图注 → 关闭
      if (overlay.classList.contains('open')) {
        if (t === overlay || stage.contains(t) || t === caption) { e.preventDefault(); close(); }
        return;
      }

      // 内容在正文之外的一律不触发
      if (!t.closest('.post-content')) return;

      // echarts 图表（容器是 <div class="echarts">，内部是 canvas）
      var ec = t.closest('.echarts');
      if (ec) {
        var cv = ec.querySelector('canvas');
        if (cv) { e.preventDefault(); canvasLb(cv); }
        return;
      }

      // mermaid 图（<pre class="mermaid"> 内的 svg）
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

  // ---------- page transitions ----------
  (function () {
    var wrapper = document.querySelector('.site-wrapper');
    if (!wrapper) return;

    // 进入：首屏 / bfcache 返回时淡入
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function fadeIn() {
      if (reduced) return;
      wrapper.classList.remove('page-out');
      wrapper.classList.add('page-in');
      setTimeout(function () { wrapper.classList.remove('page-in'); }, 450);
    }
    fadeIn();

    // 离开：拦截同源常规链接（排除外链/锚点/新标签/下载），淡出后再跳转
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
      // 同页锚点或完全同 URL 不淡出
      if (url.pathname === location.pathname && (url.hash || url.search === location.search)) return;

      e.preventDefault();
      if (reduced) { window.location.href = a.href; return; }
      wrapper.classList.add('page-out');
      setTimeout(function () { window.location.href = a.href; }, 230);
    }, true);
  })();

  // ---------- boot ----------
  isDark = currentTheme() === 'dark';
  setupMorphIcons();
})();
