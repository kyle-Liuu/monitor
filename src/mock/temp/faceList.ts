// 人脸底库 mock 数据
function randomDateStr() {
    const now = Date.now()
    const offset = Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)
    return new Date(now - offset).toLocaleString()
}

// 随机生成年龄
function randomAge(min = 18, max = 60) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

// 模拟人脸底库分类数据
export const mockFaceList = [
    {
        name: 'staff',
        label: '工作人员',
        items: [
            {
                id: 'face-staff-001',
                name: '张明',
                gender: '男',
                age: randomAge(25, 45),
                image: '/assets/face.jpg',
                faceFeature: '/assets/facefeature.jpg',
                desc: '保安部门主管',
                createTime: randomDateStr()
            },
            {
                id: 'face-staff-002',
                name: '李红',
                gender: '女',
                age: randomAge(25, 40),
                image: '/assets/face.jpg',
                faceFeature: '/assets/facefeature.jpg',
                desc: '前台接待员',
                createTime: randomDateStr()
            },
            {
                id: 'face-staff-003',
                name: '王刚',
                gender: '男',
                age: randomAge(30, 50),
                image: '/assets/face.jpg',
                faceFeature: '/assets/facefeature.jpg',
                desc: '技术部门经理',
                createTime: randomDateStr()
            },
            {
                id: 'face-staff-004',
                name: '周慧',
                gender: '女',
                age: randomAge(22, 35),
                image: '/assets/face.jpg',
                faceFeature: '/assets/facefeature.jpg',
                desc: '人事专员',
                createTime: randomDateStr()
            },
            {
                id: 'face-staff-005',
                name: '刘强',
                gender: '男',
                age: randomAge(35, 55),
                image: '/assets/face.jpg',
                faceFeature: '/assets/facefeature.jpg',
                desc: '运维工程师',
                createTime: randomDateStr()
            }
        ]
    },
    {
        name: 'visitor',
        label: '访客',
        items: [
            {
                id: 'face-visitor-001',
                name: '陈明',
                gender: '男',
                age: randomAge(),
                image: '/assets/face.jpg',
                faceFeature: '/assets/facefeature.jpg',
                desc: '商务洽谈',
                createTime: randomDateStr()
            },
            {
                id: 'face-visitor-002',
                name: '赵婷',
                gender: '女',
                age: randomAge(),
                image: '/assets/face.jpg',
                faceFeature: '/assets/facefeature.jpg',
                desc: '面试应聘',
                createTime: randomDateStr()
            },
            {
                id: 'face-visitor-003',
                name: '林伟',
                gender: '男',
                age: randomAge(),
                image: '/assets/face.jpg',
                faceFeature: '/assets/facefeature.jpg',
                desc: '设备维修',
                createTime: randomDateStr()
            }
        ]
    },
    {
        name: 'vip',
        label: '重要人物',
        items: [
            {
                id: 'face-vip-001',
                name: '黄总',
                gender: '男',
                age: randomAge(40, 65),
                image: '/assets/face.jpg',
                faceFeature: '/assets/facefeature.jpg',
                desc: '公司董事长',
                createTime: randomDateStr()
            },
            {
                id: 'face-vip-002',
                name: '张董',
                gender: '男',
                age: randomAge(40, 60),
                image: '/assets/face.jpg',
                faceFeature: '/assets/facefeature.jpg',
                desc: '投资方代表',
                createTime: randomDateStr()
            }
        ]
    },
    {
        name: 'blacklist',
        label: '黑名单',
        items: [
            {
                id: 'face-blacklist-001',
                name: '曾某',
                gender: '男',
                age: randomAge(25, 50),
                image: '/assets/face.jpg',
                faceFeature: '/assets/facefeature.jpg',
                desc: '前员工，有过不良行为记录',
                createTime: randomDateStr()
            },
            {
                id: 'face-blacklist-002',
                name: '钱某',
                gender: '男',
                age: randomAge(30, 45),
                image: '/assets/face.jpg',
                faceFeature: '/assets/facefeature.jpg',
                desc: '疑似诈骗分子',
                createTime: randomDateStr()
            }
        ]
    }
] 