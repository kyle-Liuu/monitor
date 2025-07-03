# AI监控管理系统前后端交互步骤

本文档记录了前端与后端交互的API设计和实现步骤，按照功能模块进行分类整理。

## 一、HTTP请求封装

基于`src/utils/http/index.ts`中的Axios封装，实现了以下功能：

- 请求和响应拦截器
- 统一错误处理
- 请求重试机制
- Token自动携带
- 接口超时处理
- 返回数据格式标准化

## 二、API模块划分

根据系统功能，将API分为以下几个模块：

### 1. 认证模块 (authApi.ts)

- 用户登录 `/auth/login`
- 用户注册 `/auth/register`

### 2. 用户管理模块 (userApi.ts)

- 获取当前用户信息 `/user/info`
- 获取用户列表 `/user/list`
- 创建用户 `/user`
- 更新用户 `/user/{id}`
- 删除用户 `/user/{id}`
- 获取用户详情 `/user/{id}`

### 3. 角色管理模块 (roleApi.ts)

- 获取角色列表 `/roles`
- 创建角色 `/roles`
- 更新角色 `/roles/{id}`
- 删除角色 `/roles/{id}`
- 获取角色详情 `/roles/{id}`

### 4. 组织管理模块 (organizationApi.ts)

- 获取组织列表 `/organizations`
- 创建组织 `/organizations`
- 更新组织 `/organizations/{id}`
- 删除组织 `/organizations/{id}`

### 5. 虚拟组织管理模块 (virtualOrgApi.ts)

- 获取虚拟组织列表 `/virtualorganizations`
- 创建虚拟组织 `/virtualorganizations`
- 更新虚拟组织 `/virtualorganizations/{id}`
- 删除虚拟组织 `/virtualorganizations/{id}`
- 为虚拟组织添加视频流 `/virtualorganizations/{id}/streams`
- 从虚拟组织移除视频流 `/virtualorganizations/{id}/streams/{streamId}`

### 6. 视频流管理模块 (videoStreamApi.ts)

- 获取视频流列表 `/videostreams`
- 创建视频流 `/videostreams`
- 更新视频流 `/videostreams/{id}`
- 删除视频流 `/videostreams/{id}`
- 获取视频流详情 `/videostreams/{id}`
- 检查视频流状态 `/videostreams/{id}/status`

### 7. 报警管理模块 (warningApi.ts)

- 获取报警列表 `/warnings`
- 更新报警状态 `/warnings/{id}`
- 获取报警详情 `/warnings/{id}`
- 获取报警统计数据 `/warnings/stats`
- 处理报警 `/warnings/{id}/process`
- 批量处理报警 `/warnings/batch-process`

### 8. 算法管理模块 (algoApi.ts)

- 获取算法列表 `/algorithms`
- 创建算法 `/algorithms`
- 更新算法 `/algorithms/{id}`
- 删除算法 `/algorithms/{id}`
- 获取算法详情 `/algorithms/{id}`
- 为视频流分配算法 `/videostreams/{id}/algorithms`
- 从视频流移除算法 `/videostreams/{id}/algorithms/{algoId}`
- 上传算法模型 `/algorithms/upload-model`
- 测试算法 `/algorithms/{id}/test`
- 获取算法性能指标 `/algorithms/{id}/metrics`

### 9. 监控任务模块 (monitorApi.ts)

- 创建监控任务 `/monitor/tasks`
- 获取监控任务列表 `/monitor/tasks`
- 获取监控任务详情 `/monitor/tasks/{id}`
- 更新监控任务 `/monitor/tasks/{id}`
- 删除监控任务 `/monitor/tasks/{id}`
- 启动监控任务 `/monitor/tasks/{id}/start`
- 停止监控任务 `/monitor/tasks/{id}/stop`
- 获取监控任务实时状态 `/monitor/tasks/{id}/status`

## 三、WebSocket实现

为了实现实时通信，创建了WebSocket连接管理器(websocketApi.ts)，实现功能：

- 基于Token的认证
- 自动重连机制
- 消息序列化/反序列化
- 事件处理
- 连接状态管理

### WebSocket连接端点

- 监控任务实时数据 `/ws/monitor/{task_id}`
- 实时告警推送 `/ws/warnings`
- 系统状态监控 `/ws/system`

