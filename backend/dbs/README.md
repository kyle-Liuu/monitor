# 数据库表结构设计

本文件夹包含AI监控管理系统的数据库表结构设计，基于前端mock数据和视图结构。

## 数据库表清单

### 用户认证模块

1. **users.sql** - 用户表，存储系统用户信息
2. **roles.sql** - 角色表，存储系统角色定义
3. **user_roles.sql** - 用户角色关联表，实现多对多关系

### 算法管理模块

4. **algorithms.sql** - 算法表，存储AI算法信息

### 人脸库模块

5. **faces.sql** - 人脸表，存储人脸识别信息
6. **face_groups.sql** - 人脸分组表，用于分类管理人脸

### 组织架构模块

7. **organizations.sql** - 组织机构表，存储组织架构树形结构

### 视频流模块

8. **video_streams.sql** - 视频流表，存储监控视频流信息
9. **virtual_organizations.sql** - 虚拟组织表，用于自定义分组
10. **virtual_org_streams.sql** - 虚拟组织与视频流关联表

### 监控告警模块

11. **monitor_tasks.sql** - 监控任务表，存储监控配置任务
12. **warnings.sql** - 告警信息表，存储检测到的告警信息

### 文章评论模块

13. **articles.sql** - 文章表，存储系统文章内容
14. **comments.sql** - 评论表，存储文章评论

## 表关系说明

- 用户(users)与角色(roles)是多对多关系，通过user_roles表关联
- 组织机构(organizations)通过parent_id实现自引用的树形结构
- 视频流(video_streams)属于组织机构(organizations)
- 监控任务(monitor_tasks)关联视频流(video_streams)和算法(algorithms)
- 告警信息(warnings)关联监控任务、视频流和算法
- 虚拟组织(virtual_organizations)通过virtual_org_streams表与视频流关联
- 人脸(faces)通过group_id与人脸分组(face_groups)关联
- 文章(articles)通过author_id与用户(users)关联
- 评论(comments)与文章(articles)、用户(users)关联，且支持自引用的层级回复结构

## 数据库设计说明

1. 所有表均设计了适当的索引以提高查询性能
2. 使用外键约束确保数据完整性
3. 所有表都包含创建时间字段，大部分表包含更新时间字段
4. 敏感数据（如密码）进行了哈希处理
5. 使用软删除方式（通过status字段）代替物理删除
6. 使用注释说明字段用途和可选值
