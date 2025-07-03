# AI监控管理系统后端

这是AI监控管理系统的后端部分，基于FastAPI和SQLite3开发。提供API接口、视频流处理、算法调度和告警管理功能。

## 目录结构

```
backend/
├── app/
│   ├── api/             # API路由
│   │   ├── endpoints/   # 各模块API端点
│   │   │   ├── algorithms.py    # 算法管理接口
│   │   │   ├── auth.py          # 认证相关接口
│   │   │   ├── monitor.py       # 监控任务接口
│   │   │   ├── videostreams.py  # 视频流接口
│   │   │   ├── warnings.py      # 告警信息接口
│   │   │   ├── repository.py    # 人脸库接口
│   │   │   ├── websocket.py     # WebSocket接口
│   │   │   └── ...              # 其他接口文件
│   │   ├── api.py       # API路由聚合
│   │   └── deps.py      # API依赖
│   ├── core/            # 核心配置
│   │   ├── config.py    # 应用配置
│   │   ├── security.py  # 安全/认证相关
│   │   └── events.py    # 事件处理
│   ├── db/              # 数据库相关
│   │   ├── base.py      # 数据库基础设置
│   │   ├── session.py   # 会话管理
│   │   └── init_db.py   # 数据库初始化
│   ├── models/          # SQLAlchemy数据库模型
│   │   ├── algorithm.py         # 算法模型
│   │   ├── monitor_task.py      # 监控任务模型
│   │   ├── organization.py      # 组织模型
│   │   ├── user.py              # 用户模型
│   │   ├── videostream.py       # 视频流模型
│   │   └── ...                  # 其他模型文件
│   ├── schemas/         # Pydantic模型/数据验证
│   │   ├── algorithm.py         # 算法数据模型
│   │   ├── monitor_task.py      # 监控任务数据模型
│   │   ├── organization.py      # 组织数据模型
│   │   ├── user.py              # 用户数据模型
│   │   ├── videostream.py       # 视频流数据模型
│   │   └── ...                  # 其他数据模型文件
│   ├── services/        # 业务逻辑服务
│   │   ├── algorithm_service.py   # 算法服务实现
│   │   ├── monitor_service.py     # 监控任务服务实现
│   │   ├── videostream_service.py # 视频流服务实现
│   │   ├── zlmedia_service.py     # 流媒体服务器接口
│   │   └── ...                    # 其他服务实现文件
│   ├── utils/           # 工具函数
│   │   ├── deps.py              # 通用依赖函数
│   │   ├── thread_pool.py       # 线程池管理工具
│   │   └── ...                  # 其他工具函数
│   └── ws/              # WebSocket相关
│       ├── connection.py        # WebSocket连接管理
│       └── manager.py           # WebSocket事件管理
├── uploads/             # 上传文件存储目录
├── alembic/             # 数据库迁移
├── tests/               # 单元测试
├── main.py              # 应用入口
└── requirements.txt     # 依赖库
```

## 核心文件说明

### 应用入口

- `main.py` - 应用程序入口点，创建FastAPI应用实例，配置中间件，注册路由

### API接口层

- `app/api/api.py` - 聚合所有API路由，设置路由前缀和标签
- `app/api/deps.py` - 提供依赖注入函数，如数据库会话、当前用户获取等
- `app/api/endpoints/algorithms.py` - 算法管理接口，提供算法的CRUD操作
- `app/api/endpoints/auth.py` - 认证接口，处理用户登录、注册、令牌验证等
- `app/api/endpoints/monitor.py` - 监控任务接口，管理监控任务的创建、启停、状态查询
- `app/api/endpoints/videostreams.py` - 视频流接口，管理视频流的添加、删除、状态检查
- `app/api/endpoints/warnings.py` - 告警接口，处理告警信息的查询、处理和统计
- `app/api/endpoints/websocket.py` - WebSocket接口，提供实时数据连接端点

### 核心配置

- `app/core/config.py` - 应用配置，包括数据库URL、JWT设置、跨域设置等
- `app/core/security.py` - 安全相关函数，处理密码哈希、JWT创建验证等
- `app/core/events.py` - 应用事件处理，包括启动和关闭事件

### 数据库层

- `app/db/base.py` - 数据库基础设置，定义基础模型类
- `app/db/session.py` - 数据库会话管理，创建引擎和会话工厂
- `app/db/init_db.py` - 数据库初始化，创建表结构和初始数据

