// ============================================
// Mono theme — render-stage transforms
// ============================================

// Hexo 的 syntax_highlighter 是全局配置，产物是
//   <figure class="highlight lang"><table><tr><td class="gutter">…<td class="code"><pre>…token spans…</pre>
// mono 主题改用 MicroLighter（CSS ::highlight()，需要纯文本 pre>code），
// 且不希望行号 gutter 混进 DOM。此 filter 在页面渲染后立刻还原为：
//   <pre><code class="language-lang">纯文本源码</code></pre>
// warmpaper 主题不使用本 filter（用 hexo.config.theme 判断，稳定不依赖
// theme.config——后者在热重载时可能被 config processor 整体覆盖）。
function isMono() {
  return hexo.config.theme === 'mono';
}

// ```echarts 经 hexo 的 backtick_code_block 拦截后，语言丢失、落为 plaintext，
// 内容仍是 JSON。识别其是否 echarts 配置（与 warmpaper 侧同一组键）。
function isEchartsJson(text) {
  try {
    var obj = JSON.parse(text);
    return !!(obj && (obj.series || obj.xAxis || obj.yAxis || obj.radar || obj.geo || obj.visualMap));
  } catch (e) {
    return false;
  }
}

// 反扁平化：figure.highlight → 纯文本 pre>code；echarts JSON → <div class="echarts">
hexo.extend.filter.register('after_render:html', function (str) {
  if (!isMono()) return str;

  return str.replace(
    /<figure class="highlight ([a-zA-Z0-9_+-]*)"><table><tr><td class="gutter">[\s\S]*?<\/td><td class="code"><pre>([\s\S]*?)<\/pre><\/td><\/tr><\/table><\/figure>/g,
    function (match, lang, code) {
      // 还原源码：去 token span、<br> 转 \n、HTML 实体反转义
      var text = code
        .replace(/<br>/g, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&#123;/g, '{').replace(/&#125;/g, '}')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/\n$/, '');

      // echarts 配置（来自 ```echarts 围栏）→ 数据容器，浏览器端 echarts 初始化
      // data-echarts-config 存原始 JSON（HTML 转义），灯箱重新初始化用
      if (lang === '' || lang === 'plaintext' || lang === 'echarts') {
        if (isEchartsJson(text)) {
          var esc = text
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
          return '<div class="echarts" data-echarts-config="' + esc + '">' + text.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</div>';
        }
      }

      var cls = lang && lang !== 'plaintext' ? ' class="language-' + lang + '"' : '';
      return '<pre><code' + cls + '>' + text + '</code></pre>';
    }
  );
}, 1);
