<template>
  <div class="page-content">
    <ArtCutterImg
      ref="cutterRef"
      v-model:imgUrl="imageUrl"
      :boxWidth="540"
      :boxHeight="300"
      :cutWidth="360"
      :cutHeight="200"
      :quality="1"
      :tool="true"
      :watermarkText="'My Watermark'"
      watermarkColor="#ff0000"
      :showPreview="true"
      :originalGraph="false"
      :title="'图片裁剪'"
      :previewTitle="'预览效果'"
      @error="handleError"
      @imageLoadComplete="handleLoadComplete"
      @imageLoadError="handleLoadError"
      @downloadImage="handleDownloadImage"
    />

    <div class="download-buttons">
      <el-button type="primary" @click="downloadOriginalImage" v-ripple>下载原图</el-button>
      <el-button type="success" @click="downloadCroppedImage" v-ripple>下载裁剪后的图片</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import lockImg from '@imgs/lock/lock_screen_1.webp'
  const imageUrl = ref(lockImg)
  // 保存原始图像URL
  const originalImageUrl = ref(lockImg)
  // 引用裁剪组件
  const cutterRef = ref()

  const handleError = (error: any) => {
    console.error('裁剪错误:', error)
  }

  const handleLoadComplete = (result: any) => {
    console.log('图片加载完成:', result)
    // 图片加载完成时，保存原图URL
    originalImageUrl.value = imageUrl.value
  }

  const handleLoadError = (error: any) => {
    console.error('图片加载失败:', error)
  }
  
  // 处理组件内部下载事件
  const handleDownloadImage = (data: { url: string, filename: string }) => {
    console.log('组件内部下载图片:', data)
    // 可以在这里添加自定义逻辑，比如重命名、统计等
  }

  // 下载原图
  const downloadOriginalImage = () => {
    if (!originalImageUrl.value) return
    
    const a = document.createElement('a')
    a.href = originalImageUrl.value
    a.download = '原图.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // 下载裁剪后的图片，直接使用组件暴露的方法
  const downloadCroppedImage = () => {
    if (!cutterRef.value) return
    
    // 使用组件暴露的方法获取当前裁剪图片
    const croppedImage = cutterRef.value.getCroppedImage()
    if (!croppedImage) {
      console.warn('没有可用的裁剪图片')
      return
    }
    
    const a = document.createElement('a')
    a.href = croppedImage
    a.download = '裁剪图.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
</script>

<style lang="scss" scoped>
.download-buttons {
  margin-top: 20px;
  display: flex;
  gap: 16px;
}
</style>
