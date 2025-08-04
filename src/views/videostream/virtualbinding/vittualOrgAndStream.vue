<template>
  <div class="streaminfo-page">
    <!-- 搜索区域 -->
    <ArtSearchBar
      v-model:filter="formFilters"
      :items="formItems"
      @reset="handleReset"
      @search="handleSearch"
    />
    <ElCard shadow="never" class="art-table-card">
      <ArtTableHeader
        v-model:columns="columnChecks"
        @refresh="handleRefresh"
        layout="refresh,size,fullscreen,columns,settings"
        fullClass="art-table-card"
      >
        <template #left>
          <ElButton @click="openTransfer" v-ripple type="primary">新增</ElButton>
          <ElButton
            type="danger"
            :disabled="!selectedRows.length"
            @click="handleBatchDelete"
            :loading="batchOperationLoading"
          >
            批量删除
          </ElButton>
          <ElButton
            type="success"
            :disabled="!selectedRows.length"
            @click="handleBatchEnable(true)"
            :loading="batchOperationLoading"
          >
            批量启用
          </ElButton>
          <ElButton
            type="warning"
            :disabled="!selectedRows.length"
            @click="handleBatchEnable(false)"
            :loading="batchOperationLoading"
          >
            批量禁用
          </ElButton>
        </template>
      </ArtTableHeader>
      <ArtTable
        ref="tableRef"
        row-key="id"
        :data="streamData"
        :loading="isLoading"
        :pagination="{
          current: paginationState.current,
          size: paginationState.size,
          total: paginationState.total ?? 0
        }"
        :columns="columns"
        :table-config="{ emptyHeight: '360px' }"
        :layout="{ marginTop: 10, showIndex: false }"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
        <!-- 状态列插槽 -->
        <template #enable="{ row }">
          <ElTag :type="row.enable ? 'primary' : 'info'" effect="light" size="small">
            {{ row.enable ? '启用' : '禁用' }}
          </ElTag>
        </template>
      </ArtTable>
    </ElCard>
    <!-- 新增流穿梭框弹窗 -->
    <ElDialog
      v-model="transferVisible"
      title="分配视频流到当前组织"
      align-center
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="custom-transfer-wrapper" v-loading="transferLoading">
        <ElTransfer
          v-model="transferValue"
          :data="transferData"
          filterable
          :filter-method="filterMethod"
          filter-placeholder="流名称"
          :titles="['未分配组织', '当前组织']"
          class="custom-dark-transfer"
          @change="handleTransferChange"
        />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="handleCancel('transfer')">取消</ElButton>
          <ElButton
            type="primary"
            @click="handleTransferOk"
            :loading="transferSubmitting"
            :disabled="transferLoading"
          >
            确定</ElButton
          >
        </div>
      </template>
    </ElDialog>
    <!-- 编辑流弹窗 -->
    <ElDialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增' : '编辑'"
      width="420px"
      align-center
      :close-on-click-modal="false"
      destroy-on-close
    >
      <ElForm
        ref="formRef"
        :model="formData"
        label-width="90px"
        :rules="formRules"
        :validate-on-rule-change="false"
        status-icon
      >
        <ElFormItem label="流名称" prop="streamName">
          <ElInput
            v-model.trim="formData.streamName"
            maxlength="50"
            show-word-limit
            placeholder="请输入流名称"
            clearable
          />
        </ElFormItem>
        <ElFormItem label="组织" prop="orgId">
          <ElTreeSelect
            :key="treeSelectKey"
            v-model="formData.orgId"
            :data="orgTree"
            :props="{
              label: 'name',
              value: 'id',
              children: 'children',
              disabled: (node: any) => node.status === '禁用'
            }"
            :default-expanded-keys="expandedOrgKeys"
            placeholder="请选择组织"
            check-strictly
            clearable
            style="width: 100%"
            :render-after-expand="false"
          >
            <template #default="{ node, data }">
              <span
                :style="
                  selectedOrgPathIds.includes(data.id) ? 'color: #409EFF; font-weight: bold;' : ''
                "
              >
                {{ data.name }}
              </span>
            </template>
          </ElTreeSelect>
          <div
            v-if="selectedOrgPath.length"
            style="margin-top: 4px; display: flex; align-items: center; flex-wrap: wrap"
          >
            <span class="org-path-text">组织路径：</span>
            <template v-for="(name, idx) in selectedOrgPath" :key="idx">
              <ElTag type="info" effect="plain" style="margin-right: 4px">{{ name }}</ElTag>
              <span v-if="idx < selectedOrgPath.length - 1" style="color: #aaa; margin-right: 4px"
                >&gt;</span
              >
            </template>
          </div>
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch v-model="formData.enable" active-text="启用" inactive-text="禁用" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput
            v-model.trim="formData.description"
            type="textarea"
            maxlength="200"
            show-word-limit
            placeholder="请输入描述"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="handleCancel('dialog')">取消</ElButton>
          <ElButton type="primary" @click="handleDialogOk" :loading="isSubmitting">确定</ElButton>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, h, nextTick, computed, watch, watchEffect } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import { useTable } from '@/composables/useTable'
  import { useWindowSize } from '@vueuse/core'

  import ArtTableHeader from '@/components/core/tables/art-table-header/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import {
    ElButton,
    ElCard,
    ElTableColumn,
    ElTransfer,
    ElTreeSelect,
    ElTag,
    ElSwitch
  } from 'element-plus'
  import { BgColorEnum } from '@/enums/appEnum'
  import type { SearchFormItem } from '@/types'
  import { StreamService, type StreamItem as APIStreamItem } from '@/api/streamApi'
  import { OrganizationService, type OrganizationNode } from '@/api/organizationApi'
  import { VirtualOrgService } from '@/api/virtualOrgApi'
  import { defineProps } from 'vue'
  import type { TransferDataItem, TransferKey, TransferDirection } from 'element-plus'

  // 定义本地StreamItem类型，与前端模板兼容
  interface StreamItem {
    id: string // 改为string类型
    streamName: string
    streamCode: string
    protocol: string
    orgId: string
    orgName: string
    description: string
    enable: boolean
    createTime: string
    org_id?: string // 添加兼容后端API的字段
    algos?: string[] // 添加可能需要的字段
    algoConfigs?: Record<string, any> // 添加可能需要的字段
  }

  // 本地组织节点类型
  interface OrgNode {
    id: string
    name: string
    parentId: string | null
    status: '启用' | '禁用'
    sort: number
    desc?: string
    children?: OrgNode[]
  }

  interface Props {
    orgId?: string
  }

  const props = defineProps<Props>()

  defineOptions({ name: 'VirtualOrgAndStream' })

  const { width } = useWindowSize()
  const loading = ref(false)
  const errorMessage = ref<string>('')

  // 表单和组织树相关
  const formRef = ref<FormInstance>()
  const orgTree = ref<OrgNode[]>([])
  const expandedOrgKeys = ref<string[]>([])
  const treeSelectKey = ref(0)
  const selectedOrgPath = ref<string[]>([])
  const selectedOrgPathIds = ref<string[]>([])
  const formData = ref({
    streamName: '',
    orgId: '',
    description: '',
    enable: false
  })
  const formRules = {
    streamName: [
      { required: true, message: '请输入流名称', trigger: 'blur' },
      { min: 2, max: 50, message: '流名称长度为2-50字符', trigger: 'blur' }
    ],
    orgId: [{ required: true, message: '请选择组织', trigger: 'change' }]
  }

  // 编辑对话框相关
  const dialogVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const isSubmitting = ref(false)
  const editRowId = ref<string | null>(null)

  // 批量操作相关
  const btnLoading = reactive({
    add: false,
    edit: false,
    delete: false,
    enable: false,
    disable: false
  })
  const selectedRows = ref<StreamItem[]>([])
  const batchOperationLoading = ref(false)

  // 穿梭框相关变量
  const transferVisible = ref(false)
  const transferLoading = ref(false)
  const transferSubmitting = ref(false)
  const transferData = ref<TransferDataItem[]>([])
  const transferValue = ref<TransferKey[]>([])

  // 搜索相关
  const formFilters = reactive({
    streamName: '',
    streamCode: '',
    protocol: '',
    disable: ''
  })

  const formItems: SearchFormItem[] = [
    {
      label: '流名称',
      prop: 'streamName',
      type: 'input',
      config: { clearable: true }
    },
    {
      label: '状态',
      prop: 'disable',
      type: 'select',
      config: {
        clearable: true,
        options: [
          { label: '全部', value: '' },
          { label: '启用', value: 'true' },
          { label: '禁用', value: 'false' }
        ]
      }
    }
  ]

  const tableRef = ref()

  // 获取组织树数据
  const fetchOrganizationTree = async () => {
    try {
      const response = await OrganizationService.getOrganizationTree()

      // 将API返回的组织结构转换为前端需要的格式
      const transformNode = (apiNode: OrganizationNode): OrgNode => ({
        id: apiNode.org_id,
        name: apiNode.name,
        parentId: apiNode.parent_id,
        status: apiNode.status === 'active' ? '启用' : '禁用',
        sort: apiNode.sort_order || 0,
        desc: apiNode.description,
        children: apiNode.children?.map(transformNode)
      })

      // 转换组织树数据
      orgTree.value = response.organizations.map(transformNode)
    } catch (error) {
      console.error('获取组织树失败:', error)
      ElMessage.error('获取组织树失败')
      orgTree.value = []
    }
  }

  // 辅助函数 - 根据ID查找组织名称
  function findOrgNameById(nodes: OrgNode[], id: string): string {
    if (!id) return ''

    for (const node of nodes) {
      if (node.id === id) return node.name

      if (node.children && node.children.length > 0) {
        const found = findOrgNameById(node.children, id)
        if (found) return found
      }
    }

    return ''
  }

  // useTable Hook实现
  const {
    columnChecks,
    columns,
    tableData: streamData,
    isLoading,
    paginationState,
    onPageSizeChange,
    onCurrentPageChange,
    refreshAll,
    refreshSoft,
    refreshAfterCreate,
    refreshAfterUpdate,
    refreshAfterRemove,
    searchState,
    searchData,
    resetSearch
  } = useTable<StreamItem>({
    // 核心配置
    core: {
      apiFn: async (params: any) => {
        try {
          const response = await StreamService.getStreamList({
            skip: (params.current - 1) * params.size,
            limit: params.size,
            name: params.streamName,
            stream_type: params.protocol,
            status: params.disable === 'true' ? 'active' : undefined
          })

          // 将API返回的流数据转换为前端需要的格式
          const records: StreamItem[] = await Promise.all(
            response.items.map(async (apiStream) => {
              // 查找组织名称 (如果apiStream.org_id存在)
              let orgName = ''
              if (apiStream.org_id) {
                try {
                  const orgDetail = await OrganizationService.getOrganizationDetail(
                    apiStream.org_id
                  )
                  orgName = orgDetail.name
                } catch (e) {
                  console.error('获取组织名称失败:', e)
                }
              }

              return {
                id: apiStream.stream_id,
                streamName: apiStream.name,
                streamCode: apiStream.url,
                protocol: apiStream.stream_type,
                orgId: apiStream.org_id || '',
                orgName: orgName,
                description: apiStream.description || '',
                enable: apiStream.status === 'active',
                createTime: new Date(apiStream.created_at).toLocaleString()
              }
            })
          )

          return {
            records,
            total: response.total,
            size: params.size,
            current: params.current,
            pages: Math.ceil(response.total / params.size)
          }
        } catch (err) {
          console.error('获取视频流列表失败:', err)
          ElMessage.error('获取视频流列表失败，请重试')
          return {
            records: [],
            total: 0,
            size: params.size,
            current: params.current,
            pages: 0
          }
        }
      },
      apiParams: {
        current: 1,
        size: 20,
        streamName: '',
        disable: ''
      } as any,
      immediate: false,
      columnsFactory: () => [
        { type: 'selection', width: 55 },
        { type: 'index', label: '序号', width: 60 },
        {
          prop: 'streamName',
          label: '流名称',
          minWidth: width.value < 500 ? 150 : 120,
          showOverflowTooltip: true
        },
        { prop: 'orgName', label: '组织', minWidth: 120, showOverflowTooltip: true },
        {
          prop: 'enable',
          label: '状态',
          width: 90,
          useSlot: true
        },
        {
          prop: 'description',
          label: '描述',
          minWidth: width.value < 500 ? 220 : 180,
          showOverflowTooltip: true
        },
        {
          prop: 'createTime',
          label: '创建时间',
          width: 160,
          formatter: (row: StreamItem) => formatDate(row.createTime)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 150,
          fixed: 'right',
          formatter: (row: StreamItem) => {
            return h('div', [
              h(ArtButtonTable, {
                type: 'edit',
                onClick: () => openDialog('edit', row)
              }),
              h(ArtButtonTable, {
                type: 'delete',
                onClick: () => handleDelete(row)
              })
            ])
          }
        }
      ]
    },

    // 性能优化
    performance: {
      enableCache: true,
      cacheTime: 5 * 60 * 1000, // 5分钟
      debounceTime: 300
    },

    // 生命周期钩子
    hooks: {
      onSuccess: (data) => {
        console.log('数据加载成功:', data.length)
        // tableData.value = data; // This line is removed as per the edit hint
      },
      onError: (error) => {
        console.error('获取数据错误:', error)
        errorMessage.value = error.message
        ElMessage.error(error.message)
        // tableData.value = []; // This line is removed as per the edit hint
      }
    }
  })

  /**
   * 重置筛选条件并刷新数据
   */
  const handleReset = () => {
    resetSearch()
  }

  /**
   * 执行筛选并刷新数据
   */
  const handleSearch = () => {
    // 将表单筛选值传递给搜索状态
    Object.assign(searchState, formFilters)
    searchData()
  }

  /**
   * 刷新数据
   */
  const handleRefresh = () => {
    refreshAll()
  }

  /**
   * 处理每页显示数量变化 - 使用useTable提供的方法
   */
  const handleSizeChange = (size: number) => {
    onPageSizeChange(size)
  }

  /**
   * 处理页码变化 - 使用useTable提供的方法
   */
  const handleCurrentChange = (page: number) => {
    onCurrentPageChange(page)
  }

  /**
   * 处理表格选择变化
   */
  const handleSelectionChange = (selection: StreamItem[]) => {
    selectedRows.value = selection
  }

  /**
   * 批量删除
   */
  function handleBatchDelete() {
    if (!selectedRows.value.length) {
      ElMessage.warning('请选择要删除的流')
      return
    }

    const count = selectedRows.value.length
    ElMessageBox.confirm(`确定要删除选中的 ${count} 个流吗？此操作不可恢复！`, '批量删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          batchOperationLoading.value = true

          if (!props.orgId) {
            ElMessage.warning('未选择组织')
            return
          }

          // 获取所有选中流的ID
          const streamIds = selectedRows.value.map((row) => row.id)

          // 调用API批量删除绑定关系
          await VirtualOrgService.batchDeleteOrganizationBindings({
            binding_ids: streamIds // 这里应该是绑定ID，需要根据实际业务调整
          })

          ElMessage.success(`成功删除 ${streamIds.length} 个流`)

          // 重置选择
          selectedRows.value = []

          // 刷新数据
          refreshAll()
        } catch (error) {
          console.error('批量删除失败:', error)
          ElMessage.error('批量删除失败，请重试')
        } finally {
          batchOperationLoading.value = false
        }
      })
      .catch(() => {
        // 用户取消操作
      })
  }

  /**
   * 批量启用/禁用
   */
  async function handleBatchEnable(enable: boolean) {
    if (!selectedRows.value.length) {
      ElMessage.warning(`请选择要${enable ? '启用' : '禁用'}的流`)
      return
    }

    const count = selectedRows.value.length
    const action = enable ? '启用' : '禁用'

    try {
      batchOperationLoading.value = true

      // 获取所有选中流的ID
      const streamIds = selectedRows.value.map((row) => row.id)

      // 调用批量操作API
      await StreamService.batchOperateStreams({
        stream_ids: streamIds,
        operation: enable ? 'start' : 'stop'
      })

      ElMessage.success(`成功${action} ${streamIds.length} 个流`)

      // 刷新数据
      refreshAll()
    } catch (error) {
      console.error(`批量${action}失败:`, error)
      ElMessage.error(`批量${action}失败，请重试`)
    } finally {
      batchOperationLoading.value = false
    }
  }

  /**
   * 处理删除单个流
   */
  async function handleDelete(row: StreamItem) {
    try {
      await ElMessageBox.confirm(
        `确定要删除流 "${row.streamName}" 吗？此操作不可恢复！`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          closeOnClickModal: false
        }
      )

      // 调用API删除流
      await StreamService.deleteStream(row.id)

      ElMessage.success('删除成功')

      // 刷新表格数据
      refreshAll()

      // 如果当前页删除完了且不是第一页，则回到上一页
      if (streamData.value.length === 0 && paginationState.current > 1) {
        onCurrentPageChange(paginationState.current - 1)
      }
    } catch (err) {
      // 用户取消操作或API错误，不做特殊处理
      console.log('删除操作已取消或出错', err)
    }
  }

  /**
   * 获取表格数据 - 使用useTable提供的方法
   */
  function getTableData() {
    // 将当前组织ID传入搜索参数
    if (props.orgId) {
      searchState.orgId = props.orgId
    } else {
      delete searchState.orgId
    }

    // 刷新数据
    refreshAll()
  }

  /**
   * 获取所有节点键
   */
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

  /**
   * 格式化日期
   */
  function formatDate(date: string | number | Date) {
    if (!date) return ''
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return ''

      return d
        .toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
        .replace(/\//g, '-')
    } catch (err) {
      console.error('日期格式化错误:', err)
      return ''
    }
  }

  /**
   * 打开编辑/新增对话框
   */
  function openDialog(type: 'add' | 'edit', row?: StreamItem) {
    dialogType.value = type

    // 重置表单数据
    if (type === 'edit' && row) {
      formData.value = {
        streamName: row.streamName || '',
        orgId: row.orgId || '',
        description: row.description || '',
        enable: row.enable || false
      }
      editRowId.value = row.id
    } else {
      formData.value = {
        streamName: '',
        orgId: props.orgId || '', // 默认使用当前组织ID
        description: '',
        enable: false
      }
      editRowId.value = null
    }

    // 打开对话框，使用nextTick确保DOM更新后再清除验证
    dialogVisible.value = true
    nextTick(() => formRef.value?.clearValidate())
  }

  /**
   * 处理对话框确认
   */
  async function handleDialogOk() {
    if (!formRef.value) return

    try {
      // 表单验证
      await formRef.value.validate()

      isSubmitting.value = true

      // 模拟API延迟
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (dialogType.value === 'add') {
        await handleAddStream()
      } else if (dialogType.value === 'edit' && editRowId.value !== null) {
        await handleEditStream()
      }

      dialogVisible.value = false
    } catch (err) {
      console.log('表单验证未通过或操作被取消')
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * 处理新增流
   */
  async function handleAddStream() {
    try {
      const streamName = formData.value.streamName.trim()
      const orgId = formData.value.orgId

      // 验证组织存在
      if (orgId) {
        const orgName = findOrgNameById(orgTree.value, orgId)
        if (!orgName) {
          ElMessage.warning('选择的组织不存在，请重新选择')
          return Promise.reject(new Error('组织不存在'))
        }
      }

      // 检查是否存在同名流
      const existingStreams = await StreamService.getStreamList({
        name: streamName,
        limit: 1
      })

      if (existingStreams.items && existingStreams.items.length > 0) {
        ElMessage.warning('已存在同名流，请修改名称')
        return Promise.reject(new Error('流名称重复'))
      }

      // 创建新流
      await StreamService.createStream({
        name: streamName,
        url: `rtsp://example.com/${streamName}`, // 生成一个示例RTSP URL
        description: formData.value.description.trim(),
        stream_type: 'rtsp',
        org_id: formData.value.orgId,
        auto_start: formData.value.enable
      })

      ElMessage.success('添加视频流成功')

      // 刷新数据
      refreshAll()

      return Promise.resolve()
    } catch (error) {
      console.error('添加视频流失败:', error)
      ElMessage.error('添加视频流失败')
      return Promise.reject(error)
    }
  }

  /**
   * 处理编辑流
   */
  async function handleEditStream() {
    try {
      if (editRowId.value === null) {
        ElMessage.warning('未找到要编辑的流')
        return Promise.reject(new Error('无效的流ID'))
      }

      const streamId = editRowId.value.toString()
      const streamName = formData.value.streamName.trim()
      const orgId = formData.value.orgId

      // 验证组织存在
      if (orgId) {
        const orgName = findOrgNameById(orgTree.value, orgId)
        if (!orgName) {
          ElMessage.warning('选择的组织不存在，请重新选择')
          return Promise.reject(new Error('组织不存在'))
        }
      }

      // 检查是否存在同名流（排除自身）
      const existingStreams = await StreamService.getStreamList({
        name: streamName,
        limit: 5
      })

      const duplicateStream = existingStreams.items?.find(
        (stream: any) =>
          stream.name.toLowerCase() === streamName.toLowerCase() && stream.stream_id !== streamId
      )

      if (duplicateStream) {
        ElMessage.warning('已存在同名流，请修改名称')
        return Promise.reject(new Error('流名称重复'))
      }

      // 更新流信息
      await StreamService.updateStream(streamId, {
        name: streamName,
        description: formData.value.description.trim(),
        org_id: formData.value.orgId
      })

      ElMessage.success('更新视频流成功')

      // 刷新数据
      refreshAll()

      return Promise.resolve()
    } catch (error) {
      console.error('更新视频流失败:', error)
      ElMessage.error('更新视频流失败')
      return Promise.reject(error)
    }
  }

  onMounted(() => {
    fetchOrganizationTree() // 调用获取组织树的函数
    getTableData()
  })

  watch(
    () => props.orgId,
    (newOrgId) => {
      if (newOrgId !== undefined) {
        onCurrentPageChange(1) // 使用onCurrentPageChange方法
        getTableData()
      }
    }
  )

  // 获取穿梭框数据
  const fetchTransferData = async () => {
    transferLoading.value = true
    try {
      // 获取所有流
      const allStreamsResponse = await StreamService.getStreamList({
        limit: 1000 // 获取足够多的流
      })

      // 获取已分配给当前组织的流
      const currentStreams = streamData.value
      const currentStreamIds = currentStreams.map((stream) => stream.id)

      // 转换为穿梭框数据格式
      transferData.value = allStreamsResponse.items.map((stream) => ({
        key: stream.stream_id,
        label: stream.name,
        disabled: false // 可以根据需要设置禁用条件
      }))

      // 设置默认已选择的值
      transferValue.value = currentStreamIds
    } catch (error) {
      console.error('获取穿梭框数据失败:', error)
      ElMessage.error('获取穿梭框数据失败')
      transferData.value = []
      transferValue.value = []
    } finally {
      transferLoading.value = false
    }
  }

  // 打开穿梭框
  const openTransfer = async () => {
    transferVisible.value = true
    await fetchTransferData()
  }

  /**
   * 初始化穿梭框选中值
   */
  function initTransferValue() {
    if (!transferValue || !streamData.value) return

    // 使用当前表格数据中的流ID初始化穿梭框选中值
    transferValue.value = streamData.value
      .filter((item) => item.orgId === props.orgId)
      .map((item) => item.id)
  }

  watch(streamData, () => {
    if (transferVisible.value) {
      initTransferValue()
    }
  })

  /**
   * 穿梭框过滤方法
   */
  const filterMethod = (query: string, item: TransferDataItem) => {
    if (!query) return true
    const label = item.label as string
    return label.toLowerCase().includes(query.toLowerCase())
  }

  /**
   * 穿梭框变更回调
   */
  const handleTransferChange = (
    value: TransferKey[],
    direction: TransferDirection,
    movedKeys: TransferKey[]
  ) => {
    console.log(`${direction === 'right' ? '添加' : '移除'}了${movedKeys.length}个流`)
  }

  /**
   * 监听组织ID变化，更新组织路径
   */
  watch(
    () => formData.value.orgId,
    (newId: string) => {
      if (!newId) {
        selectedOrgPath.value = []
        selectedOrgPathIds.value = []
        return
      }

      const pathArr = getOrgPathWithIds(orgTree.value, newId)
      selectedOrgPath.value = pathArr.map((item: { id: string; name: string }) => item.name)
      selectedOrgPathIds.value = pathArr.map((item: { id: string; name: string }) => item.id)
    }
  )

  /**
   * 获取组织路径
   */
  function getOrgPathWithIds(
    tree: any[],
    id: string,
    path: { id: string; name: string }[] = []
  ): { id: string; name: string }[] {
    for (const node of tree) {
      if (node.id === id) return [...path, { id: node.id, name: node.name }]
      if (node.children && node.children.length) {
        const found = getOrgPathWithIds(node.children, id, [
          ...path,
          { id: node.id, name: node.name }
        ])
        if (found.length) return found
      }
    }
    return []
  }

  /**
   * 穿梭框确认
   */
  async function handleTransferOk() {
    if (!props.orgId) {
      ElMessage.warning('请先选择组织')
      return
    }

    transferSubmitting.value = true
    try {
      // 获取当前已选择的流ID
      const selectedStreamIds = transferValue.value as string[]

      // 获取当前组织下的所有流
      const currentStreams = streamData.value
      const currentStreamIds = currentStreams.map((stream) => stream.id)

      // 计算需要添加和移除的流
      const toAdd = selectedStreamIds.filter((id) => !currentStreamIds.includes(id))
      const toRemove = currentStreamIds.filter((id) => !selectedStreamIds.includes(id))

      // 调用API进行添加和移除操作
      if (toAdd.length > 0) {
        await VirtualOrgService.batchCreateOrganizationBindings({
          org_id: props.orgId!,
          stream_ids: toAdd
        })
      }

      if (toRemove.length > 0) {
        await VirtualOrgService.batchDeleteOrganizationBindings({
          binding_ids: toRemove // 这里应该是绑定ID，需要根据实际业务调整
        })
      }

      ElMessage.success('流分配成功')
      transferVisible.value = false

      // 刷新数据
      refreshAll()
    } catch (error) {
      console.error('流分配失败:', error)
      ElMessage.error('流分配失败，请重试')
    } finally {
      transferSubmitting.value = false
    }
  }

  /**
   * 处理取消
   */
  function handleCancel(type: 'dialog' | 'transfer') {
    if (type === 'dialog' && isSubmitting.value) return
    if (type === 'transfer' && transferSubmitting.value) return

    if (type === 'dialog') {
      ElMessageBox.confirm('确定要取消吗？未保存的内容将会丢失', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '继续编辑',
        type: 'warning'
      })
        .then(() => {
          dialogVisible.value = false
        })
        .catch(() => {
          // 用户选择继续编辑，不做任何操作
        })
    } else {
      transferVisible.value = false
    }
  }

  defineExpose({
    columns,
    columnChecks,
    getTableData,
    errorMessage
  })
</script>

<style lang="scss" scoped>
  .streaminfo-page {
    background: var(--art-main-bg-color);
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .org-path-text {
    color: var(--el-color-primary);
  }

  // .art-table-card {
  //   background: var(--art-root-card-border-color);
  //   border-radius: 10px;
  //   margin-top: 8px;
  //   flex: 1;
  //   display: flex;
  //   flex-direction: column;
  //   overflow: hidden;
  // }

  :deep(.el-card__body) {
    padding: 8px;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  :deep(.el-table) {
    border-radius: 8px;
    flex: 1;
  }

  :deep(.el-table__cell) {
    font-size: 14px;
    color: var(--art-text-gray-800);
    line-height: 1.6;
  }

  :deep(.el-table__header th) {
    font-weight: 600;
    background: var(--art-main-bg-color);
  }

  :deep(.el-pagination .el-pagination__total) {
    margin-right: 16px;
  }

  :deep(.el-pagination .el-pagination__sizes) {
    margin-right: 16px;
  }

  .dialog-footer {
    text-align: right;
    margin-top: 20px;
  }

  .custom-transfer-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 360px;
  }

  .custom-dark-transfer {
    border-radius: 8px;

    .el-transfer-panel {
      margin: 10px;
      background: #232323;
      color: #fff;
      border: 1px solid #333;
    }

    .el-transfer-panel__header {
      background: #232323;
      color: #fff;
      border-bottom: 1px solid #333;
    }

    .el-transfer-panel__body {
      background: #232323;
      color: #fff;
    }

    .el-transfer__buttons {
      .el-button {
        background: #333;
        color: #fff;
        border: none;
        border-radius: 4px;
      }
    }
  }
</style>
