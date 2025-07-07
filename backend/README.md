# AI监控管理系统后端

本目录包含AI监控管理系统的后端服务代码，基于FastAPI构建。

## 目录结构

```
backend/
├── app/                    # 应用主目录
│   ├── api/                # API接口
│   │   ├── endpoints/      # 各模块API端点
│   │   │   └── uploads.py  # 文件上传API
│   ├── core/               # 核心配置和功能
│   ├── db/                 # 数据库相关
│   │   └── migrations/     # 数据库迁移脚本
│   ├── models/             # 数据模型
│   ├── schemas/            # 接口模式
│   ├── services/           # 服务层
│   ├── utils/              # 工具函数
│   └── ws/                 # WebSocket相关
├── dbs/                    # 数据库脚本
├── uploads/                # 上传文件存储
│   └── avatars/            # 用户头像存储
├── reset_db.py             # 数据库重置脚本
└── server.py               # 服务器启动脚本
```

## 启动服务

服务启动脚本提供多种方式启动后端服务：

### 直接启动

```bash
python server.py
```

### 重置数据库并启动

```bash
python server.py --reset-db
```

### 指定主机和端口

```bash
python server.py --host 0.0.0.0 --port 8000
```

### 禁用热重载

```bash
python server.py --no-reload
```

## 数据库管理

### 重置数据库

如果需要重置数据库（清空数据并初始化），可以使用以下命令：

```bash
python reset_db.py
```

这将删除现有数据库并创建一个新的数据库，然后添加初始测试数据。

### 可用的测试账户

重置数据库后，会创建以下测试账户：

- 超级管理员: Super / 123456
- 管理员: Admin / 123456
- 普通用户: User / 123456

## API文档

启动服务后，可以通过以下URL访问API文档：

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 文件上传

系统支持文件上传功能，包括：

- 用户头像上传：`/api/v1/upload/avatar`

所有上传的文件都存储在`uploads`目录中，按类型分类存储。