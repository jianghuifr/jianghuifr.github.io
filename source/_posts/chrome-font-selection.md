---
title: Chrome 字体：文楷下哪个文件，衬线和等宽怎么留
date: 2026-11-11 23:05:00
tags:
  - Chrome
  - 字体
  - 霞鹜文楷
  - Nerd Font
categories: [工具链]
---

正文用霞鹜文楷，去下字体才发现同一个名字有六七个文件，只差几个字母。记一下选型依据，下次重装不用再翻。

## 文楷的三个维度

文件名里的修饰词是三件事叠在一起：`Screen`（屏幕阅读优化）、`GB`（陆标字形）、`Mono`（等宽）。

| 文件 | 字形 | 用途 |
|---|---|---|
| `LXGWWenKaiScreen.ttf` | 原风格（半陆标） | 屏幕阅读 |
| `LXGWWenKaiGBScreen.ttf` | 陆标 | 屏幕阅读 + 大陆写法 |
| `LXGWWenKaiMonoScreen.ttf` | 原风格 | 等宽，只给编辑器 |
| `LXGWWenKaiMonoGBScreen.ttf` | 陆标 | 等宽，只给编辑器 |

`Screen` 版把字重调粗，解决原版在屏幕上偏细、发虚的问题，代价是高分屏上看着比印刷版重一点。`GB` 版按大陆规范字形调整了偏旁写法，比如门字框、走之底的收笔方向，字库覆盖《通用规范汉字表》的 8105 字。`Mono` 版把拉丁字符换成等宽并补齐缺字，所有字符占同一宽度。

浏览器正文选 `LXGWWenKaiGBScreen.ttf`。Mono 版不进浏览器设置——网页正文一旦用等宽字体，汉字会变成一格一格的方块，标点和行距全乱，只适合放代码编辑器里。

## Chrome 里只改两项

`chrome://settings/fonts`（设置 → 外观 → 自定义字体）：

| 项 | 设成 | 原因 |
|---|---|---|
| 标准字体 | LXGW WenKai GB Screen | 网页没指定字体时的兜底，覆盖面最大 |
| 无衬线字体 | LXGW WenKai GB Screen | CSS 里写 `sans-serif` 的站点 |
| 衬线字体 | Georgia，或保留 Times New Roman | 文楷是楷体，不是衬线体 |
| 等宽字体 | 保持原样（FiraMono Nerd Font） | 代码块的连字与对齐 |
| 数学字体 | 不动 | 文楷没有数学符号 |

衬线不跟着换成文楷：衬线体的特征是笔画末端的装饰脚，新闻、论文类站点专门指定 `serif` 来区分层次；把楷体塞进衬线位，这些页面的排版就失去对比了。

这套设置只在网页自己没有写死字体时生效。知乎、微博、B 站这类站点在 CSS 里锁了自己的字体，改这里看不到变化。要全站强制，装 Stylus 加规则：

```css
/* 全局 !important 会把图标字体一起顶掉，只对正文容器下手更稳 */
body, article, .content, .post, p, li {
  font-family: "LXGW WenKai GB Screen", sans-serif !important;
}
```

## 衬线：Source Serif 不是思源宋体

`adobe-fonts/source-serif` 是西文衬线体，只有拉丁、希腊、西里尔字符，拿来当浏览器衬线字体时中文字会回退到系统宋体。要中文宋体得装 `adobe-fonts/source-han-serif`，两者是配套关系而不是同一个东西。

下载走 Release 里的 `TTF` → `Variable Simplified Chinese (简体中文)` → `TTF`，得到 `SourceHanSerifSC-VF.ttf`，约 57 MB。可变字体一个文件覆盖全部字重，比装一堆静态字重省事。Windows 上优先用 TTF 而不是 OTF：CFF2 可变字体在 Win10/11 上渲染有已知问题，Adobe 自己在 release note 里提了。

装完 Chrome 的衬线下拉会出现三个条目：`Source Han Serif CN`、`Source Han Serif SC`、`Source Han Serif SC VF`。选带 `VF` 的那个，就是刚装的可变字体；另外两个是旧的静态版和另一套命名。

## 等宽那三个 Fira 变体

名字只差一个词，其实是两个维度叠出来的：

| 名字 | 连字 | 图标宽度 |
|---|---|---|
| FiraCode Nerd Font | 有，`=>` `!=` `->` 合成符号 | 双倍宽 |
| FiraMono Nerd Font | 无 | 双倍宽 |
| FiraMono Nerd Font Mono | 无 | 单倍宽 |

Nerd Font 是在原字体上打补丁，往 Unicode 私有使用区塞了 Powerline、Devicons、Font Awesome 那批图标。名字末尾再带一个 `Mono`，是把这些图标压成单倍宽，让终端里一行图标仍然一格一个地排齐。

要看出差别不能用字母和汉字，这两个字体里它们完全一样，得用私有区字符：

```bash
python3 -c "print('\ue0b0 \uf015 \ue700')"
```

`U+E0B0` 是 Powerline 的分隔符，`U+F015` 是 Font Awesome 的首页图标，`U+E700` 是 Devicons。把输出分别粘到设了这两个字体的输入框里对比：不带 `Mono` 的版本图标比字符宽一截，后面的文字对不齐；带 `Mono` 的版本能严丝合缝接上。编辑器里差别无所谓，终端、状态栏这种要严格对齐的地方用带 `Mono` 的那个。
