// Mono code rendering:
// 1. MicroLighter (<micro-lighter> element: copy button + line numbers on by default)
// 2. mermaid & echarts — lazy-loaded CDN, only when present on the page
// 支持 SPA 路由（mono:routechange）重复初始化。
(function () {
  'use strict';

  var ML_CDN = 'https://cdn.jsdelivr.net/npm/microlighter@2.1.0/dist/micro-lighter-element.min.js';
  var MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.min.js';
  var ECHARTS_CDN = 'https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.min.js';

  var mlLoaded = false;
  var mermaidLoaded = false;
  var echartsLoaded = false;

  // ---------- MicroLighter ----------
  function initMicroLighter() {
    var hasCode = document.querySelector('pre > code');
    if (!hasCode || !window.CSS || !CSS.highlights) return;

    function wrapAll() {
      document.querySelectorAll('pre > code').forEach(function (code) {
        var pre = code.parentElement;
        if (!pre || pre.closest('micro-lighter')) return;
        var ml = document.createElement('micro-lighter');
        ml.setAttribute('line-numbers', '');
        ml.setAttribute('controls', 'copy');
        pre.parentNode.insertBefore(ml, pre);
        ml.appendChild(pre);
      });
    }

    if (mlLoaded) { wrapAll(); return; }
    mlLoaded = true; // 幂等：组件只需 define 一次
    var s = document.createElement('script');
    s.type = 'module';
    s.src = ML_CDN;
    s.onload = wrapAll;
    s.onerror = function () { mlLoaded = false; };
    document.head.appendChild(s);
  }

  // ---------- mermaid ----------
  function initMermaid() {
    var hasMermaid = document.querySelector('pre.mermaid');
    if (!hasMermaid) return;

    function render() {
      if (typeof mermaid === 'undefined') return;
      mermaid.initialize({ startOnLoad: false, theme: currentCodeTheme(), securityLevel: 'loose', fontFamily: '"LXGW WenKai GB", sans-serif' });
      mermaid.run({ querySelector: 'pre.mermaid' }).catch(function (e) { console.warn('mermaid render failed:', e); });
    }

    if (mermaidLoaded) { render(); return; }
    mermaidLoaded = true;
    loadScript(MERMAID_CDN, function () { render(); });
  }

  // ---------- echarts ----------
  function initEcharts() {
    var hasEcharts = document.querySelector('.echarts');
    if (!hasEcharts) return;

    function register() {
      echarts.registerTheme('mono', {
        'color': ['#333333', '#666666', '#999999', '#CCCCCC', '#0284C7', '#059669', '#8B5CF6', '#D97706'],
        'backgroundColor': 'transparent',
        'textStyle': { 'fontFamily': 'inherit' },
        'title': { 'textStyle': { 'color': '#111111' }, 'subtextStyle': { 'color': '#666666' } },
        'line': { 'itemStyle': { 'borderWidth': 2 }, 'lineStyle': { 'width': 2 }, 'symbolSize': 6, 'symbol': 'circle' },
        'bar': { 'itemStyle': { 'barBorderWidth': 0 } },
        'categoryAxis': { 'axisLine': { 'show': true, 'lineStyle': { 'color': '#CCCCCC' } }, 'axisTick': { 'show': false }, 'axisLabel': { 'color': '#555555' }, 'splitLine': { 'show': false } },
        'valueAxis': { 'axisLine': { 'show': false }, 'axisTick': { 'show': false }, 'axisLabel': { 'color': '#666666' }, 'splitLine': { 'show': true, 'lineStyle': { 'color': '#E5E5E5', 'type': 'dashed', 'width': 1 } } },
        'tooltip': { 'backgroundColor': '#FFFFFF', 'borderColor': '#CCCCCC', 'borderWidth': 1, 'textStyle': { 'color': '#111111' } },
        'legend': { 'textStyle': { 'color': '#555555' } },
        'dataZoom': { 'backgroundColor': 'rgba(255,255,255,0)', 'borderColor': '#CCCCCC', 'textStyle': { 'color': '#555555' } }
      });
      echarts.registerTheme('mono-dark', {
        'color': ['#CCCCCC', '#999999', '#666666', '#444444', '#67C7F0', '#6EE7B7', '#A78BFA', '#F0B868'],
        'backgroundColor': 'transparent',
        'textStyle': { 'fontFamily': 'inherit' },
        'title': { 'textStyle': { 'color': '#EDEDED' }, 'subtextStyle': { 'color': '#999999' } },
        'line': { 'itemStyle': { 'borderWidth': 2 }, 'lineStyle': { 'width': 2 }, 'symbolSize': 6, 'symbol': 'circle' },
        'bar': { 'itemStyle': { 'barBorderWidth': 0 } },
        'categoryAxis': { 'axisLine': { 'show': true, 'lineStyle': { 'color': '#444444' } }, 'axisTick': { 'show': false }, 'axisLabel': { 'color': '#A0A0A0' }, 'splitLine': { 'show': false } },
        'valueAxis': { 'axisLine': { 'show': false }, 'axisTick': { 'show': false }, 'axisLabel': { 'color': '#999999' }, 'splitLine': { 'show': true, 'lineStyle': { 'color': '#333333', 'type': 'dashed', 'width': 1 } } },
        'tooltip': { 'backgroundColor': '#1B1B1B', 'borderColor': '#444444', 'borderWidth': 1, 'textStyle': { 'color': '#EDEDED' } },
        'legend': { 'textStyle': { 'color': '#A0A0A0' } },
        'dataZoom': { 'backgroundColor': 'rgba(17,17,17,0)', 'borderColor': '#444444', 'textStyle': { 'color': '#A0A0A0' } }
      });
    }

    function render() {
      document.querySelectorAll('.echarts').forEach(function (el) {
        if (el._chart) return; // 已初始化
        try {
          var cfg = JSON.parse(el.textContent.trim());
          var theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'mono-dark' : 'mono';
          var chart = echarts.init(el, theme);
          chart.setOption(cfg);
          el._chart = chart;
          new ResizeObserver(function () { chart.resize(); }).observe(el);
        } catch (e) {}
      });
    }

    if (echartsLoaded) { render(true); return; }
    echartsLoaded = true;
    function onLoaded() {
      if (typeof echarts === 'undefined') return;
      register();
      render();
      // 主题切换时重绘
      new MutationObserver(function () {
        document.querySelectorAll('.echarts').forEach(function (el) {
          if (el._chart) { el._chart.dispose(); el._chart = null; }
        });
        render();
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }
    loadScript(ECHARTS_CDN, onLoaded);
  }

  // ---------- 统一入口：首屏 + SPA 路由 ——
  function wrapContent() {
    initMicroLighter();
    initMermaid();
    initEcharts();
  }

  window.__monoWrapContent = wrapContent;

  // 首屏
  wrapContent();

  // SPA 路由切换后重跑（mermaid/echarts 只渲染新出现但未初始化的块；micro-lighter 包装新 pre>code）
  document.addEventListener('mono:routechange', function () {
    wrapContent();
  });

  // ---------- helpers ----------
  function loadScript(url, cb) {
    var s = document.createElement('script');
    s.src = url;
    s.async = true;
    s.onload = cb;
    s.onerror = function () { cb(); }; // 与原先一致：失败也回调（内部有 typeof 检查）
    document.head.appendChild(s);
  }

  function currentCodeTheme() {
    var t = document.documentElement.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    return t === 'dark' ? 'dark' : 'default';
  }
})();
