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

  // importmap 只需注入一次（且只在真的要加载模块时）
  var importMapAdded = false;
  function addImportMap() {
    if (importMapAdded) return;
    importMapAdded = true;
    var importMap = document.createElement('script');
    importMap.type = 'importmap';
    importMap.textContent = JSON.stringify({
      imports: { three: cfg.threeUrl || 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js' }
    });
    document.head.appendChild(importMap);
  }

  var api = null;
  // 只在首页启动：lines-core.js 静态 import three（~250KB），
  // 曾经因为先 import 再判断 isHome，导致每个内页都白下载一次。
  function boot() {
    if (api || !isHome()) return;
    addImportMap();
    import(cfg.linesUrl).then(function (mod) {
      if (!isHome()) { container.style.display = 'none'; return; }
      api = mod.initLines(container);
    }).catch(function () {
      if (container.parentNode) container.parentNode.removeChild(container);
    });
  }
  boot();

  // 首页 <-> 内页切换：显示/隐藏 canvas（保留实例，SPA 快速切换不重建）
  document.addEventListener('mono:routechange', function (ev) {
    var home = (ev.detail && ev.detail.isHome) || isHome();
    if (home) {
      container.style.display = '';
      boot();
    } else {
      container.style.display = 'none';
    }
  });
})();
