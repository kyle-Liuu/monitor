# API 类型定义文档

本文档定义了前后端交互的API类型，确保前后端一致性。

## 通用类型

### 基础响应

```typescript
interface BaseResponse<T = any> {
  code: number;        // 状态码
  message: string;     // 消息
  data: T;             // 数据
}
```

### 分页参数

```typescript
interface PaginationParams {
  current: number;     // 当前页码
  size: number;        // 每页条数
}
```

### 分页结果

```typescript
interface PaginationResult<T = any> {
  records: T[];        // 记录列表
  current: number;     // 当前页码
  size: number;        // 每页条数
  total: number;       // 总记录数
}
```

## 用户相关

### 用户信息

```typescript
interface UserInfo {
  id?: number;                // 用户ID
  user_id: string;            // 用户唯一标识，格式为user+7位任意字符或数字
  username: string;           // 用户名
  email: string;              // 邮箱
  full_name?: string;         // 姓名
  phone?: string;             // 手机号
  avatar?: string;            // 头像路径
  gender?: number;            // 性别：1-男，2-女，0-保密
  status?: number;            // 状态：1-在线，2-离线，3-异常，4-注销
  is_active: boolean;         // 是否激活
  is_superuser: boolean;      // 是否超级管理员
  roles: Role[];              // 角色列表
  created_at: string;         // 创建时间
  updated_at: string;         // 更新时间
  description?: string;       // 个人介绍
  tags?: string[];            // 标签列表
}
```

### 角色信息

```typescript
interface Role {
  id: number;                 // 角色ID
  role_code: string;          // 角色代码
  role_name: string;          // 角色名称
  description?: string;       // 角色描述
}
```

### 用户创建参数

```typescript
interface CreateUserParams {
  username: string;           // 用户名
  password: string;           // 密码
  email: string;              // 邮箱
  full_name?: string;         // 姓名
  phone?: string;             // 手机号
  gender?: number;            // 性别
  is_active?: boolean;        // 是否激活
  is_superuser?: boolean;     // 是否超级管理员
  roles?: string[];           // 角色代码列表
}
```

### 用户更新参数

```typescript
interface UpdateUserParams {
  email?: string;             // 邮箱
  full_name?: string;         // 姓名
  phone?: string;             // 手机号
  password?: string;          // 密码
  avatar?: string;            // 头像路径
  gender?: number;            // 性别
  description?: string;       // 个人介绍
  tags?: string[];            // 标签列表
  is_active?: boolean;        // 是否激活
  is_superuser?: boolean;     // 是否超级管理员
}
```

### 用户头像更新参数

```typescript
interface UserAvatarUpdate {
  avatar: string;             // 头像路径
}
```

### 修改用户密码

**请求路径**：`PUT /users/{user_id}/password`

**请求参数**：

```typescript
interface PasswordChange {
  // 当前密码
  current_password: string
  // 新密码
  new_password: string
}
```

**响应参数**：

```typescript
interface MessageResult {
  message: string
}
```

**示例**：

```json
// 请求
{
  "current_password": "oldpassword123",
  "new_password": "newpassword456"
}

// 响应
{
  "message": "密码修改成功"
}
```

**说明**：

- 普通用户只能修改自己的密码，需要验证当前密码
- 管理员可以修改任何用户的密码，无需验证当前密码
- 密码长度不能少于8位

## 组织相关

### 组织信息

```typescript
interface OrganizationInfo {
  id: number;                 // 组织ID
  org_id: string;             // 组织唯一标识，格式为org+7位任意字符或数字
  name: string;               // 组织名称
  parent_id?: number;         // 父组织ID
  description?: string;       // 组织描述
  address?: string;           // 地址
  contact?: string;           // 联系人
  contact_phone?: string;     // 联系电话
  created_at: string;         // 创建时间
  updated_at: string;         // 更新时间
  children?: OrganizationInfo[]; // 子组织列表
}
```

### 组织创建参数

```typescript
interface CreateOrganizationParams {
  name: string;               // 组织名称
  parent_id?: number;         // 父组织ID
  description?: string;       // 组织描述
  address?: string;           // 地址
  contact?: string;           // 联系人
  contact_phone?: string;     // 联系电话
}
```

### 组织更新参数

```typescript
interface UpdateOrganizationParams {
  name?: string;              // 组织名称
  description?: string;       // 组织描述
  address?: string;           // 地址
  contact?: string;           // 联系人
  contact_phone?: string;     // 联系电话
  parent_id?: number;         // 父组织ID
}
```

## 虚拟组织相关

### 虚拟组织信息

```typescript
interface VirtualOrgInfo {
  id: number;                 // 虚拟组织ID
  vorg_id: string;            // 虚拟组织唯一标识，格式为vorg+7位任意字符或数字
  name: string;               // 虚拟组织名称
  description?: string;       // 虚拟组织描述
  created_at: string;         // 创建时间
  updated_at: string;         // 更新时间
  videostreams: Array<{       // 关联的视频流列表
    id: number;
    stream_id: string;
    name: string;
  }>;
}
```

### 虚拟组织创建参数

```typescript
interface CreateVirtualOrgParams {
  name: string;               // 虚拟组织名称
  description?: string;       // 虚拟组织描述
  videostream_ids?: number[]; // 关联的视频流ID列表
}
```

### 虚拟组织更新参数

```typescript
interface UpdateVirtualOrgParams {
  name?: string;              // 虚拟组织名称
  description?: string;       // 虚拟组织描述
  videostream_ids?: number[]; // 关联的视频流ID列表
}
```

