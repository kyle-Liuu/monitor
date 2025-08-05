import { ref, computed, readonly } from 'vue'
import { RoleService, type RoleItem } from '@/api/roleApi'
import { OrganizationService, type OrganizationNode, type OrganizationListItem } from '@/api/organizationApi'

/**
 * 通用选项管理 Composable
 * 统一管理所有下拉选择器的选项数据，提供统一的接口和处理函数
 */
export function useOptions() {
  // ========== 角色相关数据 ==========
  const rolesList = ref<RoleItem[]>([])
  const rolesLoading = ref(false)
  const rolesError = ref<string | null>(null)

  // 角色选项（用于下拉选择器）
  const roleOptions = computed(() => 
    rolesList.value.map(role => ({
      label: role.role_name,
      value: role.role_code,
      disabled: !role.is_enabled
    }))
  )

  // 角色字典（根据code获取name）
  const roleDict = computed(() => {
    const dict: Record<string, string> = {}
    rolesList.value.forEach(role => {
      dict[role.role_code] = role.role_name
    })
    return dict
  })

  // ========== 组织相关数据 ==========
  const orgsTree = ref<OrganizationNode[]>([])
  const orgsList = ref<OrganizationNode[]>([])
  const orgsLoading = ref(false)
  const orgsError = ref<string | null>(null)

  // 将树结构转换为平铺列表
  const flattenOrgTree = (nodes: OrganizationNode[]): OrganizationNode[] => {
    const result: OrganizationNode[] = []
    const traverse = (items: OrganizationNode[]) => {
      for (const node of items) {
        result.push({ ...node })
        if (node.children && node.children.length > 0) {
          traverse(node.children)
        }
      }
    }
    traverse(nodes)
    return result
  }

  // 组织选项（用于下拉选择器，平铺结构）
  const orgOptions = computed(() => 
    orgsList.value
      .filter(org => org.status === 'active') // 只显示启用的组织
      .map(org => ({
        label: org.name,
        value: org.org_id,
        disabled: org.status !== 'active'
      }))
  )

  // 组织树选项（用于树形选择器，保持层级结构）
  const orgTreeOptions = computed(() => {
    const transformToTreeOptions = (nodes: OrganizationNode[]): any[] => {
      return nodes
        .filter(node => node.status === 'active')
        .map(node => ({
          label: node.name,
          value: node.org_id,
          disabled: node.status !== 'active',
          children: node.children ? transformToTreeOptions(node.children) : undefined
        }))
    }
    return transformToTreeOptions(orgsTree.value)
  })

  // 组织字典（根据id获取name）
  const orgDict = computed(() => {
    const dict: Record<string, string> = {}
    orgsList.value.forEach(org => {
      dict[org.org_id] = org.name
    })
    return dict
  })

  // 搜索用的组织选项列表（包含所有状态的组织）
  const orgOptionsForSearch = computed(() => {
    const options = [{ label: '全部', value: '' }]
    if (orgsList.value.length > 0) {
      options.push(
        ...orgsList.value.map((org) => ({
          label: org.name + (org.status === 'inactive' ? ' (已禁用)' : ''),
          value: org.org_id
        }))
      )
    }
    return options
  })

  // ========== 静态选项数据 ==========

  // 用户状态选项
  const userStatusOptions = computed(() => [
    { label: '启用', value: '1' },
    { label: '禁用', value: '2' }
  ])

  // 用户性别选项
  const userGenderOptions = computed(() => [
    { label: '男', value: '1' },
    { label: '女', value: '2' }
  ])

  // 摄像头协议选项
  const streamProtocolOptions = computed(() => [
    { label: 'rtsp', value: 'rtsp' },
    { label: 'GB28181', value: 'GB28181' },
    { label: 'rtmp', value: 'rtmp' },
    { label: 'hls', value: 'hls' }
  ])

  // 告警状态选项
  const alarmStatusOptions = computed(() => [
    { label: '未处理', value: 'no' },
    { label: '已处理', value: 'processed' },
    { label: '已忽略', value: 'ignored' }
  ])

  // 告警等级选项
  const alarmLevelOptions = computed(() => [
    { label: '低', value: 'low' },
    { label: '中', value: 'medium' },
    { label: '高', value: 'high' },
    { label: '严重', value: 'critical' }
  ])

  // 通用状态选项
  const statusOptions = computed(() => [
    { label: '启用', value: 'active' },
    { label: '禁用', value: 'inactive' }
  ])

  // ========== 数据获取方法 ==========

  // 获取角色列表（基础版本，用于选项）
  const fetchRoles = async (refresh = false) => {
    // 如果已经有数据且不是刷新，直接返回
    if (rolesList.value.length > 0 && !refresh) {
      return rolesList.value
    }

    try {
      rolesLoading.value = true
      rolesError.value = null
      
      const response = await RoleService.getRolesList({
        // 获取所有角色，不分页
        skip: 0,
        limit: 1000
      })
      
      rolesList.value = response.roles || []
      return rolesList.value
    } catch (err: any) {
      rolesError.value = err.message || '获取角色列表失败'
      console.error('获取角色列表失败:', err)
      return []
    } finally {
      rolesLoading.value = false
    }
  }

  // 获取角色列表（支持搜索和自定义参数）
  const fetchRolesWithSearch = async (params: {
    keyword?: string
    skip?: number
    limit?: number
    refresh?: boolean
  } = {}) => {
    try {
      rolesLoading.value = true
      rolesError.value = null
      
      const response = await RoleService.getRolesList({
        keyword: params.keyword || '',
        skip: params.skip || 0,
        limit: params.limit || 1000
      })
      
      const roles = response.roles || []
      
      // 如果是无搜索条件的请求，更新缓存
      if (!params.keyword) {
        rolesList.value = roles
      }
      
      return roles
    } catch (err: any) {
      rolesError.value = err.message || '获取角色列表失败'
      console.error('获取角色列表失败:', err)
      return []
    } finally {
      rolesLoading.value = false
    }
  }

  // 获取组织树（基础版本，用于选项）
  const fetchOrgs = async (refresh = false) => {
    // 如果已经有数据且不是刷新，直接返回
    if (orgsTree.value.length > 0 && !refresh) {
      return orgsTree.value
    }

    try {
      orgsLoading.value = true
      orgsError.value = null
      
      const response = await OrganizationService.getOrganizationTree()
      
      orgsTree.value = response.organizations || []
      // 同时更新平铺列表
      orgsList.value = flattenOrgTree(orgsTree.value)
      
      return orgsTree.value
    } catch (err: any) {
      orgsError.value = err.message || '获取组织树失败'
      console.error('获取组织树失败:', err)
      return []
    } finally {
      orgsLoading.value = false
    }
  }

  // 获取组织树（支持数据转换）
  const fetchOrgsWithTransform = async <T = any>(
    transformFn?: (node: OrganizationNode) => T,
    refresh = false
  ) => {
    try {
      orgsLoading.value = true
      orgsError.value = null
      
      const response = await OrganizationService.getOrganizationTree()
      const originalData = response.organizations || []
      
      // 如果没有数据且不是刷新，更新缓存
      if (!refresh || orgsTree.value.length === 0) {
        orgsTree.value = originalData
        orgsList.value = flattenOrgTree(orgsTree.value)
      }
      
      // 如果提供了转换函数，进行数据转换
      if (transformFn) {
        const transformNode = (node: OrganizationNode): T => {
          const transformed = transformFn(node)
          return {
            ...transformed,
            children: node.children ? node.children.map(transformNode) : undefined
          } as T
        }
        
        return originalData.map(transformNode)
      }
      
      return originalData
    } catch (err: any) {
      orgsError.value = err.message || '获取组织树失败'
      console.error('获取组织树失败:', err)
      return []
    } finally {
      orgsLoading.value = false
    }
  }

  // ========== 通用处理函数 ==========

  // 根据值获取标签的通用函数
  const getLabel = (options: { label: string; value: any }[], value: any): string => {
    const option = options.find(opt => opt.value === value)
    return option ? option.label : String(value)
  }

  // 根据值数组获取标签数组的通用函数
  const getLabels = (options: { label: string; value: any }[], values: any[]): string[] => {
    return values.map(value => getLabel(options, value))
  }

  // 检查值是否存在的通用函数
  const hasValue = (options: { label: string; value: any }[], value: any): boolean => {
    return options.some(opt => opt.value === value)
  }

  // ========== 角色相关处理函数 ==========

  // 根据角色代码获取角色名称
  const getRoleName = (roleCode: string): string => {
    return roleDict.value[roleCode] || roleCode
  }

  // 根据角色代码数组获取角色名称数组
  const getRoleNames = (roleCodes: string[]): string[] => {
    return roleCodes.map(code => getRoleName(code))
  }

  // 检查角色是否存在
  const hasRole = (roleCode: string): boolean => {
    return rolesList.value.some(role => role.role_code === roleCode)
  }

  // 根据角色代码获取角色详情
  const getRoleByCode = (roleCode: string): RoleItem | undefined => {
    return rolesList.value.find(role => role.role_code === roleCode)
  }

  // ========== 组织相关处理函数 ==========

  // 根据组织ID获取组织名称
  const getOrgName = (orgId: string): string => {
    return orgDict.value[orgId] || orgId
  }

  // 根据组织ID数组获取组织名称数组
  const getOrgNames = (orgIds: string[]): string[] => {
    return orgIds.map(id => getOrgName(id))
  }

  // 检查组织是否存在
  const hasOrg = (orgId: string): boolean => {
    return orgsList.value.some(org => org.org_id === orgId)
  }

  // 根据组织ID获取组织详情
  const getOrgById = (orgId: string): OrganizationNode | undefined => {
    return orgsList.value.find(org => org.org_id === orgId)
  }

  // ========== 初始化方法 ==========

  // 初始化所有选项数据
  const initializeOptions = async () => {
    await Promise.all([
      fetchRoles(),
      fetchOrgs()
    ])
    // 这里可以添加其他需要异步获取的选项
  }

  // 刷新所有数据
  const refreshAllOptions = async () => {
    await Promise.all([
      fetchRoles(true),
      fetchOrgs(true)
    ])
  }

  // ========== 返回接口 ==========
  return {
    // ===== 角色相关 =====
    rolesList: readonly(rolesList),
    roleOptions,
    roleDict,
    rolesLoading: readonly(rolesLoading),
    rolesError: readonly(rolesError),
    fetchRoles,
    fetchRolesWithSearch,
    getRoleName,
    getRoleNames,
    hasRole,
    getRoleByCode,
    
    // ===== 组织相关 =====
    orgsTree: readonly(orgsTree),
    orgsList: readonly(orgsList),
    orgOptions,
    orgTreeOptions,
    orgOptionsForSearch,
    orgDict,
    orgsLoading: readonly(orgsLoading),
    orgsError: readonly(orgsError),
    fetchOrgs,
    fetchOrgsWithTransform,
    getOrgName,
    getOrgNames,
    hasOrg,
    getOrgById,
    flattenOrgTree,
    
    // ===== 静态选项 =====
    userStatusOptions,
    userGenderOptions,
    streamProtocolOptions,
    alarmStatusOptions,
    alarmLevelOptions,
    statusOptions,
    
    // ===== 通用处理函数 =====
    getLabel,
    getLabels,
    hasValue,
    
    // ===== 管理方法 =====
    initializeOptions,
    refreshAllOptions
  }
}

