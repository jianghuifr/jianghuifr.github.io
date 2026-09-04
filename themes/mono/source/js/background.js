// 首页背景动效：Bubbles（ShaderToy 4dl3zn 复刻，仅核心渲染，无面板）
// 由 index 首页 lazy 加载；仅在 body[data-noheader] 时激活。
// 版权：原作者 Inigo Quilez 2013（教育学习复刻，勿公开分发/商用）。
(function () {
  'use strict';

  if (!document.body || !document.body.hasAttribute('data-noheader')) return;

  var container = document.getElementById('bg-bubbles');
  var cfg = window.__MONO_BG || {};
  if (!container || !cfg.coreUrl) return;

  // three.module.js borrows importmap; 单独声明避免污染主页面模块图
  var importMap = document.createElement('script');
  importMap.type = 'importmap';
  importMap.textContent = JSON.stringify({
    imports: { three: cfg.threeUrl || '/vendor/three.module.js' }
  });
  document.head.appendChild(importMap);

  import(cfg.coreUrl).then(function (mod) {
    mod.initBubbles(container);
  }).catch(function () {
    container.parentNode.removeChild(container);
  });
})();
