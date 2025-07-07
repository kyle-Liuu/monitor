# AI监控管理系统启动指南

本指南提供AI监控管理系统的启动和基本配置方法。

## 系统组成

系统由前端和后端两部分组成：

- 前端：Vue.js + Element Plus
- 后端：FastAPI + SQLite

## 后端启动方法

### Windows系统

1. 进入后端目录
   ```
   cd backend
   ```

2. 使用启动脚本
   ```
   start.bat
   ```
   
   启动脚本会询问是否需要重置数据库，根据需要选择。

3. 或者直接使用命令启动
   ```
   # 直接启动
   python server.py
   
   # 重置数据库并启动
   python server.py --reset-db
   
   # 指定IP和端口
   python server.py --host 0.0.0.0 --port 8000
   ```

### Linux/Mac系统

1. 进入后端目录
   ```
   cd backend
   ```

2. 添加脚本执行权限
   ```
   chmod +x start.sh
   ```

3. 使用启动脚本
   ```
   ./start.sh
   ```

4. 或者直接使用命令启动
   ```
   # 直接启动
   python server.py
   
   # 重置数据库并启动
   python server.py --reset-db
   
   # 指定IP和端口
   python server.py --host 0.0.0.0 --port 8000
   ```

## 前端启动方法

1. 进入项目根目录

2. 安装依赖
   ```
   npm install
   ```

3. 启动开发服务器
   ```
   npm run dev
   ```

4. 构建生产版本
   ```
   npm run build
   ```

## 默认账户信息

当重置数据库后，系统会创建以下默认账户：

| 账户类型 | 用户名 | 密码 | 说明 |
|---------|-------|------|-----|
| 超级管理员 | Super | 123456 | 拥有所有权限 |
| 管理员 | Admin | 123456 | 拥有管理权限 |
| 普通用户 | User | 123456 | 拥有基本权限 |

## 访问地址

- 前端界面：http://localhost:5173 (开发模式) 或 http://localhost (生产部署)
- 后端API：http://localhost:8000
- API文档：http://localhost:8000/docs 或 http://localhost:8000/redoc

## 常见问题

### 1. 数据库重置失败

检查数据库文件是否被其他进程占用，可尝试关闭所有相关应用后再重试。

### 2. 端口被占用

如果8000端口被占用，可使用以下命令指定其他端口：
```
python server.py --port 8080
```

### 3. 文件上传失败

确保uploads目录及其子目录存在且具有写入权限：
```
# Windows
mkdir uploads\avatars

# Linux/Mac
mkdir -p uploads/avatars
chmod -R 755 uploads
```

### 4. 用户头像上传

系统支持用户头像上传，每个用户的头像存储在其专属目录中：
```
uploads/avatars/{user_id}/
```

系统自动为每个用户生成唯一的user_id，格式为"user"前缀+7位随机字符或数字。 