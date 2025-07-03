import api from '@/utils/http'

export class WarningService {
    /**
     * 获取报警列表
     * @param params 查询参数
     */
    static getWarningList(params: {
        current?: number;
        size?: number;
        start_time?: string;
        end_time?: string;
        stream_id?: number;
        warning_type?: string;
        status?: number;
    }) {
        return api.get<{
            records: Array<{
                id: number;
                stream_id: number;
                stream_name: string;
                warning_type: string;
                warning_level: number;
                warning_time: string;
                description: string;
                status: number;
                created_at: string;
                image_url?: string;
                details?: any;
            }>;
            current: number;
            size: number;
            total: number;
        }>({
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
        return api.put<{ message: string }>({
            url: `/warnings/${warningId}`,
            data: { status }
        })
    }

    /**
     * 获取报警详情
     * @param warningId 报警ID
     */
    static getWarningById(warningId: number) {
        return api.get<{
            id: number;
            stream_id: number;
            stream_name: string;
            warning_type: string;
            warning_level: number;
            warning_time: string;
            description: string;
            status: number;
            created_at: string;
            image_url?: string;
            details?: any;
        }>({
            url: `/warnings/${warningId}`
        })
    }

    /**
     * 获取报警统计数据
     * @param params 查询参数
     */
    static getWarningStats(params: {
        start_time?: string;
        end_time?: string;
        stream_id?: number;
    }) {
        return api.get<{
            total_count: number;
            processed_count: number;
            false_alarm_count: number;
            pending_count: number;
            by_type: Record<string, number>;
            by_level: Record<number, number>;
            by_time: Array<{ date: string; count: number }>;
        }>({
            url: '/warnings/stats',
            params
        })
    }
} 