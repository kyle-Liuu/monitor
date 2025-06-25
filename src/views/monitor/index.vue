<script setup lang="ts">
  import { onMounted } from 'vue'

  onMounted(() => {
    // 直接跳转到监控页面
    window.location.href = './monitor.html'
  })
</script>

<template>
  <div class="page-content monitor">
    <div class="monitor-container">
      <div class="monitor-header">
        <h2>正在跳转到实时监控系统...</h2>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .monitor-container {
    background-color: var(--el-bg-color);
    border-radius: 8px;
    box-shadow: var(--el-box-shadow-light);
    padding: 24px;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .monitor-header {
    margin-bottom: 24px;
    text-align: center;

    h2 {
      font-size: 24px;
      color: var(--el-text-color-primary);
      margin-bottom: 8px;
    }

    p {
      color: var(--el-text-color-secondary);
      font-size: 14px;
    }
  }
</style>
