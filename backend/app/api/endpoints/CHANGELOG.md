# API端点修改日志

## 2023-07-20：用户API参数类型修正

### 修改内容

1. 修正用户API中的`user_id`参数类型
   - 将所有用户相关API中的`user_id`参数类型从`int`改为`str`
   - 修改查询条件使用`user_id`字段而不是`id`字段
   - 确保前端传递的字符串类型的`user_id`能被正确处理

2. 修改的API端点包括：
   - `GET /api/users/{user_id}` - 获取用户信息
   - `PUT /api/users/{user_id}` - 更新用户信息
   - `DELETE /api/users/{user_id}` - 删除用户
   - `PUT /api/users/{user_id}/avatar` - 更新用户头像
   - `PUT /api/users/{user_id}/password` - 修改用户密码

### 技术细节

- 数据库中的`user_id`字段是字符串类型，格式为"user+7位任意字符或数字"
- 前端API调用时传递的是字符串类型的`user_id`
- 修改前的后端API期望接收整数类型的`user_id`，导致类型不匹配
- 修改后的后端API现在正确接收字符串类型的`user_id`

### 影响范围

- 所有涉及用户ID的API调用
- 用户信息查询、更新、删除等操作
- 用户头像上传和更新

### 注意事项

- 此修改不影响数据库结构
- 前端代码不需要修改，因为前端已经在使用字符串类型的`user_id`
- 这个修改解决了前端上传头像时的类型不匹配问题 