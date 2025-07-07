import api from '@/utils/http'

export class WarningService {
    /**
     * 获取报警列表
     * @param params 查询参数
     */
    static getWarningList(params: Api.Warning.WarningQueryParams) {
        return api.get<Api.Warning.WarningListResult>({
            url: '/warnings',
            params
        })
    }

    /**
     * 更新报警状态
     * @param warningId 报警ID
     * @param status 报警状态 (0:未处理, 1:已处理, 2:误报)
     */
    static updateWarningStatus(warningId: number, status: number) {
        return api.put<Api.Common.MessageResult>({
            url: `/warnings/${warningId}/process`,
            data: { status }
        })
    }

    /**
     * 批量处理报警
     * @param warningIds 报警ID数组
     * @param status 报警状态 (0:未处理, 1:已处理, 2:误报)
     * @param notes 备注
     */
    static batchProcessWarnings(warningIds: number[], status: number, notes?: string) {
        return api.post<Api.Warning.BatchProcessResult>({
            url: '/warnings/batch-process',
            data: { warning_ids: warningIds, status, notes }
        })
    }

    /**
     * 获取报警详情
     * @param warningId 报警ID
     */
    static getWarningById(warningId: number) {
        return api.get<Api.Warning.WarningInfo>({
            url: `/warnings/${warningId}`
        })
    }

    /**
     * 获取报警统计数据
     * @param params 查询参数
     */
    static getWarningStats(params: Api.Warning.WarningStatsParams) {
        return api.get<Api.Warning.WarningStatsResult>({
            url: '/warnings/stats',
            params
        })
    }
} 