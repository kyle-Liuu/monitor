# 流信息页面更改记录

## 2024-06-19

- **修改人**：AI助手
- **内容**：操作列按钮字体样式对齐角色管理页，初始为13px、主色、加粗，hover主色加深并下划线。
- **主要代码片段**：

```scss
:deep(.el-button--text),
:deep(.el-button.is-link) {
  font-size: 13px;
  color: var(--main-color);
  font-weight: 500;
  padding: 0 8px;
  min-width: 0;
}
:deep(.el-button--text):hover,
:deep(.el-button.is-link):hover {
  color: var(--el-color-primary-dark-2);
  text-decoration: underline;
}
```

---

## 2024-06-19

- **修改人**：用户
- **内容**：将操作列按钮字体大小由13px调整为14px，去除主色、加粗、hover下划线等样式。
- **主要代码片段**：

```scss
:deep(.el-button--text),
:deep(.el-button.is-link) {
  font-size: 14px;
}
```

---

> 本文件用于记录 `src/views/videostream/streaminfo/index.vue` 的所有结构和样式更改，便于团队后续查阅和同步修改习惯。
