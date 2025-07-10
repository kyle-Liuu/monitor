// 开放底库 mock 数据
function randomDateStr() {
    const now = Date.now()
    const offset = Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)
    return new Date(now - offset).toLocaleString()
}

// 模拟开放底库分类数据
export const mockOpenList = [
    {
        name: 'vehicles',
        label: '车辆',
        items: [
            {
                id: 'open-vehicle-001',
                name: '红色轿车',
                desc: '红色四门轿车，中型车',
                image: '/assets/bus.jpg',
                openFeature: '/assets/bus.jpg',
                createTime: randomDateStr()
            },
            {
                id: 'open-vehicle-002',
                name: '白色货车',
                desc: '白色小型货车，载重2吨',
                image: '/assets/bus.jpg',
                openFeature: '/assets/bus.jpg',
                createTime: randomDateStr()
            },
            {
                id: 'open-vehicle-003',
                name: '黑色SUV',
                desc: '黑色大型SUV，七座',
                image: '/assets/bus.jpg',
                openFeature: '/assets/bus.jpg',
                createTime: randomDateStr()
            }
        ]
    },
    {
        name: 'objects',
        label: '物品',
        items: [
            {
                id: 'open-object-001',
                name: '黑色背包',
                desc: '黑色双肩背包，中等大小',
                image: '/assets/bus.jpg',
                openFeature: '/assets/bus.jpg',
                createTime: randomDateStr()
            },
            {
                id: 'open-object-002',
                name: '红色行李箱',
                desc: '红色硬壳行李箱，大号',
                image: '/assets/bus.jpg',
                openFeature: '/assets/bus.jpg',
                createTime: randomDateStr()
            }
        ]
    },
    {
        name: 'custom',
        label: '自定义分类',
        items: []
    }
] 