/**
 * 使用示例：
 * 
 * import { useOptions } from '@/composables/useOptions'
 * 
 * // 获取所有选项数据
 * const {
 *   // 角色相关
 *   roleOptions, getRoleName, fetchRoles, fetchRolesWithSearch,
 *   // 组织相关  
 *   orgOptions, orgTreeOptions, orgOptionsForSearch, getOrgName, fetchOrgs, fetchOrgsWithTransform,
 *   // 静态选项
 *   userStatusOptions, alarmStatusOptions,
 *   // 通用函数
 *   getLabel, initializeOptions
 * } = useOptions()
 * 
 * // 组件挂载时初始化所有数据
 * onMounted(async () => {
 *   await initializeOptions()
 * })
 * 
 * // 使用角色选项
 * <el-select v-model="selectedRole" placeholder="请选择角色">
 *   <el-option
 *     v-for="option in roleOptions"
 *     :key="option.value"
 *     :label="option.label"
 *     :value="option.value"
 *     :disabled="option.disabled"
 *   />
 * </el-select>
 * 
 * // 使用组织树选项
 * <el-tree-select
 *   v-model="selectedOrg"
 *   :data="orgTreeOptions"
 *   :props="{ label: 'label', value: 'value', children: 'children' }"
 *   placeholder="请选择组织"
 * />
 * 
 * // 使用搜索专用的组织选项（包含禁用组织）
 * <el-select v-model="searchOrgId" placeholder="请选择组织">
 *   <el-option
 *     v-for="option in orgOptionsForSearch"
 *     :key="option.value"
 *     :label="option.label"
 *     :value="option.value"
 *   />
 * </el-select>
 * 
 * // 高级用法：
 * 
 * // 1. 带搜索的角色获取
 * const searchRoles = async (keyword: string) => {
 *   const roles = await fetchRolesWithSearch({ keyword })
 *   return roles
 * }
 * 
 * // 2. 带数据转换的组织获取
 * interface CustomOrgNode {
 *   id: string
 *   name: string
 *   status: '启用' | '禁用'
 *   children?: CustomOrgNode[]
 * }
 * 
 * const getCustomOrgTree = async () => {
 *   const customTree = await fetchOrgsWithTransform<CustomOrgNode>(
 *     (node) => ({
 *       id: node.org_id,
 *       name: node.name,
 *       status: node.status === 'active' ? '启用' : '禁用'
 *     })
 *   )
 *   return customTree
 * }
 * 
 * // 获取名称
 * const roleName = getRoleName('admin')
 * const orgName = getOrgName('org123')
 * 
 * // 通用获取标签
 * const statusLabel = getLabel(userStatusOptions.value, '1') // '启用'
 */ 