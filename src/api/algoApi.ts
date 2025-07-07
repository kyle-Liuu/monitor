import api from '@/utils/http'

export class AlgorithmService {
    /**
     * 获取算法列表
     */
    static getAlgorithmList() {
        return api.get<Api.Algorithm.AlgorithmListResult>({
            url: '/algorithms'
        })
    }

    /**
     * 创建算法
     * @param algoData 算法数据
     */
    static createAlgorithm(algoData: Api.Algorithm.CreateAlgorithmParams) {
        return api.post<Api.Algorithm.AlgorithmInfo>({
            url: '/algorithms',
            data: algoData
        })
    }

    /**
     * 更新算法
     * @param algoId 算法ID
     * @param algoData 算法数据
     */
    static updateAlgorithm(algoId: number, algoData: Api.Algorithm.UpdateAlgorithmParams) {
        return api.put<Api.Algorithm.AlgorithmInfo>({
            url: `/algorithms/${algoId}`,
            data: algoData
        })
    }

    /**
     * 删除算法
     * @param algoId 算法ID
     */
    static deleteAlgorithm(algoId: number) {
        return api.del<Api.Common.MessageResult>({
            url: `/algorithms/${algoId}`
        })
    }

    /**
     * 获取算法详情
     * @param algoId 算法ID
     */
    static getAlgorithmById(algoId: number) {
        return api.get<Api.Algorithm.AlgorithmInfo>({
            url: `/algorithms/${algoId}`
        })
    }

    /**
     * 为视频流分配算法
     * @param streamId 视频流ID
     * @param algoIds 算法ID数组
     */
    static assignAlgorithmsToStream(streamId: number, algoIds: number[]) {
        return api.post<Api.Common.MessageResult>({
            url: `/videostreams/${streamId}/algorithms`,
            data: { algorithm_ids: algoIds }
        })
    }

    /**
     * 从视频流移除算法
     * @param streamId 视频流ID
     * @param algoId 算法ID
     */
    static removeAlgorithmFromStream(streamId: number, algoId: number) {
        return api.del<Api.Common.MessageResult>({
            url: `/videostreams/${streamId}/algorithms/${algoId}`
        })
    }
} 