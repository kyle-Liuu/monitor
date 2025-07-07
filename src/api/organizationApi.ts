import api from '@/utils/http'

export class OrganizationService {
    /**
     * 获取组织列表
     */
    static getOrganizationList() {
        return api.get<Api.Organization.OrganizationListResult>({
            url: '/organizations'
        })
    }

    /**
     * 创建组织
     * @param orgData 组织数据
     */
    static createOrganization(orgData: Api.Organization.CreateOrganizationParams) {
        return api.post<Api.Organization.OrganizationInfo>({
            url: '/organizations',
            data: orgData
        })
    }

    /**
     * 更新组织
     * @param orgId 组织ID
     * @param orgData 组织数据
     */
    static updateOrganization(orgId: number, orgData: Api.Organization.UpdateOrganizationParams) {
        return api.put<Api.Organization.OrganizationInfo>({
            url: `/organizations/${orgId}`,
            data: orgData
        })
    }

    /**
     * 删除组织
     * @param orgId 组织ID
     */
    static deleteOrganization(orgId: number) {
        return api.del<Api.Common.MessageResult>({
            url: `/organizations/${orgId}`
        })
    }
} 