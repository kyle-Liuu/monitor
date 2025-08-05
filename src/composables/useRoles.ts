import { ref, computed, onMounted } from 'vue'
import { RoleService } from '@/api/roleApi'
import type { RoleItem } from '@/api/roleApi'

/**
 * 角色管理 Composable
 * 提供角色列表和选项数据
 */
export function useRoles() {
  // 角色列表数据
  const rolesList = ref<RoleItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

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

  // 获取角色列表
  const fetchRoles = async (refresh = false) => {
    // 如果已经有数据且不是刷新，直接返回
    if (rolesList.value.length > 0 && !refresh) {
      return rolesList.value
    }

    try {
      loading.value = true
      error.value = null
      
      const response = await RoleService.getRolesList({
        // 获取所有角色，不分页
        skip: 0,
        limit: 1000
      })
      
      rolesList.value = response.roles || []
      return rolesList.value
    } catch (err: any) {
      error.value = err.message || '获取角色列表失败'
      console.error('获取角色列表失败:', err)
      return []
    } finally {
      loading.value = false
    }
  }

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

  return {
    // 数据
    rolesList: readonly(rolesList),
    roleOptions,
    roleDict,
    loading: readonly(loading),
    error: readonly(error),
    
    // 方法
    fetchRoles,
    getRoleName,
    getRoleNames,
    hasRole
  }
} 