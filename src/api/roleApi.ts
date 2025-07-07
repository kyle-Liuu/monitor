import api from '@/utils/http'

export class RoleService {
    /**
     * 获取角色列表
     * @param params 查询参数
     */
    static getRoleList(params: { current: number; size: number }) {
        return api.get<Api.Role.RoleListResult>({
            url: '/api/roles',
            params
        })
    }

    /**
     * 创建角色
     * @param roleData 角色数据
     */
    static createRole(roleData: Api.Role.CreateRoleParams) {
        return api.post<Api.Role.RoleInfo>({
            url: '/api/roles',
            data: roleData
        })
    }

    /**
     * 更新角色
     * @param roleId 角色ID
     * @param roleData 角色数据
     */
    static updateRole(roleId: number, roleData: Api.Role.UpdateRoleParams) {
        return api.put<Api.Role.RoleInfo>({
            url: `/api/roles/${roleId}`,
            data: roleData
        })
    }

    /**
     * 删除角色
     * @param roleId 角色ID
     */
    static deleteRole(roleId: number) {
        return api.del<Api.Common.MessageResult>({
            url: `/api/roles/${roleId}`
        })
    }

    /**
     * 获取角色详情
     * @param roleId 角色ID
     */
    static getRoleById(roleId: number) {
        return api.get<Api.Role.RoleInfo>({
            url: `/api/roles/${roleId}`
        })
    }
} 