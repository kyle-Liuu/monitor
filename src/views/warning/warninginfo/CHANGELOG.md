# 警告信息页面更改记录

## 2024-06-19

- **修改人**：AI助手
- **内容**：
  - 统一页面背景、卡片、表格等区域为主题变量，支持主题切换。
  - 分页器数字颜色、激活色、hover色全部用主题变量，明暗主题下自动适配。
  - 分页器结构、位置、样式与用户管理页面完全一致，移除手动分页器，全部交由 ArtTable 内部渲染。
  - 搜索区、分页区、卡片、抽屉等所有交互和视觉与系统用户管理页保持一致。
- **主要代码片段**：

```scss
.warning-page {
  background: var(--art-main-bg-color);
}
.art-table-card {
  background: var(--art-root-card-border-color);
}
.pager-bar :deep(.el-pager li) {
  background: var(--art-main-bg-color);
  color: var(--art-text-gray-800);
}
.pager-bar :deep(.el-pager li.is-active) {
  background: #6c7fff;
  color: #fff;
}
.pager-bar :deep(.el-pager li:hover) {
  color: var(--art-primary);
}
```

---

> 本文件用于记录 `src/views/warning/warninginfo/index.vue` 的所有结构和样式更改，便于团队后续查阅和同步修改习惯。
