---
title: 相册
layout: page
description: 相册：生活记录
---

<style>
.gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 2em 0;
}
.gallery-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 4/3;
  background: var(--color-code-bg);
  transition: transform 0.2s, box-shadow 0.2s;
}
.gallery-item:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}
.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  /* page 布局现在套了 .post-content，正文 img 的 margin/圆角会撑破缩略图卡片 */
  margin: 0;
  border-radius: 0;
}
@media (max-width: 768px) {
  .gallery { grid-template-columns: repeat(2, 1fr); gap: 8px; }
}
@media (max-width: 480px) {
  .gallery { grid-template-columns: 1fr; }
}

/* Lightbox */
.lightbox {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0,0,0,0.92);
  align-items: center;
  justify-content: center;
}
.lightbox.open { display: flex; }
.lightbox img {
  max-width: 92vw;
  max-height: 88vh;
  object-fit: contain;
  border-radius: 4px;
}
.lightbox-close {
  position: absolute;
  top: 16px;
  right: 20px;
  width: 40px; height: 40px;
  border: none;
  background: rgba(255,255,255,0.15);
  color: #fff;
  font-size: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.lightbox-close:hover { background: rgba(255,255,255,0.3); }
.lightbox-prev, .lightbox-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px; height: 48px;
  border: none;
  background: rgba(255,255,255,0.12);
  color: #fff;
  font-size: 28px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.lightbox-prev:hover, .lightbox-next:hover { background: rgba(255,255,255,0.25); }
.lightbox-prev { left: 16px; }
.lightbox-next { right: 16px; }
.lightbox-counter {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255,255,255,0.7);
  font-size: 14px;
}
@media (max-width: 768px) {
  .lightbox-prev, .lightbox-next { width: 36px; height: 36px; font-size: 20px; }
  .lightbox-prev { left: 8px; }
  .lightbox-next { right: 8px; }
}
</style>

<div class="gallery" id="gallery">
  <div class="gallery-item" tabindex="0" role="button" aria-label="查看第 1 张照片"><img src="https://picsum.photos/seed/a1/800/600" alt="相册占位图 1" loading="lazy" width="800" height="600"></div>
  <div class="gallery-item" tabindex="0" role="button" aria-label="查看第 2 张照片"><img src="https://picsum.photos/seed/a2/800/600" alt="相册占位图 2" loading="lazy" width="800" height="600"></div>
  <div class="gallery-item" tabindex="0" role="button" aria-label="查看第 3 张照片"><img src="https://picsum.photos/seed/a3/800/600" alt="相册占位图 3" loading="lazy" width="800" height="600"></div>
  <div class="gallery-item" tabindex="0" role="button" aria-label="查看第 4 张照片"><img src="https://picsum.photos/seed/a4/800/600" alt="相册占位图 4" loading="lazy" width="800" height="600"></div>
  <div class="gallery-item" tabindex="0" role="button" aria-label="查看第 5 张照片"><img src="https://picsum.photos/seed/a5/800/600" alt="相册占位图 5" loading="lazy" width="800" height="600"></div>
  <div class="gallery-item" tabindex="0" role="button" aria-label="查看第 6 张照片"><img src="https://picsum.photos/seed/a6/800/600" alt="相册占位图 6" loading="lazy" width="800" height="600"></div>
  <div class="gallery-item" tabindex="0" role="button" aria-label="查看第 7 张照片"><img src="https://picsum.photos/seed/a7/900/600" alt="相册占位图 7" loading="lazy" width="900" height="600"></div>
  <div class="gallery-item" tabindex="0" role="button" aria-label="查看第 8 张照片"><img src="https://picsum.photos/seed/a8/900/600" alt="相册占位图 8" loading="lazy" width="900" height="600"></div>
  <div class="gallery-item" tabindex="0" role="button" aria-label="查看第 9 张照片"><img src="https://picsum.photos/seed/a9/600/900" alt="相册占位图 9" loading="lazy" width="600" height="900"></div>
  <div class="gallery-item" tabindex="0" role="button" aria-label="查看第 10 张照片"><img src="https://picsum.photos/seed/a10/800/600" alt="相册占位图 10" loading="lazy" width="800" height="600"></div>
  <div class="gallery-item" tabindex="0" role="button" aria-label="查看第 11 张照片"><img src="https://picsum.photos/seed/a11/800/600" alt="相册占位图 11" loading="lazy" width="800" height="600"></div>
  <div class="gallery-item" tabindex="0" role="button" aria-label="查看第 12 张照片"><img src="https://picsum.photos/seed/a12/800/600" alt="相册占位图 12" loading="lazy" width="800" height="600"></div>