### 数据模型

- `app/models/algorithm.py` - 算法数据库模型
- `app/models/monitor_task.py` - 监控任务数据库模型
- `app/models/organization.py` - 组织数据库模型
- `app/models/user.py` - 用户数据库模型
- `app/models/videostream.py` - 视频流数据库模型
- `app/models/warning.py` - 告警信息数据库模型

### 数据验证模型

- `app/schemas/algorithm.py` - 算法数据验证和响应模型
- `app/schemas/monitor_task.py` - 监控任务数据验证和响应模型
- `app/schemas/organization.py` - 组织数据验证和响应模型
- `app/schemas/user.py` - 用户数据验证和响应模型
- `app/schemas/videostream.py` - 视频流数据验证和响应模型
- `app/schemas/warning.py` - 告警信息数据验证和响应模型

### 业务服务层

- `app/services/algorithm_service.py` - 算法服务，提供算法管理和执行功能
- `app/services/monitor_service.py` - 监控任务服务，管理监控任务的创建、执行和状态维护
- `app/services/videostream_service.py` - 视频流服务，管理视频流的添加、状态检查等
- `app/services/zlmedia_service.py` - 流媒体服务，与ZLMediaKit流媒体服务器交互

### 工具类

- `app/utils/deps.py` - 依赖函数，提供通用依赖注入工具
- `app/utils/thread_pool.py` - 线程池管理工具，支持视频流和算法处理的多线程执行

### WebSocket相关

- `app/ws/connection.py` - WebSocket连接管理器，处理连接的建立、断开和消息发送
- `app/ws/manager.py` - WebSocket事件管理器，处理事件注册、触发和消息处理

## 主要功能模块说明

### 1. 算法管理模块

算法管理模块负责AI算法的管理和调用，包括以下功能：

- 算法CRUD操作：添加、修改、删除和查询算法
- 算法模型文件上传：上传和管理算法模型文件
- 算法测试：使用测试图片验证算法有效性
- 算法执行：在监控任务中调用算法进行分析

相关文件：
- `app/api/endpoints/algorithms.py` - 提供API接口
- `app/services/algorithm_service.py` - 实现业务逻辑
- `app/models/algorithm.py` - 数据库模型
- `app/schemas/algorithm.py` - 数据验证模型

### 2. 视频流管理模块

视频流管理模块负责视频流的管理和处理，包括以下功能：

- 视频流CRUD操作：添加、修改、删除和查询视频流
- 视频流状态检查：检查视频流是否可访问
- 视频流转发：通过ZLMediaKit转发和处理视频流
- 组织和虚拟组织管理：按组织和虚拟组织管理视频流

相关文件：
- `app/api/endpoints/videostreams.py` - 提供API接口
- `app/services/videostream_service.py` - 实现业务逻辑
- `app/services/zlmedia_service.py` - 与流媒体服务器交互
- `app/models/videostream.py` - 数据库模型
- `app/schemas/videostream.py` - 数据验证模型

### 3. 监控任务模块

监控任务模块负责创建和管理监控任务，包括以下功能：

- 监控任务CRUD操作：创建、修改、删除和查询监控任务
- 监控任务启停控制：启动和停止监控任务
- 监控任务状态查询：查询监控任务实时状态
- 多线程执行：使用线程池并发处理多个监控任务

相关文件：
- `app/api/endpoints/monitor.py` - 提供API接口
- `app/services/monitor_service.py` - 实现业务逻辑
- `app/utils/thread_pool.py` - 提供多线程支持
- `app/models/monitor_task.py` - 数据库模型
- `app/schemas/monitor_task.py` - 数据验证模型

### 4. WebSocket实时数据模块

WebSocket实时数据模块负责实时数据的推送，包括以下功能：

- 建立WebSocket连接：提供多种连接端点
- 用户认证：验证WebSocket连接的用户身份
- 实时数据推送：推送监控状态、告警信息等实时数据
- 事件处理：注册和处理自定义事件

相关文件：
- `app/api/endpoints/websocket.py` - 提供WebSocket接口
- `app/ws/connection.py` - 管理WebSocket连接
- `app/ws/manager.py` - 处理WebSocket事件

## 技术栈

- **框架**：FastAPI
- **数据库**：SQLite3
- **缓存**：Redis (可选)
- **流媒体服务器**：ZLMediaKit
- **算法推理**：YOLO系列 
- **认证**：JWT (JSON Web Token)
- **API文档**：Swagger/OpenAPI

