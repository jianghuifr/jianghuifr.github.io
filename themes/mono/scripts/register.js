'use strict';

// ============================================
// Mono theme — Hexo extend registration
// ============================================

// blog 结构（_config.yml: archive_dir=blog, tag_dir=blog/tags, category_dir=blog/categories）：
//   /blog/            博客文章列表（archive generator 以 blog 为 archive_dir 生成）
//   /blog/tags/       标签索引
//   /blog/categories/ 分类索引
// 专辑 /album 由 source/album/index.md 生成。

hexo.extend.generator.register('tags_index', function (locals) {
  return {
    path: 'blog/tags/index.html',
    data: { title: '标签' },
    layout: ['tags']
  };
});

hexo.extend.generator.register('categories_index', function (locals) {
  return {
    path: 'blog/categories/index.html',
    data: { title: '分类' },
    layout: ['categories']
  };
});

// sitemap.xml —— 不引入 npm 依赖（AGENT.md 的体积/依赖约束）。
// 覆盖：首页、博客列表页、文章、页面、标签/分类的详情与索引页；
// 路径按 pretty_urls.trailing_index: false 去掉 index.html。
hexo.extend.generator.register('sitemap', function (locals) {
  var base = String(hexo.config.url || '').replace(/\/+$/, '') + '/';
  var seen = Object.create(null);
  var rows = [];

  function add(path, updated) {
    if (!path) return;
    // 直接用 Hexo 给出的 path（标签/分类是原始中文），只去掉 index.html，
    // 再按 URL 规范做百分号编码（sitemap 里不写裸 UTF-8）
    var loc = encodeURI((base + String(path).replace(/^\/+/, '')).replace(/index\.html$/, ''));
    if (seen[loc]) return;
    seen[loc] = true;
    var lastmod = updated ? '<lastmod>' + new Date(updated).toISOString().slice(0, 10) + '</lastmod>' : '';
    rows.push('  <url><loc>' + loc.replace(/&/g, '&amp;') + '</loc>' + lastmod + '</url>');
  }

  add('index.html');
  if (hexo.config.archive_dir) add(hexo.config.archive_dir + '/index.html');
  locals.posts.each(function (post) {
    if (post.sitemap !== false) add(post.path, post.updated || post.date);
  });
  locals.pages.each(function (page) {
    // 404 不该进站内地图；页面可用 front matter `sitemap: false` 单独排除
    if (page.sitemap !== false && page.path !== '404.html') add(page.path, page.updated || page.date);
  });
  locals.tags.each(function (tag) { add(tag.path); });
  locals.categories.each(function (cat) { add(cat.path); });

  return {
    path: 'sitemap.xml',
    data: '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      rows.join('\n') + '\n</urlset>\n'
  };
});
