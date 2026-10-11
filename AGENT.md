# AGENT.md — 本仓库铁律与协作说明（任何 agent 必读）

## 一、唯一铁律：本仓库永远只保留一个 commit

`jianghuifr.github.io` 只是一个博客网页仓库，**commit 历史没有任何保留价值**，
而历史本身就是一类真实的数据泄漏面：历史里可能残留误提交的草稿、密钥、内部
链接、临时文件、个人信息——**即使后续 commit 把它们删掉了，旧 commit 依然可达**。

因此本仓库的约定是：

> **`main` 分支永远只有 1 个 commit。任何时候都不允许出现第 2 个。**

任何 agent 在本仓库改完东西后，都必须把改动**压进那唯一一个 commit**，而不是新增
commit。历史已经被压缩过，所以这里不存在「不要重写历史」的顾虑——**重写历史正是
本仓库的明确要求**。

### 标准操作流程（日常改动）

```bash
git add -A
git commit --amend --no-edit        # 压进唯一 commit，不新增
git push --force origin main        # 强推覆盖远端
```

- **不要**用 `git commit -m "..."` 新增 commit。
- **不要** merge，**不要** rebase 出多个 commit。
- 唯一 commit 的 message 用稳定描述，不要写成流水账 changelog——它会被反复 amend。

### 新仓库 / 历史已经不止一个 commit 时

```bash
git checkout --orphan tmp-single
git add -A
git commit -m "site: jianghuifr.github.io 博客全量快照"
git branch -D main
git branch -m tmp-single main
git push --force origin main
git reflog expire --expire=now --all
git gc --prune=now
```

### 推送后必须校验

```bash
git fetch origin
git rev-list --count origin/main    # 必须输出 1，否则说明压得不干净
git ls-remote --heads origin        # 只应看到 refs/heads/main
```

### 历史已于 2026-10-11 彻底清空

仓库做过一次**删除并重建**，`refs/pull/*` 与全部旧 commit 对象都已消失：
旧 SHA 现在通过 API 返回 `422 No commit found`，`git fetch origin <old-sha>` 也取不回。

所以不要再有「反正只是个公开博客」的松懈。**一旦历史被污染，正确做法是再次重建仓库，
而不是只强推**——强推只让旧 commit 从分支上消失，服务端对象仍然可达。

重建流程（需要 `delete_repo` 权限：`gh auth refresh -s delete_repo`）：

```bash
# 0) 安全网：把当前远端完整镜像备份到仓库之外（含 refs/pull/*）
git clone --mirror git@github.com:jianghuifr/jianghuifr.github.io.git ../jhf-backup.git

# 1) 删除 + 新建同名公开仓库（保留 description / homepage）
gh repo delete jianghuifr/jianghuifr.github.io --yes
gh repo create jianghuifr/jianghuifr.github.io --public \
  --description "jianghuifr.github.io — Hexo blog (mono theme)" \
  --homepage "https://jianghuifr.github.io/"

# 2) 必须在 push 前启用 Pages，否则首次 Actions 部署会因 Pages 未开启而失败
gh api -X POST repos/jianghuifr/jianghuifr.github.io/pages -f build_type=workflow

# 3) 推唯一那个 commit
git push -u origin main --force
```

验证（旧 commit 应为 `422`，网页为 `404`，`refs/pull/*` 数量为 0）：

```bash
git ls-remote origin 'refs/pull/*' | wc -l      # 期望 0
git ls-remote --heads origin                    # 期望只有 refs/heads/main
```

若历史中确实出现过真实凭据，**必须立即轮换**——清历史不能替代轮换。

---

## 二、目录与内容约定

- `source/_posts/` — 已发布博客
- `source/_drafts/` — 原始对话缓存，已 gitignore，Hexo 不渲染
- `source/album/` — 相册页
- `source/404.md` — 自定义 404（`permalink: /404.html`，已从 sitemap 排除）
- `source/robots.txt` — 爬虫规则（指向 `/sitemap.xml`）
- `themes/mono/` — **唯一主题**（`_config.yml` 里 `theme: mono`）
- `.local/` — **本地私有**（已 gitignore）：内部流程文档与辅助脚本。
  例如 `.local/tools/deepseek_share_to_md.py`、`.local/tools/deepseek-blog-workflow.md`。
  这类文件不参与渲染，**一律不进公开仓库**。
- **不要**新增第二个主题，也不要保留未启用主题的配置。Hexo 只会读取与当前主题
  同名的 `_config.<theme>.yml`（即 `_config.mono.yml`），其他 `_config.*.yml` 是死文件。

### Hexo 扩展点（重要）

站点根 `scripts/` 与当前主题的 `scripts/` **都会被 Hexo 当插件加载**。因此：

- 站点级过滤器要放在**主题目录**下（`themes/mono/scripts/`），不要放在站点根
  `scripts/`——后者会在换主题/多主题时产生跨主题耦合（历史上就踩过一次）。
