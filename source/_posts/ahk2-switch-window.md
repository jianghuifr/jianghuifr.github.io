---
title: AHK v2 同应用窗口切换——Windows 版 Cmd+`
date: 2026-08-03 20:20:00
tags:
  - autohotkey
  - windows
categories: [Windows 效率]

---

macOS 的 Cmd+` 在同一应用的不同窗口间切换，Windows 的 Alt+Tab 却把所有应用的窗口混在一起。用 AutoHotkey v2 补上这个缺口，核心逻辑不到 40 行。

<!-- more -->

## 完整脚本

```autohotkey
#`::SwitchToSimilarWindow()

SwitchToSimilarWindow() {
    MouseGetPos(, , &mouse_id)
    mouse_class := WinGetClass("ahk_id " mouse_id)
    mouse_exe := WinGetProcessName("ahk_id " mouse_id)

    ids := [], titles := []
    for this_id in WinGetList(, , "Program Manager") {
        if (WinGetClass("ahk_id " this_id) = mouse_class
         && WinGetProcessName("ahk_id " this_id) = mouse_exe) {
            ids.Push(this_id)
            titles.Push(WinGetTitle("ahk_id " this_id))
        }
    }
    index := ShowToolTip(mouse_exe, mouse_class, titles)

    key := RegExReplace(A_ThisHotKey, "[*~$#+!^( UP)]")
    Loop {
        if !GetKeyState("LWin", "P") {
            WinActivate("ahk_id " ids[index])
            ToolTip()
            break
        }
        KeyWait(key)
        if KeyWait(key, "D T0.2")
            index := ShowToolTip(mouse_exe, mouse_class, titles, index)
    }
}
```

## 关键设计

### 双重匹配识别同一应用

`WinGetClass` + `WinGetProcessName` 组合判断，而不是只看 exe 名称。因为不同应用的窗口类名不同，同一应用的所有窗口类名相同。这个双重匹配比单靠进程名更可靠。

```autohotkey
if (this_class = mouse_class && this_exe = mouse_exe)
```

### 0.2 秒快速连按切换

```autohotkey
if KeyWait(key, "D T0.2")
    index := ShowToolTip(mouse_exe, mouse_class, titles, index)
```

`KeyWait(key, "D T0.2")` 等待按键弹起后再按下，超时 0.2 秒。在 0.2 秒内再次按下热键 → 选中下一个窗口；超时未再按 → 停在当前选中项。

### 释放 Win 键即激活

```autohotkey
if !GetKeyState("LWin", "P") {
    WinActivate("ahk_id " ids[index])
    break
}
```

整个过程是：按住 Win 键 → 按热键弹出列表 → 连按热键切换选中项 → 松开 Win 键激活窗口。交互模式与 macOS 的 Cmd+` 一致。

## 使用方式

- 绑定 `Win+` ` 作为热键，与 macOS 习惯一致
- 排除桌面（`Program Manager`）避免干扰
- `ShowToolTip` 需要自行实现——用 ToolTip 或 Gui 弹窗显示窗口列表并在当前选中项上高亮

比 Alt+Tab 精准：只切 Chrome 就看 Chrome 的窗口，只切 VS Code 就看 VS Code 的窗口，不受其他应用干扰。
