# DeepSeek 分享链接 → 博客工作流

这是一份 **面向任意 AI agent** 的操作规范（Claude Code、hermes、pi 等都能读）。当用户在这个仓库的会话里贴出 DeepSeek 分享链接，或明确要求"把这次 DeepSeek 对话整理成博客"时，请严格按下面的步骤执行。

## 触发条件

用户消息命中任一：

- 包含形如 `https://chat.deepseek.com/share/<id>` 的 URL
- 明确表达"整理 / 总结 / 沉淀 这次 DeepSeek 对话为博客"

## 执行步骤

### 1. 拉取原始对话

在仓库根目录（`/Users/jianghui/workspaces/notes` 或用户的等价路径）执行：

```bash
python3 tools/deepseek_share_to_md.py <URL_OR_SHARE_ID>
```

- 依赖：Python 3 标准库，无需 pip 安装
- 输出：stderr 打印进度日志；stdout 最后一行是 draft 文件的绝对路径，形如 `.../source/_drafts/deepseek-<id>.md`
- 失败退出码 ≠ 0；stderr 打印可读错误

如果 agent 无法直接执行 shell，请要求用户帮忙执行并把 stdout 的路径回贴过来。

### 2. 阅读 draft 理解内容

打开上一步输出的路径。draft 已经处理好：

- 首条用户消息派生成标题
- `[citation:N]` 引用标记替换成锚点链接
- `search_results` 集中到"参考来源"块
- `thinking_content`（若有）折叠在 `<details>` 里

**目标是理解主题**，不要把 draft 内容直接搬运到博客。

### 3. 撰写博客

在 `source/_posts/<slug>.md` **新建**文件（slug 用短横线小写英文，不带日期前缀；permalink 已经带 `:year/:month/:day/`）。

**Front matter 参考已有 posts（见 `source/_posts/cheat-sheet~*.md`）**：

```yaml
---
title: 一个具体的技术命题
date: YYYY-MM-DD HH:mm:ss
tags:
  - kubernetes
  - 相关标签
---
```

**博客正文风格 —— 必须遵守**：

1. **架构、流程、层次结构图一律用 Mermaid**（围栏语法 ` ```mermaid `）。仓库已装 `hexo-filter-mermaid-diagrams`，NexT 主题已开启 mermaid runtime，可以直接用 `flowchart`、`sequenceDiagram`、`classDiagram` 等。**禁止用 ASCII 字符画的框图**。

2. **主动降低 AI 味**。避免：
   - 章末加 "结语 / 总结 / 最后" 段落——写完就停
   - 大量 "**编号 + 加粗小标题**：解释" 的枚举模板
   - 表格塞 ✅⚠️❌ 之类的 checkmark emoji
   - "为什么不 X？" 自问自答式小标题
   - "让我们 / 首先 / 接下来 / 值得注意的是" 等引导语
   - 章节头带 emoji（如 "## 💎 结论"）
   目标风格：直接、密实、工程师笔记感。参考 `source/_posts/cheat-sheet~docker.md` 的语气。

3. **不是复述对话，是二次创作**。取核心技术命题、关键结论、代码/命令示例、避坑点。DeepSeek 的原文经常有大量礼貌性铺垫和小结，都要删掉。

4. **不写来源链接**。分享链接（`<share_url>`）会暴露原始对话、可能含未脱敏内容，一律不写进博客。文末不需要「本文基于…对话整理」的致谢或来源标注，正文写完就停。

5. **敏感信息脱敏**。对话中的真实凭证、IP、主机名、数据库地址、实例 ID 等信息，在博客中必须做伪装。替换原则：保留语义可读性，抹去可追溯性。例如：
   - DB 地址 `pg-xxx.rds-pg.example.com` → 改写为 `pg-xxx.rds-pg.example.com` 或 `postgres-xxxx.rds.xxx.com`
   - 内网 IP `10.x.x.10` → 保持 `10.x.x.10` 或保留网段但改后两段
   - Node 主机名 `node-xxxx` → 改为 `node-xxxx`
   - Namespace `<your-ns>` → 泛化为 `<your-ns>` 或 `prod-ns`
   核心：K8s 概念、命令、排查思路原样保留，但具体实体名称一律替换。

### 4. 本地验证（可选但推荐）

如果 `pnpm run server` 已在运行，Hexo 会自动热更新。检查 http://localhost:4000/notes/YYYY/MM/DD/<slug>/ 能打开，mermaid 图能渲染。

如果没跑，可以只跑 `pnpm run build` 确认无渲染报错。

### 5. 提交前先与用户确认

Commit 到 main 会通过 `.github/workflows/pages.yml` 自动触发 GitHub Pages 部署，属于对外可见操作。默认要 **展示待提交 diff、征求用户同意** 再执行 `git commit && git push`。除非用户明确说了"自动发布"或"直接推"。

## 其他约定

- `source/_drafts/` 已在 `.gitignore` 里，原始对话不入库（随时可从 share URL 重新生成）
- `tools/` 用于放本仓库的辅助脚本（Hexo 会把 `scripts/` 目录当扩展点加载，别用那个名字）
- 依赖用 `pnpm`（`pnpm-lock.yaml` 是权威）
- 扩展这个流程支持其他分享源（ChatGPT、Claude.ai、Kimi 等）时，新增脚本放在 `tools/` 下，保持相同 stdout 契约（最后一行打印 draft 绝对路径），并在本文档追加一节说明
