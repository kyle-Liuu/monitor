<!-- 图片裁剪组件 github: https://github.com/acccccccb/vue-img-cutter/tree/master -->
<template>
  <div class="cutter-container">
    <div class="cutter-component">
      <div class="title">{{ title }}</div>
      <ImgCutter
        ref="imgCutterModal"
        @cutDown="cutDownImg"
        @onPrintImg="cutterPrintImg"
        @onImageLoadComplete="handleImageLoadComplete"
        @onImageLoadError="handleImageLoadError"
        @onClearAll="handleClearAll"
        v-bind="cutterProps"
        class="img-cutter"
      >
        <template #choose>
          <el-button type="primary" plain v-ripple style="display: none;">选择图片</el-button>
        </template>
        <template #cancel>
          <el-button type="danger" plain v-ripple style="display: none;">清除</el-button>
        </template>
        <template #confirm>
          <!-- <el-button type="primary" style="margin-left: 10px">确定</el-button> -->
          <div></div>
        </template>
      </ImgCutter>
    </div>

    <div v-if="showPreview" class="preview-container">
      <div class="title">{{ previewTitle }}</div>
      <div
        class="preview-box"
        :style="{
          width: `${cutterProps.cutWidth}px`,
          height: `${cutterProps.cutHeight}px`
        }"
      >
        <img class="preview-img" :src="temImgPath" alt="预览图" v-if="temImgPath" />
      </div>
      <el-button class="download-btn" @click="downloadImg" :disabled="!temImgPath" v-ripple
        >下载图片</el-button
      >
    </div>
  </div>
</template>

<script setup lang="ts">
  import ImgCutter from 'vue-img-cutter'

  defineOptions({ name: 'ArtCutterImg' })

  interface CutterProps {
    // 基础配置
    /** 是否模态框 */
    isModal?: boolean
    /** 是否显示工具栏 */
    tool?: boolean
    /** 工具栏背景色 */
    toolBgc?: string
    /** 标题 */
    title?: string
    /** 预览标题 */
    previewTitle?: string
    /** 是否显示预览 */
    showPreview?: boolean

    // 尺寸相关
    /** 容器宽度 */
    boxWidth?: number
    /** 容器高度 */
    boxHeight?: number
    /** 裁剪宽度 */
    cutWidth?: number
    /** 裁剪高度 */
    cutHeight?: number
    /** 是否允许大小调整 */
    sizeChange?: boolean

    // 移动和缩放
    /** 是否允许移动 */
    moveAble?: boolean
    /** 是否允许图片移动 */
    imgMove?: boolean
    /** 是否允许缩放 */
    scaleAble?: boolean

    // 图片相关
    /** 是否显示原始图片 */
    originalGraph?: boolean
    /** 是否允许跨域 */
    crossOrigin?: boolean
    /** 文件类型 */
    fileType?: 'png' | 'jpeg' | 'webp'
    /** 质量 */
    quality?: number

    // 水印
    /** 水印文本 */
    watermarkText?: string
    /** 水印字体大小 */
    watermarkFontSize?: number
    /** 水印颜色 */
    watermarkColor?: string

    // 其他功能
    /** 是否保存裁剪位置 */
    saveCutPosition?: boolean
    /** 是否预览模式 */
    previewMode?: boolean

    // 输入图片
    imgUrl?: string
  }

  interface CutterResult {
    fileName: string
    file: File
    blob: Blob
    dataURL: string
  }

  const props = withDefaults(defineProps<CutterProps>(), {
    // 基础配置默认值
    isModal: false,
    tool: true,
    toolBgc: '#fff',
    title: '',
    previewTitle: '',
    showPreview: true,

    // 尺寸相关默认值
    boxWidth: 700,
    boxHeight: 458,
    cutWidth: 470,
    cutHeight: 270,
    sizeChange: true,

    // 移动和缩放默认值
    moveAble: true,
    imgMove: true,
    scaleAble: true,

    // 图片相关默认值
    originalGraph: true,
    crossOrigin: true,
    fileType: 'png',
    quality: 0.9,

    // 水印默认值
    watermarkText: '',
    watermarkFontSize: 20,
    watermarkColor: '#ffffff',

    // 其他功能默认值
    saveCutPosition: true,
    previewMode: true
  })

  const emit = defineEmits([
    'update:imgUrl', 
    'error', 
    'imageLoadComplete', 
    'imageLoadError',
    'downloadImage', // 下载图片事件
    'imageSelected' // 新增图片选择事件
  ])

  const temImgPath = ref('')
  const originalImgUrl = ref('') // 新增：存储原始图片URL
  const imgCutterModal = ref()
  const isImageCropped = ref(false) // 新增：标记图片是否已被裁剪

  // 计算属性：整合所有ImgCutter的props
  const cutterProps = computed(() => ({
    ...props,
    WatermarkText: props.watermarkText,
    WatermarkFontSize: props.watermarkFontSize,
    WatermarkColor: props.watermarkColor
  }))

  // 图片预加载
  function preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve()
      img.onerror = reject
      img.src = url
    })
  }

  // 初始化裁剪器
  async function initImgCutter() {
    if (props.imgUrl) {
      try {
        await preloadImage(props.imgUrl)
        originalImgUrl.value = props.imgUrl // 初始化时保存原始图片URL
        imgCutterModal.value?.handleOpen({
          name: '封面图片',
          src: props.imgUrl
        })
      } catch (error) {
        emit('error', error)
        console.error('图片加载失败:', error)
      }
    }
  }

  // 生命周期钩子
  onMounted(() => {
    if (props.imgUrl) {
      temImgPath.value = props.imgUrl
      originalImgUrl.value = props.imgUrl // 初始化时保存原始图片URL
      initImgCutter()
    }
  })

  // 监听图片URL变化
  watch(
    () => props.imgUrl,
    (newVal) => {
      if (newVal) {
        temImgPath.value = newVal
        originalImgUrl.value = newVal // 初始化时保存原始图片URL
        isImageCropped.value = false // 重置裁剪状态
        initImgCutter()
      }
    }
  )

  // 实时预览
  function cutterPrintImg(result: { dataURL: string }) {
    temImgPath.value = result.dataURL
    isImageCropped.value = true // 标记为已裁剪
  }

  // 裁剪完成
  function cutDownImg(result: CutterResult) {
    emit('update:imgUrl', result.dataURL)
    isImageCropped.value = true // 标记为已裁剪
  }

  // 图片加载完成
  function handleImageLoadComplete(result: any) {
    // 如果是新选择的图片（从文件选择器选择），保存为原始图片
    if (result && result.src) {
      console.log('图片加载完成，更新原始图片URL:', result)
      originalImgUrl.value = result.src
      isImageCropped.value = false // 重置裁剪状态
      
      // 通知父组件新图片已选择
      emit('imageSelected', {
        originalUrl: result.src
      })
    }
    
    emit('imageLoadComplete', result)
  }

  // 图片加载失败
  function handleImageLoadError(error: any) {
    emit('error', error)
    emit('imageLoadError', error)
  }

  // 清除所有
  function handleClearAll() {
    temImgPath.value = ''
    originalImgUrl.value = ''
    isImageCropped.value = false
  }

  // 下载图片
  function downloadImg() {
    console.log('下载图片')
    if (!temImgPath.value) return
    
    const a = document.createElement('a')
    a.href = temImgPath.value
    a.download = 'image.png'
    a.click()
    
    // 向父组件发送下载事件，传递图片路径
    emit('downloadImage', {
      url: temImgPath.value,
      filename: 'image.png'
    })
  }
  
  // 暴露方法供父组件调用
  defineExpose({
    downloadImg,
    getCroppedImage: () => temImgPath.value,
    getOriginalImage: () => originalImgUrl.value, // 新增：获取原始图片
    isImageCropped: () => isImageCropped.value, // 新增：判断图片是否已被裁剪
    handleClearAll, // 暴露清空方法给父组件
    clearImage: () => { // 新增清空图片方法
      handleClearAll();
      if (imgCutterModal.value && typeof imgCutterModal.value.clearAll === 'function') {
        imgCutterModal.value.clearAll();
      } else if (imgCutterModal.value && typeof imgCutterModal.value.clear === 'function') {
        imgCutterModal.value.clear();
      } else {
        console.warn('裁剪组件未提供clear或clearAll方法');
      }
    }
  })
