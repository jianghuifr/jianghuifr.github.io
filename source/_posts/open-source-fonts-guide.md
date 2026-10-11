---
title: 开源字体选型与配置：文楷、思源系列与 FiraCode
date: 2026-11-11 23:05:00
tags:
  - 字体
  - 开源字体
  - 霞鹜文楷
  - 思源宋体
  - FiraCode
  - 编辑器配置
categories: [工具链]
---

记录常用开源字体的差异、Chrome 字体项和 VS Code 字体配置。下文默认值指 Windows 版 Chrome 的默认设置。

## 一、概念

| 概念 | 说明 |
|---|---|
| 衬线 / 无衬线 | 笔画末端有无装饰脚。思源宋体属衬线，思源黑体属无衬线 |
| 楷体 | 模拟毛笔起收的第三类，霞鹜文楷属此类 |
| 线性 / 非线性 | 旧分类中线性约等于无衬线；非严格术语 |
| 等宽 / 比例 | 拉丁字符前进宽度是否固定；汉字为全角 |
| Mono | 等宽字体；Nerd Font 文件名中特指图标单倍宽 |
| TTF / OTF | glyf 二次曲线 / CFF 三次曲线 |
| 可变字体（VF） | 单文件包含多个字重 |
| Nerd Font | 补入 PUA 图标；默认双倍宽、Mono 单倍宽、Propo 比例 |
| Screen | 针对屏幕加粗的版本 |

衬线体用于长文与印刷，无衬线用于界面；楷体既非衬线也非无衬线，放进 `serif` 槽位会让依赖 `serif` 区分层次的页面失去对比。

<figure class="post-figure">
<img src="/images/font-serif-sans-kai.png" alt="同一句话在思源宋体、思源黑体、霞鹜文楷下的对比">
<figcaption>宋体、黑体、楷体的笔画差异</figcaption>
</figure>

比例字体的 `i` 窄 `m` 宽；等宽字体每个拉丁字符同宽，代码、日志才能按列对齐。中文等宽字体统一的是拉丁、数字和标点，并与汉字保持整数倍宽度。

<figure class="post-figure">
<img src="/images/font-proportional-vs-mono.png" alt="同一段文字在比例字体和等宽字体下的对齐差异">
<figcaption>比例字体与等宽字体的对齐差异</figcaption>
</figure>

