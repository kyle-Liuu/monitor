// 开放底库 mock 数据
function randomDateStr() {
    const now = Date.now()
    const offset = Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)
    return new Date(now - offset).toLocaleString()
}

// 模拟开放底库分类数据 - 默认为空
export const mockOpenList = [] 