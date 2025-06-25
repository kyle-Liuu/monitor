# RT-monitor 项目页面更改总记录（2024-06-19）

---

## 流信息页面（src/views/videostream/streaminfo/index.vue）

### 2024-06-19

- **AI助手**：操作列按钮字体样式对齐角色管理页，初始为13px、主色、加粗，hover主色加深并下划线。

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

- **用户**：将操作列按钮字体大小由13px调整为14px，去除主色、加粗、hover下划线等样式。

  ```scss
  :deep(.el-button--text),
  :deep(.el-button.is-link) {
    font-size: 14px;
  }
  ```

---

## 警告信息页面（src/views/warning/warninginfo/index.vue）

### 2024-06-19

- **AI助手**：

  - 统一页面背景、卡片、表格等区域为主题变量，支持主题切换。
  - 分页器数字颜色、激活色、hover色全部用主题变量，明暗主题下自动适配。
  - 分页器结构、位置、样式与用户管理页面完全一致，移除手动分页器，全部交由 ArtTable 内部渲染。
  - 搜索区、分页区、卡片、抽屉等所有交互和视觉与系统用户管理页保持一致。

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

## 用户管理页面（src/views/system/user/index.vue）

### 2024-06-19

- **AI助手**：

  - 作为分页、表格、搜索区、操作列等样式和结构的标准参考，供其他管理页面对齐。
  - 分页器、表格、操作列按钮等样式被流信息、警告信息等页面复用。

  ```vue
  <el-pagination
    v-model:current-page="pagination.currentPage"
    v-model:page-size="pagination.pageSize"
    :page-sizes="[10, 20, 30, 50]"
    :total="pagination.total"
    layout="total, sizes, prev, pager, next, jumper"
    background
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
  />
  ```

---

## 角色管理页面（src/views/system/role/index.vue）

### 2024-06-19

- **AI助手**：

  - 作为表格主体、操作列按钮、字体样式等的标准参考，供流信息等页面对齐。
  - 操作列按钮采用 el-button link，字体13px、主色、加粗，hover主色加深。

  ```vue
  <el-button link @click="showPermissionDialog()"> 菜单权限 </el-button>
  <el-button link @click="showDialog('edit', scope.row)"> 编辑 </el-button>
  <el-button link @click="deleteRole()"> 删除 </el-button>
  ```

---

## 算法信息页面（src/views/algorithm/algoinfo/index.vue）

### 2024-06-19

- **AI助手**：页面结构初始化，占位内容"算法信息页面内容待完善"，风格与其他管理页统一。

  ```vue
  <template>
    <div class="empty-page">算法信息页面内容待完善</div>
  </template>
  ```

---

> 本文件用于汇总记录 2024-06-19 各页面所有结构和样式更改，便于团队全局查阅和同步修改习惯。
