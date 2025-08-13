<template>
  <div class="player-page">
    <div class="player-header">
      <div class="player-controls">
        <ElInput
          v-model="inputUrl"
          placeholder="ws-fmp4/http-fmp4"
          size="small"
          class="url-input"
        />
        <ElButton type="primary" size="small" @click="handlePlay" :loading="loading">
          播放
        </ElButton>
        <ElButton size="small" @click="handleStop"> 停止 </ElButton>
      </div>
    </div>
    <div class="player-body">
      <div
        ref="playerContainer"
        class="video-player-container"
        :style="{ backgroundColor: 'black', minHeight: '500px' }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, onUnmounted, watchEffect, nextTick } from 'vue'
  import { useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'

  const route = useRoute()

  const app = computed(() => (route.query.app as string) || 'live')
  const stream = computed(() => (route.query.stream as string) || '')

  const defaultUrl = computed(() => {
    if (!stream.value) return ''
    return `ws://192.1681.186/${app.value}/${stream.value}.live.mp4`
  })

  const inputUrl = ref('')
  const loading = ref(false)
  const playerContainer = ref<HTMLElement>()

  let ePlayer: any = null

  // 初始化输入地址
  watchEffect(() => {
    if (!inputUrl.value && defaultUrl.value) {
      inputUrl.value = defaultUrl.value
    }
  })

  // 动态加载 EasyPlayer 脚本
  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve()
        return
      }
      const script = document.createElement('script')
      script.src = src
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
      document.head.appendChild(script)
    })
  }

  // 确保 EasyPlayer 已加载
  const ensureEasyPlayer = async (): Promise<void> => {
    if (window.EasyPlayerPro) return

    try {
      // 确保 wasm 相关资源按 /js/ 解析
      try {
        const g: any = window
        g.Module = g.Module || {}
        if (typeof g.Module.locateFile !== 'function') {
          g.Module.locateFile = (path: string) => `/js/${path}`
        }
      } catch {}

      await loadScript('/js/EasyPlayer-pro.js')

      if (!window.EasyPlayerPro) {
        throw new Error('EasyPlayerPro not found after loading script')
      }
    } catch (error) {
      console.error('Failed to load EasyPlayer:', error)
      throw error
    }
  }

  // 创建播放器实例（参数参考 monitor/views/monitor/index.vue）
  const createPlayer = async (): Promise<void> => {
    if (!playerContainer.value) return

    try {
      await ensureEasyPlayer()

      ePlayer = new window.EasyPlayerPro({
        container: playerContainer.value,
        // 低延迟相关
        videoBuffer: 0.05,
        videoBufferDelay: 1,
        bufferTime: 0.01,
        maxBufferLength: 0.1,
        lowLatencyMode: true,
        // 解码与资源
        decoder: '/js/EasyPlayer-decode.js',
        isResize: true,
        loadingText: '加载中',
        debug: false,
        debugLevel: 'error',
        useMSE: true,
        useSIMD: true,
        useWCS: true,
        hasAudio: false,
        websocket1006ErrorReplay: true,
        networkDelayTimeoutReplay: true,
        useMThreading: true,
        showBandwidth: false,
        showPerformance: false,
        operateBtns: {
          fullscreen: true,
          screenshot: false,
          play: true,
          audio: false,
          ptz: false,
          quality: false,
          performance: false
        },
        background: '/assets/bus.jpg',
        timeout: 3,
        qualityConfig: ['普清', '高清'],
        forceNoOffscreen: true,
        isNotMute: true,
        heartTimeout: 2,
        ptzClickType: 'mouseDownAndUp',
        ptzZoomShow: false,
        ptzMoreArrowShow: false,
        ptzApertureShow: false,
        ptzFocusShow: false,
        pauseAndNextPlayUseLastFrameShow: false,
        heartTimeoutReplayUseLastFrameShow: false,
        replayUseLastFrameShow: false,
        fullscreenWatermarkConfig: { text: '' }
      })

      console.log('EasyPlayer 创建成功')
    } catch (error) {
      console.error('创建播放器失败:', error)
      ElMessage.error('播放器初始化失败')
      throw error
    }
  }

  // 开始播放
  const playStart = async (videoUrl: string): Promise<void> => {
    if (!videoUrl || videoUrl.trim() === '') {
      ElMessage.error('请输入播放地址')
      return
    }

    if (!videoUrl.endsWith('.mp4')) {
      ElMessage.error('无效的流地址，必须是 .mp4 格式')
      return
    }

    if (!videoUrl.startsWith('ws://') && !videoUrl.startsWith('http://')) {
      ElMessage.error('无效的流地址，必须以 ws:// 或 http:// 开头')
      return
    }

    try {
      loading.value = true

      // 如果播放器已存在，先销毁
      if (ePlayer) {
        await ePlayer.destroy()
        ePlayer = null
      }

      // 重新创建播放器
      await createPlayer()

      if (ePlayer) {
        await ePlayer.play(videoUrl)
        ElMessage.success('开始播放')
      }
    } catch (error) {
      console.error('播放失败:', error)
      ElMessage.error('播放失败，请检查流地址是否正确')
    } finally {
      loading.value = false
    }
  }

  // 停止播放
  const playStop = async (): Promise<void> => {
    try {
      if (ePlayer) {
        await ePlayer.destroy()
        ePlayer = null
        ElMessage.success('已停止播放')
      }
    } catch (error) {
      console.error('停止播放失败:', error)
    }
  }

  // 处理播放按钮点击
  const handlePlay = (): void => {
    const url = inputUrl.value.trim()
    playStart(url)
  }

  // 处理停止按钮点击
  const handleStop = (): void => {
    playStop()
  }

  // 页面加载时自动播放（如果有默认地址）
  onMounted(async () => {
    await nextTick()

    // 如果有默认地址，自动开始播放
    if (defaultUrl.value) {
      setTimeout(() => {
        handlePlay()
      }, 400)
    }
  })

  // 页面卸载时清理播放器
  onUnmounted(() => {
    if (ePlayer) {
      ePlayer.destroy().catch(console.error)
      ePlayer = null
    }
  })

  // 类型声明
  declare global {
    interface Window {
      EasyPlayerPro: any
      Module?: any
    }
  }
</script>

<style scoped>
  .player-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #0f1114;
  }

  .player-header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 12px 16px;
    background-color: #0f1114;
    border-bottom: 1px solid rgba(0, 212, 255, 0.2);
  }

  .player-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .url-input {
    width: 420px;
  }

  .player-body {
    flex: 1;
    padding: 16px;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 0;
  }

  .video-player-container {
    width: 100%;
    max-width: 100%;
    height: calc(100vh - 80px);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(0, 212, 255, 0.15);
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .player-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
    }

    .player-controls {
      width: 100%;
      flex-wrap: wrap;
    }

    .url-input {
      width: 100%;
      min-width: 200px;
    }

    .video-player-container {
      height: calc(100vh - 120px);
    }
  }

  /* EasyPlayer 样式覆盖 */
  :deep(.video-player-container) {
    position: relative;
  }

  :deep(.easyplayer-container) {
    width: 100% !important;
    height: 100% !important;
  }

  :deep(.easyplayer-loading) {
    background-color: rgba(0, 0, 0, 0.8) !important;
  }
</style>
