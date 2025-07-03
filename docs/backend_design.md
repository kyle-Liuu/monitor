# AI监控管理系统后端设计文档

## 1. 技术栈

- **框架**：FastAPI
- **数据库**：SQLite3 (轻量级关系型数据库) + Redis (可选，用于缓存)
- **通信**：HTTP RESTful API + WebSocket
- **认证**：JWT (JSON Web Token)
- **文档**：Swagger/OpenAPI

## 2. 项目结构图

```
┌─────────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│                     │     │                  │     │                    │
│  前端 (Vue.js)      │◄────┤  FastAPI 后端    │◄────┤  SQLite3 数据库    │
│                     │     │                  │     │                    │
└─────────┬───────────┘     └────────┬─────────┘     └────────────────────┘
          │                          │
          │                          │
          │                          ▼
          │                 ┌──────────────────┐
          │                 │                  │
          └────────────────►│  YOLO 算法服务   │
                            │                  │
                            └──────────────────┘
```

## 3. 后端目录结构

```
backend/
├── app/
│   ├── api/
│   │   ├── endpoints/
│   │   │   ├── auth.py          # 认证相关接口
│   │   │   ├── users.py         # 用户管理接口
│   │   │   ├── algorithm.py     # 算法管理接口
│   │   │   ├── videostream.py   # 视频流管理接口
│   │   │   ├── monitor.py       # 监控管理接口
│   │   │   ├── warning.py       # 告警信息接口
│   │   │   ├── repository.py    # 人脸库等资源库接口
│   │   │   └── system.py        # 系统管理接口
│   │   └── api.py               # API路由聚合
│   ├── core/
│   │   ├── config.py            # 配置管理
│   │   ├── security.py          # 安全相关
│   │   └── events.py            # 事件处理
│   ├── db/
│   │   ├── base.py              # 数据库基础设置
│   │   ├── session.py           # 会话管理
│   │   └── init_db.py           # 数据库初始化
│   ├── models/                  # 数据库模型
│   │   ├── user.py
│   │   ├── algorithm.py
│   │   ├── videostream.py
│   │   ├── warning.py
│   │   ├── face.py
│   │   └── system.py
│   ├── schemas/                 # Pydantic模型/数据验证
│   │   ├── user.py
│   │   ├── algorithm.py
│   │   ├── videostream.py
│   │   ├── warning.py
│   │   ├── face.py
│   │   └── system.py
│   ├── services/                # 业务逻辑
│   │   ├── algorithm_service.py
│   │   ├── videostream_service.py
│   │   ├── monitor_service.py
│   │   ├── warning_service.py
│   │   └── face_service.py
│   ├── utils/                   # 工具函数
│   │   ├── deps.py              # 依赖注入
│   │   └── yolo_utils.py        # YOLO算法工具
│   └── ws/                      # WebSocket相关
│       ├── connection.py
│       └── manager.py
├── alembic/                     # 数据库迁移
├── tests/                       # 测试
├── main.py                      # 应用入口
└── requirements.txt             # 依赖管理
```

## 4. SQLite3 数据库设计

### SQLite3 特点与优势

- **轻量级**：单文件数据库，无需独立服务器
- **零配置**：无需安装和配置过程
- **可移植性**：数据库文件可直接复制迁移
- **性能**：对于中小规模应用性能良好
- **可靠性**：支持ACID事务

### 数据库表设计

#### 用户表 (users)
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(100) NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    gender INTEGER DEFAULT 1, -- 1:男 2:女
    avatar VARCHAR(255),
    status VARCHAR(2) DEFAULT '1', -- 1:在线 2:离线 3:异常 4:注销
    last_login TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    is_superuser INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 角色表 (roles)