- 现有扩展：`themes/mono/scripts/code-blocks.js`、`register.js`（标签/分类索引 + `sitemap.xml`
  生成器，均为零依赖手写）、`img-lazy.js`。

## 三、写作与依赖约定

- **不要**在 `source/_posts/*.md` 里用 ASCII 字符画架构图，必须用 mermaid 围栏代码块
  （已装 `hexo-filter-mermaid-diagrams`，它只把围栏改写成 `pre.mermaid`，
  真正的渲染由 `themes/mono/source/js/code.js` 懒加载 CDN 完成；不存在 `mermaid.enable` 开关）。
- **front matter 的 `date` 用 `YYYY-MM-DD HH:MM:SS`，且时间不要早于 `08:00`**（建议 `12:00:00`）。
  原因：permalink 的 `:year/:month/:day` 取的是**构建进程时区**下的日期，而 `_config.yml`
  的 `timezone` 只管页面显示；`08:00` 之前的时间在 UTC 构建里会落到前一天，导致
  页面显示的日期与 URL 差一天（历史上线上就有过：显示 2026-07-29，URL 是 `/2026/07/28/`）。
  CI 里已用 `env: TZ: Asia/Shanghai` 钉住时区，这条约定是第二道保险，别再写出 `< 08:00` 的时间。
- 本地与 CI 都用 `pnpm`，`pnpm-lock.yaml` 是权威（`git ls-files` 里必须有它）。
  - CI 命令是 `pnpm install --frozen-lockfile --config.strict-dep-builds=false`：
    后半截是必需的，否则 pnpm 会因为「忽略了 hexo-util 的 postinstall」直接失败退出。
  - `.github/workflows/pages.yml` 里 pin 的 pnpm 版本要与本机 `pnpm -v` 一致；
    Node 版本在 workflow 里 pin 为 22。
  - **`package.json` 仍是构建的真相源**：改依赖必须改它并刷新 `pnpm-lock.yaml`。
    不要往 `package.json` 加 `packageManager` 字段——那会让 pnpm 要求把自身版本
    写进锁文件，`--frozen-lockfile` 就会失败。

## 四、体积与信息最小化（同样是硬约束）

仓库只放「渲染站点必需的东西」，其余一律不放：

- 不引入大体积第三方 JS。three.js 走 CDN：
  `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js`，
  由 `layout.ejs` 给出 `window.__MONO_BG`（URL + 版本号），`background.js` 注入 importmap
  并**仅在首页** `import()`（`lines-core.js` 静态 import three，非首页提前判断 isHome
  能省掉每个内页约 250KB 的下载）。
  注意 `background.js` 对加载失败有 catch 降级（静默移除背景容器），所以 CDN 不可达
  时首页背景会消失但不会报错。
- 图片放 `source/images/`，**新增前先确认会被引用**；删除博客时顺手删掉其专属图片。
- 不提交 `public/`、`db.json`、`node_modules/`、`source/_drafts/`、`.local/`。

## 五、push 就等于上线

`.github/workflows/pages.yml` 在 push 到 `main` 时构建并部署到 GitHub Pages，
**部署触发条件就是 `main`**。因此：

- 强推前必须与用户确认。
- **不要**把默认分支改名为 `master`，否则 Actions 不触发、站点不再更新
  （除非同步改工作流与仓库设置）。
- 远端**不要**保留任何其他分支。分支会引用旧 commit，让本该消失的历史继续可达。
  dependabot 等自动分支必须及时删除（对应 PR 会关闭，这是预期行为）。
  本仓库**已删除 `.github/dependabot.yml`**：自动开的 PR/分支一旦在网页上 Merge，
  就会产生新 commit，直接破坏「永远一个 commit」。依赖升级请在本地改
  `package.json` 并刷新 `pnpm-lock.yaml`，再走 amend + 强推。
  注意：该文件只管**版本更新**；仓库设置里的 **Dependabot security updates** 是独立的
  开关，要彻底停掉自动 PR 需在 Settings → Code security 里另行关闭。

---

## 能力边界（如实说明）

单 commit 化 + 重建仓库能保证 **GitHub 上**不再有旧历史。但它防不住仓库之外的泄漏面：

- 第三方存档（Wayback Machine、搜索引擎快照）——删 git 历史管不了，需单独申请移除；
- 历史上出现过的真实凭据——**必须立即轮换**，清历史不能替代轮换。

另外，`secret_scanning_non_provider_patterns` 与 `secret_scanning_validity_checks` 这两项
**无法通过个人账户的 API 打开**（仓库级 PATCH 静默忽略，个人账户没有组织级 code security
configuration 接口）。需要就去网页 Settings → Code security 手动开；`secret_scanning` 与
`push_protection` 是默认开启的，那两项才是关键。
