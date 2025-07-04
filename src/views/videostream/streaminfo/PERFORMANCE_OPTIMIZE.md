# 视频流页面性能优化记录

## 优化时间

2024-06-20

## 优化内容

### 1. 分页优化

- 表格已实现分页，确保每次只渲染当前页数据，避免一次性渲染全部数据。
- 分页切换时仅更新表格数据，不做全量刷新。

### 2. 懒加载优化

- 所有弹窗/抽屉（ElDrawer、ElDialog）使用 `v-if` 控制渲染，只在需要时渲染，减少初始渲染压力。
- 图片标签增加 `loading="lazy"`，实现图片懒加载。
- 组织树、算法标签等大数据结构，建议在弹窗打开时再初始化数据。

### 3. 主题切换优化

- 只切换 CSS 变量，不做全局刷新。
- 避免 watch 主题变量时触发不必要的逻辑。
- 对于大表格、弹窗等，切换主题时不重新拉取数据、不重建 DOM。

### 4. 其他建议

- 如有大数据结构，弹窗打开时再初始化。
- 检查 watch/响应式依赖，避免主题切换时触发不必要的副作用。

### 5. 算法标签列优化

- 表格"算法标签"列只显示前三个标签，超出部分用 ElTooltip 悬浮显示全部标签内容，提升表格可读性和美观性。

### 2024-06-27

- 多边形绘制与自适应渲染优化：
  - 支持图片区域多边形绘制，点击添加顶点、鼠标预览、自动闭合、命名、删除、清空、选中高亮等功能。
  - 多边形数据归一化存储，渲染时根据图片实际显示尺寸还原，支持自适应图片缩放和窗口变化。
  - 通过ResizeObserver监听图片尺寸变化，imgResizeTrigger强制刷新SVG，保证多边形与图片同步缩放。
  - 修正SVG渲染条件，保证polygons在查看模式下也能显示，且样式区分编辑/查看状态。
  - 解决弹窗打开时多边形不显示、查看检测区域不显示多边形等问题，核心原因是数据未持久化或未正确回显，已通过与算法配置绑定polygons字段解决。
- mock数据结构优化：
  - streamList.ts扩展每个算法配置的polygons字段，模拟多边形区域数据。
  - mockAlgoList被单独抽离，结构包含id、desc、createTime等字段，便于前端统一复用。
  - streamList.ts通过引入mockAlgoList自动生成所有算法value，保持与前端一致。
- 交互与体验优化：
  - 图片加载时增加loading动画，延迟600ms后再渲染多边形，提升用户体验。
  - 弹窗每次打开时重新绑定ResizeObserver，保证图片尺寸变化时多边形实时自适应。
  - 多边形命名、保存、删除、清空等交互细节完善处理。
- 代码风格与维护：
  - 所有修改均保持一致的代码风格，遵循项目规范。
  - 重要变更和实现细节均有详细说明，便于后续维护和扩展。

---

> 本文档用于记录本页面性能优化的关键点，便于后续维护和查阅。
