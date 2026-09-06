// 首页背景：Six Lines 波浪（ShaderToy DtXfDr 复刻），带渐入
// 仅 body[data-noheader]（首页）启动；SPA 离开首页时隐藏 canvas。
(function () {
  'use strict';

  var container = document.getElementById('bg-lines');
  var cfg = window.__MONO_BG || {};
  if (!container || !cfg.linesUrl) return;

  function isHome() {
    return document.body.hasAttribute('data-noheader');
  }

  var importMap = document.createElement('script');
  importMap.type = 'importmap';
  importMap.textContent = JSON.stringify({
    imports: { three: cfg.threeUrl || '/vendor/three.module.js' }
  });
  document.head.appendChild(importMap);

  var api = null;
  import(cfg.linesUrl).then(function (mod) {
    if (!isHome()) { container.style.display = 'none'; return; }
    api = mod.initLines(container);
  }).catch(function () {
    container.parentNode.removeChild(container);
  });

  // 首页 <-> 内页切换：显示/隐藏 canvas（保留实例，SPA 快速切换不重建）
  document.addEventListener('mono:routechange', function (ev) {
    var home = (ev.detail && ev.detail.isHome) || isHome();
    if (home) {
      container.style.display = '';
      if (!api) {
        import(cfg.linesUrl).then(function (mod) { api = mod.initLines(container); });
      }
    } else {
      container.style.display = 'none';
    }
  });
})();
