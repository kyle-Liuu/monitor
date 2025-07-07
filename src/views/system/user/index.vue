<template>
  <ArtTableFullScreen>
    <div class="account-page" id="table-full-screen">
      <!-- 搜索栏 -->
      <ArtSearchBar
        v-model:filter="formFilters"
        :items="formItems"
        @reset="handleReset"
        @search="handleSearch"
      ></ArtSearchBar>

      <ElCard shadow="never" class="art-table-card">
        <!-- 表格头部 -->
        <ArtTableHeader v-model:columns="columnChecks" @refresh="handleRefresh">
          <template #left>
            <ElButton @click="showDialog('add')">新增用户</ElButton>
          </template>
        </ArtTableHeader>

        <!-- 表格 -->
        <ArtTable
          ref="tableRef"
          row-key="id"
          :loading="loading"
          :data="tableData"
          :currentPage="pagination.currentPage"
          :pageSize="pagination.pageSize"
          :total="pagination.total"
          :marginTop="10"
          @selection-change="handleSelectionChange"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        >
          <template #default>
            <ElTableColumn v-for="col in columns" :key="col.prop || col.type" v-bind="col" />
          </template>
        </ArtTable>

        <ElDialog
          v-model="dialogVisible"
          :title="dialogType === 'add' ? '添加用户' : '编辑用户'"
          width="30%"
          align-center
        >
          <ElForm ref="formRef" :model="formData" :rules="rules" label-width="80px">
            <ElFormItem label="用户名" prop="username">
              <ElInput v-model="formData.username" />
            </ElFormItem>
            <ElFormItem label="手机号" prop="phone">
              <ElInput v-model="formData.phone" />
            </ElFormItem>
            <ElFormItem label="性别" prop="gender">
              <ElSelect v-model="formData.gender">
                <ElOption label="男" :value="1" />
                <ElOption label="女" :value="2" />
                <ElOption label="保密" :value="0" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="角色" prop="role">
              <ElSelect v-model="formData.role" multiple>
                <ElOption
                  v-for="role in roleList"
                  :key="role.roleCode"
                  :value="role.roleCode"
                  :label="role.roleName"
                />
              </ElSelect>
            </ElFormItem>
          </ElForm>
          <template #footer>
            <div class="dialog-footer">
              <ElButton @click="dialogVisible = false">取消</ElButton>
              <ElButton type="primary" @click="handleSubmit">提交</ElButton>
            </div>
          </template>
        </ElDialog>
      </ElCard>
    </div>
  </ArtTableFullScreen>
</template>

