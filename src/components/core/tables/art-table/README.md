# Art Table 组件文档

## 组件概述

`ArtTable` 是一个基于 Element Plus ElTable 封装的高级表格组件，提供了丰富的功能和配置选项，包括分页、排序、筛选、树形数据展示、自定义列渲染等。

## 组件特性

- 支持自定义列配置和动态渲染
- 内置分页功能
- 支持表格样式定制（边框、斑马纹、表头背景等）
- 支持树形数据展示
- 支持全局序号显示
- 自适应移动端设备
- 提供丰富的事件和方法
- 支持插槽自定义内容

## 属性说明

### 基础属性

| 属性名  | 类型    | 默认值 | 说明             |
| ------- | ------- | ------ | ---------------- |
| data    | Array   | []     | 表格数据源       |
| columns | Array   | []     | 列配置数组       |
| loading | Boolean | false  | 是否显示加载状态 |

### 分页配置 (pagination)

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| current | Number | 1 | 当前页码 |
| size | Number | 20 | 每页显示条目个数 |
| total | Number | 0 | 总条目数 |
| sizes | Array | [20, 30, 50, 100] | 每页显示个数选择器的选项列表 |
| align | String | 'center' | 分页器的对齐方式，可选值：'left'、'center'、'right' |
| layout | String | 根据设备动态计算 | 分页器的布局 |
| hideOnSinglePage | Boolean | false | 只有一页时是否隐藏分页器 |
| componentSize | String | 'default' | 分页器的大小，可选值：'small'、'default'、'large' |

### 表格配置 (tableConfig)

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| rowKey | String/Function | 'id' | 行数据的 Key |
| height | String/Number | '100%' | 表格高度 |
| maxHeight | String/Number | - | 表格最大高度 |
| emptyHeight | String/Number | - | 表格空数据高度 |
| size | String | - | 表格大小，可选值：'small'、'default'、'large' |
| border | Boolean | null | 是否显示边框 |
| stripe | Boolean | null | 是否使用斑马纹样式 |
| showHeader | Boolean | true | 是否显示表头 |
| highlightCurrentRow | Boolean | false | 是否高亮当前行 |
| showHeaderBackground | Boolean | null | 是否显示表头背景色 |
| emptyText | String | '暂无数据' | 空数据时显示的文本 |
| treeProps | Object | - | 树形数据的配置 |
| defaultExpandAll | Boolean | false | 是否默认展开所有行 |
| expandRowKeys | Array | - | 设置目前的展开行 |
| defaultSort | Object | - | 默认的排序列的配置 |
| tooltipEffect | String | 'dark' | tooltip effect |
| showSummary | Boolean | false | 是否显示合计行 |
| sumText | String | '合计' | 合计行第一列的文本 |

### 布局配置 (layout)

| 属性名    | 类型    | 默认值 | 说明             |
| --------- | ------- | ------ | ---------------- |
| marginTop | Number  | 20     | 表格距离顶部距离 |
| showIndex | Boolean | false  | 是否显示序号列   |

### 列配置 (Column)

| 属性名         | 类型           | 说明                                                          |
| -------------- | -------------- | ------------------------------------------------------------- |
| prop           | String         | 对应列内容的字段名                                            |
| label          | String         | 显示的标题                                                    |
| width          | String/Number  | 列宽度                                                        |
| minWidth       | String/Number  | 列最小宽度                                                    |
| fixed          | String/Boolean | 列是否固定                                                    |
| align          | String         | 对齐方式                                                      |
| type           | String         | 列类型，可选值：'selection'、'index'、'expand'、'globalIndex' |
| useSlot        | Boolean        | 是否使用插槽渲染列内容                                        |
| slotName       | String         | 内容插槽名称，默认为 prop 值                                  |
| useHeaderSlot  | Boolean        | 是否使用插槽渲染表头                                          |
| headerSlotName | String         | 表头插槽名称，默认为 `${prop}-header`                         |
| formatter      | Function       | 用来格式化内容                                                |

## 事件说明

### 分页事件

| 事件名                    | 参数       | 说明             |
| ------------------------- | ---------- | ---------------- |
| pagination:change         | pagination | 分页配置变化     |
| pagination:size-change    | size       | 每页显示条数变化 |
| pagination:current-change | current    | 当前页码变化     |

### 行操作事件

| 事件名               | 参数                      | 说明           |
| -------------------- | ------------------------- | -------------- |
| row:click            | row, column, event        | 行点击事件     |
| row:dblclick         | row, column, event        | 行双击事件     |
| row:contextmenu      | row, column, event        | 行右键事件     |
| row:selection-change | selection                 | 选择项变化事件 |
| row:current-change   | currentRow, oldCurrentRow | 当前行变化事件 |

