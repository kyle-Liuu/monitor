# monitor.html 全屏按钮实现说明

## 1. 功能说明

- 在"后台"按钮旁新增全屏按钮，点击可全屏/退出全屏。
- 全屏状态与后台管理页面共享（多页面同步）。

## 2. 技术实现

- 使用原生 Fullscreen API（requestFullscreen/exitFullscreen）。
- 使用 BroadcastChannel 实现多页面间全屏状态同步。
- 按钮状态与全屏状态联动，支持主动和被动同步。

## 3. 主要代码点

- public/monitor.html：新增全屏按钮（SVG）。
- public/js/monitor.js：全屏控制与同步逻辑。

## 4. 使用说明

- 点击全屏按钮即可全屏/退出全屏。
- 任一页面全屏/退出，所有打开的相关页面都会同步。

---

> 本文档用于记录全屏功能实现细节，便于后续维护和查阅。
