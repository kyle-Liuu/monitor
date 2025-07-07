<template>
  <div class="avatar-uploader">
    <el-upload
      class="avatar-upload-wrapper"
      action=""
      :show-file-list="false"
      :auto-upload="false"
      :on-change="handleFileChange"
      accept="image/*"
    >
      <div class="avatar-display">
        <img v-if="avatarUrl" :src="avatarUrl" class="avatar-image" />
        <el-icon v-else class="avatar-icon"><Plus /></el-icon>
      </div>
      <div class="avatar-hint">{{ $t('components.avatarUpload.clickToUpload') }}</div>
    </el-upload>
    <el-button 
      v-if="file && !isUploading" 
      type="primary" 
      size="small" 
      class="avatar-submit-btn" 
      @click="submitUpload"
    >
      {{ $t('components.avatarUpload.upload') }}
    </el-button>
    <el-button 
      v-if="isUploading" 
      type="primary" 
      size="small" 
      class="avatar-submit-btn" 
      disabled
    >
      <el-icon class="is-loading"><Loading /></el-icon>
      {{ $t('components.avatarUpload.uploading') }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Loading } from '@element-plus/icons-vue'
import { uploadUserAvatar } from '@/api/userApi'
import type { UploadFile } from 'element-plus'

const props = defineProps<{
  userId: string
  currentAvatar?: string
}>()

const emit = defineEmits<{
  (e: 'success', path: string): void
  (e: 'error', error: any): void
}>()

const file = ref<File | null>(null)
const avatarUrl = ref<string>(props.currentAvatar || '')
const isUploading = ref(false)

/**
 * 处理文件选择变化
 */
const handleFileChange = (uploadFile: UploadFile) => {
  const rawFile = uploadFile.raw
  if (!rawFile) {
    ElMessage.error('无法获取文件信息')
    return
  }
  
  // 检查文件大小（限制为2MB）
  const isLessThan2M = rawFile.size / 1024 / 1024 < 2
  if (!isLessThan2M) {
    ElMessage.error('头像文件不能超过2MB')
    return
  }

  // 检查文件类型
  if (!rawFile.type.startsWith('image/')) {
    ElMessage.error('请上传图片文件')
    return
  }

  // 保存文件并预览
  file.value = rawFile
  avatarUrl.value = URL.createObjectURL(rawFile)
}

/**
 * 上传头像
 */
const submitUpload = async () => {
  if (!file.value) {
    ElMessage.warning('请先选择头像文件')
    return
  }

  try {
    isUploading.value = true
    const response = await uploadUserAvatar(props.userId, file.value)
    
    if (response && response.data) {
      // 更新显示的头像URL
      avatarUrl.value = response.data.avatarPath
      
      // 触发成功事件
      emit('success', response.data.avatarPath)
      
      ElMessage.success('头像上传成功')
    } else {
      throw new Error('上传响应数据异常')
    }
  } catch (error) {
    console.error('头像上传失败:', error)
    emit('error', error)
    ElMessage.error('头像上传失败')
  } finally {
    isUploading.value = false
  }
}
</script>

<style scoped lang="scss">
.avatar-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .avatar-upload-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    
    .avatar-display {
      width: 100px;
      height: 100px;
      border: 1px dashed var(--el-border-color);
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      transition: all 0.3s;
      
      &:hover {
        border-color: var(--el-color-primary);
      }
      
      .avatar-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .avatar-icon {
        font-size: 24px;
        color: var(--el-text-color-placeholder);
      }
    }
    
    .avatar-hint {
      margin-top: 8px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
  
  .avatar-submit-btn {
    margin-top: 16px;
  }
}
</style> 