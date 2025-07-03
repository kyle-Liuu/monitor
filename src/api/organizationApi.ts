import api from '@/utils/http'

export class OrganizationService {
    /**
     * 获取组织列表
     */
    static getOrganizationList() {
        return api.get<{
            total: number;
            items: Array<{
                id: number;
                name: string;
                parent_id: number | null;
                description: string;
                address: string;
                contact: string;
                contact_phone: string;
                created_at: string;
                children?: Array<any>;
            }>;
        }>({
            url: '/organizations'
        })
    }

    /**
     * 创建组织
     * @param orgData 组织数据
     */
    static createOrganization(orgData: {
        name: string;
        parent_id?: number;
        description?: string;
        address?: string;
        contact?: string;
        contact_phone?: string;
    }) {
        return api.post<any>({
            url: '/organizations',
            data: orgData
        })
    }

    /**
     * 更新组织
     * @param orgId 组织ID
     * @param orgData 组织数据
     */
    static updateOrganization(orgId: number, orgData: {
        name?: string;
        description?: string;
        address?: string;
        contact?: string;
        contact_phone?: string;
    }) {
        return api.put<any>({
            url: `/organizations/${orgId}`,
            data: orgData
        })
    }

    /**
     * 删除组织
     * @param orgId 组织ID
     */
    static deleteOrganization(orgId: number) {
        return api.del<{ message: string }>({
            url: `/organizations/${orgId}`
        })
    }
} 