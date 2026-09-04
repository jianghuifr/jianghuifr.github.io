// 全站 WebGL 背景动效：Bubbles（ShaderToy 4dl3zn 复刻，仅核心渲染，无面板）
// 所有页面常驻（layout 全局引入），SPA 路由切换时不被重建。
// 跟随站点主题（data-theme / prefers-color-scheme）切换深浅色。
// 版权：原作者 Inigo Quilez 2013（教育学习复刻，勿公开分发/商用）。
(function () {
  'use strict';

  var container = document.getElementById('bg-bubbles');
  var cfg = window.__MONO_BG || {};
  if (!container || !cfg.coreUrl) return;

  function currentIsDark() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark') return true;
    if (t === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  var importMap = document.createElement('script');
  importMap.type = 'importmap';
  importMap.textContent = JSON.stringify({
    imports: { three: cfg.threeUrl || '/vendor/three.module.js' }
  });
  document.head.appendChild(importMap);

  import(cfg.coreUrl).then(function (mod) {
    var api = mod.initBubbles(container, { isDark: currentIsDark() });
    // 主题切换时同步 shader
    new MutationObserver(function () {
      api.setTheme(currentIsDark());
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    // 系统深浅色跟随（未手动设置时）
    var mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', function () {
      var hasManual = false;
      try { hasManual = !!localStorage.getItem('mono-theme'); } catch (e) {}
      if (!hasManual) api.setTheme(mql.matches);
    });
    // 窗口大小变化时（resize 已在 core 内处理 canvas size；这里无需额外）
  }).catch(function () {
    container.parentNode.removeChild(container);
  });
})();
