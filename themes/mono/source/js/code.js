// Mono code rendering:
// 1. 代码高亮走 Hexo 服务端 highlight.js（figure.highlight，无需前端）
// 2. mermaid & echarts — lazy-loaded CDN, only when present on the page
// 支持 SPA 路由（mono:routechange）重复初始化。
(function () {
  'use strict';

  var MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.min.js';
  var ECHARTS_CDN = 'https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.min.js';

  var mermaidLoaded = false;
  var echartsLoaded = false;

  // ---------- mermaid ----------
  // 统一风格：theme 内建 dark/default 差异大（黑白 vs 彩色），改用 'base' +
  // themeVariables 自定义 mono 配色（深浅各一套但强调色一致，避免“有的黑白有的彩色”）
  function mermaidThemeVars() {
    var dark = currentCodeTheme() === 'dark';
    return {
      dark: dark,
      background: dark ? '#1B1B1B' : '#FFFFFF',
      primaryColor: dark ? '#2B2520' : '#F5F5F5',
      primaryTextColor: dark ? '#EDEDED' : '#111111',
      primaryBorderColor: dark ? '#666666' : '#CCCCCC',
      lineColor: dark ? '#888888' : '#999999',
      secondaryColor: dark ? '#332C26' : '#EEEAE4',
      tertiaryColor: dark ? '#3D3732' : '#F0EDE9',
      fontFamily: '"LXGW WenKai GB", sans-serif'
    };
  }

  function initMermaid() {
    var hasMermaid = document.querySelector('pre.mermaid');
    if (!hasMermaid) return;

    function render() {
      if (typeof mermaid === 'undefined') return;
      // 重绘：恢复原始源码（首次渲染时存入 dataset），清掉旧 SVG 与
      // mermaid 的 data-processed 标记（有标记会跳过 run），再渲染
      document.querySelectorAll('pre.mermaid').forEach(function (pre) {
        var src = pre.getAttribute('data-mermaid-src');
        if (src == null) {
          src = pre.textContent;
          pre.setAttribute('data-mermaid-src', src);
        }
        pre.removeAttribute('data-processed');
        pre.innerHTML = '';
        pre.textContent = src;
      });
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: mermaidThemeVars(),
        securityLevel: 'loose',
        fontFamily: '"LXGW WenKai GB", sans-serif'
      });
      mermaid.run({ querySelector: 'pre.mermaid' }).catch(function (e) { console.warn('mermaid render failed:', e); });
    }

    function ensureRender() {
      render();
      // 主题切换：重绘一遍（与 echarts 一致），保证深浅模式配色统一
      if (!initMermaid.watching) {
        initMermaid.watching = true;
        new MutationObserver(function () {
          // 有 SVG 的说明已渲染过 → 重绘换主题
          if (document.querySelector('pre.mermaid svg')) render();
        }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      }
    }

    if (mermaidLoaded) { ensureRender(); return; }
    mermaidLoaded = true;
    loadScript(MERMAID_CDN, ensureRender);
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

    if (echartsLoaded) { render(); return; }
    echartsLoaded = true;
    function onLoaded() {
      if (typeof echarts === 'undefined') return;
      register();
      render();
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
    initMermaid();
    initEcharts();
  }

  window.__monoWrapContent = wrapContent;
  wrapContent();
  document.addEventListener('mono:routechange', function () {
    wrapContent();
  });

  // ---------- helpers ----------
  function loadScript(url, cb) {
    var s = document.createElement('script');
    s.src = url;
    s.async = true;
    s.onload = cb;
    s.onerror = function () { cb(); };
    document.head.appendChild(s);
  }

  function currentCodeTheme() {
    var t = document.documentElement.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    return t === 'dark' ? 'dark' : 'default';
  }
})();