## 完整安装与部署流程

### 1. 环境准备

#### 系统要求
- Python 3.8+
- FFmpeg 4.0+
- 可选: CUDA环境 (用于GPU加速)

```bash
# Ubuntu安装FFmpeg
sudo apt update
sudo apt install ffmpeg

# Windows安装FFmpeg
# 1. 下载: https://ffmpeg.org/download.html
# 2. 解压到任意目录
# 3. 添加bin目录到PATH环境变量
```

### 2. 流媒体服务器安装 (ZLMediaKit)

ZLMediaKit用于处理和转发RTSP/RTMP等流媒体协议。

#### Docker安装 (推荐)

```bash
# 拉取镜像
docker pull zlmediakit/zlmediakit:master

# 运行容器
docker run -d --restart=always \
    --name zlmediakit \
    -p 1935:1935 \
    -p 8080:80 \
    -p 8443:443 \
    -p 8554:554 \
    -p 10000:10000 \
    -p 10000:10000/udp \
    -p 30000-30500:30000-30500/udp \
    zlmediakit/zlmediakit:master
```

#### 配置ZLMediaKit

编辑配置文件（Docker中路径为`/opt/media/conf/config.ini`），设置API密钥：

```ini
[api]
secret=your_api_secret_here  # 设置安全密钥
apiDebug=1                   # 启用API调试
```

### 3. 后端安装

#### 创建虚拟环境 (推荐)

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

#### 安装依赖库

```bash
pip install -r requirements.txt

# 如果需要GPU支持
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

#### 环境配置

创建`.env`文件在项目根目录，设置必要的环境变量：

```
# API配置
SECRET_KEY=your_secure_secret_key
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# 数据库配置
SQLALCHEMY_DATABASE_URI=sqlite:///./ai_monitor.db

# Redis配置 (可选)
USE_REDIS=false
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT配置
JWT_SECRET=your_jwt_secret_key

# ZLMediaKit配置
ZLMEDIAKIT_API_URL=http://localhost:8080
ZLMEDIAKIT_SECRET=your_api_secret_here

# YOLO配置
YOLO_WEIGHTS_PATH=uploads/models/yolov5s.pt
YOLO_CONF_THRESHOLD=0.25
YOLO_IOU_THRESHOLD=0.45
YOLO_DEVICE=cuda:0  # 或 'cpu'
```

#### 初始化数据库

```bash
# 创建初始数据库表结构
python -c "from app.db.init_db import init_db; init_db()"

# 添加测试数据 (可选)
python -c "from app.db.init_db import create_test_data; create_test_data()"
```

### 4. 运行服务

#### 开发环境运行

```bash
# 使用uvicorn启动(开发环境)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 生产环境运行

```bash
# 使用Gunicorn和Uvicorn workers (生产环境)
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
```

## API文档

启动服务后，可以访问以下地址查看API文档：

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 主要功能

### 用户认证与授权
- 用户登录/注册/登出
- JWT认证
- 基于角色的权限控制

### 用户与角色管理
- 用户管理: 创建、查询、更新、删除
- 角色管理: 创建、分配权限

### 组织管理
- 支持多层级组织结构
- 虚拟组织管理

### 视频流管理
- 支持RTSP/RTMP/HTTP-FLV等协议
- 通过ZLMediaKit转发和处理流

### 算法管理
- YOLO目标检测
- 算法模型管理
- 性能监控

### 告警管理
- 实时告警通知
- 历史告警查询
- 告警统计

### 监控任务管理
- 实时监控
- 定时任务
- 告警规则配置

## 高级配置

### Redis缓存 (提高性能)

在`.env`文件中启用Redis:

```
USE_REDIS=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

### GPU加速

确保安装了CUDA和适配的PyTorch:

```bash
# 检查CUDA是否可用
python -c "import torch; print(torch.cuda.is_available())"
```

在`.env`文件中配置:

```
YOLO_DEVICE=cuda:0
```

### SSL配置

使用Nginx作为反向代理并配置SSL:

```nginx
server {
    listen 443 ssl;
    server_name api.yourdomian.com;

    ssl_certificate /path/to/certificate.pem;
    ssl_certificate_key /path/to/privatekey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws {
        proxy_pass http://localhost:8000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
} 