### 单元格事件

| 事件名           | 参数                     | 说明               |
| ---------------- | ------------------------ | ------------------ |
| cell:click       | row, column, cell, event | 单元格点击事件     |
| cell:dblclick    | row, column, cell, event | 单元格双击事件     |
| cell:mouse-enter | row, column, cell, event | 单元格鼠标进入事件 |
| cell:mouse-leave | row, column, cell, event | 单元格鼠标离开事件 |

### 表头事件

| 事件名             | 参数          | 说明         |
| ------------------ | ------------- | ------------ |
| header:click       | column, event | 表头点击事件 |
| header:contextmenu | column, event | 表头右键事件 |

### 排序筛选事件

| 事件名        | 参数       | 说明         |
| ------------- | ---------- | ------------ |
| sort:change   | sortInfo   | 排序变化事件 |
| filter:change | filterInfo | 筛选变化事件 |

### 展开选择事件

| 事件名        | 参数              | 说明           |
| ------------- | ----------------- | -------------- |
| expand:change | row, expandedRows | 展开行变化事件 |
| select        | selection, row    | 选择某一行事件 |
| select:all    | selection         | 全选事件       |

## 插槽说明

- `default` - 可直接放置 ElTableColumn 组件进行自定义列定义
- 动态列插槽 - 通过列配置的 `slotName` 或 `prop` 值创建的插槽
- 动态表头插槽 - 通过列配置的 `headerSlotName` 或 `${prop}-header` 创建的插槽

## 方法说明

| 方法名             | 参数          | 说明             |
| ------------------ | ------------- | ---------------- |
| getTableInstance   | -             | 获取表格实例     |
| expandAll          | -             | 展开所有树形行   |
| collapseAll        | -             | 折叠所有树形行   |
| toggleRowExpansion | row, expanded | 切换行的展开状态 |
| clearSelection     | -             | 清空多选         |
| toggleRowSelection | row, selected | 切换行的选中状态 |
| toggleAllSelection | -             | 切换全选状态     |
| setCurrentRow      | row           | 设置当前行       |
| clearSort          | -             | 清空排序         |
| clearFilter        | columnKeys    | 清空过滤         |
| sort               | prop, order   | 手动排序         |
| doLayout           | -             | 重新布局         |
| scrollToTop        | -             | 滚动到顶部       |
| scrollToPosition   | position      | 滚动到指定位置   |

## 使用示例

```vue
<template>
  <ArtTable
    :data="tableData"
    :columns="columns"
    :loading="loading"
    :pagination="pagination"
    :tableConfig="tableConfig"
    :layout="layout"
    @row:click="handleRowClick"
    @pagination:change="handlePaginationChange"
  >
    <!-- 自定义插槽 -->
    <template #operation="{ row }">
      <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
      <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
    </template>
  </ArtTable>
</template>

<script setup>
  import { ref, reactive } from 'vue'

  // 表格数据
  const tableData = ref([
    { id: 1, name: '张三', age: 25, address: '北京市' },
    { id: 2, name: '李四', age: 30, address: '上海市' }
  ])

  // 列配置
  const columns = reactive([
    { prop: 'name', label: '姓名', width: 120 },
    { prop: 'age', label: '年龄', width: 80 },
    { prop: 'address', label: '地址', minWidth: 180 },
    { label: '操作', width: 180, useSlot: true, slotName: 'operation' }
  ])

  // 分页配置
  const pagination = reactive({
    current: 1,
    size: 20,
    total: 100
  })

  // 表格配置
  const tableConfig = reactive({
    border: true,
    stripe: true,
    highlightCurrentRow: true
  })

  // 布局配置
  const layout = reactive({
    showIndex: true
  })

  // 加载状态
  const loading = ref(false)

  // 事件处理
  const handleRowClick = (row) => {
    console.log('点击了行', row)
  }

  const handlePaginationChange = (pagination) => {
    console.log('分页变化', pagination)
    // 这里可以发起请求获取数据
  }

  const handleEdit = (row) => {
    console.log('编辑', row)
  }

  const handleDelete = (row) => {
    console.log('删除', row)
  }
</script>
```

## 注意事项

1. 移动端适配时分页器布局会自动调整
2. 表格大小、边框、斑马纹等可以通过 tableConfig 配置，也可以从 store 中获取全局配置
3. 使用树形数据时需要设置 treeProps
4. 前端分页和后端分页可通过 pagination.total 值判断
