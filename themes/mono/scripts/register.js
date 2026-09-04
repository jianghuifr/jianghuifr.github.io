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
