# monitor大屏集成说明

## 1. 集成方式

- 在 art-layouts 组件中，/monitor 路由时只显示大屏盒子（iframe），不显示原有layout内容。
- 其他路由正常显示原有内容。

## 2. 路由

- 访问 http://localhost:3006/#/monitor 时，显示大屏。
- 其他页面不受影响。

## 3. 技术实现

- 通过iframe加载 public/monitor.html，便于与原有大屏代码解耦。
- 便于后续逐步将大屏迁移为Vue组件。

## 4. 通信建议

- 可通过 BroadcastChannel、localStorage、postMessage 等方式实现大屏与其他页面通信。
- 推荐 BroadcastChannel，已在全屏等场景中应用。

---

> 本文档用于记录大屏集成实现细节，便于后续维护和查阅。