## 视频流相关

### 视频流信息

```typescript
interface VideoStreamInfo {
  id: number;                 // 视频流ID
  stream_id: string;          // 视频流唯一标识，格式为stream+7位任意字符或数字
  name: string;               // 视频流名称
  url: string;                // 视频流URL
  type: string;               // 视频流类型：RTSP、RTMP、HLS等
  status: number;             // 状态：0-离线，1-在线，2-异常
  organization_id?: number;   // 所属组织ID
  organization_name?: string; // 所属组织名称
  location?: string;          // 位置
  description?: string;       // 描述
  created_at: string;         // 创建时间
  updated_at: string;         // 更新时间
}
```

### 视频流创建参数

```typescript
interface CreateVideoStreamParams {
  name: string;               // 视频流名称
  url: string;                // 视频流URL
  type: string;               // 视频流类型
  organization_id?: number;   // 所属组织ID
  location?: string;          // 位置
  description?: string;       // 描述
}
```

### 视频流更新参数

```typescript
interface UpdateVideoStreamParams {
  name?: string;              // 视频流名称
  url?: string;               // 视频流URL
  type?: string;              // 视频流类型
  status?: number;            // 状态
  organization_id?: number;   // 所属组织ID
  location?: string;          // 位置
  description?: string;       // 描述
}
```

## 算法相关

### 算法信息

```typescript
interface AlgorithmInfo {
  id: number;                 // 算法ID
  algo_id: string;            // 算法唯一标识，格式为algo+7位任意字符或数字
  name: string;               // 算法名称
  version: string;            // 算法版本
  description?: string;       // 算法描述
  type: string;               // 算法类型
  status: number;             // 状态：0-禁用，1-启用，2-测试中
  model_path?: string;        // 模型文件路径
  config_json?: string;       // 配置信息（JSON格式）
  is_active: boolean;         // 是否激活
  created_at: string;         // 创建时间
  updated_at: string;         // 更新时间
}
```

### 算法创建参数

```typescript
interface CreateAlgorithmParams {
  name: string;               // 算法名称
  version: string;            // 算法版本
  description?: string;       // 算法描述
  type: string;               // 算法类型
  model_path?: string;        // 模型文件路径
  config_json?: string;       // 配置信息
  status?: number;            // 状态
}
```

### 算法更新参数

```typescript
interface UpdateAlgorithmParams {
  name?: string;              // 算法名称
  version?: string;           // 算法版本
  description?: string;       // 算法描述
  status?: number;            // 状态
  model_path?: string;        // 模型文件路径
  config_json?: string;       // 配置信息
}
```

## 警告相关

### 警告信息

```typescript
interface WarningInfo {
  id: number;                 // 警告ID
  warn_id: string;            // 警告唯一标识，格式为warn+7位任意字符或数字
  type: string;               // 警告类型
  level: number;              // 警告级别：1-普通，2-重要，3-紧急
  status: number;             // 状态：0-未处理，1-已处理，2-误报，3-忽略
  videostream_id?: number;    // 视频流ID
  stream_name?: string;       // 视频流名称
  algorithm_id?: number;      // 算法ID
  detection_time: string;     // 检测时间
  image_path?: string;        // 警告截图路径
  warning_metadata?: string;  // 警告详细信息（JSON格式）
  is_processed: boolean;      // 是否已处理
  processed_by?: number;      // 处理人ID
  processed_at?: string;      // 处理时间
  notes?: string;             // 处理备注
  created_at: string;         // 创建时间
  updated_at: string;         // 更新时间
}
```

### 警告查询参数

```typescript
interface WarningQueryParams {
  current?: number;           // 当前页码
  size?: number;              // 每页条数
  start_time?: string;        // 开始时间
  end_time?: string;          // 结束时间
  stream_id?: number;         // 视频流ID
  warning_type?: string;      // 警告类型
  status?: number;            // 状态
  level?: number;             // 警告级别
}
```

### 警告状态更新参数

```typescript
interface UpdateWarningStatusParams {
  status: number;             // 状态
  notes?: string;             // 处理备注
}
```

## 监控任务相关

### 监控任务信息

```typescript
interface MonitorTaskInfo {
  id: number;                 // 任务ID
  task_id: string;            // 任务唯一标识，格式为task+7位任意字符或数字
  name: string;               // 任务名称
  videostream_id?: number;    // 视频流ID
  stream_name?: string;       // 视频流名称
  algorithm_id?: number;      // 算法ID
  algorithm_name?: string;    // 算法名称
  status: number;             // 状态：0-停止，1-运行中，2-异常
  config_json?: string;       // 任务配置（JSON格式）
  schedule_type?: string;     // 调度类型：realtime、scheduled
  schedule_config?: string;   // 调度配置（JSON格式）
  created_by?: number;        // 创建人ID
  creator_name?: string;      // 创建人名称
  created_at: string;         // 创建时间
  updated_at: string;         // 更新时间
}
```

### 监控任务创建参数

```typescript
interface CreateMonitorTaskParams {
  name: string;               // 任务名称
  videostream_id: number;     // 视频流ID
  algorithm_id: number;       // 算法ID
  config_json?: string;       // 任务配置
  schedule_type?: string;     // 调度类型
  schedule_config?: string;   // 调度配置
}
```

### 监控任务更新参数

```typescript
interface UpdateMonitorTaskParams {
  name?: string;              // 任务名称
  status?: number;            // 状态
  config_json?: string;       // 任务配置
  schedule_type?: string;     // 调度类型
  schedule_config?: string;   // 调度配置
}
``` 