<script setup lang="ts">
  import { h } from 'vue'
  import { ROLE_LIST_DATA, ACCOUNT_TABLE_DATA } from '@/mock/temp/formData'

  import { ElDialog, FormInstance, ElTag } from 'element-plus'
  import { ElMessageBox, ElMessage } from 'element-plus'
  import type { FormRules } from 'element-plus'
  import { useCheckedColumns } from '@/composables/useCheckedColumns'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { UserService } from '@/api/userApi'
  import { SearchChangeParams, SearchFormItem } from '@/types'
  import { useUserStore } from '@/store/modules/user'
  import { formatAvatarUrl } from '@/utils/dataprocess/format'
  const { width } = useWindowSize()

  defineOptions({ name: 'User' }) // 定义组件名称，用于 KeepAlive 缓存控制

  const dialogType = ref('add')
  const dialogVisible = ref(false)
  const loading = ref(false)

  // 定义表单搜索初始值
  const initialSearchState = {
    name: '',
    phone: '',
    address: '',
    level: '',
    email: '',
    date: '',
    daterange: '',
    status: '1'
  }

  const roleList = ref<any[]>([])

  // 响应式表单数据
  const formFilters = reactive({ ...initialSearchState })

  const pagination = reactive({
    currentPage: 1,
    pageSize: 20,
    total: 0
  })

  // 表格数据
  const tableData = ref<any[]>([])

  // 表格实例引用
  const tableRef = ref()

  // 选中的行数据
  const selectedRows = ref<any[]>([])

  // 重置表单
  const handleReset = () => {
    Object.assign(formFilters, { ...initialSearchState })
    pagination.currentPage = 1 // 重置到第一页
    getUserList()
  }

  // 搜索处理
  const handleSearch = () => {
    console.log('搜索参数:', formFilters)
    pagination.currentPage = 1 // 搜索时重置到第一页
    getUserList()
  }

  // 表单项变更处理
  const handleFormChange = (params: SearchChangeParams): void => {
    console.log('表单项变更:', params)
  }

  // 表单配置项
  const formItems: SearchFormItem[] = [
    {
      label: '用户名',
      prop: 'name',
      type: 'input',
      config: {
        clearable: true
      },
      onChange: handleFormChange
    },

    {
      label: '电话',
      prop: 'phone',
      type: 'input',
      config: {
        clearable: true
      },
      onChange: handleFormChange
    },
    {
      label: '用户等级',
      prop: 'level',
      type: 'select',
      config: {
        clearable: true
      },
      options: () => [
        { label: '普通用户', value: 'normal' },
        { label: 'VIP用户', value: 'vip' },
        { label: '高级VIP', value: 'svip' },
        { label: '企业用户', value: 'enterprise', disabled: true }
      ],
      onChange: handleFormChange
    },
    {
      label: '地址',
      prop: 'address',
      type: 'input',
      config: {
        clearable: true
      },
      onChange: handleFormChange
    },
    {
      label: '邮箱',
      prop: 'email',
      type: 'input',
      config: {
        clearable: true
      },
      onChange: handleFormChange
    },
    // 支持 9 种日期类型定义
    // 具体可参考 src/components/core/forms/art-search-bar/widget/art-search-date/README.md
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
      options: [
        { label: '在线', value: '1' },
        { label: '离线', value: '2' }
      ],
      onChange: handleFormChange
    }
  ]

  // 获取标签类型
  // 1: 在线 2: 离线 3: 异常 4: 注销
  const getTagType = (status: string | number) => {
    // 将状态转换为字符串
    const statusStr = String(status)
    switch (statusStr) {
      case '1':
        return 'success'
      case '2':
        return 'info'
      case '3':
        return 'warning'
      case '4':
        return 'danger'
      default:
        return 'info'
    }
  }

  // 构建标签文本
  const buildTagText = (status: string | number) => {
    // 将状态转换为字符串
    const statusStr = String(status)
    let text = ''
    if (statusStr === '1') {
      text = '在线'
    } else if (statusStr === '2') {
      text = '离线'
    } else if (statusStr === '3') {
      text = '异常'
    } else if (statusStr === '4') {
      text = '注销'
    } else {
      text = '未知'
    }
    return text
  }

  // 显示对话框
  const showDialog = (type: string, row?: any) => {
    dialogVisible.value = true
    dialogType.value = type

    // 重置表单验证状态
    if (formRef.value) {
      formRef.value.resetFields()
    }

    if (type === 'edit' && row) {
      formData.username = row.username
      formData.phone = row.userPhone
      formData.gender = row.userGender // 直接使用数字代码: 1=男, 2=女, 0=保密

      // 将用户角色代码数组直接赋值给formData.role
      formData.role = Array.isArray(row.userRoles) ? row.userRoles : []
    } else {
      formData.username = ''
      formData.phone = ''
      formData.gender = 1 // 默认为"男"
      formData.role = []
    }
  }

  // 删除用户
  const deleteUser = () => {
    ElMessageBox.confirm('确定要注销该用户吗？', '注销用户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    }).then(() => {
      ElMessage.success('注销成功')
    })
  }

  // 动态列配置
  const { columnChecks, columns } = useCheckedColumns(() => [
    { type: 'selection' }, // 勾选列
    // { type: 'expand', label: '展开', width: 80 }, // 展开列
    // { type: 'index', label: '序号', width: 80 }, // 序号列
    {
      prop: 'avatar',
      label: '用户名',
      minWidth: width.value < 500 ? 220 : '',
      formatter: (row: any) => {
        return h('div', { class: 'user', style: 'display: flex; align-items: center' }, [
          h('img', { class: 'avatar', src: formatAvatarUrl(row.avatar) }),
          h('div', {}, [
            h('p', { class: 'user-name' }, row.username),
            h('p', { class: 'email' }, row.userEmail)
          ])
        ])
      }
    },
    {
      prop: 'userGender',
      label: '性别',
      sortable: true,
      formatter: (row) => (row.userGender === 1 ? '男' : row.userGender === 2 ? '女' : '保密')
    },
    { prop: 'userPhone', label: '手机号' },
    {
      prop: 'status',
      label: '状态',
      formatter: (row) => {
        // 确保状态值存在
        const status = row.status !== undefined ? row.status : '2'
        return h(ElTag, { type: getTagType(status) }, () => buildTagText(status))
      }
    },
    {
      prop: 'userRoles',
      label: '角色',
      formatter: (row) => {
        // 处理userRoles可能是不同格式的情况
        const roles = row.userRoles || []
        if (!roles.length) return '-'
        
        return h('div', {}, roles.map((role: string | any) => {
          // 处理role可能是对象的情况
          const roleText = typeof role === 'object' ? (role.role_code || role.roleName || '-') : role
          return h(ElTag, { size: 'small', effect: 'light', style: 'margin-right: 5px' }, () => roleText)
        }))
      }
    },
    {
      prop: 'createTime',
      label: '创建日期',
      sortable: true
    },
    {
      prop: 'operation',
      label: '操作',
      width: 150,
      // fixed: 'right', // 固定在右侧
      // disabled: true,
      formatter: (row: any) => {
        return h('div', [
          h(ArtButtonTable, {
            type: 'edit',
            onClick: () => showDialog('edit', row)
          }),
          h(ArtButtonTable, {
            type: 'delete',
            onClick: () => deleteUser()
          })
        ])
      }
    }
  ])

  // 表单实例
  const formRef = ref<FormInstance>()

  // 表单数据
  const formData = reactive({
    username: '',
    phone: '',
    gender: 1, // 数字类型: 1=男, 2=女, 0=保密
    role: [] as string[]
  })

  // 使用用户store
  const userStore = useUserStore()

  // 在组件挂载时获取数据
  onMounted(() => {
    getUserList()
    getRoleList()
  })

  // 获取用户列表数据
  const getUserList = async () => {
    loading.value = true
    try {
      const { currentPage, pageSize } = pagination
      
      // 使用API获取用户列表
      const result = await UserService.getUserList({
        current: currentPage,
        size: pageSize
      }) as any
      
      console.log('后端返回的用户数据:', result)
      
      // 处理返回的数据
      let records: any[] = []
      let current = currentPage
      let size = pageSize
      let total = 0
      
      // 检查返回的数据格式
      if (result && typeof result === 'object') {
        // 标准分页格式
        if ('records' in result && 'total' in result) {
          records = result.records || []
          current = result.current || currentPage
          size = result.size || pageSize
          total = result.total || 0
        } 
        // 数组格式
        else if (Array.isArray(result)) {
          records = result as any[]
          total = records.length
        }
      }
      
      // 使用本地头像替换接口返回的头像，并确保字段名称一致
      tableData.value = records.map((item: any, index: number) => ({
        ...item,
        // 保持原有字段
        username: item.username,
        // 正确映射字段
        userEmail: item.email,
        userPhone: item.phone,
        userGender: item.gender,
        createTime: item.created_at,
        // 确保状态字段存在
        status: item.status || '2',
        // 映射角色信息 - 确保用户角色数组存在
        userRoles: Array.isArray(item.userRoles) ? item.userRoles : 
                   (Array.isArray(item.roles) ? item.roles.map((r: any) => r.role_code || r) : []),
        // 使用后端返回的头像或本地头像
        avatar: item.avatar || ACCOUNT_TABLE_DATA[index % ACCOUNT_TABLE_DATA.length].avatar
      }))

      // 更新分页信息
      Object.assign(pagination, { currentPage: current, pageSize: size, total })
    } catch (error: any) {
      console.error('获取用户列表失败:', error)
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        fullError: JSON.stringify(error, null, 2)
      })
      ElMessage.error(`获取用户列表失败: ${error.message || '未知错误'}`)
      // 如果API请求失败，使用模拟数据
      tableData.value = ACCOUNT_TABLE_DATA.slice(0, pagination.pageSize)
      pagination.total = ACCOUNT_TABLE_DATA.length
    } finally {
      loading.value = false
    }
  }

  const getRoleList = () => {
    roleList.value = ROLE_LIST_DATA
  }

  const handleRefresh = () => {
    getUserList()
  }

  // 处理表格行选择变化
  const handleSelectionChange = (selection: any[]) => {
    selectedRows.value = selection
  }

  // 表单验证规则
  const rules = reactive<FormRules>({
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    phone: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
    ],
    gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
    role: [{ required: true, message: '请选择角色', trigger: 'change' }]
  })

  // 提交表单
  const handleSubmit = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
      if (valid) {
        try {
          // 构建请求数据
          const requestData: any = {
            username: formData.username,
            phone: formData.phone,
            gender: Number(formData.gender),
            roles: formData.role // 直接使用role数组作为roles
          }

          if (dialogType.value === 'add') {
            // 创建用户
            await UserService.createUser({
              ...requestData,
              password: '12345678', // 默认密码
              email: `${formData.username}@example.com` // 默认邮箱
            })
            ElMessage.success('用户创建成功')
          } else {
            // 更新用户
            const currentUser = tableData.value.find(item => item.username === formData.username)
            if (currentUser?.user_id) {
              await UserService.updateUser(currentUser.user_id, requestData)
              ElMessage.success('用户更新成功')
            } else {
              throw new Error('找不到用户ID')
            }
          }
          
          // 刷新用户列表
          getUserList()
          
          // 关闭对话框
          dialogVisible.value = false
        } catch (error: any) {
          console.error('提交表单失败:', error)
          ElMessage.error(`操作失败: ${error.message || '未知错误'}`)
        }
      }
    })
  }

  // 处理表格分页变化
  const handleSizeChange = (newPageSize: number) => {
    pagination.pageSize = newPageSize
    getUserList()
  }

  const handleCurrentChange = (newCurrentPage: number) => {
    pagination.currentPage = newCurrentPage
    getUserList()
  }
</script>

<style lang="scss" scoped>
  .account-page {
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
        }
      }
    }
  }
</style>
