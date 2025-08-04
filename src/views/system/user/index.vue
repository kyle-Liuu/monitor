<!-- 用户管理 -->
<!-- art-full-height 自动计算出页面剩余高度 -->
<!-- art-table-card 一个符合系统样式的 class，同时自动撑满剩余高度 -->
<!-- 如果你想使用 template 语法，请移步功能示例下面的高级表格示例 -->
<template>
  <div class="user-page art-full-height">
    <!-- 搜索栏 -->
    <UserSearch v-model:filter="defaultFilter" @reset="resetSearch" @search="handleSearch" />

    <ElCard class="art-table-card" shadow="never">
      <!-- 表格头部 -->
      <ArtTableHeader v-model:columns="columnChecks" @refresh="refreshAll">
        <template #left>
          <ElButton @click="showDialog('add')">新增用户</ElButton>
          <ElButton v-if="selectedRows.length > 0" type="danger" @click="batchDeleteUsers">
            批量删除 ({{ selectedRows.length }})
          </ElButton>
        </template>
      </ArtTableHeader>

      <!-- 表格 -->
      <ArtTable
        :loading="isLoading"
        :data="tableData"
        :columns="columns"
        :pagination="{
          current: paginationState.current,
          size: paginationState.size,
          total: paginationState.total ?? 0
        }"
        :table-config="{ rowKey: 'id' }"
        :layout="{ marginTop: 10 }"
        @row:selection-change="handleSelectionChange"
        @pagination:size-change="onPageSizeChange"
        @pagination:current-change="onCurrentPageChange"
      >
      </ArtTable>

      <!-- 用户弹窗 -->
      <UserDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :user-data="currentUserData"
        @submit="handleDialogSubmit"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { ACCOUNT_TABLE_DATA } from '@/mock/temp/formData'
  import { ElMessageBox, ElMessage, ElTag } from 'element-plus'
  import { useTable } from '@/composables/useTable'
  import { UserService } from '@/api/usersApi'
  import UserSearch from './modules/user-search.vue'
  import UserDialog from './modules/user-dialog.vue'

  defineOptions({ name: 'User' })

  type UserListItem = Api.User.UserListItem
  const { width } = useWindowSize()
  const { getUserList, deleteUser, batchOperateUsers } = UserService

  // 弹窗相关
  const dialogType = ref<Form.DialogType>('add')
  const dialogVisible = ref(false)
  const currentUserData = ref<Partial<UserListItem>>({})

  // 选中行
  const selectedRows = ref<UserListItem[]>([])

  // 表单搜索初始值
  const defaultFilter = ref({
    name: undefined,
    level: 'normal',
    date: '2025-01-05',
    daterange: ['2025-01-01', '2025-02-10'],
    status: '1'
  })

  // 用户状态配置
  const USER_STATUS_CONFIG = {
    '1': { type: 'success' as const, text: '启用' },
    '2': { type: 'danger' as const, text: '禁用' },
    active: { type: 'success' as const, text: '启用' },
    inactive: { type: 'danger' as const, text: '禁用' }
  } as const

  /**
   * 获取用户状态配置
   */
  const getUserStatusConfig = (status: string) => {
    return (
      USER_STATUS_CONFIG[status as keyof typeof USER_STATUS_CONFIG] || {
        type: 'info' as const,
        text: '未知'
      }
    )
  }

  const {
    columns,
    columnChecks,
    tableData,
    isLoading,
    paginationState,
    searchData,
    searchState,
    resetSearch,
    onPageSizeChange,
    onCurrentPageChange,
    refreshAll
  } = useTable<UserListItem>({
    // 核心配置
    core: {
      apiFn: getUserList,
      apiParams: {
        current: 1,
        size: 20,
        keyword: ''
      },
      // 自定义分页字段映射，同时需要在 apiParams 中配置字段名
      // paginationKey: {
      //   current: 'pageNum',
      //   size: 'pageSize'
      // },
      columnsFactory: () => [
        { type: 'selection' }, // 勾选列
        { type: 'index', width: 60, label: '序号' }, // 序号
        {
          prop: 'avatar',
          label: '用户信息',
          minWidth: width.value < 500 ? 220 : 200,
          formatter: (row) => {
            return h('div', { class: 'user', style: 'display: flex; align-items: center' }, [
              h('img', { class: 'avatar', src: row.avatar }),
              h('div', {}, [
                h('p', { class: 'user-name' }, row.userName),
                h('p', { class: 'email' }, row.userEmail),
                // 显示用户标签
                ...(row.userTags && row.userTags.length > 0
                  ? [
                      h(
                        'div',
                        { class: 'tags' },
                        row.userTags.map((tag: string) =>
                          h(ElTag, { size: 'small', style: 'margin-right: 4px;' }, () => tag)
                        )
                      )
                    ]
                  : [])
              ])
            ])
          }
        },
        {
          prop: 'userGender',
          label: '性别',
          width: 80,
          sortable: true,
          formatter: (row) => row.userGender || '-'
        },
        {
          prop: 'userPhone',
          label: '手机号',
          width: 130,
          formatter: (row) => row.userPhone || '-'
        },
        {
          prop: 'userRoles',
          label: '角色',
          width: 120,
          formatter: (row) => {
            if (!row.userRoles || row.userRoles.length === 0) return '-'
            return h(
              'div',
              { class: 'roles' },
              row.userRoles
                .slice(0, 2)
                .map((role) =>
                  h(ElTag, { type: 'primary', size: 'small', style: 'margin-right: 4px;' }, () => {
                    // 角色代码映射为可读名称
                    const roleNames = {
                      R_SUPER: '超级管理员',
                      R_ADMIN: '管理员',
                      R_USER: '普通用户'
                    }
                    return roleNames[role as keyof typeof roleNames] || role
                  })
                )
                .concat(
                  row.userRoles.length > 2
                    ? [
                        h(
                          'span',
                          { style: 'color: #999; font-size: 12px;' },
                          `+${row.userRoles.length - 2}`
                        )
                      ]
                    : []
                )
            )
          }
        },
        {
          prop: 'status',
          label: '状态',
          width: 80,
          formatter: (row) => {
            const statusConfig = getUserStatusConfig(row.status)
            return h(ElTag, { type: statusConfig.type }, () => statusConfig.text)
          }
        },
        {
          prop: 'created_at',
          label: '创建日期',
          width: 160,
          sortable: true,
          formatter: (row) => row.created_at || '-'
        },
        {
          prop: 'operation',
          label: '操作',
          width: 140,
          fixed: 'right', // 固定列
          formatter: (row) =>
            h('div', [
              h(ArtButtonTable, {
                type: 'edit',
                onClick: () => showDialog('edit', row)
              }),
              h(ArtButtonTable, {
                type: 'delete',
                onClick: () => handleDeleteUser(row)
              })
            ])
        }
      ]
    },
    // 数据处理
    transform: {
      // 数据转换器 - 替换头像和处理数据格式
      dataTransformer: (records: any) => {
        // 类型守卫检查
        if (!Array.isArray(records)) {
          console.warn('数据转换器: 期望数组类型，实际收到:', typeof records)
          return []
        }

        // 使用本地头像替换接口返回的头像，并处理数据格式
        return records.map((item: any, index: number) => {
          return {
            ...item,
            avatar: ACCOUNT_TABLE_DATA[index % ACCOUNT_TABLE_DATA.length].avatar,
            // 处理角色数据：如果是字符串则分割为数组
            userRoles:
              typeof item.userRoles === 'string'
                ? item.userRoles.split(',').filter(Boolean)
                : Array.isArray(item.userRoles)
                  ? item.userRoles
                  : [],
            // 处理标签数据
            userTags:
              typeof item.userTags === 'string'
                ? item.userTags.split(',').filter(Boolean)
                : Array.isArray(item.userTags)
                  ? item.userTags
                  : []
          }
        })
      }
    },
    // 性能优化
    performance: {
      enableCache: true, // 是否开启缓存
      cacheTime: 10 * 60 * 1000 // 缓存时间 10分钟
    },
    // 生命周期钩子
    hooks: {
      onError: (error) => ElMessage.error(error.message) // 错误处理
    },
    // 调试配置
    debug: {
      enableLog: true // 是否开启日志
    }
  })

  /**
   * 搜索处理
   * @param params 参数
   */
  const handleSearch = (params: Record<string, any>) => {
    // 处理日期区间参数，把 daterange 转换为 startTime 和 endTime
    const { daterange, ...searchParams } = params
    const [startTime, endTime] = Array.isArray(daterange) ? daterange : [null, null]

    // 搜索参数赋值
    Object.assign(searchState, { ...searchParams, startTime, endTime })
    searchData()
  }

  /**
   * 显示用户弹窗
   */
  const showDialog = (type: Form.DialogType, row?: UserListItem): void => {
    console.log('打开弹窗:', { type, row })
    dialogType.value = type
    currentUserData.value = row || {}
    nextTick(() => {
      dialogVisible.value = true
    })
  }

  /**
   * 删除单个用户
   */
  const handleDeleteUser = (row: UserListItem): void => {
    ElMessageBox.confirm(`确定要删除用户「${row.userName}」吗？`, '删除用户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        await deleteUser(row.id)
        ElMessage.success('删除成功')
      } catch (error: any) {
        console.error('删除用户失败:', error)
        ElMessage.error(error.message || '删除失败')
      }
    })
  }

  /**
   * 批量删除用户
   */
  const batchDeleteUsers = (): void => {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请先选择要删除的用户')
      return
    }

    ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个用户吗？`,
      '批量删除用户',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(async () => {
      try {
        const userIds = selectedRows.value.map((row) => row.id)
        await batchOperateUsers({
          operation: 'delete',
          user_ids: userIds
        })

        ElMessage.success(`成功删除 ${selectedRows.value.length} 个用户`)
        selectedRows.value = [] // 清空选中
      } catch (error: any) {
        console.error('批量删除失败:', error)
        ElMessage.error(error.message || '批量删除失败')
      }
    })
  }

  /**
   * 处理弹窗提交事件
   */
  const handleDialogSubmit = async () => {
    try {
      dialogVisible.value = false
      currentUserData.value = {}
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  /**
   * 处理表格行选择变化
   */
  const handleSelectionChange = (selection: UserListItem[]): void => {
    selectedRows.value = selection
    console.log('选中行数据:', selectedRows.value)
  }
</script>

<style lang="scss" scoped>
  .user-page {
    :deep(.user) {
      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 6px;
      }

      > div {
        margin-left: 10px;

        .user-name {
          font-weight: 500;
          color: var(--art-text-gray-800);
          margin-bottom: 2px;
        }

        .email {
          font-size: 12px;
          color: var(--art-text-gray-500);
          margin-bottom: 4px;
        }

        .tags {
          margin-top: 4px;
        }
      }
    }

    :deep(.roles) {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
  }
</style>
