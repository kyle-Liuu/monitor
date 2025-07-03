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