// 首页背景动效：Bubbles（ShaderToy 4dl3zn 复刻，仅核心渲染，无面板）
// 由 index 首页 lazy 加载；仅在 body[data-noheader] 时激活。
// 跟随站点主题（data-theme / prefers-color-scheme）切换深浅色。
// 版权：原作者 Inigo Quilez 2013（教育学习复刻，勿公开分发/商用）。
(function () {
  'use strict';

  if (!document.body || !document.body.hasAttribute('data-noheader')) return;

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

    // 移动端气泡缩小适配：视口越窄，气泡越小（保留数量，更碎更轻盈）
    function applyScale() {
      var w = window.innerWidth;
      var s = 1.0;
      if (w <= 480) s = 0.42;
      else if (w <= 768) s = 0.55;
      else if (w <= 1024) s = 0.72;
      api.setScale(s);
    }
    applyScale();
    window.addEventListener('resize', applyScale);

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
  }).catch(function () {
    container.parentNode.removeChild(container);
  });
})();