Nerd Font 是在原字体上补入图标（[ryanoasis/nerd-fonts](https://github.com/ryanoasis/nerd-fonts)），终端、状态栏需要严格对齐时用 `Mono` 版；`Nerd Font Mono` 的 `Mono` 指图标宽度，不是字体类别。

<figure class="post-figure">
<img src="/images/font-nerd-mono.png" alt="FiraCode Nerd Font 与 Mono 版本的图标宽度对比">
<figcaption>Nerd Font 与 Mono 版的图标宽度</figcaption>
</figure>

可变字体用一个文件覆盖全部字重，省去装多份静态字重；Windows 上优先选 TTF，CFF2 可变字体的兼容性较差。

## 二、字体

以下字体均为 SIL Open Font License（OFL）。

| 字体 | 定位 | 关键点 |
|---|---|---|
| [霞鹜文楷](https://github.com/lxgw/LxgwWenKai) | 楷体 | `Screen` / `GB` / `Mono` 三个维度；正文用 GB Screen |
| [思源宋体](https://github.com/adobe-fonts/source-han-serif) | 衬线 | 与 [Noto Serif CJK](https://github.com/notofonts/noto-cjk) 同字形；有 VF TTF |
| [思源黑体](https://github.com/adobe-fonts/source-han-sans) | 无衬线 | 与 Noto Sans CJK 同字形，字重齐全 |
| [FiraCode](https://github.com/tonsky/FiraCode) | 等宽 + 连字 | Nerd 变体分双宽/单宽、有无连字 |
| [Fira Mono](https://github.com/mozilla/Fira) | 等宽无连字 | 与 FiraCode 同设计 |
| [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) | 等宽 | x-height 更高，带连字 |
| [更纱黑体](https://github.com/be5invis/Sarasa-Gothic) | 中文等宽 | [Iosevka](https://github.com/be5invis/Iosevka) + 思源黑体，适合终端中英对齐 |
| [Noto Sans / Serif](https://github.com/notofonts/noto-fonts) | 西文 | 常与思源系列搭配 |

### 文楷的文件版本

| 文件 | 字形 | 用途 |
|---|---|---|
| `LXGWWenKaiScreen.ttf` | 原风格（半陆标） | 屏幕阅读 |
| `LXGWWenKaiGBScreen.ttf` | 陆标 | 屏幕阅读 + 大陆写法 |
| `LXGWWenKaiMonoScreen.ttf` | 原风格 | 等宽，编辑器 |
| `LXGWWenKaiMonoGBScreen.ttf` | 陆标 | 等宽，编辑器 |

`Screen` 加粗、`GB` 按大陆字形（覆盖《通用规范汉字表》8105 字）、`Mono` 统一拉丁与标点宽度。浏览器选 `GB Screen`，编辑器选带 `Mono` 的版本。

### 思源宋体

Release 里选 `TTF` → `Variable Simplified Chinese`，得到 `SourceHanSerifSC-VF.ttf`（约 57 MB）。装完 Chrome 的衬线下拉会出现 `CN`、`SC`、`SC VF` 三项，选 `VF`。注意 [Source Serif](https://github.com/adobe-fonts/source-serif) 是西文衬线，不含中文。

### FiraCode

连字把 `=>`、`!=`、`->`、`===` 合成单个符号，Fira Mono 无连字。

<figure class="post-figure">
<img src="/images/font-ligatures.png" alt="FiraCode 的连字与 Consolas 原始字符的对比">
<figcaption>FiraCode 连字与 Consolas 原字符</figcaption>
</figure>

| Nerd 变体 | 连字 | 图标宽度 |
|---|---|---|
| FiraCode Nerd Font | 有 | 双倍宽 |
| FiraCode Nerd Font Mono | 有 | 单倍宽 |
| FiraMono Nerd Font | 无 | 双倍宽 |
| FiraMono Nerd Font Mono | 无 | 单倍宽 |

用私有区字符查看图标宽度：`python3 -c "print('\ue0b0 \uf015 \ue700')"`（Powerline、Font Awesome、Devicons）。终端用 `Mono` 版，图标占一格。

## 三、安装

| 方式 | 位置 | 适用 |
|---|---|---|
| 安装 | `%LOCALAPPDATA%\Microsoft\Windows\Fonts` | 当前用户，无需管理员 |
| 为所有用户安装 | `C:\Windows\Fonts` | 多用户，需要管理员 |

装完重启浏览器和编辑器；字体列表显示 family name，不是文件名。

## 四、Chrome

`chrome://settings/fonts`，Windows 默认值与修改对照：

| 项 | 默认 | 修改为 | 说明 |
|---|---|---|---|
| 标准字体 | Times New Roman | LXGW WenKai GB Screen | 未指定字体时的兜底 |
| 无衬线字体 | Arial | LXGW WenKai GB Screen | `sans-serif` 页面 |
| 衬线字体 | Times New Roman | Source Han Serif SC VF | 保留宋体层次 |
| 等宽字体 | Consolas | FiraMono Nerd Font Mono | 代码块与等宽页面 |
| 数学字体 | Cambria Math | 不改 | 文楷无数学符号 |
| 字号 | 16 | 不改 | 默认 |
| 最小字号 | 0 | 不改 | 可设 12px 兜底小字 |

四个字体槽位改动，字号与数学字体保持默认：未写死字体的页面和 `sans-serif` 页面用楷体，`serif` 页面用宋体，代码块用等宽 + 单宽图标。

衬线槽位不要填文楷，否则新闻、论文类页面的宋体层次消失。

Chrome 设置只对未指定字体的页面生效；锁字体的站点用 Stylus 覆盖正文容器：

```css
body, article, .content, .post, p, li {
  font-family: "LXGW WenKai GB Screen", sans-serif !important;
}
```

## 五、VS Code

配置在 `%APPDATA%\Code\User\settings.json`：

```json
{
  "editor.fontFamily": "'FiraCode Nerd Font', 'LXGW WenKai Mono GB Screen', Consolas, 'Courier New', monospace",
  "editor.fontLigatures": true,
  "editor.fontSize": 14,
  "editor.lineHeight": 1.6,
  "terminal.integrated.fontFamily": "'FiraMono Nerd Font Mono', 'FiraCode Nerd Font Mono', 'Sarasa Mono SC', monospace",
  "terminal.integrated.fontSize": 13,
  "terminal.integrated.lineHeight": 1.15
}
```

- 编辑器链：FiraCode 管拉丁，文楷 Mono 管 CJK，两者都等宽，行号与缩进不会乱；字体若在系统里只有中文名，链里要同时写中文名。
- 终端链：FiraMono Mono 保证图标单宽，Sarasa Mono SC 负责中文等宽；缺 FiraMono 时用 FiraCode Mono 替补。
- 配置指向未安装的字体不会报错，只会静默回退（如落到 Consolas）；装完字体后重启 VS Code。

Windows Terminal 对应配置：

```json
{
  "profiles": {
    "defaults": {
      "font": { "face": "FiraMono Nerd Font Mono", "size": 11 }
    }
  }
}
```

## 六、速查

| 场景 | 字体 |
|---|---|
| 浏览器正文 | 霞鹜文楷 GB Screen |
| 长文阅读 / 打印 | 思源宋体 SC VF |
| 界面 / 无衬线正文 | 思源黑体 SC |
| 代码编辑器 | FiraCode Nerd Font |
| 终端 | FiraMono Nerd Font Mono（中文对齐加 Sarasa Mono SC） |
