<!-- 用户搜索栏 -->
<template>
  <ArtSearchBar
    v-model:filter="filter"
    :items="formItems"
    @reset="handleReset"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
  import type { SearchFormItem } from '@/types'
  import { useOptions } from '@/composables/useOptions'

  interface Props {}

  const props = withDefaults(defineProps<Props>(), {})

  const filter = defineModel<any>('filter', { required: true })

  const emit = defineEmits<{
    reset: []
    search: [params: Record<string, any>]
  }>()

  // 使用统一选项管理 composable
  const { roleOptions, userStatusOptions, initializeOptions } = useOptions()

  // 组件挂载时获取数据
  onMounted(() => {
    initializeOptions()
  })

  // 重置处理
  const handleReset = () => {
    emit('reset')
  }

  // 搜索处理
  const handleSearch = () => {
    emit('search', filter.value)
  }

  const handleFormChange = () => {
    emit('search', filter.value)
  }

  // --- 表单配置项 ---
  const formItems: SearchFormItem[] = [
    {
      label: '用户名',
      prop: 'username',
      type: 'input',
      config: {
        clearable: true,
        placeholder: '输入用户名进行搜索'
      },
      onChange: handleFormChange
    },
    {
      label: '电话',
      prop: 'phone',
      type: 'input',
      config: {
        clearable: true,
        placeholder: '输入手机号进行搜索'
      },
      onChange: handleFormChange
    },
    {
      label: '角色',
      prop: 'role_filter',
      type: 'select',
      config: {
        clearable: true,
        placeholder: '选择用户角色'
      },
      // 动态获取角色选项
      options: () => roleOptions.value,
      onChange: handleFormChange
    },
    {
      label: '地址',
      prop: 'address',
      type: 'input',
      config: {
        clearable: true,
        placeholder: '输入地址信息进行搜索'
      },
      onChange: handleFormChange
    },
    {
      label: '邮箱',
      prop: 'email',
      type: 'input',
      config: {
        clearable: true,
        placeholder: '输入邮箱地址进行搜索'
      },
      onChange: handleFormChange
    },
    {
      prop: 'date',
      label: '日期',
      type: 'date',
      config: {
        type: 'date',
        placeholder: '请选择日期'
      }
    },
    {
      prop: 'daterange',
      label: '日期范围',
      type: 'daterange',
      config: {
        type: 'daterange',
        startPlaceholder: '开始时间',
        endPlaceholder: '结束时间'
      }
    },
    {
      label: '状态',
      prop: 'status',
      type: 'radio',
      options: () => userStatusOptions.value,
      onChange: handleFormChange
    }
  ]
</script>
