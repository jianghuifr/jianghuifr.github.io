// ============================================
// Mono theme — render-stage transforms
// ============================================

// Hexo 的 syntax_highlighter 产物是
//   <figure class="highlight lang"><table><tr><td class="gutter">行号<td class="code"><pre>token spans
// mono 主题直接用 Hexo 服务端高亮（highlight.js），前端不再做反扁平化。
// 唯一转换：识别 ```echarts 围栏（hexo 转成 figure.highlight plaintext / JSON 内容），
// 包装成 <div class="echarts"> 供浏览器端 echarts 初始化 + 灯箱重建。
function isMono() {
  return hexo.config.theme === 'mono';
}

function isEchartsJson(text) {
  try {
    var obj = JSON.parse(text);
    return !!(obj && (obj.series || obj.xAxis || obj.yAxis || obj.radar || obj.geo || obj.visualMap));
  } catch (e) {
    return false;
  }
}

hexo.extend.filter.register('after_render:html', function (str) {
  if (!isMono()) return str;

  return str.replace(
    /<figure class="highlight (plaintext|echarts)"><table><tr><td class="gutter">[\s\S]*?<\/td><td class="code"><pre>([\s\S]*?)<\/pre><\/td><\/tr><\/table><\/figure>/g,
    function (match, lang, code) {
      // 还原源码：去 token span、<br> 转 \n、HTML 实体反转义
      var text = code
        .replace(/<br>/g, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&#123;/g, '{').replace(/&#125;/g, '}')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/\n$/, '');

      if (isEchartsJson(text)) {
        var esc = text
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
        return '<div class="echarts" data-echarts-config="' + esc + '">' + text.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</div>';
      }
      return match;
    }
  );
}, 1);
