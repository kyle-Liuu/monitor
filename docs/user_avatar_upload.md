# 用户头像上传和信息更新分离

## 概述

本文档描述了用户头像上传和信息更新分离的实现方案。在这个方案中，我们将上传头像和更新用户信息的API分开，使得前端可以更灵活地处理这两个操作。

## 数据库变更

1. 用户表添加了两个新字段：
   - `tags`: JSON类型，存储用户标签数组
   - `description`: 字符串类型，存储用户个人介绍

## API变更

### 上传头像API

- **URL**: `/upload/avatar`
- **方法**: POST
- **参数**:
  - `file`: 头像文件 (FormData)
  - `userId`: 用户ID (FormData)
- **返回**:
  ```json
  {
    "code": 0,
    "message": "头像上传成功",
    "data": {
      "avatarPath": "/uploads/avatars/userXXXXXXX/timestamp.jpg"
    }
  }
  ```
- **说明**: 此API只负责上传头像文件，不会更新用户信息

### 更新用户头像API

- **URL**: `/users/{user_id}/avatar`
- **方法**: PUT
- **参数**:
  ```json
  {
    "avatar": "/uploads/avatars/userXXXXXXX/timestamp.jpg"
  }
  ```
- **返回**: 更新后的用户信息
- **说明**: 此API只负责更新用户头像路径

### 更新用户信息API

- **URL**: `/users/{user_id}`
- **方法**: PUT
- **参数**:
  ```json
  {
    "email": "user@example.com",
    "full_name": "用户全名",
    "phone": "13800138000",
    "gender": 1,
    "description": "个人介绍",
    "tags": ["标签1", "标签2", "标签3"]
  }
  ```
- **返回**: 更新后的用户信息
- **说明**: 此API负责更新用户基本信息，不包括头像

## 前端实现

前端实现了三种方式调用API：

1. **直接调用API函数**:
   ```typescript
   import { uploadUserAvatar, updateUserAvatar, updateUser } from '@/api/userApi'
   
   // 上传头像
   const uploadResponse = await uploadUserAvatar(userId, file)
   const avatarPath = uploadResponse.data.avatarPath
   
   // 更新头像路径
   await updateUserAvatar(userId, avatarPath)
   
   // 更新用户信息
   await updateUser(userId, userInfo)
   ```

2. **使用UserService类**:
   ```typescript
   // 上传头像
   const avatarPath = await UserService.uploadAvatar(file, userId)
   
   // 更新头像路径
   await UserService.updateAvatar(userId, avatarPath)
   
   // 更新用户信息
   await UserService.updateUser(userId, userInfo)
   ```

3. **一次性更新用户信息和头像**:
   ```typescript
   // 同时更新用户信息和头像
   await UserService.updateUserWithAvatar(userId, userIdStr, userInfo, avatarFile)
   ```

## 数据库迁移

为了支持新增字段，创建了数据库迁移脚本：

1. `backend/app/db/migrations/add_user_tags_description.py`: 添加用户标签和描述字段
2. `backend/run_migration.py`: 运行所有迁移脚本
3. `backend/migrate.bat` 和 `backend/migrate.sh`: 方便运行迁移的脚本

## 运行迁移

在Windows系统上:
```
cd backend
migrate.bat
```

在Linux/Mac系统上:
```
cd backend
chmod +x migrate.sh
./migrate.sh
```

## 注意事项

1. 上传头像后需要单独调用更新头像API将路径保存到用户信息中
2. 用户标签最多支持5个
3. 个人介绍最长支持500个字符 