### WebSocket事件类型

```typescript
// 事件类型枚举
export enum EventTypes {
  // 监控相关事件
  MONITOR_START = "monitor_start",
  MONITOR_STOP = "monitor_stop",
  MONITOR_STATUS = "monitor_status",
  
  // 告警相关事件
  WARNING_NEW = "warning_new",
  WARNING_UPDATE = "warning_update",
  
  // 系统相关事件
  SYSTEM_STATUS = "system_status",
  
  // 检测结果事件
  DETECTION_RESULT = "detection_result"
}
```

## 四、类型定义

在`src/typings/api.d.ts`中定义了API相关类型：

- 基础响应类型 `BaseResponse`
- 分页参数和结果类型 `PaginationParams` 和 `PaginationResult`
- 各模块的请求和响应类型

## 五、后端服务实现

### 1. 算法服务类 (algorithm_service.py)

算法服务类实现了算法的管理和执行功能：

```python
class AlgorithmService:
    """算法服务类，提供算法管理和执行功能"""
    
    @staticmethod
    async def get_algorithms(db: Session, skip: int = 0, limit: int = 100, type: Optional[str] = None, is_active: Optional[bool] = None) -> List[Algorithm]:
        """获取算法列表"""
        # 实现代码...
    
    @staticmethod
    async def create_algorithm(db: Session, algorithm: AlgorithmCreate) -> Algorithm:
        """创建算法"""
        # 实现代码...
    
    @staticmethod
    async def upload_model(db: Session, algorithm_id: int, model_file: UploadFile) -> Dict[str, Any]:
        """上传算法模型"""
        # 实现代码...
    
    @staticmethod
    async def test_algorithm(db: Session, algorithm_id: int, test_image: UploadFile, config_override: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """测试算法"""
        # 实现代码...
    
    @staticmethod
    def run_detection(image: np.ndarray, model_path: str, config: Dict[str, Any] = None) -> Dict[str, Any]:
        """执行目标检测"""
        # 实现代码...
```

### 2. 视频流服务类 (videostream_service.py)

视频流服务类实现了视频流的管理和处理功能：

```python
class VideoStreamService:
    """视频流服务类，提供视频流管理和处理功能"""
    
    @staticmethod
    async def get_videostreams(db: Session, skip: int = 0, limit: int = 100, organization_id: Optional[int] = None) -> List[VideoStream]:
        """获取视频流列表"""
        # 实现代码...
    
    @staticmethod
    async def create_videostream(db: Session, videostream: VideoStreamCreate) -> VideoStream:
        """创建视频流"""
        # 实现代码...
    
    @staticmethod
    async def check_stream_status(db: Session, stream_id: int) -> Dict[str, Any]:
        """检查视频流状态"""
        # 实现代码...
```

### 3. ZLMedia服务类 (zlmedia_service.py)

ZLMedia服务类提供与流媒体服务器的交互功能：

```python
class ZLMediaService:
    """ZLMediaKit服务类，提供流媒体服务器管理功能"""
    
    @staticmethod
    async def get_stream_list(app: str = "live", stream: str = None) -> List[Dict[str, Any]]:
        """获取流列表"""
        # 实现代码...
    
    @staticmethod
    async def add_stream_proxy(app: str, stream: str, url: str, enable_hls: bool = True) -> Dict[str, Any]:
        """添加代理流"""
        # 实现代码...
    
    @staticmethod
    async def get_stream_snapshot(url: str, timeout_sec: int = 10) -> Dict[str, Any]:
        """获取流截图"""
        # 实现代码...
```

### 4. 监控服务类 (monitor_service.py)

监控服务类整合了算法和视频流服务，实现监控任务的管理：

```python
class MonitorService:
    """监控服务类，整合算法服务和视频流服务，实现监控任务的创建、管理和执行"""
    
    @staticmethod
    async def create_monitor_task(db: Session, task: MonitorTaskCreate, user_id: int) -> MonitorTask:
        """创建监控任务"""
        # 实现代码...
    
    @staticmethod
    async def start_monitor_task(db: Session, task_id: int) -> Dict[str, Any]:
        """启动监控任务"""
        # 实现代码...
    
    @staticmethod
    async def stop_monitor_task(db: Session, task_id: int) -> Dict[str, Any]:
        """停止监控任务"""
        # 实现代码...
    
    @staticmethod
    async def get_monitor_task_status(db: Session, task_id: int) -> Dict[str, Any]:
        """获取监控任务实时状态"""
        # 实现代码...
```