</div>

<!-- 灯箱元素改用 album-lightbox 这个 id：主题 layout 里那个同名元素会让两边 getElementById 互相指错 -->
<div class="lightbox" id="album-lightbox" role="dialog" aria-modal="true" aria-label="相册预览" aria-hidden="true">
  <button class="lightbox-close" id="lbClose" type="button" aria-label="关闭">✕</button>
  <button class="lightbox-prev" id="lbPrev" type="button" aria-label="上一张">‹</button>
  <img id="lbImg" alt="">
  <button class="lightbox-next" id="lbNext" type="button" aria-label="下一张">›</button>
  <span class="lightbox-counter" id="lbCounter"></span>
</div>

<script>
(function() {
  var gallery = document.getElementById("gallery");
  var items = Array.from(gallery.querySelectorAll(".gallery-item"));
  var photos = items.map(function(item, i) {
    var img = item.querySelector("img");
    return {
      src: img.getAttribute("src"),
      alt: img.getAttribute("alt") || ("照片 " + (i + 1))
    };
  });

  var lb = document.getElementById("album-lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbCounter = document.getElementById("lbCounter");
  var lbClose = document.getElementById("lbClose");
  var lbPrev = document.getElementById("lbPrev");
  var lbNext = document.getElementById("lbNext");
  var currentIdx = 0;
  var lastFocus = null;

  function render() {
    var p = photos[currentIdx];
    lbImg.src = p.src;
    lbImg.alt = p.alt;
    lbCounter.textContent = (currentIdx + 1) + " / " + photos.length;
  }

  function open(idx) {
    if (!photos.length) return;
    lastFocus = document.activeElement;
    currentIdx = idx;
    render();
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    lbClose.focus();
  }

  function close() {
    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.isConnected && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
  }

  function prev() {
    currentIdx = (currentIdx - 1 + photos.length) % photos.length;
    render();
  }

  function next() {
    currentIdx = (currentIdx + 1) % photos.length;
    render();
  }

  gallery.addEventListener("click", function(e) {
    var item = e.target.closest(".gallery-item");
    if (!item) return;
    open(items.indexOf(item));
  });
  gallery.addEventListener("keydown", function(e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var item = e.target.closest(".gallery-item");
    if (!item) return;
    e.preventDefault();
    open(items.indexOf(item));
  });

  lbClose.addEventListener("click", close);
  lbPrev.addEventListener("click", prev);
  lbNext.addEventListener("click", next);
  lb.addEventListener("click", function(e) { if (e.target === lb) close(); });

  // SPA 切页会替换 main 内容并重新执行本脚本：先摘掉上一次挂在 document 上的监听，
  // 否则每访问一次相册就多一层（N 次后方向键触发 N 次）
  if (window.__albumKeydown) document.removeEventListener("keydown", window.__albumKeydown);
  window.__albumKeydown = function(e) {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key === "ArrowLeft") { e.preventDefault(); prev(); return; }
    if (e.key === "ArrowRight") { e.preventDefault(); next(); return; }
    if (e.key === "Tab") {
      var focusables = [lbClose, lbPrev, lbNext];
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  document.addEventListener("keydown", window.__albumKeydown);
})();
</script>
