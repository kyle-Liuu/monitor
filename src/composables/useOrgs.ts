import { ref, computed, readonly } from 'vue'
import { OrganizationService, type OrganizationNode, type OrganizationListItem } from '@/api/organizationApi'

/**
 * 组织管理 Composable
 * 提供组织树和选项数据，统一处理组织相关逻辑
 */
export function useOrgs() {
  // 组织树数据
  const orgsTree = ref<OrganizationNode[]>([])
  // 平铺组织列表数据（从树结构展开）
  const orgsList = ref<OrganizationNode[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

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

  // 获取组织树
  const fetchOrgs = async (refresh = false) => {
    // 如果已经有数据且不是刷新，直接返回
    if (orgsTree.value.length > 0 && !refresh) {
      return orgsTree.value
    }

    try {
      loading.value = true
      error.value = null
      
      const response = await OrganizationService.getOrganizationTree()
      
      orgsTree.value = response.organizations || []
      // 同时更新平铺列表
      orgsList.value = flattenOrgTree(orgsTree.value)
      
      return orgsTree.value
    } catch (err: any) {
      error.value = err.message || '获取组织树失败'
      console.error('获取组织树失败:', err)
      return []
    } finally {
      loading.value = false
    }
  }

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

  return {
    // 数据
    orgsTree: readonly(orgsTree),
    orgsList: readonly(orgsList),
    orgOptions,
    orgTreeOptions,
    orgDict,
    loading: readonly(loading),
    error: readonly(error),
    
    // 方法
    fetchOrgs,
    getOrgName,
    getOrgNames,
    hasOrg,
    getOrgById,
    flattenOrgTree
  }
}

/**
 * 使用示例：
 * 
 * // 方式1：直接使用 useOrgs
 * import { useOrgs } from '@/composables/useOrgs'
 * 
 * const { orgOptions, orgTreeOptions, fetchOrgs, getOrgName } = useOrgs()
 * 
 * // 组件挂载时获取数据
 * onMounted(async () => {
 *   await fetchOrgs()
 * })
 * 
 * // 普通下拉选择器（平铺结构）
 * <el-select v-model="selectedOrgId" placeholder="请选择组织">
 *   <el-option
 *     v-for="option in orgOptions"
 *     :key="option.value"
 *     :label="option.label"
 *     :value="option.value"
 *     :disabled="option.disabled"
 *   />
 * </el-select>
 * 
 * // 树形选择器（保持层级结构）
 * <el-tree-select
 *   v-model="selectedOrgId"
 *   :data="orgTreeOptions"
 *   :props="{ label: 'label', value: 'value', children: 'children' }"
 *   placeholder="请选择组织"
 * />
 * 
 * // 方式2：通过 useOptions 使用（推荐）
 * import { useOptions } from '@/composables/useOptions'
 * 
 * const { orgOptions, orgTreeOptions, fetchOrgs } = useOptions()
 */ 