### 5. WebSocket管理器 (manager.py)

WebSocket管理器处理实时数据推送：

```python
class ConnectionManager:
    """WebSocket连接管理器，管理活跃的WebSocket连接，并提供向客户端广播消息的功能"""
    
    async def connect(self, websocket: WebSocket, client_id: str) -> None:
        """处理新的WebSocket连接"""
        # 实现代码...
    
    async def broadcast(self, message: Any, topic: str = None) -> None:
        """广播消息到所有订阅了特定主题的客户端"""
        # 实现代码...
    
    def subscribe(self, client_id: str, topic: str) -> None:
        """订阅特定主题"""
        # 实现代码...
```

## 六、API调用示例

### 用户登录

```typescript
import { AuthService } from '@/api'

const handleLogin = async (username: string, password: string) => {
  try {
    const result = await AuthService.login(username, password)
    // 处理登录成功
    console.log('登录成功', result)
  } catch (error) {
    // 处理错误
    console.error('登录失败', error)
  }
}
```

### 获取视频流列表

```typescript
import { VideoStreamService } from '@/api'

const getVideoStreams = async () => {
  try {
    const params = { current: 1, size: 10, organization_id: 1 }
    const result = await VideoStreamService.getVideoStreamList(params)
    // 处理获取到的视频流列表
    console.log('视频流列表', result)
  } catch (error) {
    console.error('获取视频流失败', error)
  }
}
```

### 创建并启动监控任务

```typescript
import { MonitorService } from '@/api'

const createAndStartMonitorTask = async () => {
  try {
    // 创建监控任务
    const taskData = {
      name: '入侵检测任务',
      videostream_id: 1,
      algorithm_id: 1,
      config_json: {
        target_classes: ['person'],
        alert_threshold: 0.7,
        region_of_interest: [[0,0], [0,1], [1,1], [1,0]]
      },
      schedule_type: 'realtime'
    }
    
    const task = await MonitorService.createMonitorTask(taskData)
    console.log('监控任务已创建', task)
    
    // 启动监控任务
    const result = await MonitorService.startMonitorTask(task.id)
    console.log('监控任务已启动', result)
  } catch (error) {
    console.error('创建或启动监控任务失败', error)
  }
}
```

### WebSocket连接示例

```typescript
import { createWebSocket } from '@/api'

// 创建WebSocket连接
const wsConnection = createWebSocket({
  url: 'ws://your-api-domain/ws',
  onOpen: (event) => {
    console.log('WebSocket已连接')
  },
  onMessage: (event) => {
    // 处理接收到的消息
    console.log('收到消息', event.data)
  },
  onClose: (event) => {
    console.log('WebSocket已关闭', event.code)
  }
})

// 发送消息
wsConnection.send({ type: 'subscribe', channel: 'warnings' })

// 关闭连接
function closeConnection() {
  wsConnection.close()
}
```

## 七、组件中的应用

### 监控任务管理组件

