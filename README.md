English | [简体中文](./README.zh-CN.md)

## AI监控管理系统 (Art Design Pro)

Art Design Pro是一个专注于用户体验和快速开发的开源AI监控管理系统。该系统基于ElementPlus设计规范进行了视觉优化，提供美观实用的前端界面，帮助您轻松构建高质量的监控管理系统。本系统整合了算法服务、视频流处理和多线程功能，实现智能化监控管理。

## 官方网站

[访问官方文档](https://www.lingchen.kim/art-design-pro/docs/en/)

## 系统架构

本系统采用前后端分离架构：
- 前端：Vue.js + ElementPlus
- 后端：FastAPI + SQLite3 + Redis
- 流媒体服务：ZLMediaKit
- 算法服务：YOLO目标检测

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

## 系统截图

### 亮色主题

![Light Theme](https://www.qiniu.lingchen.kim/art_design_pro_readme_cover1.png)

![Light Theme](https://www.qiniu.lingchen.kim/art_design_pro_readme_cover2.png)

### 暗色主题

![Dark Theme](https://www.qiniu.lingchen.kim/art_design_pro_readme_cover3.png)

![Dark Theme](https://www.qiniu.lingchen.kim/art_design_pro_readme_cover4.png)

## 特性

- 使用最新技术栈
- 内置常用业务组件模板
- 提供多种主题模式和可定制主题
- 精美UI设计、优秀用户体验、注重细节
- 系统完全支持定制化，满足个性化需求
- 算法服务集成：支持YOLO目标检测算法
- 视频流处理：支持RTSP/RTMP等协议
- 多线程处理：高效处理大量视频流
- 实时通信：基于WebSocket的实时数据推送
- 告警管理：异常检测和告警通知

## 功能模块

- 丰富的主题切换
- 全局搜索
- 锁屏
- 多标签页
- 全局面包屑
- 多语言支持
- 图标库
- 富文本编辑器
- Echarts图表
- 工具包
- 网络异常处理
- 路由级别鉴权
- 侧边栏菜单鉴权
- 鉴权指令
- 移动端适配
- 算法管理：添加、更新、删除和测试算法
- 视频流管理：添加、更新、删除和监控视频流
- 监控任务管理：创建和调度监控任务
- 告警管理：实时告警和历史记录查询
- 组织管理：多层级组织结构
- WebSocket实时数据：实时推送监控状态和告警

## 兼容性

- 支持Chrome、Safari、Firefox等现代主流浏览器

## 安装和运行

```bash
# 安装依赖
pnpm install

# 如果pnpm install失败，尝试使用以下命令安装依赖
pnpm install --ignore-scripts

# 启动本地开发环境
pnpm dev

# 构建生产环境
pnpm build
```

## 后端服务安装

请参阅 [后端服务安装指南](./backend/README.md) 了解完整的后端服务安装和配置流程。

## 技术支持

QQ群: <a href="https://qm.qq.com/cgi-bin/qm/qr?k=Gg6yzZLFaNgmRhK0T5Qcjf7-XcAFWWXm&jump_from=webapi&authKey=YpRKVJQyFKYbGTiKw0GJ/YQXnNF+GdXNZC5beQQqnGZTvuLlXoMO7nw5fNXvmVhA">821834289</a> (点击链接加入群聊)

## 捐赠

如果我的项目对你有所帮助，欢迎捐赠！你的支持将用于购买ChatGPT、Cursor等工具，提升开发效率，让项目变得更好。感谢你的鼓励与支持！

![Donation QR Code](https://www.qiniu.lingchen.kim/%E7%BB%84%202%402x%202.png)
