import api from '@/utils/http'

export class RoleService {
    /**
     * 获取角色列表
     * @param params 查询参数
     */
    static getRoleList(params: { current: number; size: number }) {
        return api.get<{
            records: Array<{
                id: number;
                role_code: string;
                role_name: string;
                description?: string;
                created_at: string;
            }>;
            current: number;
            size: number;
            total: number;
        }>({
            url: '/roles',
            params
        })
    }

    /**
     * 创建角色
     * @param roleData 角色数据
     */
    static createRole(roleData: {
        role_code: string;
        role_name: string;
        description?: string;
    }) {
        return api.post<{
            id: number;
            role_code: string;
            role_name: string;
            description?: string;
            created_at: string;
        }>({
            url: '/roles',
            data: roleData
        })
    }

    /**
     * 更新角色
     * @param roleId 角色ID
     * @param roleData 角色数据
     */
    static updateRole(roleId: number, roleData: {
        role_name?: string;
        description?: string;
    }) {
        return api.put<{
            id: number;
            role_code: string;
            role_name: string;
            description?: string;
            created_at: string;
        }>({
            url: `/roles/${roleId}`,
            data: roleData
        })
    }

    /**
     * 删除角色
     * @param roleId 角色ID
     */
    static deleteRole(roleId: number) {
        return api.del<{ message: string }>({
            url: `/roles/${roleId}`
        })
    }

    /**
     * 获取角色详情
     * @param roleId 角色ID
     */
    static getRoleById(roleId: number) {
        return api.get<{
            id: number;
            role_code: string;
            role_name: string;
            description?: string;
            created_at: string;
        }>({
            url: `/roles/${roleId}`
        })
    }
} 