```vue
<template>
  <div class="monitor-task">
    <div class="task-controls">
      <el-button type="primary" @click="startTask" :disabled="task.status === 'running'">
        启动任务
      </el-button>
      <el-button type="danger" @click="stopTask" :disabled="task.status !== 'running'">
        停止任务
      </el-button>
    </div>
    
    <div class="task-status" v-if="task.status === 'running'">
      <div class="status-item">
        <span class="label">当前FPS:</span>
        <span class="value">{{ status.current_fps.toFixed(2) }}</span>
      </div>
      <div class="status-item">
        <span class="label">CPU使用率:</span>
        <span class="value">{{ status.cpu_usage.toFixed(1) }}%</span>
      </div>
      <div class="status-item">
        <span class="label">内存使用:</span>
        <span class="value">{{ status.memory_usage }}MB</span>
      </div>
      <div class="status-item">
        <span class="label">运行时间:</span>
        <span class="value">{{ formatDuration(status.uptime_seconds) }}</span>
      </div>
    </div>
    
    <div class="detection-results" v-if="detections.length > 0">
      <h3>检测结果</h3>
      <div class="detection-item" v-for="(detection, index) in detections" :key="index">
        <span class="class-name">{{ detection.class_name }}</span>
        <span class="confidence">{{ (detection.confidence * 100).toFixed(0) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { MonitorService } from '@/api'
import { createWebSocket, WebSocketInstance } from '@/api/websocketApi'

const props = defineProps<{
  taskId: number
}>()

// 任务信息
const task = reactive({
  id: props.taskId,
  name: '',
  status: 'stopped'
})

// 任务状态
const status = reactive({
  current_fps: 0,
  cpu_usage: 0,
  gpu_usage: 0,
  memory_usage: 0,
  uptime_seconds: 0
})

// 检测结果
const detections = ref([])

// WebSocket连接
let wsConnection: WebSocketInstance | null = null

// 启动任务
const startTask = async () => {
  try {
    const result = await MonitorService.startMonitorTask(task.id)
    task.status = result.status
    // 连接WebSocket获取实时状态
    connectWebSocket()
  } catch (error) {
    console.error('启动任务失败', error)
  }
}

// 停止任务
const stopTask = async () => {
  try {
    const result = await MonitorService.stopMonitorTask(task.id)
    task.status = result.status
    // 断开WebSocket连接
    disconnectWebSocket()
  } catch (error) {
    console.error('停止任务失败', error)
  }
}

// 连接WebSocket
const connectWebSocket = () => {
  wsConnection = createWebSocket({
    url: `ws://${window.location.host}/ws/monitor/${task.id}`,
    onOpen: () => {
      console.log('监控WebSocket已连接')
    },
    onMessage: (event) => {
      const data = JSON.parse(event.data)
      if (data.event === 'monitor_status') {
        // 更新状态信息
        Object.assign(status, data.data)
      } else if (data.event === 'detection_result') {
        // 更新检测结果
        detections.value = data.data.detections
      }
    },
    onClose: () => {
      console.log('监控WebSocket已断开')
    }
  })
}

// 断开WebSocket
const disconnectWebSocket = () => {
  if (wsConnection) {
    wsConnection.close()
    wsConnection = null
  }
}

// 格式化时间
const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 初始化
onMounted(async () => {
  try {
    // 获取任务信息
    const taskInfo = await MonitorService.getMonitorTask(props.taskId)
    Object.assign(task, taskInfo)
    
    // 如果任务正在运行，连接WebSocket
    if (task.status === 'running') {
      connectWebSocket()
    }
  } catch (error) {
    console.error('获取任务信息失败', error)
  }
})

// 清理
onUnmounted(() => {
  disconnectWebSocket()
})
</script>
```

### 报警列表组件

```vue
<template>
  <div class="warning-list">
    <el-table :data="warningList" v-loading="loading">
      <!-- 表格列... -->
    </el-table>
    <el-pagination
      v-model:current-page="queryParams.current"
      v-model:page-size="queryParams.size"
      :total="total"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { WarningService } from '@/api'

// 查询参数
const queryParams = reactive({
  current: 1,
  size: 10,
  warning_type: undefined,
  status: undefined,
})

// 数据
const warningList = ref([])
const total = ref(0)
const loading = ref(false)

// 获取报警列表
const getWarningList = async () => {
  loading.value = true
  try {
    const result = await WarningService.getWarningList(queryParams)
    warningList.value = result.records
    total.value = result.total
  } catch (error) {
    console.error('获取报警列表失败', error)
  } finally {
    loading.value = false
  }
}

// 更新报警状态
const updateWarningStatus = async (id: number, status: number) => {
  try {
    await WarningService.updateWarningStatus(id, status)
    // 重新加载列表
    getWarningList()
  } catch (error) {
    console.error('更新状态失败', error)
  }
}

// 分页变化
const handlePageChange = () => {
  getWarningList()
}

// 初始加载
onMounted(() => {
  getWarningList()
})
</script>
```

## 八、后续优化方向

1. 添加请求防抖和节流处理
2. 实现请求队列和取消机制
3. 添加接口缓存策略
4. 优化WebSocket连接的心跳机制
5. 添加API接口自动化测试
6. 更详细的错误日志和监控机制
7. 优化算法推理性能
8. 添加分布式处理能力
9. 实现更复杂的告警规则引擎
10. 集成更多类型的算法模型