</script>

<style lang="scss" scoped>
  .cutter-container {
    display: flex;
    flex-flow: row wrap;

    .title {
      padding-bottom: 10px;
      font-size: 18px;
      font-weight: 500;
    }

    .cutter-component {
      margin-right: 30px;
    }

    .preview-container {
      .preview-box {
        background-color: #f6f6f6 !important;

        .preview-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      }

      .download-btn {
        display: block;
        margin: 20px auto;
      }
    }

    :deep(.toolBoxControl) {
      z-index: 100;
    }

    :deep(.dockMain) {
      right: 0;
      bottom: -40px;
      left: 0;
      z-index: 10;
      padding: 0;
      background-color: transparent !important;
      opacity: 1;
    }

    :deep(.copyright) {
      display: none !important;
    }

    :deep(.i-dialog-footer) {
      height: 0 !important;
      margin-top: 0px !important;
    }

    :deep(.dockBtn) {
      height: 26px;
      padding: 0 10px;
      font-size: 12px;
      line-height: 26px;
      color: var(--el-color-primary) !important;
      background-color: var(--el-color-primary-light-9) !important;
      border: 1px solid var(--el-color-primary-light-4) !important;
    }

    :deep(.dockBtnScrollBar) {
      margin: 0 10px 0 6px;
      background-color: var(--el-color-primary-light-1);
    }

    :deep(.scrollBarControl) {
      border-color: var(--el-color-primary);
    }

    :deep(.closeIcon) {
      line-height: 15px !important;
    }
  }

  .dark {
    .cutter-container {
      :deep(.toolBox) {
        border: transparent;
      }

      :deep(.dialogMain) {
        background-color: transparent !important;
      }

      :deep(.i-dialog-footer) {
        .btn {
          background-color: var(--el-color-primary) !important;
          border: transparent;
        }
      }
    }
  }
</style>
