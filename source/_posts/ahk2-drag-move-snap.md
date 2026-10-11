---
title: AHK v2 任意位置拖拽窗口 + 边缘吸附 + 点击最大化
date: 2026-08-03 20:25:00
tags:
  - autohotkey
  - windows
categories: [Windows 效率]

---

不用瞄准标题栏，按住左键再按右键就能拖拽任意窗口。配合边缘吸附、Esc 取消、点击最大化——一个不到 60 行的 AHK v2 脚本，替代 AltDrag 的核心功能。

<!-- more -->

## 完整脚本（基础版）

```autohotkey
#Requires AutoHotkey v2.0
#SingleInstance Force
SetWinDelay(-1)
CoordMode("Mouse")

DRAG_X := SysGet(68)  ; SM_CXDRAG
DRAG_Y := SysGet(69)  ; SM_CYDRAG

~LButton & RButton:: {
    ; 排除特殊窗口
    if WinActive("ahk_exe mstsc.exe")
        return
    if WinActive("ahk_class WorkerW")
        return

    MouseGetPos(&ox, &oy, &hwnd)
    px := ox, py := oy
    WinGetPos(&wx, &wy, , , "ahk_id " hwnd)
    minmax := WinGetMinMax("ahk_id " hwnd)
    moved := false

    Loop {
        if !GetKeyState("LButton", "P")
            break
        if GetKeyState("Escape", "P") {
            if (moved && minmax = 0)
                WinMove(wx, wy, , , "ahk_id " hwnd)
            return
        }

        MouseGetPos(&cx, &cy)
        if (!moved && (Abs(cx - ox) >= DRAG_X || Abs(cy - oy) >= DRAG_Y))
            moved := true
        if (moved && minmax = 0) {
            WinGetPos(&cwx, &cwy, , , "ahk_id " hwnd)
            WinMove(cwx + cx - px, cwy + cy - py, , , "ahk_id " hwnd)
        }
        px := cx, py := cy
        Sleep(10)
    }

    if (!moved) {
        if (minmax = 1)
            WinRestore("ahk_id " hwnd)
        else if (minmax = 0)
            WinMaximize("ahk_id " hwnd)
    }
}
```

## 核心设计

### 拖拽阈值区分点击与移动

```autohotkey
DRAG_X := SysGet(68)  ; SM_CXDRAG，系统定义的拖动阈值
DRAG_Y := SysGet(69)  ; SM_CYDRAG
```

用 Windows 系统设定的拖动阈值（通常 ~4-6px），而不是硬编码数值。鼠标移动超过这个阈值才算拖拽，否则算点击。这跟资源管理器的拖拽判定一致。

### 增量移动而非绝对定位

```autohotkey
; ✅ 增量：取当前位置 + 鼠标增量
WinMove(cwx + cx - px, cwy + cy - py, , , "ahk_id " hwnd)
;    ↑窗口当前坐标  ↑鼠标从上一帧到这一帧的偏移

; ❌ 绝对：取鼠标位置 - 初始偏移
WinMove(cx - offset_x, cy - offset_y, ...)
```

增量移动避免了浮点累积误差导致的抖动——如果某一帧 WinMove 的实际落点与期望值有微小偏差，下一帧的增量计算会自动修正。

### 三种窗口状态分别处理

| minmax | 状态 | 拖拽 | 点击 |
|--------|------|------|------|
| 0 | 正常 | 移动窗口 | 最大化 |
| 1 | 最大化 | ❌ 禁止 | 还原 |
| -1 | 最小化 | ❌ 禁止 | ❌ 忽略 |

最大化窗口禁止拖拽——不需要，也容易出 bug。

### Esc 取消

拖拽过程中按 Esc → 窗口回到拖拽前的原始位置。实现就是简单地把 `wx, wy`（拖拽开始时记录的窗口坐标）写回去。

## 增强版：边缘吸附

```autohotkey
SNAP_DISTANCE := 20  ; 吸附距离（像素）

; 在释放 LButton 后的逻辑中加入：
if moved {
    WinGetPos(&cx, &cy, , , "ahk_id " hwnd)
    snap_x := cx, snap_y := cy

    if (cx < SNAP_DISTANCE)
        snap_x := 0
    else if (cx + ww > A_ScreenWidth - SNAP_DISTANCE)
        snap_x := A_ScreenWidth - ww

    if (cy < SNAP_DISTANCE)
        snap_y := 0
    else if (cy + wh > A_ScreenHeight - SNAP_DISTANCE)
        snap_y := A_ScreenHeight - wh

    if (snap_x != cx || snap_y != cy)
        WinMove(snap_x, snap_y, , , "ahk_id " hwnd)
}
```

拖拽到屏幕边缘 20px 范围内自动吸过去。四条边独立判断——同时靠近左边缘和上边缘就会吸附到左上角。
