// ============================================
// Mono theme — 图片懒加载
// ============================================

// 渲染期改写：在首次绘制前就带上 loading="lazy"。
// 运行时 JS 再补已经太晚——图片可能已被请求。
hexo.extend.filter.register('after_render:html', function (str) {
  return str.replace(/<img(?![^>]*loading=)((?:[^>]*?))>/g, function (match, attrs) {
    // SVG 体积小且常被内联复用，跳过
    if (/\.svg"/.test(attrs)) return match;
    // 需要首屏立即加载的图片可用 data-no-lazy 显式退出
    if (/data-no-lazy/.test(attrs)) return match;
    return '<img loading="lazy" decoding="async"' + attrs + '>';
  });
});
