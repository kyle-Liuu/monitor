# 监控页面更新日志

## 2023-10-15

### 添加

- 创建初始监控页面基础结构
- 添加iframe加载机制，实现在布局组件中加载监控内容

## 2023-10-25 

### 更新

- 完善前后端交互API接口
  - 添加算法服务API (algoApi.ts)
  - 添加视频流API (videoStreamApi.ts)
  - 添加报警API (warningApi.ts)
  - 添加WebSocket连接API (websocketApi.ts)
  - 添加监控任务API (monitorApi.ts)

## 2023-11-05

### 添加

- 添加后端服务组件
  - 算法服务类 (algorithm_service.py)
  - 视频流服务类 (videostream_service.py)
  - ZLMedia服务类 (zlmedia_service.py)
  - 线程池工具类 (thread_pool.py)
  - 监控服务类 (monitor_service.py)
  - WebSocket管理器 (manager.py)

- 添加数据库模型和Schema定义
  - 算法模型 (algorithm.py)
  - 视频流模型 (videostream.py)
  - 监控任务模型 (monitor_task.py)
  - 告警模型 (warning.py)

### 更新

- 更新项目文档
  - 更新README.md，添加系统架构和功能说明
  - 更新step.md，完善前后端交互流程
  - 添加后端安装和配置指南

## 2023-11-10

### 添加

- 添加监控任务管理组件
  - 任务创建和配置
  - 任务启动和停止
  - 任务状态实时显示
  - 检测结果展示

- 添加实时WebSocket通信
  - 监控状态实时推送
  - 告警信息实时通知
  - 检测结果实时更新

### 修复

- 修复依赖问题
  - 添加缺失的redis、aioredis和aiohttp依赖
  - 创建setup.py和install_deps.py脚本简化安装

### 优化

- 优化多线程处理
  - 提高视频流处理效率
  - 减少CPU资源占用
  - 增强系统稳定性 

## 用户头像上传功能实现 - 2023-07-01

### 修改内容

1. 后端实现：
   - 在`uploads.py`中添加头像上传接口
   - 文件以用户ID为目录进行组织存储
   - 头像文件按时间戳重命名存储
   - 添加权限控制，普通用户只能上传自己的头像

2. 前端实现：
   - 创建`AvatarUpload`可复用组件
   - 在用户中心页面集成头像上传功能
   - 头像右下角添加编辑按钮，点击弹出上传对话框
   - 修改`userApi.ts`添加头像上传和更新用户信息的相关函数
   - 分离头像上传和用户信息修改功能

3. 其他改进：
   - 合并`main.py`和`start_server.py`为`server.py`
   - 创建Windows和Linux启动脚本
   - 添加用户头像上传功能文档

### 技术要点

- 使用`FormData`处理文件上传
- 使用`el-upload`组件实现文件选择和预览
- 使用`el-dialog`实现上传对话框
- 实现用户ID目录结构存储头像文件
- 实现权限控制和文件类型检查

### 遗留问题

- 暂无

### 相关文件

- `backend/app/api/endpoints/uploads.py`：头像上传接口实现
- `backend/server.py`：统一的后端启动脚本
- `src/api/userApi.ts`：用户API相关函数
- `src/components/custom/avatar-upload/`：头像上传组件
- `src/views/system/user-center/index.vue`：用户中心页面
- `docs/user_avatar_upload.md`：功能说明文档 