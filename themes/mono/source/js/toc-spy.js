// 文章目录滚动高亮：当前章节在目录左侧显示一条指示条，目录项同时高亮
// （该条的位置与高度在这里计算；CSS 见 theme.css 的 .toc-indicator）
// 只在有目录的文章页加载（post.ejs）。SPA 切页会重新执行本文件，
// 所以开头先把上一次留下的监听摘掉，避免叠加。
(function () {
  'use strict';

  if (window.__tocSpyCleanup) window.__tocSpyCleanup();

  var wrapper = document.querySelector('.toc-wrapper');
  var bar = document.querySelector('.toc-indicator');
  if (!wrapper || !bar) return;

  var items = [];
  document.querySelectorAll('.toc a').forEach(function (link) {
    var href = link.getAttribute('href') || '';
    if (href.charAt(0) !== '#') return;
    var id = href.slice(1);
    try { id = decodeURIComponent(id); } catch (e) { /* 保持原样 */ }
    var el = id ? document.getElementById(id) : null;
    if (el) items.push({ link: link, el: el });
  });
  if (!items.length) return;

  var active = null;
  var ticking = false;
  var dead = false; // 被下一次执行（SPA 切页）接管后置为 true，旧实例不再动 DOM
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // 判定阈值跟 CSS 的 scroll-padding-top（吸顶 header + 1rem）对齐，
  // 移动端 --header-height 变小也能自适应
  function limit() {
    var pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
    return (isNaN(pad) ? 72 : pad) + 8;
  }

  function place(entry, noAnim) {
    var wrapTop = wrapper.getBoundingClientRect().top;
    var rect = entry.link.getBoundingClientRect();
    var instant = noAnim || reduced;
    if (instant) bar.classList.add('no-anim');
    bar.style.height = rect.height + 'px';
    // 用目录容器的内容坐标（容器自身可能滚动），否则内部滚动后条会错位
    bar.style.transform = 'translateY(' + Math.round(rect.top - wrapTop + wrapper.scrollTop) + 'px)';
    bar.classList.add('is-visible');
    if (instant) {
      void bar.offsetHeight; // 强制回流，让 no-anim 生效后再恢复过渡
      bar.classList.remove('no-anim');
    }
  }

  function setActive(entry, noAnim) {
    if (entry === active && !noAnim) return;
    active = entry;
    items.forEach(function (it) {
      var on = it === entry;
      it.link.classList.toggle('active', on);
      if (on) it.link.setAttribute('aria-current', 'location');
      else it.link.removeAttribute('aria-current');
    });
    if (!entry) { bar.classList.remove('is-visible'); return; }
    place(entry, noAnim);
  }

  function update(noAnim) {
    ticking = false;
    if (dead) return;
    var y = limit();
    var current = null;
    // 标题按文档顺序排列：取最后一个已经越过阈值线的
    for (var i = 0; i < items.length; i++) {
      if (items[i].el.getBoundingClientRect().top - y <= 0) current = items[i];
      else break;
    }
    setActive(current, noAnim);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { update(); });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  // 字体（LXGW 现在是异步加载）与图片换入都会改变正文高度，落定后再校准一次
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { update(true); });
  }
  window.addEventListener('load', function () { update(true); }, { once: true });
  update(true); // 首屏直接定位，不做动画

  window.__tocSpyCleanup = function () {
    dead = true;
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
})();
