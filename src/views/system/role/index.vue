<template>
  <div class="page-content">
    <ElForm>
      <ElRow :gutter="12">
        <ElCol :xs="24" :sm="12" :lg="6">
          <ElFormItem>
            <ElInput
              placeholder="请输入角色名称"
              v-model="searchForm.keyword"
              @keyup.enter="fetchRolesList"
            ></ElInput>
          </ElFormItem>
        </ElCol>
        <ElCol :xs="24" :sm="12" :lg="6">
          <ElFormItem>
            <ElButton v-ripple @click="fetchRolesList" :loading="loading">搜索</ElButton>
            <ElButton @click="showDialog('add')" v-ripple>新增角色</ElButton>
            <ElButton v-if="selectedRoles.length > 0" @click="batchOperateRoles">
              批量操作 ({{ selectedRoles.length }})
            </ElButton>
          </ElFormItem>
        </ElCol>
      </ElRow>
    </ElForm>

    <ArtTable :data="roleList" :loading="loading" index @selection-change="handleSelectionChange">
      <template #default>
        <ElTableColumn type="selection" width="55" />
        <ElTableColumn label="角色名称" prop="role_name" sortable />
        <ElTableColumn label="角色编码" prop="role_code" sortable>
          <template #default="scope">
            <ElTag type="info" size="small">{{ scope.row.role_code }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="描述" prop="description" show-overflow-tooltip />
        <ElTableColumn label="用户数量" prop="user_count" sortable width="100">
          <template #default="scope">
            <ElBadge :value="scope.row.user_count || 0" class="item" type="primary">
              <ElButton size="small" text>用户</ElButton>
            </ElBadge>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" prop="is_enabled" width="100">
          <template #default="scope">
            <ElSwitch v-model="scope.row.is_enabled" @change="toggleRoleStatus(scope.row)" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="创建时间" prop="created_at" sortable width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </ElTableColumn>
        <ElTableColumn fixed="right" label="操作" width="120px">
          <template #default="scope">
            <ElRow>
              <ArtButtonMore
                :list="getActionList(scope.row)"
                @click="buttonMoreClick($event, scope.row)"
              />
            </ElRow>
          </template>
        </ElTableColumn>
      </template>
    </ArtTable>

    <!-- 新增/编辑角色对话框 -->
    <ElDialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增角色' : '编辑角色'"
      width="30%"
      align-center
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="120px">
        <ElFormItem label="角色名称" prop="role_name">
          <ElInput v-model="form.role_name" placeholder="请输入角色名称" />
        </ElFormItem>
        <ElFormItem label="角色编码" prop="role_code">
          <ElInput
            v-model="form.role_code"
            placeholder="请输入角色编码(如：R_USER)"
            :disabled="dialogType === 'edit'"
          />
        </ElFormItem>
        <ElFormItem label="描述" prop="description">
          <ElInput
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
          />
        </ElFormItem>
        <ElFormItem label="启用状态">
          <ElSwitch v-model="form.is_enabled" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="dialogVisible = false">取消</ElButton>
          <ElButton type="primary" :loading="submitting" @click="handleSubmit(formRef)">
            {{ submitting ? '提交中...' : '提交' }}
          </ElButton>
        </div>
      </template>
    </ElDialog>

    <!-- 菜单权限对话框 -->
    <ElDialog
      v-model="permissionDialog"
      title="菜单权限配置"
      width="520px"
      align-center
      class="el-dialog-border"
    >
      <div v-if="currentRole">
        <p style="margin-bottom: 16px; color: #666">
          正在为角色「{{ currentRole.role_name }}」配置菜单权限
        </p>
      </div>
      <ElScrollbar height="70vh">
        <ElTree
          ref="treeRef"
          :data="processedMenuList"
          show-checkbox
          node-key="name"
          :default-expand-all="isExpandAll"
          :default-checked-keys="checkedMenus"
          :props="defaultProps"
          @check="handleTreeCheck"
        >
          <template #default="{ data }">
            <div style="display: flex; align-items: center">
              <span v-if="data.isAuth">
                {{ data.label }}
              </span>
              <span v-else>{{ defaultProps.label(data) }}</span>
            </div>
          </template>
        </ElTree>
      </ElScrollbar>
      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="toggleExpandAll">{{ isExpandAll ? '全部收起' : '全部展开' }}</ElButton>
          <ElButton @click="toggleSelectAll" style="margin-left: 8px">{{
            isSelectAll ? '取消全选' : '全部选择'
          }}</ElButton>
          <ElButton type="primary" :loading="savingPermission" @click="savePermission">
            {{ savingPermission ? '保存中...' : '保存' }}
          </ElButton>
        </div>
      </template>
    </ElDialog>

    <!-- 批量操作对话框 -->
    <ElDialog v-model="batchDialog" title="批量操作" width="400px" align-center>
      <ElForm :model="batchForm" label-width="120px">
        <ElFormItem label="操作类型">
          <ElSelect v-model="batchForm.operation" placeholder="请选择操作类型">
            <ElOption
              v-for="option in batchOperationOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="batchForm.operation === 'delete'" label="确认删除">
          <ElAlert title="警告：删除操作不可恢复，请谨慎操作！" type="warning" :closable="false" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="batchDialog = false">取消</ElButton>
          <ElButton
            type="primary"
            :loading="batchProcessing"
            @click="confirmBatchOperation"
            :disabled="!batchForm.operation"
          >
            {{ batchProcessing ? '处理中...' : '确认' }}
          </ElButton>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { useMenuStore } from '@/store/modules/menu'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import { formatMenuTitle } from '@/router/utils/utils'
  import { RoleService } from '@/api/roleApi'
  import { useOptions } from '@/composables/useOptions'
  import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'

  defineOptions({ name: 'Role' })

  // 使用统一选项管理
  const { statusOptions, fetchRolesWithSearch, rolesLoading } = useOptions()

  // 批量操作选项
  const batchOperationOptions = computed(() => [
    { label: '启用', value: 'enable' },
    { label: '禁用', value: 'disable' },
    { label: '删除', value: 'delete' }
  ])

  // 响应式数据
  const dialogVisible = ref(false)
  const permissionDialog = ref(false)
  const batchDialog = ref(false)
  const { menuList } = storeToRefs(useMenuStore())
  const treeRef = ref()
  const isExpandAll = ref(true)
  const isSelectAll = ref(false)
  const submitting = ref(false)
  const savingPermission = ref(false)
  const batchProcessing = ref(false)

  // 角色列表数据
  const roleList = ref<any[]>([])
  const selectedRoles = ref<any[]>([])
  const currentRole = ref<any>(null)
  const checkedMenus = ref<string[]>([])

  // 使用统一的加载状态
  const loading = computed(() => rolesLoading.value)

  // 搜索表单
  const searchForm = reactive({
    keyword: ''
  })

  // 批量操作表单
  const batchForm = reactive({
    operation: '' as 'delete' | 'enable' | 'disable' | ''
  })

  // 获取角色列表 - 使用统一的 fetchRolesWithSearch
  const fetchRolesList = async () => {
    try {
      const roles = await fetchRolesWithSearch({
        keyword: searchForm.keyword
      })
      roleList.value = roles
    } catch (error: any) {
      console.error('获取角色列表失败:', error)
      ElMessage.error(error.message || '获取角色列表失败')
      roleList.value = []
    }
  }

  // 页面初始化时获取角色列表
  onMounted(() => {
    fetchRolesList()
  })

  // 处理菜单数据，将 authList 转换为子节点
  const processedMenuList = computed(() => {
    const processNode = (node: any) => {
      const processed = { ...node }

      // 如果有 authList，将其转换为子节点
      if (node.meta && node.meta.authList && node.meta.authList.length) {
        const authNodes = node.meta.authList.map((auth: any) => ({
          id: `${node.id}_${auth.authMark}`,
          name: `${node.name}_${auth.authMark}`,
          label: auth.title,
          authMark: auth.authMark,
          isAuth: true,
          checked: auth.checked || false
        }))

        processed.children = processed.children ? [...processed.children, ...authNodes] : authNodes
      }

      // 递归处理子节点
      if (processed.children) {
        processed.children = processed.children.map(processNode)
      }

      return processed
    }

    return menuList.value.map(processNode)
  })

  const formRef = ref<FormInstance>()

  const rules = reactive<FormRules>({
    role_name: [
      { required: true, message: '请输入角色名称', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    role_code: [
      { required: true, message: '请输入角色编码', trigger: 'blur' },
      {
        pattern: /^R_[A-Z_]+$/,
        message: '角色编码必须以R_开头，只能包含大写字母和下划线',
        trigger: 'blur'
      }
    ],
    description: [{ required: true, message: '请输入角色描述', trigger: 'blur' }]
  })

  // 表单数据类型
  interface RoleFormData {
    role_name: string
    role_code: string
    description: string
    is_enabled: boolean
  }

  const form = reactive<RoleFormData>({
    role_name: '',
    role_code: '',
    description: '',
    is_enabled: true
  })

  const dialogType = ref('add')

  const showDialog = (type: string, row?: any) => {
    dialogVisible.value = true
    dialogType.value = type

    if (type === 'edit' && row) {
      form.role_name = row.role_name
      form.role_code = row.role_code
      form.description = row.description
      form.is_enabled = row.is_enabled
      currentRole.value = row
    } else {
      form.role_name = ''
      form.role_code = ''
      form.description = ''
      form.is_enabled = true
      currentRole.value = null
    }
  }

  // 获取操作按钮列表
  const getActionList = (row: any) => {
    const actions = [
      { key: 'permission', label: '菜单权限' },
      { key: 'edit', label: '编辑角色' }
    ]

    // 系统预设角色不允许删除
    if (!['R_SUPER'].includes(row.role_code)) {
      actions.push({ key: 'delete', label: '删除角色' })
    }

    return actions
  }

  const buttonMoreClick = (item: ButtonMoreItem, row: any) => {
    if (item.key === 'permission') {
      showPermissionDialog(row)
    } else if (item.key === 'edit') {
      showDialog('edit', row)
    } else if (item.key === 'delete') {
      deleteRole(row)
    }
  }

  const showPermissionDialog = (role: any) => {
    currentRole.value = role
    // TODO: 获取角色的菜单权限
    checkedMenus.value = []
    permissionDialog.value = true
  }

  // 切换角色状态
  const toggleRoleStatus = async (role: any) => {
    try {
      await RoleService.updateRole(role.role_id, {
        is_enabled: role.is_enabled
      })
      ElMessage.success(`角色已${role.is_enabled ? '启用' : '禁用'}`)
    } catch (error: any) {
      // 恢复原状态
      role.is_enabled = !role.is_enabled
      console.error('更新角色状态失败:', error)
      ElMessage.error(error.message || '更新角色状态失败')
    }
  }

  const defaultProps = {
    children: 'children',
    label: (data: any) => formatMenuTitle(data.meta?.title) || ''
  }

  const deleteRole = (role: any) => {
    ElMessageBox.confirm(`确定删除角色「${role.role_name}」吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        await RoleService.deleteRole(role.role_id)
        ElMessage.success('删除成功')
        fetchRolesList() // 重新获取列表
      } catch (error: any) {
        console.error('删除角色失败:', error)
        ElMessage.error(error.message || '删除失败')
      }
    })
  }

  const handleSubmit = async (formEl: FormInstance | undefined) => {
    if (!formEl) return

    const valid = await new Promise((resolve) => {
      formEl.validate((valid) => resolve(valid))
    })

    if (!valid) return

    try {
      submitting.value = true

      if (dialogType.value === 'add') {
        // 创建角色
        await RoleService.createRole({
          role_name: form.role_name,
          role_code: form.role_code,
          description: form.description,
          is_enabled: form.is_enabled
        })
        ElMessage.success('创建成功')
      } else {
        // 更新角色
        await RoleService.updateRole(currentRole.value.role_id, {
          role_name: form.role_name,
          description: form.description,
          is_enabled: form.is_enabled
        })
        ElMessage.success('更新成功')
      }

      dialogVisible.value = false
      formEl.resetFields()
      fetchRolesList() // 重新获取列表
    } catch (error: any) {
      console.error('提交失败:', error)
      ElMessage.error(error.message || '操作失败')
    } finally {
      submitting.value = false
    }
  }

  const savePermission = async () => {
    if (!currentRole.value) return

    try {
      savingPermission.value = true
      // TODO: 调用保存权限的API
      ElMessage.success('权限保存成功')
      permissionDialog.value = false
    } catch (error: any) {
      console.error('保存权限失败:', error)
      ElMessage.error(error.message || '保存权限失败')
    } finally {
      savingPermission.value = false
    }
  }

  // 表格选择变化
  const handleSelectionChange = (selection: any[]) => {
    selectedRoles.value = selection
  }

  // 批量操作角色
  const batchOperateRoles = () => {
    if (selectedRoles.value.length === 0) {
      ElMessage.warning('请先选择要操作的角色')
      return
    }
    batchForm.operation = ''
    batchDialog.value = true
  }

  // 确认批量操作
  const confirmBatchOperation = async () => {
    if (!batchForm.operation) {
      ElMessage.warning('请选择操作类型')
      return
    }

    try {
      batchProcessing.value = true

      // 如果是删除操作，需要检查是否包含基础角色
      if (batchForm.operation === 'delete') {
        const systemRoles = selectedRoles.value.filter((role) =>
          ['R_SUPER'].includes(role.role_code)
        )
        const deletableRoles = selectedRoles.value.filter(
          (role) => !['R_SUPER'].includes(role.role_code)
        )

        if (systemRoles.length > 0) {
          const systemRoleNames = systemRoles.map((role) => role.role_code).join('、')

          if (deletableRoles.length === 0) {
            // 全部都是系统角色，不能删除
            ElMessage.warning(`系统预设角色「${systemRoleNames}」不允许删除`)
            return
          } else {
            // 部分是系统角色，给出提示并继续删除其他角色
            await ElMessageBox.confirm(
              `选中的角色中包含系统预设角色「${systemRoleNames}」，这些角色不能删除。\n\n是否继续删除其他 ${deletableRoles.length} 个角色？`,
              '批量删除确认',
              {
                confirmButtonText: '继续删除',
                cancelButtonText: '取消',
                type: 'warning',
                dangerouslyUseHTMLString: false
              }
            )
          }
        }

        // 只操作可删除的角色
        const roleIds = deletableRoles.map((role) => role.role_id)

        if (roleIds.length === 0) {
          ElMessage.warning('没有可删除的角色')
          return
        }

        await RoleService.batchOperateRoles({
          role_ids: roleIds,
          operation: batchForm.operation
        })

        if (systemRoles.length > 0) {
          ElMessage.success(`批量删除完成，已跳过 ${systemRoles.length} 个系统预设角色`)
        } else {
          ElMessage.success('批量删除成功')
        }
      } else {
        // 其他操作（启用/禁用）正常处理
        const roleIds = selectedRoles.value.map((role) => role.role_id)

        await RoleService.batchOperateRoles({
          role_ids: roleIds,
          operation: batchForm.operation
        })

        const operationText = {
          enable: '启用',
          disable: '禁用'
        }[batchForm.operation]

        ElMessage.success(`批量${operationText}成功`)
      }

      batchDialog.value = false
      selectedRoles.value = []
      fetchRolesList() // 重新获取列表
    } catch (error: any) {
      if (error === 'cancel') {
        // 用户取消操作
        ElMessage.info('已取消批量删除')
      } else {
        console.error('批量操作失败:', error)
        ElMessage.error(error.message || '批量操作失败')
      }
    } finally {
      batchProcessing.value = false
    }
  }

  const toggleExpandAll = () => {
    const tree = treeRef.value
    if (!tree) return

    // 使用store.nodesMap直接控制所有节点的展开状态
    const nodes = tree.store.nodesMap
    for (const node in nodes) {
      nodes[node].expanded = !isExpandAll.value
    }

    isExpandAll.value = !isExpandAll.value
  }

  const toggleSelectAll = () => {
    const tree = treeRef.value
    if (!tree) return

    if (!isSelectAll.value) {
      // 全选：获取所有节点的key并设置为选中
      const allKeys = getAllNodeKeys(processedMenuList.value)
      tree.setCheckedKeys(allKeys)
    } else {
      // 取消全选：清空所有选中
      tree.setCheckedKeys([])
    }

    isSelectAll.value = !isSelectAll.value
  }

  const getAllNodeKeys = (nodes: any[]): string[] => {
    const keys: string[] = []
    const traverse = (nodeList: any[]) => {
      nodeList.forEach((node) => {
        if (node.name) {
          keys.push(node.name)
        }
        if (node.children && node.children.length > 0) {
          traverse(node.children)
        }
      })
    }
    traverse(nodes)
    return keys
  }

  const handleTreeCheck = () => {
    const tree = treeRef.value
    if (!tree) return

    // 使用树组件的getCheckedKeys方法获取选中的节点
    const checkedKeys = tree.getCheckedKeys()
    const allKeys = getAllNodeKeys(processedMenuList.value)

    // 判断是否全选：选中的节点数量等于总节点数量
    isSelectAll.value = checkedKeys.length === allKeys.length && allKeys.length > 0
  }

  const formatDate = (date: string) => {
    if (!date) return '-'
    return new Date(date)
      .toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
      .replace(/\//g, '-')
  }
</script>

<style lang="scss" scoped>
  .page-content {
    .svg-icon {
      width: 1.8em;
      height: 1.8em;
      overflow: hidden;
      vertical-align: -8px;
      fill: currentcolor;
    }
  }
  .item {
    margin-top: 10px;
    margin-right: 30px;
  }
</style>
