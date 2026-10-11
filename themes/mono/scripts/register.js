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
    data: { title: '标签', description: '按标签浏览全部文章' },
    layout: ['tags']
  };
});

hexo.extend.generator.register('categories_index', function (locals) {
  return {
    path: 'blog/categories/index.html',
    data: { title: '分类', description: '按分类浏览全部文章' },
    layout: ['categories']
  };
});

// atom.xml —— 零依赖手写订阅源（不引入 hexo-generator-feed，见 AGENT.md 依赖约束）。
// 只带摘要：阅读器不渲染 mermaid、代码块也丢样式，全文反而更差；摘要足够判断是否点开。
// 时间用 post.date（_config.yml 的 updated_option 已改为 date），避免 CI checkout 后
// 所有文章的 updated 都变成构建时间、每次部署都像“刚更新”。
hexo.extend.generator.register('atom', function (locals) {
  var config = hexo.config;
  var base = String(config.url || '').replace(/\/+$/, '');
  var list = locals.posts.sort('-date').limit(20).toArray();

  function escapeXml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function absolute(path) {
    return base + '/' + encodeURI(String(path == null ? '' : path).replace(/^\/+/, ''));
  }

  function iso(date) {
    return new Date(date).toISOString();
  }

  function decodeEntities(value) {
    return String(value == null ? '' : value)
      .replace(/&#x([0-9a-f]+);/gi, function (_, hex) { return String.fromCodePoint(parseInt(hex, 16)); })
      .replace(/&#(\d+);/g, function (_, dec) { return String.fromCodePoint(Number(dec)); })
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&');
  }

  function summary(post) {
    // 先解码实体再转义，否则 &#x2F; 会变成 &amp;#x2F;，阅读器显示字面实体；
    // 截断按码点 + 标点边界，避免切在单词/实体中间
    var text = decodeEntities(String(post.content || '')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<figure class="highlight[\s\S]*?<\/figure>/gi, ' ')
      .replace(/<pre[\s\S]*?<\/pre>/gi, ' ')
      .replace(/<table[\s\S]*?<\/table>/gi, ' ')
      .replace(/<[^>]+>/g, ' '))
      .replace(/\s+/g, ' ')
      .replace(/\s+([，。；：、！？])/g, '$1')
      .trim();
    var chars = Array.from(text);
    var LIMIT = 260;
    if (chars.length > LIMIT) {
      var cut = LIMIT;
      for (var i = LIMIT; i > LIMIT * 0.6; i--) {
        if ('。；，、！？!? '.indexOf(chars[i]) >= 0) { cut = i + 1; break; }
      }
      text = chars.slice(0, cut).join('').replace(/[，；、\s]+$/, '') + '…';
    }
    return text;
  }

  var feedUpdated = list.length
    ? list.reduce(function (max, post) {
      var date = new Date(post.updated || post.date);
      return date > max ? date : max;
    }, new Date(0)).toISOString()
    : new Date().toISOString();

  var entries = list.map(function (post) {
    var url = absolute(post.path);
    var tagList = post.tags && typeof post.tags.toArray === 'function' ? post.tags.toArray() : [];
    var categories = tagList.map(function (tag) {
      return '    <category term="' + escapeXml(tag.name) + '" scheme="' + escapeXml(absolute(tag.path)) + '"/>';
    }).join('\n');
    return [
      '  <entry>',
      '    <id>' + escapeXml(url) + '</id>',
      '    <title>' + escapeXml(post.title) + '</title>',
      '    <link rel="alternate" type="text/html" href="' + escapeXml(url) + '"/>',
      '    <published>' + iso(post.date) + '</published>',
      '    <updated>' + iso(post.updated || post.date) + '</updated>',
      '    <author><name>' + escapeXml(post.author || config.author || config.title) + '</name></author>',
      categories,
      '    <summary type="text">' + escapeXml(summary(post)) + '</summary>',
      '  </entry>'
    ].filter(Boolean).join('\n');
  }).join('\n');

  var xml = '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<feed xmlns="http://www.w3.org/2005/Atom">\n' +
    '  <id>' + escapeXml(base + '/') + '</id>\n' +
    '  <title>' + escapeXml(config.title) + '</title>\n' +
    '  <subtitle>' + escapeXml(config.description || '') + '</subtitle>\n' +
    '  <link rel="self" type="application/atom+xml" href="' + escapeXml(base + '/atom.xml') + '"/>\n' +
    '  <link rel="alternate" type="text/html" href="' + escapeXml(base + '/blog/') + '"/>\n' +
    '  <updated>' + feedUpdated + '</updated>\n' +
    '  <author><name>' + escapeXml(config.author || config.title) + '</name><uri>' + escapeXml(base + '/') + '</uri></author>\n' +
    '  <generator uri="https://hexo.io/">Hexo</generator>\n' +
    (entries ? entries + '\n' : '') +
    '</feed>\n';

  return { path: 'atom.xml', data: xml };
});

// sitemap.xml —— 不引入 npm 依赖（AGENT.md 的体积/依赖约束）。
// 覆盖：首页、博客列表页、文章、页面、标签/分类的详情与索引页；
// 路径按 pretty_urls.trailing_index: false 去掉 index.html。
hexo.extend.generator.register('sitemap', function (locals) {
  var config = hexo.config;
  var base = String(config.url || '').replace(/\/+$/, '') + '/';
  var perPage = Number(config.per_page) || 0;
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

  // 取一组文章里最新的 updated/date（本地无更新时 updated 取自 front matter date）
  function latest(posts) {
    var max = null;
    posts.forEach(function (post) {
      var d = post.updated || post.date;
      if (d && (!max || d > max)) max = d;
    });
    return max;
  }

  // 列表分页（archive / tag / category 都由 Hexo 按 per_page 切页，locals 里没有对应对象）
  function addPaged(dir, posts) {
    if (!(perPage > 0)) return;
    var total = Math.ceil(posts.length / perPage);
    for (var i = 2; i <= total; i++) {
      add(dir + 'page/' + i + '/index.html', latest(posts.slice((i - 1) * perPage, i * perPage)));
    }
  }

  var allPosts = locals.posts.sort('-date').toArray();

  add('index.html', latest(allPosts));
  if (config.archive_dir) {
    add(config.archive_dir + '/index.html', latest(allPosts));
    addPaged(config.archive_dir + '/', allPosts);
  }
  locals.posts.each(function (post) {
    if (post.sitemap !== false) add(post.path, post.updated || post.date);
  });
  locals.pages.each(function (page) {
    // 404 不该进站内地图；页面可用 front matter `sitemap: false` 单独排除
    if (page.sitemap !== false && page.path !== '404.html') add(page.path, page.updated || page.date);
  });
  // 标签/分类索引页是主题里手写的 generator，不在 locals 里
  if (config.tag_dir) add(config.tag_dir + '/index.html', latest(allPosts));
  if (config.category_dir) add(config.category_dir + '/index.html', latest(allPosts));
  locals.tags.each(function (tag) {
    add(tag.path, latest(tag.posts));
    addPaged(tag.path, tag.posts.toArray());
  });
  locals.categories.each(function (cat) {
    add(cat.path, latest(cat.posts));
    addPaged(cat.path, cat.posts.toArray());
  });

  return {
    path: 'sitemap.xml',
    data: '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      rows.join('\n') + '\n</urlset>\n'
  };
});
