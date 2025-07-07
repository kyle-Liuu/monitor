import api from '@/utils/http'

export class VirtualOrganizationService {
    /**
     * 获取虚拟组织列表
     */
    static getVirtualOrgList() {
        return api.get<Api.VirtualOrganization.VirtualOrgListResult>({
            url: '/virtualorganizations'
        })
    }

    /**
     * 创建虚拟组织
     * @param orgData 虚拟组织数据
     */
    static createVirtualOrg(orgData: Api.VirtualOrganization.CreateVirtualOrgParams) {
        return api.post<Api.VirtualOrganization.VirtualOrgInfo>({
            url: '/virtualorganizations',
            data: orgData
        })
    }

    /**
     * 更新虚拟组织
     * @param orgId 虚拟组织ID
     * @param orgData 虚拟组织数据
     */
    static updateVirtualOrg(orgId: number, orgData: Api.VirtualOrganization.UpdateVirtualOrgParams) {
        return api.put<Api.VirtualOrganization.VirtualOrgInfo>({
            url: `/virtualorganizations/${orgId}`,
            data: orgData
        })
    }

    /**
     * 删除虚拟组织
     * @param orgId 虚拟组织ID
     */
    static deleteVirtualOrg(orgId: number) {
        return api.del<Api.Common.MessageResult>({
            url: `/virtualorganizations/${orgId}`
        })
    }

    /**
     * 为虚拟组织添加视频流
     * @param orgId 虚拟组织ID
     * @param streamIds 视频流ID数组
     */
    static addStreamsToVirtualOrg(orgId: number, streamIds: number[]) {
        return api.post<Api.Common.MessageResult>({
            url: `/virtualorganizations/${orgId}/streams`,
            data: { videostream_ids: streamIds }
        })
    }

    /**
     * 从虚拟组织移除视频流
     * @param orgId 虚拟组织ID
     * @param streamId 视频流ID
     */
    static removeStreamFromVirtualOrg(orgId: number, streamId: number) {
        return api.del<Api.Common.MessageResult>({
            url: `/virtualorganizations/${orgId}/streams/${streamId}`
        })
    }
} 