```sql
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_code VARCHAR(50) UNIQUE NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 用户角色关联表 (user_roles)
```sql
CREATE TABLE user_roles (
    user_id INTEGER,
    role_id INTEGER,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
```

#### 菜单表 (menus)
```sql
CREATE TABLE menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    component TEXT,
    redirect TEXT,
    icon TEXT,
    parent_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    is_hidden INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES menus(id) ON DELETE SET NULL
);
```

#### 角色菜单关联表 (role_menus)
```sql
CREATE TABLE role_menus (
    role_id INTEGER,
    menu_id INTEGER,
    PRIMARY KEY (role_id, menu_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
);
```

#### 算法表 (algorithms)
```sql
CREATE TABLE algorithms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,  -- 如：目标检测、人脸识别等
    model_path TEXT,     -- 模型文件路径
    config_json TEXT,    -- 配置信息 (JSON格式)
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 视频流表 (videostreams)
```sql
CREATE TABLE videostreams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL,  -- 如：RTSP、RTMP、HLS等
    status TEXT DEFAULT 'offline',  -- online, offline, error
    organization_id INTEGER,
    location TEXT,
    description TEXT,
    config_json TEXT,    -- 配置信息 (JSON格式)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
```

#### 组织表 (organizations)
```sql
CREATE TABLE organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER,
    description TEXT,
    address TEXT,
    contact TEXT,
    contact_phone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES organizations(id) ON DELETE SET NULL
);
```

#### 虚拟组织表 (virtual_organizations)
```sql
CREATE TABLE virtual_organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 虚拟组织视频流关联表 (virtual_org_streams)
```sql
CREATE TABLE virtual_org_streams (
    virtual_org_id INTEGER,
    videostream_id INTEGER,
    PRIMARY KEY (virtual_org_id, videostream_id),
    FOREIGN KEY (virtual_org_id) REFERENCES virtual_organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (videostream_id) REFERENCES videostreams(id) ON DELETE CASCADE
);
```

#### 人脸库表 (face_repository)
```sql
CREATE TABLE face_repository (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    person_id TEXT NOT NULL,
    face_image_path TEXT NOT NULL,
    feature_vector BLOB,       -- 人脸特征向量
    metadata TEXT,             -- 其他元数据 (JSON格式)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 告警信息表 (warnings)
```sql
CREATE TABLE warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,  -- 如：入侵检测、人脸识别、异常行为等
    level TEXT NOT NULL, -- 如：info, warning, critical
    videostream_id INTEGER,
    algorithm_id INTEGER,
    detection_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_path TEXT,     -- 告警截图路径
    metadata TEXT,       -- 告警详细信息 (JSON格式)
    is_processed INTEGER DEFAULT 0,
    processed_by INTEGER,
    processed_at TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (videostream_id) REFERENCES videostreams(id),
    FOREIGN KEY (algorithm_id) REFERENCES algorithms(id),
    FOREIGN KEY (processed_by) REFERENCES users(id)
);
```

#### 监控任务表 (monitor_tasks)
```sql
CREATE TABLE monitor_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    videostream_id INTEGER,
    algorithm_id INTEGER,
    status TEXT DEFAULT 'stopped',  -- running, stopped, error
    config_json TEXT,          -- 任务配置 (JSON格式)
    schedule_type TEXT,        -- 如：realtime, scheduled
    schedule_config TEXT,      -- 调度配置 (JSON格式)
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (videostream_id) REFERENCES videostreams(id),
    FOREIGN KEY (algorithm_id) REFERENCES algorithms(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

## 5. API接口设计

### 认证接口

#### 登录
- **路径**: `/api/auth/login`
- **方法**: POST
- **请求体**:
  ```json
  {
    "username": "admin",
    "password": "password"
  }
  ```
- **响应**:
  ```json
  {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "full_name": "管理员",
      "is_active": true,
      "is_superuser": true
    }
  }
  ```

#### 注册
- **路径**: `/api/auth/register`
- **方法**: POST
- **请求体**:
  ```json
  {
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "password123",
    "full_name": "新用户"
  }
  ```

### 用户管理接口

#### 用户数据表设计
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(100) NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    gender INTEGER DEFAULT 1, -- 1:男 2:女
    avatar VARCHAR(255),
    status VARCHAR(2) DEFAULT '1', -- 1:在线 2:离线 3:异常 4:注销
    last_login TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    is_superuser INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_code VARCHAR(50) UNIQUE NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
    user_id INTEGER,
    role_id INTEGER,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
```

#### 用户认证接口
- **路径**: `/api/auth/login`
- **方法**: POST
- **请求体**:
  ```json
  {
    "username": "admin",
    "password": "password"
  }
  ```
- **响应**:
  ```json
  {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "full_name": "管理员",
      "is_active": true,
      "is_superuser": true
    }
  }
  ```

#### 获取用户信息
- **路径**: `/api/user/info`
- **方法**: GET
- **响应**:
  ```json
  {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "full_name": "管理员",
    "phone": "13800138000",
    "gender": 1,
    "avatar": "/storage/avatars/admin.jpg",
    "status": "1",
    "is_active": true,
    "is_superuser": true,
    "created_at": "2023-06-01T10:00:00Z",
    "updated_at": "2023-06-15T08:30:00Z",
    "userRoles": ["admin", "user"]
  }
  ```

#### 获取用户列表
- **路径**: `/api/user/list`
- **方法**: GET
- **查询参数**: `current=1&size=20&name=&phone=&status=&level=`
- **响应**:
  ```json
  {
    "records": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "full_name": "管理员",
        "phone": "13800138000",
        "gender": 1,
        "avatar": "/storage/avatars/admin.jpg",
        "status": "1",
        "is_active": true,
        "is_superuser": true,
        "created_at": "2023-06-01T10:00:00Z",
        "updated_at": "2023-06-15T08:30:00Z",
        "userRoles": ["admin", "user"]
      },
      // ...
    ],
    "current": 1,
    "size": 20,
    "total": 100
  }
  ```

#### 创建用户
- **路径**: `/api/user`
- **方法**: POST
- **请求体**:
  ```json
  {
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "password123",
    "full_name": "新用户",
    "phone": "13900139000",
    "gender": 1,
    "roles": ["user"]
  }
  ```
- **响应**: 返回创建的用户信息

#### 更新用户
- **路径**: `/api/user/{user_id}`
- **方法**: PUT
- **请求体**:
  ```json
  {
    "username": "updateduser",
    "email": "updated@example.com",
    "full_name": "更新用户",
    "phone": "13900139001",
    "gender": 2,
    "status": "1",
    "roles": ["editor", "user"]
  }
  ```
- **响应**: 返回更新后的用户信息

#### 删除/注销用户
- **路径**: `/api/user/{user_id}`
- **方法**: DELETE
- **响应**:
  ```json
  {
    "message": "用户已成功注销"
  }
  ```

#### Redis缓存策略

用户相关数据缓存设计：

1. **用户信息缓存**:
   - 键格式: `user:{user_id}`
   - 值: 用户信息的JSON序列化字符串
   - 过期时间: 1小时

2. **用户认证缓存**:
   - 键格式: `token:{access_token}`
   - 值: 用户ID
   - 过期时间: 与token有效期相同

3. **用户角色缓存**:
   - 键格式: `user_roles:{user_id}`
   - 值: 角色代码列表的JSON序列化字符串
   - 过期时间: 1小时

4. **用户列表缓存**:
   - 键格式: `user_list:{query_hash}`  
   - 值: 查询结果的JSON序列化字符串
   - 过期时间: 5分钟

### 菜单接口

#### 获取菜单列表
- **路径**: `/api/system/menus/`
- **方法**: GET
- **响应**:
  ```json
  [
    {
      "id": 1,
      "name": "监控管理",
      "path": "/monitor",
      "component": "monitor/index",
      "icon": "monitor",
      "children": [
        // ...
      ]
    },
    // ...
  ]
  ```

### 算法管理接口

#### 获取算法列表
- **路径**: `/api/algorithms/`
- **方法**: GET
- **查询参数**: `current=1&size=20&type=&is_active=true`
- **响应**:
  ```json
  {
    "records": [
      {
        "id": 1,
        "name": "YOLOv5",
        "version": "6.1",
        "type": "object_detection",
        "description": "通用目标检测算法",
        "is_active": true,
        "created_at": "2023-06-01T10:00:00Z",
        "updated_at": "2023-06-15T08:30:00Z"
      },
      // ...
    ],
    "current": 1,
    "size": 20,
    "total": 5
  }
  ```

#### 获取算法详情
- **路径**: `/api/algorithms/{algorithm_id}`
- **方法**: GET
- **响应**:
  ```json
  {
    "id": 1,
    "name": "YOLOv5",
    "version": "6.1",
    "type": "object_detection",
    "description": "通用目标检测算法",
    "model_path": "/models/yolov5s.pt",
    "config_json": {
      "confidence_threshold": 0.5,
      "nms_threshold": 0.4,
      "device": "cuda",
      "classes": [
        "person", "bicycle", "car", "motorcycle", "bus", "truck"
      ]
    },
    "is_active": true,
    "created_at": "2023-06-01T10:00:00Z",
    "updated_at": "2023-06-15T08:30:00Z"
  }
  ```

#### 创建算法
- **路径**: `/api/algorithms/`
- **方法**: POST
- **请求体**:
  ```json
  {
    "name": "YOLOv7",
    "version": "1.0",
    "type": "object_detection",
    "description": "改进版目标检测算法，速度更快",
    "model_path": "/models/yolov7.pt",
    "config_json": {
      "confidence_threshold": 0.6,
      "nms_threshold": 0.5,
      "device": "cuda",
      "classes": [
        "person", "bicycle", "car", "motorcycle", "bus", "truck"
      ]
    }
  }
  ```
- **响应**: 返回创建的算法信息

#### 更新算法
- **路径**: `/api/algorithms/{algorithm_id}`
- **方法**: PUT
- **请求体**:
  ```json
  {
    "name": "YOLOv5-improved",
    "version": "6.2",
    "description": "优化后的YOLOv5算法",
    "config_json": {
      "confidence_threshold": 0.6,
      "nms_threshold": 0.45,
      "device": "cuda"
    },
    "is_active": true
  }
  ```
- **响应**: 返回更新后的算法信息

#### 删除算法
- **路径**: `/api/algorithms/{algorithm_id}`
- **方法**: DELETE
- **响应**:
  ```json
  {
    "message": "算法已成功删除"
  }
  ```

#### 上传算法模型
- **路径**: `/api/algorithms/upload-model`
- **方法**: POST
- **请求体**: 使用FormData格式
  ```
  {
    "model_file": <模型文件>,
    "algorithm_id": 1
  }
  ```
- **响应**:
  ```json
  {
    "algorithm_id": 1,
    "model_path": "/models/yolov5s_new.pt",
    "file_size": 14528000,
    "upload_time": "2023-06-16T10:30:00Z"
  }
  ```

#### 测试算法
- **路径**: `/api/algorithms/{algorithm_id}/test`
- **方法**: POST
- **请求体**: 使用FormData格式
  ```
  {
    "test_image": <测试图片>,
    "config_override": {
      "confidence_threshold": 0.7
    }
  }
  ```
- **响应**:
  ```json
  {
    "algorithm_id": 1,
    "algorithm_name": "YOLOv5",
    "processing_time_ms": 85,
    "detections": [
      {
        "class": "person",
        "confidence": 0.92,
        "bbox": [120, 30, 350, 540]
      },
      {
        "class": "car",
        "confidence": 0.88,
        "bbox": [450, 200, 650, 380]
      }
    ],
    "result_image": "base64编码的结果图片"
  }
  ```

#### 获取算法性能指标
- **路径**: `/api/algorithms/{algorithm_id}/metrics`
- **方法**: GET
- **查询参数**: `period=7d`  // 1d, 7d, 30d, all
- **响应**:
  ```json
  {
    "algorithm_id": 1,
    "algorithm_name": "YOLOv5",
    "metrics": {
      "avg_processing_time_ms": 78.5,
      "max_processing_time_ms": 120,
      "min_processing_time_ms": 65,
      "avg_fps": 12.8,
      "total_calls": 15240,
      "error_rate": 0.002
    },
    "daily_metrics": [
      {
        "date": "2023-06-10",
        "avg_processing_time_ms": 80.2,
        "total_calls": 2500
      },
      // ...
    ]
  }
  ```

### 视频流管理接口

#### 获取视频流列表
- **路径**: `/api/videostreams/`
- **方法**: GET
- **响应**:
  ```json
  {
    "total": 20,
    "items": [
      {
        "id": 1,
        "name": "前门摄像头",
        "url": "rtsp://192.168.1.100:554/stream1",
        "type": "RTSP",
        "status": "online",
        "organization": {
          "id": 1,
          "name": "总部大楼"
        }
      },
      // ...
    ]
  }
  ```

#### 创建视频流
- **路径**: `/api/videostreams/`
- **方法**: POST
- **请求体**:
  ```json
  {
    "name": "后门摄像头",
    "url": "rtsp://192.168.1.101:554/stream1",
    "type": "RTSP",
    "organization_id": 1,
    "location": "后门区域",
    "description": "监控后门进出人员"
  }
  ```
- **响应**: 返回创建的视频流信息

#### 更新视频流
- **路径**: `/api/videostreams/{stream_id}`
- **方法**: PUT
- **请求体**:
  ```json
  {
    "name": "后门摄像头-更新",
    "url": "rtsp://192.168.1.101:554/stream2",
    "status": "offline",
    "description": "临时关闭维护"
  }
  ```
- **响应**: 返回更新后的视频流信息

#### 删除视频流
- **路径**: `/api/videostreams/{stream_id}`
- **方法**: DELETE
- **响应**:
  ```json
  {
    "message": "视频流已成功删除"
  }
  ```

#### 检测视频流状态
- **路径**: `/api/videostreams/{stream_id}/status`
- **方法**: GET
- **响应**:
  ```json
  {
    "id": 1,
    "status": "online",
    "latency": 120,
    "last_checked": "2023-06-15T14:30:00Z"
  }
  ```

### 组织管理接口

#### 获取组织列表
- **路径**: `/api/organizations/`
- **方法**: GET
- **响应**:
  ```json
  {
    "total": 10,
    "items": [
      {
        "id": 1,
        "name": "总部大楼",
        "parent_id": null,
        "description": "公司总部",
        "address": "北京市海淀区中关村",
        "contact": "张经理",
        "contact_phone": "13800138000",
        "created_at": "2023-06-01T10:00:00Z",
        "children": [
          {
            "id": 2,
            "name": "研发部",
            "parent_id": 1,
            "description": "负责产品研发"
          }
        ]
      },
      // ...
    ]
  }
  ```

#### 创建组织
- **路径**: `/api/organizations/`
- **方法**: POST
- **请求体**:
  ```json
  {
    "name": "安保部",
    "parent_id": 1,
    "description": "负责安全保卫工作",
    "address": "北京市海淀区中关村",
    "contact": "李队长",
    "contact_phone": "13900139000"
  }
  ```
- **响应**: 返回创建的组织信息

#### 更新组织
- **路径**: `/api/organizations/{org_id}`
- **方法**: PUT
- **请求体**:
  ```json
  {
    "name": "安防部",
    "description": "负责安全防范工作",
    "contact": "王队长",
    "contact_phone": "13900139001"
  }
  ```
- **响应**: 返回更新后的组织信息

#### 删除组织
- **路径**: `/api/organizations/{org_id}`
- **方法**: DELETE
- **响应**:
  ```json
  {
    "message": "组织已成功删除"
  }
  ```

### 虚拟组织管理接口

#### 获取虚拟组织列表
- **路径**: `/api/virtualorganizations/`
- **方法**: GET
- **响应**:
  ```json
  {
    "total": 5,
    "items": [
      {
        "id": 1,
        "name": "重点区域监控",
        "description": "公司重要区域监控集合",
        "created_at": "2023-06-01T10:00:00Z",
        "updated_at": "2023-06-15T08:30:00Z",
        "videostreams": [
          {
            "id": 1,
            "name": "前门摄像头"
          },
          {
            "id": 3,
            "name": "财务室摄像头"
          }
        ]
      },
      // ...
    ]
  }
  ```

#### 创建虚拟组织
- **路径**: `/api/virtualorganizations/`
- **方法**: POST
- **请求体**:
  ```json
  {
    "name": "外围监控",
    "description": "公司外围监控集合",
    "videostream_ids": [2, 4, 6]
  }
  ```
- **响应**: 返回创建的虚拟组织信息

#### 更新虚拟组织
- **路径**: `/api/virtualorganizations/{virtual_org_id}`
- **方法**: PUT
- **请求体**:
  ```json
  {
    "name": "外围安全监控",
    "description": "公司外围安全监控集合",
    "videostream_ids": [2, 4, 6, 8]
  }
  ```
- **响应**: 返回更新后的虚拟组织信息

#### 删除虚拟组织
- **路径**: `/api/virtualorganizations/{virtual_org_id}`
- **方法**: DELETE
- **响应**:
  ```json
  {
    "message": "虚拟组织已成功删除"
  }
  ```

#### 为虚拟组织添加视频流
- **路径**: `/api/virtualorganizations/{virtual_org_id}/streams`
- **方法**: POST
- **请求体**:
  ```json
  {
    "videostream_ids": [5, 7, 9]
  }
  ```
- **响应**:
  ```json
  {
    "message": "已成功添加3个视频流到虚拟组织"
  }
  ```

#### 从虚拟组织移除视频流
- **路径**: `/api/virtualorganizations/{virtual_org_id}/streams/{stream_id}`
- **方法**: DELETE
- **响应**:
  ```json
  {
    "message": "视频流已从虚拟组织中移除"
  }
  ```

### 监控任务接口

#### 创建监控任务
- **路径**: `/api/monitor/tasks/`
- **方法**: POST
- **请求体**:
  ```json
  {
    "name": "入侵检测任务",
    "videostream_id": 1,
    "algorithm_id": 1,
    "config_json": {
      "target_classes": ["person"],
      "alert_threshold": 0.7,
      "region_of_interest": [[0,0], [0,1], [1,1], [1,0]]
    },
    "schedule_type": "realtime"
  }
  ```
- **响应**: 返回创建的监控任务信息

#### 获取监控任务列表
- **路径**: `/api/monitor/tasks/`
- **方法**: GET
- **查询参数**: `current=1&size=20&status=&videostream_id=&algorithm_id=`
- **响应**:
  ```json
  {
    "records": [
      {
        "id": 1,
        "name": "入侵检测任务",
        "status": "running",
        "videostream": {
          "id": 1,
          "name": "前门摄像头"
        },
        "algorithm": {
          "id": 1,
          "name": "YOLOv5"
        },
        "schedule_type": "realtime",
        "created_by": {
          "id": 1,
          "username": "admin"
        },
        "created_at": "2023-06-15T10:00:00Z",
        "updated_at": "2023-06-15T10:30:00Z"
      },
      // ...
    ],
    "current": 1,
    "size": 20,
    "total": 10
  }
  ```

#### 获取监控任务详情
- **路径**: `/api/monitor/tasks/{task_id}`
- **方法**: GET
- **响应**:
  ```json
  {
    "id": 1,
    "name": "入侵检测任务",
    "videostream": {
      "id": 1,
      "name": "前门摄像头",
      "url": "rtsp://192.168.1.100:554/stream1"
    },
    "algorithm": {
      "id": 1,
      "name": "YOLOv5",
      "version": "6.1"
    },
    "status": "running",
    "config_json": {
      "target_classes": ["person"],
      "alert_threshold": 0.7,
      "region_of_interest": [[0,0], [0,1], [1,1], [1,0]]
    },
    "schedule_type": "realtime",
    "schedule_config": null,
    "created_by": {
      "id": 1,
      "username": "admin"
    },
    "created_at": "2023-06-15T10:00:00Z",
    "updated_at": "2023-06-15T10:30:00Z",
    "last_warning": {
      "id": 5,
      "type": "intrusion_detection",
      "level": "critical",
      "detection_time": "2023-06-15T14:30:00Z"
    },
    "warning_count": 3
  }
  ```

#### 更新监控任务
- **路径**: `/api/monitor/tasks/{task_id}`
- **方法**: PUT
- **请求体**:
  ```json
  {
    "name": "入侵检测任务-更新",
    "config_json": {
      "target_classes": ["person"],
      "alert_threshold": 0.8,
      "region_of_interest": [[0.1,0.1], [0.1,0.9], [0.9,0.9], [0.9,0.1]]
    }
  }
  ```
- **响应**: 返回更新后的监控任务信息

#### 删除监控任务
- **路径**: `/api/monitor/tasks/{task_id}`
- **方法**: DELETE
- **响应**:
  ```json
  {
    "message": "监控任务已成功删除"
  }
  ```

#### 启动监控任务
- **路径**: `/api/monitor/tasks/{task_id}/start`
- **方法**: POST
- **响应**:
  ```json
  {
    "id": 1,
    "name": "入侵检测任务",
    "status": "running",
    "start_time": "2023-06-15T15:00:00Z"
  }
  ```

#### 停止监控任务
- **路径**: `/api/monitor/tasks/{task_id}/stop`
- **方法**: POST
- **响应**:
  ```json
  {
    "id": 1,
    "name": "入侵检测任务",
    "status": "stopped",
    "stop_time": "2023-06-15T16:00:00Z",
    "duration_seconds": 3600
  }
  ```

#### 获取监控任务实时状态
- **路径**: `/api/monitor/tasks/{task_id}/status`
- **方法**: GET
- **响应**:
  ```json
  {
    "id": 1,
    "name": "入侵检测任务",
    "status": "running",
    "current_fps": 15.2,
    "cpu_usage": 25.6,
    "gpu_usage": 45.2,
    "memory_usage": 512,
    "uptime_seconds": 3600,
    "detected_objects": [
      {
        "class": "person",
        "confidence": 0.85,
        "count": 2
      },
      {
        "class": "car",
        "confidence": 0.92,
        "count": 1
      }
    ],
    "last_frame_time": "2023-06-15T15:59:59Z"
  }
  ```

#### 创建定时监控任务
- **路径**: `/api/monitor/tasks/scheduled`
- **方法**: POST
- **请求体**:
  ```json
  {
    "name": "夜间入侵检测",
    "videostream_id": 1,
    "algorithm_id": 1,
    "config_json": {
      "target_classes": ["person"],
      "alert_threshold": 0.7
    },
    "schedule_type": "scheduled",
    "schedule_config": {
      "start_time": "20:00:00",
      "end_time": "06:00:00",
      "days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    }
  }
  ```
- **响应**: 返回创建的定时监控任务信息

### 告警信息接口

#### 获取告警列表
- **路径**: `/api/warnings/`
- **方法**: GET
- **查询参数**: `current=1&size=20&level=&type=&videostream_id=&start_date=2023-06-01&end_date=2023-06-30&is_processed=0`
- **响应**:
  ```json
  {
    "records": [
      {
        "id": 1,
        "type": "intrusion_detection",
        "level": "critical",
        "videostream": {
          "id": 1,
          "name": "前门摄像头"
        },
        "algorithm": {
          "id": 1,
          "name": "YOLOv5"
        },
        "detection_time": "2023-06-15T14:30:00Z",
        "image_path": "/storage/warnings/img_001.jpg",
        "is_processed": false,
        "metadata": {
          "detected_objects": [
            {
              "class": "person",
              "confidence": 0.92,
              "bbox": [120, 30, 350, 540]
            }
          ],
          "zone_id": "restricted_area_1"
        }
      },
      // ...
    ],
    "current": 1,
    "size": 20,
    "total": 50
  }
  ```

#### 获取告警详情
- **路径**: `/api/warnings/{warning_id}`
- **方法**: GET
- **响应**:
  ```json
  {
    "id": 1,
    "type": "intrusion_detection",
    "level": "critical",
    "videostream": {
      "id": 1,
      "name": "前门摄像头",
      "url": "rtsp://192.168.1.100:554/stream1",
      "organization": {
        "id": 1,
        "name": "总部大楼"
      }
    },
    "algorithm": {
      "id": 1,
      "name": "YOLOv5",
      "version": "6.1"
    },
    "detection_time": "2023-06-15T14:30:00Z",
    "image_path": "/storage/warnings/img_001.jpg",
    "is_processed": false,
    "processed_by": null,
    "processed_at": null,
    "notes": "",
    "metadata": {
      "detected_objects": [
        {
          "class": "person",
          "confidence": 0.92,
          "bbox": [120, 30, 350, 540]
        }
      ],
      "zone_id": "restricted_area_1",
      "rule_triggered": "no_person_allowed",
      "video_clip": "/storage/warnings/clip_001.mp4"
    }
  }
  ```

#### 处理告警
- **路径**: `/api/warnings/{warning_id}/process`
- **方法**: PUT
- **请求体**:
  ```json
  {
    "is_processed": true,
    "notes": "确认为安保人员巡逻，非异常情况"
  }
  ```
- **响应**:
  ```json
  {
    "id": 1,
    "is_processed": true,
    "processed_by": {
      "id": 1,
      "username": "admin"
    },
    "processed_at": "2023-06-15T15:30:00Z",
    "notes": "确认为安保人员巡逻，非异常情况"
  }
  ```

#### 批量处理告警
- **路径**: `/api/warnings/batch-process`
- **方法**: PUT
- **请求体**:
  ```json
  {
    "warning_ids": [1, 2, 3, 5],
    "is_processed": true,
    "notes": "系统误报，已确认"
  }
  ```
- **响应**:
  ```json
  {
    "processed_count": 4,
    "processed_ids": [1, 2, 3, 5],
    "processed_at": "2023-06-15T16:00:00Z"
  }
  ```

#### 告警统计信息
- **路径**: `/api/warnings/statistics`
- **方法**: GET
- **查询参数**: `start_date=2023-06-01&end_date=2023-06-30&group_by=type`
- **响应**:
  ```json
  {
    "total": 120,
    "processed": 85,
    "unprocessed": 35,
    "by_level": {
      "info": 30,
      "warning": 60,
      "critical": 30
    },
    "by_type": {
      "intrusion_detection": 50,
      "face_recognition": 40,
      "abnormal_behavior": 30
    },
    "by_date": [
      {
        "date": "2023-06-01",
        "count": 5
      },
      {
        "date": "2023-06-02",
        "count": 8
      },
      // ...
    ]
  }
  ```

#### 删除告警
- **路径**: `/api/warnings/{warning_id}`
- **方法**: DELETE
- **响应**:
  ```json
  {
    "message": "告警已成功删除"
  }
  ```

#### 导出告警数据
- **路径**: `/api/warnings/export`
- **方法**: GET
- **查询参数**: `format=xlsx&start_date=2023-06-01&end_date=2023-06-30&type=&level=`
- **响应**: 直接下载Excel或CSV文件

### 人脸库接口

#### 获取人脸列表
- **路径**: `/api/repository/faces/`
- **方法**: GET
- **查询参数**: `current=1&size=20&name=&personId=`
- **响应**:
  ```json
  {
    "records": [
      {
        "id": 1,
        "name": "张三",
        "person_id": "P001",
        "face_image_path": "/storage/faces/face_001.jpg",
        "metadata": {
          "age": 30,
          "gender": "male"
        },
        "created_at": "2023-06-01T10:00:00Z",
        "updated_at": "2023-06-15T08:30:00Z"
      },
      // ...
    ],
    "current": 1,
    "size": 20,
    "total": 100
  }
  ```

#### 上传人脸图片
- **路径**: `/api/repository/faces/upload`
- **方法**: POST
- **请求体**: 使用FormData格式
  ```
  {
    "name": "李四",
    "person_id": "P002",
    "face_image": <图片文件>,
    "metadata": "{\"age\": 28, \"gender\": \"male\"}"
  }
  ```
- **响应**: 
  ```json
  {
    "id": 2,
    "name": "李四",
    "person_id": "P002",
    "face_image_path": "/storage/faces/face_002.jpg",
    "feature_vector": "base64编码的特征向量",
    "metadata": {
      "age": 28,
      "gender": "male"
    },
    "created_at": "2023-06-16T09:30:00Z"
  }
  ```

#### 更新人脸信息
- **路径**: `/api/repository/faces/{face_id}`
- **方法**: PUT
- **请求体**:
  ```json
  {
    "name": "李四(更新)",
    "person_id": "P002-1",
    "metadata": {
      "age": 29,
      "gender": "male",
      "department": "技术部"
    }
  }
  ```
- **响应**: 返回更新后的人脸信息

#### 删除人脸记录
- **路径**: `/api/repository/faces/{face_id}`
- **方法**: DELETE
- **响应**:
  ```json
  {
    "message": "人脸记录已成功删除"
  }
  ```

#### 人脸搜索匹配
- **路径**: `/api/repository/faces/search`
- **方法**: POST
- **请求体**: 使用FormData格式
  ```
  {
    "face_image": <图片文件>,
    "threshold": 0.8,
    "max_results": 5
  }
  ```
- **响应**:
  ```json
  {
    "results": [
      {
        "face_id": 1,
        "name": "张三",
        "person_id": "P001",
        "similarity": 0.95,
        "face_image_path": "/storage/faces/face_001.jpg",
        "metadata": {
          "age": 30,
          "gender": "male"
        }
      },
      {
        "face_id": 5,
        "name": "王五",
        "person_id": "P005",
        "similarity": 0.82,
        "face_image_path": "/storage/faces/face_005.jpg",
        "metadata": {
          "age": 35,
          "gender": "male"
        }
      }
    ],
    "total": 2,
    "query_time_ms": 120
  }
  ```

#### 批量导入人脸
- **路径**: `/api/repository/faces/batch-import`
- **方法**: POST
- **请求体**: 使用FormData格式
  ```
  {
    "face_zip": <包含人脸图片的ZIP文件>,
    "metadata_json": <包含元数据的JSON文件>
  }
  ```
- **响应**:
  ```json
  {
    "total_processed": 50,
    "successful": 48,
    "failed": 2,
    "failed_details": [
      {
        "filename": "face123.jpg",
        "reason": "无法检测到人脸"
      },
      {
        "filename": "face456.jpg",
        "reason": "图片格式不支持"
      }
    ]
  }
  ```

#### 人脸特征提取
- **路径**: `/api/repository/faces/extract-features`
- **方法**: POST
- **请求体**: 使用FormData格式
  ```
  {
    "face_image": <图片文件>
  }
  ```
- **响应**:
  ```json
  {
    "features": {
      "vector": "base64编码的特征向量",
      "landmarks": [
        {"x": 125, "y": 240},
        {"x": 190, "y": 240},
        {"x": 158, "y": 280},
        {"x": 130, "y": 320},
        {"x": 186, "y": 320}
      ]
    },
    "face_quality": 0.92,
    "detected_attributes": {
      "gender": "male",
      "age": "25-35",
      "emotion": "neutral"
    },
    "image_with_landmarks": "base64编码的标记了关键点的图片"
  }
  ```

## 6. WebSocket接口

### 实时监控数据
- **路径**: `/ws/monitor/{task_id}`
- **事件**:
  - `detection`: 检测结果推送
  - `warning`: 告警信息推送
  - `status`: 任务状态更新

### 实时告警推送
- **路径**: `/ws/warnings`
- **事件**:
  - `new_warning`: 新告警推送
  - `warning_update`: 告警状态更新

## 7. SQLite3 优化策略

### 性能优化

1. **索引优化**:
   ```sql
   -- 为常用查询字段创建索引
   CREATE INDEX idx_videostreams_organization ON videostreams(organization_id);
   CREATE INDEX idx_warnings_videostream ON warnings(videostream_id);
   CREATE INDEX idx_warnings_detection_time ON warnings(detection_time);
   CREATE INDEX idx_face_repository_person_id ON face_repository(person_id);
   ```

2. **查询优化**:
   - 使用参数化查询避免SQL注入
   - 避免使用`SELECT *`，只选择需要的列
   - 合理使用事务减少磁盘I/O

3. **WAL模式**:
   ```python
   # 启用WAL模式提高并发性能
   db.execute("PRAGMA journal_mode=WAL;")
   ```

4. **定期维护**:
   ```python
   # 定期执行VACUUM优化数据库大小
   db.execute("VACUUM;")
   ```

### 扩展性考虑

1. **数据库分片**:
   - 按时间或组织划分多个SQLite数据库文件
   - 使用应用层逻辑处理跨数据库查询

2. **备份策略**:
   - 定期备份数据库文件
   - 实现增量备份机制

3. **迁移路径**:
   - 设计允许未来迁移到PostgreSQL等数据库的架构
   - 使用SQLAlchemy等ORM框架抽象数据库操作

## 8. SQLite3 vs PostgreSQL 考虑因素

### 选择SQLite3的优势

1. **部署简单**:
   - 无需额外服务器和配置
   - 适合快速开发和原型验证

2. **资源占用低**:
   - 内存和CPU占用少
   - 适合资源受限环境

3. **便于分发**:
   - 整个数据库是单个文件
   - 便于备份和迁移

### 潜在限制

1. **并发性能**:
   - 写操作会锁定整个数据库
   - 不适合高并发写入场景

2. **扩展性**:
   - 不支持分布式部署
   - 单文件大小有限制

3. **功能限制**:
   - 缺少一些高级数据库功能
   - 数据类型支持有限

### 适用场景

SQLite3适合:
- 单机部署的中小型监控系统
- 用户数量和并发访问有限的场景
- 需要便携和简单部署的环境
- 开发和测试环境

如果未来系统需要扩展到大规模部署，可以考虑迁移到PostgreSQL等数据库。

## 9. 系统架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                           客户端层                                   │
│                                                                     │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────────────┐  │
│  │  Web浏览器    │   │  移动应用     │   │  桌面客户端           │  │
│  └───────────────┘   └───────────────┘   └───────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           应用服务层                                 │
│                                                                     │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────────────┐  │
│  │  FastAPI      │   │  WebSocket    │   │  静态资源服务         │  │
│  │  RESTful API  │   │  服务         │   │                       │  │
│  └───────────────┘   └───────────────┘   └───────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           业务逻辑层                                 │
│                                                                     │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────────────┐  │
│  │  用户认证     │   │  视频流管理   │   │  告警管理             │  │
│  └───────────────┘   └───────────────┘   └───────────────────────┘  │
│                                                                     │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────────────┐  │
│  │  算法管理     │   │  监控任务     │   │  人脸库管理           │  │
│  └───────────────┘   └───────────────┘   └───────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           数据持久层                                 │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                       SQLite3 数据库                          │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                       文件存储系统                            │  │
│  │            (图像、视频帧、模型文件等)                         │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           算法服务层                                 │
│                                                                     │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────────────┐  │
│  │  YOLO目标检测 │   │  人脸识别     │   │  行为分析             │  │
│  └───────────────┘   └───────────────┘   └───────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## 10. 总结

使用SQLite3作为AI监控管理系统的数据库是一个合理的选择，特别是对于中小规模部署、开发阶段或资源受限的环境。SQLite3提供了足够的功能支持系统的基本需求，同时具有部署简单、资源占用少的优势。

系统设计采用分层架构，将前端、API服务、业务逻辑和数据存储清晰分离，便于维护和扩展。通过FastAPI框架提供高性能的API接口，结合WebSocket实现实时数据推送，可以满足监控系统的实时性要求。

针对SQLite3的特性，系统实现了适当的优化策略，包括索引优化、查询优化和定期维护机制。同时，设计考虑了未来可能的扩展需求，预留了向更强大数据库系统迁移的路径。

总体而言，这一设计方案平衡了开发效率、部署简便性和系统性能，适合作为AI监控管理系统的初始实现方案。 