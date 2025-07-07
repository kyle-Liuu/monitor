# AI监控管理系统后端

这是AI监控管理系统的后端服务，基于FastAPI构建。

## 环境要求

- Python 3.8+
- 所有依赖包都列在`requirements.txt`中

## 安装

1. 创建并激活虚拟环境（可选但推荐）：

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

2. 安装依赖：

```bash
pip install -r requirements.txt
```

## 启动服务

### 基本使用

直接启动服务：

```bash
python server.py
```

默认会在 http://127.0.0.1:8000 启动服务。

### 数据库重置

重置数据库并启动：

```bash
python server.py --reset-db
```

在重置数据库前备份，并启动：

```bash
python server.py --reset-db --backup
```

重置数据库但保留上传文件：

```bash
python server.py --reset-db --keep-uploads
```

### 其他选项

指定主机和端口：

```bash
python server.py --host 0.0.0.0 --port 8080
```

设置日志级别：

```bash
python server.py --log-level debug
```

禁用热重载：

```bash
python server.py --no-reload
```

查看所有选项：

```bash
python server.py --help
```

## 测试账户

初始化数据库后，系统会创建以下测试账户：

- 超级管理员: Super / 123456
- 管理员: Admin / 123456
- 普通用户: User / 123456

## API文档

服务启动后，可以访问以下地址查看API文档：

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## 文件上传

系统支持文件上传功能，包括：

- 用户头像上传：`/api/v1/upload/avatar`

所有上传的文件都存储在`uploads`目录中，按类型分类存储。

## 文件存储结构

系统使用以下目录存储各类文件：

- 用户头像：`uploads/avatars/{user_id}/`
- 算法模型：`uploads/models/`
- 测试图片：`uploads/test_images/`
- 告警图片：`uploads/warnings/`
- 人脸数据：`uploads/faces/`
- 数据备份：`backups/backup_{timestamp}/`

## 数据库备份

可以单独执行备份命令：

```bash
python reset_db.py --backup
```

这会将当前数据库和上传的文件备份到 `backups/backup_{timestamp}/` 目录。

## 开发指南

- 添加新API端点时，请遵循 `app/api/endpoints/` 中的现有结构
- 数据模型定义在 `app/models/` 目录
- API数据验证模式定义在 `app/schemas/` 目录
- 业务逻辑应放在 `app/services/` 目录
- WebSocket连接管理在 `app/ws/` 目录

## 部署

生产环境部署建议：

```bash
# 使用生产级ASGI服务器
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app

# 或者直接使用uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```