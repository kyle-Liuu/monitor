# 头像上传组件

用于上传用户头像的Vue组件，基于Element Plus的Upload组件封装。

## 功能

- 头像预览和裁剪
- 文件类型检查（只允许图片）
- 文件大小限制（2MB）
- 上传状态展示
- 成功/错误事件回调

## 使用示例

### 基础用法

```vue
<template>
  <avatar-upload
    :userId="userInfo.user_id"
    :currentAvatar="userInfo.avatar"
    @success="handleAvatarSuccess"
    @error="handleAvatarError"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AvatarUpload } from '@/components/custom/avatar-upload'
import { getUserInfo, updateUser } from '@/api/userApi'
import { ElMessage } from 'element-plus'

const userInfo = ref({
  id: 0,
  user_id: '',
  avatar: '',
  // 其他用户信息...
})

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const response = await getUserInfo()
    if (response && response.data) {
      userInfo.value = response.data
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
  }
}

// 头像上传成功处理
const handleAvatarSuccess = (path: string) => {
  // 更新用户信息中的头像路径
  userInfo.value.avatar = path
  
  // 可以在此处更新用户信息
  updateUser(userInfo.value.id, {
    avatar: path
  }).then(() => {
    ElMessage.success('用户信息已更新')
  }).catch(error => {
    console.error('更新用户信息失败', error)
  })
}

// 头像上传失败处理
const handleAvatarError = (error: any) => {
  console.error('头像上传失败', error)
}

// 页面加载时获取用户信息
fetchUserInfo()
</script>
```

### 在用户编辑表单中使用

```vue
<template>
  <el-form :model="userForm" label-width="120px">
    <el-form-item label="头像">
      <avatar-upload
        :userId="userForm.user_id"
        :currentAvatar="userForm.avatar"
        @success="userForm.avatar = $event"
      />
    </el-form-item>
    
    <el-form-item label="用户名">
      <el-input v-model="userForm.username" />
    </el-form-item>
    
    <el-form-item label="邮箱">
      <el-input v-model="userForm.email" />
    </el-form-item>
    
    <!-- 其他表单项... -->
    
    <el-form-item>
      <el-button type="primary" @click="submitForm">保存</el-button>
    </el-form-item>
  </el-form>
</template>
```

## 属性

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| userId | string | - | 用户ID，必填，用于上传头像 |
| currentAvatar | string | '' | 当前头像路径，可选 |

## 事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| success | (path: string) | 上传成功时触发，返回头像路径 |
| error | (error: any) | 上传失败时触发，返回错误信息 | 