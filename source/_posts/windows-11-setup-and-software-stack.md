---
title: Windows 11 工作机配置：软件清单与重装顺序
date: 2026-11-23 21:30:00
tags:
  - windows
  - 环境配置
  - 效率工具
categories: [工具链]
---

记录这台 Windows 11 工作机的软件、安装方式、关键配置与重装顺序，版本为 2026-11。

## 一、基线

| 项目 | 值 |
|---|---|
| 系统 | Windows 11 专业版，Build 26300 |
| CPU / 内存 | i7-14700K / 64 GB |
| 磁盘 | C: 499 GB（系统 + 工具），D: 454 GB（数据 + 项目 + 虚拟机） |
| 包管理器 | winget + scoop |
| Shell | Windows Terminal + PowerShell 7 / WSL2 Ubuntu 24.04 |

- C: 只放系统与工具，项目、数据、虚拟机、下载全部放 D:。
- 能用命令行或配置文件完成的，不点 GUI；环境才可文本重建。
- 一个工具只由一个包管理器负责，避免 PATH 里出现两份。

## 二、安装分工

| 类型 | 工具 | 内容 |
|---|---|---|
| 系统与驱动 | Windows Update / 厂商工具 | 芯片组、显卡、网卡、主板控制中心 |
| GUI 应用 | winget | 浏览器、播放器、办公、聊天、桌面工具 |
| CLI 与开发链 | scoop | Node、Python、Go、Rust、JDK、编译器 |
| 手动 | 安装包 / 便携目录 | Office、VMware、Android SDK、Snipaste、火绒 |

判断标准：装完会出现在「设置 → 应用」的用 winget；只往 PATH 里放可执行文件的用 scoop。

## 三、winget

```powershell
$apps = @(
  '7zip.7zip','voidtools.Everything','VideoLAN.VLC','Google.Chrome',
  'Microsoft.WindowsTerminal','Microsoft.PowerShell','Microsoft.VisualStudioCode','gerardog.gsudo',
  'junegunn.fzf','ajeetdsouza.zoxide','chen08209.FlClash','ZeroTier.ZeroTierOne',
  'agalwood.Motrix','Rainmeter.Rainmeter','AutoHotkey.AutoHotkey','Gyan.FFmpeg',
  'Tencent.WeChat.Universal','ByteDance.Feishu','NetEase.UURemote',
  'Valve.Steam','EpicGames.EpicGamesLauncher'
)

$apps | ForEach-Object {
  winget install --id $_ -e --accept-package-agreements --accept-source-agreements
}
```

- `winget upgrade` 查看更新，`winget upgrade --all` 一键升级（profile 里别名 `wup`）。
- `winget export/import` 只覆盖 winget 源可识别的包，Office、Steam 游戏、MSIX 不会完整导出。

## 四、scoop

```powershell
$env:SCOOP = 'C:\dev\scoop'
irm get.scoop.sh -outfile "$env:TEMP\scoop-install.ps1"
& "$env:TEMP\scoop-install.ps1" -ScoopDir $env:SCOOP

scoop config scoop_repo https://gitee.com/scoop-installer/scoop
scoop bucket rm main
scoop bucket add main     https://gitee.com/scoop-installer/main.git
scoop bucket add extras   https://gitee.com/scoop-installer/extras.git
scoop bucket add versions https://gitee.com/scoop-installer/versions.git
scoop bucket add java     https://gitee.com/scoop-installer/java.git

scoop install aria2
scoop config aria2-enabled true
scoop config aria2-split 16
```

| 类别 | 包 |
|---|---|
| 运行时 | `nodejs-lts`、`python`、`python313`、`uv`、`go`、`rustup` |
| JVM | `temurin21-jdk`、`temurin17-jdk`、`gradle`、`maven` |
| C/C++ | `llvm`、`mingw-winlibs`、`w64devkit`、`cmake`、`ninja` |
| 工具 | `git`、`gh`、`7zip`、`aria2`、`fzf`、`zoxide`、`apktool`、`innounp` |
| 图像 | `picview` |

按表中的包名执行 `scoop install <包名>`；`python` 与 `python313` 并存用于兼容旧工具链。

`scoop update` 更新索引，`scoop update *` 升级全部，`scoop cleanup *` 清旧版本，`scoop hold <app>` 冻结版本。

## 五、终端

Windows Terminal 配置在 `%LOCALAPPDATA%\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json`：

```jsonc
{
  "copyOnSelect": true,
  "profiles": { "defaults": {
    "font": { "face": "FiraCode Nerd Font", "size": 11 },
    "colorScheme": "Dark+", "historySize": 20000, "startingDirectory": "~"
  }}
}
```

分屏 `Ctrl+Shift+=` / `Ctrl+Shift+-`，焦点 `Ctrl+Shift+方向键`；`Alt+方向键` 在 `keybindings` 里置 `null`，交还给 PSReadLine 做按词跳转。

PowerShell profile 在 `Documents\PowerShell\Microsoft.PowerShell_profile.ps1`：

- 去掉 oh-my-posh、posh-git、Terminal-Icons、PSFzf，单项启动开销约 0.4–0.7 秒；CompletionPredictor 会阻塞非交互调用。
- 通用段只设 UTF-8 与 PATH；交互段用 `IsInputRedirected` 判断，非交互时提前 `return`。
- 常用别名：`ll`、`mkcd`、`reload`、`wup`、`gs` / `gl` / `gp`。`gl`、`gp` 是内置别名，定义同名函数前需 `Remove-Item Alias:`。

## 六、开发环境

| 组件 | 配置 |
|---|---|
| Node / pnpm | Node 24 绿色版在 `softwares\`；pnpm 12；registry 用 npmmirror |
| Python | `python313` 提供 `python`，`python` 3.15 提供 `python3`；项目用 uv 管 venv 和依赖 |
| JVM | `JAVA_HOME` 指向 temurin21，temurin17 并存；Gradle / Maven 走 scoop |
| Go / Rust | `GOPATH=C:\dev\gopath`，`GOPROXY=https://goproxy.cn,direct`；rustup 管工具链 |
| C/C++ | LLVM + MinGW-w64 + CMake + Ninja，无 MSVC |
| Android | SDK 在 `C:\dev\android-sdk`，只装 platform-tools 与 cmdline-tools |
| VS Code | FiraCode + 文楷 Mono，终端 FiraCode Mono；格式化按语言分派（ruff / prettier / cpptools） |

WSL2 用 Ubuntu 24.04，`~/.wslconfig`：

```ini
[wsl2]
networkingMode=mirrored
autoProxy=true
firewall=false
dnsTunneling=true

[experimental]
autoMemoryReclaim=gradual
sparseVhd=true
hostAddressLoopback=true
```

`mirrored` 让 WSL 与 Windows 共用网络栈，`autoProxy` 继承系统代理；`autoMemoryReclaim` 归还空闲内存，`sparseVhd` 让 ext4.vhdx 能缩容。

## 七、网络

FlClash 混合端口 `7890`。git 只给 GitHub 配代理，避免把 Gitee 和内网仓库一起绕出去：

```powershell
git config --global http.https://github.com/.proxy http://127.0.0.1:7890
git config --global credential.https://github.com.helper "!gh auth git-credential"
```

SSH 走 `ssh.github.com:443`：

```text
Host github.com
  Hostname ssh.github.com
  Port 443
  User git
  IdentityFile ~/.ssh/id_ed25519
```

WSL 侧不单独配代理，`autoProxy=true` 会继承；TUN 模式下镜像网络本身就会接管流量。

## 八、桌面工具

| 工具 | 用法 |
|---|---|
| Everything | 索引 NTFS 卷，替代开始菜单搜索 |
| 7-Zip | 关联 7z / zip / rar |
| Snipaste | 便携版，F1 截图、F3 贴图，启动项放快捷方式 |
| AutoHotkey v2 | `startup.ahk` 负责窗口吸附、置顶、快速切窗 |
| Rainmeter | 桌面 CPU / 内存 / 网络监控 |
| ZeroTier | 虚拟局域网，远程访问内网设备 |
| Motrix | aria2 图形前端，多线程下载 |
| VMware Workstation | 虚拟机放 D: 盘 |
| 火绒 | 弹窗拦截与自定义规则，Defender 自动关闭 |

便携软件统一放 `C:\Users\<you>\softwares\<name>`，重装时整个目录拷走，只需重建启动项快捷方式。

## 九、重装顺序

1. Windows Update → 主板控制中心 → 显卡驱动。
2. 跑 winget 脚本 → 装 scoop 并换 Gitee 镜像。
3. 跑 scoop 安装命令 → 配环境变量。
4. 恢复配置文件。
5. D: 盘项目与文档归位，浏览器登录同步。
6. 跑验证脚本。

环境变量（用户级）：

```text
SCOOP             = C:\dev\scoop
JAVA_HOME         = C:\dev\scoop\apps\temurin21-jdk\current
GOPATH            = C:\dev\gopath
ANDROID_HOME      = C:\dev\android-sdk
ANDROID_SDK_ROOT  = C:\dev\android-sdk
```

需要备份的配置：

| 文件 | 内容 |
|---|---|
| `Documents\PowerShell\Microsoft.PowerShell_profile.ps1` | Shell 别名、PSReadLine、PATH |
| `...\WindowsTerminal\...\LocalState\settings.json` | 终端外观与快捷键 |
| `%APPDATA%\Code\User\settings.json`、`keybindings.json` | VS Code |
| `~\.gitconfig`、`~\.ssh\config`、`id_ed25519` | git 与 SSH（密钥不要进公开仓库） |
| `~\.wslconfig` | WSL2 网络与资源 |
| `softwares\`、启动项快捷方式 | 便携软件与开机自启 |

验证：

```powershell
node -v; pnpm -v
python -V; uv --version
java -version 2>&1 | Select-Object -First 1
go version; rustc -V; clang --version | Select-Object -First 1
ssh -T git@github.com
wsl -l -v
scoop status
```

`ssh -T` 返回 `Hi <user>! You've successfully authenticated` 即正常，失败先查 443 端口和密钥。
