<template>
  <div class="container dark" id="app">
    <div class="monitor-header">
      <span class="control-icon back-control" @click="goBackToDashboard">
        <svg
          t="1754477829638"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="1922"
          width="200"
          height="200"
        >
          <path
            d="M816.64 865.28c-79.872 73.216-188.928 107.52-294.4 107.52-64 0-128-13.312-186.368-40.96-8.192-4.096-12.288-12.8-9.216-21.504 2.56-8.704 11.264-14.336 19.968-12.8 139.776 21.504 228.864-22.016 279.04-62.976 61.952-49.664 100.864-124.928 104.96-201.728 4.096-78.848-27.648-179.712-109.056-226.816-33.792-19.456-72.704-27.648-115.2-24.064l46.592 135.168-482.816-95.744L394.24 51.2l39.936 117.248c100.352-21.504 197.632-18.944 279.552 15.36 110.08 46.592 203.264 152.064 229.376 274.944 33.28 159.744-12.8 301.568-126.464 406.528z"
            fill="#00d4ff"
            p-id="1923"
          ></path>
        </svg>
        <span class="control-text">后台设置</span>
      </span>
      <h1>AI监控大屏</h1>
      <span class="control-icon logout-control" @click="handleLogout">
        <svg
          t="1754477792307"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="1670"
          width="200"
          height="200"
        >
          <path
            d="M982.1 512c0 8.8-3.2 16.5-9.7 23L694.6 812.8c-6.4 6.4-14.1 9.7-23 9.7-8.9 0-16.6-3.2-23-9.7-6.4-6.4-9.7-14.1-9.7-23L638.9 642.7 414.7 642.7c-8.8 0-16.5-3.2-23-9.7s-9.7-14.1-9.7-23L382 414c0-8.8 3.2-16.5 9.7-23 6.4-6.5 14.1-9.7 23-9.7l224.3 0L639 234.2c0-8.8 3.2-16.5 9.7-23 6.4-6.5 14.1-9.7 23-9.7 8.9 0 16.6 3.3 23 9.7L972.4 489C978.8 495.4 982.1 503.1 982.1 512L982.1 512z"
            p-id="1671"
            fill="#00d4ff"
          ></path>
          <path
            d="M417 1024 240 1024c-64.1 0-124.4-25-169.7-70.3C25 908.4 0 848.1 0 784L0 240c0-64.1 25-124.4 70.3-169.7C115.6 25 175.9 0 240 0l177 0c53 0 96 43 96 96s-43 96-96 96L240 192c-26.5 0-48 21.5-48 48l0 544c0 26.5 21.5 48 48 48l177 0c53 0 96 43 96 96S470 1024 417 1024z"
            p-id="1672"
            fill="#00d4ff"
          ></path>
        </svg>
        <span class="control-text">退出登录</span>
      </span>
    </div>

    <div class="main-container">
      <div class="left-panel">
        <div class="module-section device-list-module">
          <div class="section-title">设备列表</div>
          <div class="tree-view-wrapper">
            <div class="tree-view">
              <ul id="org-tree-root"></ul>
            </div>
          </div>
        </div>
        <div class="module-section cpu-module-section">
          <div
            class="section-title"
            style="display: flex; gap: 50px; align-items: center; justify-content: flex-start"
          >
            内存/CPU
          </div>
          <div id="cpu-chart" class="cpu-chart-container"></div>
        </div>
        <div class="module-section storage-module-section">
          <div class="section-title">存储</div>
          <div class="storage-bar-outer">
            <div class="storage-bar-inner" id="storage-bar-inner"></div>
            <div class="storage-bar-label" id="storage-bar-label">45%</div>
          </div>
        </div>
      </div>

      <div class="main-content">
        <div class="video-section">
          <div class="section-title video-title-bar">
            <span>实时调阅</span>
            <span class="time-display" style="margin-left: 20px; display: none">{{
              currentTime
            }}</span>

            <div class="screen-switch">
              <span class="control-icon" @click="onPlayer">
                <svg
                  t="1750127183805"
                  class="icon"
                  viewBox="0 0 1024 1024"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  p-id="2667"
                  width="200"
                  height="200"
                >
                  <path
                    d="M772.096 875.52l87.04-1.536 2.048 102.4-256.512 4.608-4.608-256.512 102.4-1.536 1.536 75.776c156.16-122.88 182.784-348.672 60.416-504.32-69.632-88.576-176.128-139.264-288.256-137.216l4.096-102.912c254.976-1.024 462.848 204.8 463.872 459.776 0.512 140.8-62.976 273.408-172.032 361.472zM203.264 147.456l-87.04 1.536-1.536-102.4 256.512-4.608 4.608 256.512-102.4 1.536-2.048-75.776c-156.16 122.88-182.784 348.672-60.416 504.32 69.632 88.064 176.128 139.264 288.256 137.216l-4.096 102.912c-254.976 1.024-462.848-204.8-463.872-459.776C31.232 368.64 94.208 235.52 203.264 147.456z"
                    p-id="2668"
                  ></path>
                </svg>
              </span>
              <span class="control-icon" @click="onStop">
                <svg
                  t="1750127118511"
                  class="icon"
                  viewBox="0 0 1024 1024"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  p-id="1594"
                  width="200"
                  height="200"
                >
                  <path
                    d="M567.02 36.49H456.98v558.04h110.04V36.49z m199.11 136.23l-81.22 81.22c50.65 29.69 90.38 69.86 119.21 120.52 28.82 50.65 43.23 106.11 43.23 166.36 0 60.26-14.85 116.15-44.54 167.68-29.69 51.52-70.3 92.13-121.82 121.82-51.53 29.69-107.85 44.54-168.98 44.54-61.13 0-117.46-14.85-168.98-44.54-51.53-29.69-92.13-70.3-121.83-121.82-29.69-51.53-44.54-107.42-44.54-167.68 0-60.26 14.41-115.71 43.23-166.36s67.68-90.82 116.59-120.52l-78.6-81.22c-59.39 41.92-106.54 94.75-141.48 158.5C81.47 394.98 64 464.41 64 539.51c0 80.34 20.08 155.01 60.26 224S219.01 887.08 288 927.25c68.99 40.17 143.66 60.26 224 60.26s155.01-20.09 224-60.26c68.99-40.17 123.57-94.75 163.74-163.74 40.17-68.99 60.26-143.66 60.26-224 0-75.1-17.47-144.53-52.4-208.28s-82.09-116.59-141.47-158.51z"
                    p-id="1595"
                  ></path>
                </svg>
              </span>
              <div class="divider"></div>
              <span
                v-for="item in [1, 4, 9]"
                :key="item"
                :class="['screen-btn', { active: screenCount === item }]"
                @click="switchScreen(item)"
              >
                <svg
                  v-if="item === 1"
                  viewBox="0 0 1024 1024"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M960 920c0 22-18 40-40 40H104c-22 0-40-18-40-40V104c0-22 18-40 40-40h816c22 0 40 18 40 40v816z"
                  ></path>
                </svg>
                <svg
                  v-else-if="item === 4"
                  viewBox="0 0 1024 1024"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M480 96v288c0 53-43 96-96 96H96c-53 0-96-43-96-96V96C0 43 43 0 96 0h288c53 0 96 43 96 96zM1024 96v288c0 53-43 96-96 96H640c-53 0-96-43-96-96V96c0-53 43-96 96-96h288c53 0 96 43 96 96zM480 640v288c0 53-43 96-96 96H96c-53 0-96-43-96-96V640c0-53 43-96 96-96h288c53 0 96 43 96 96zM1024 640v288c0 53-43 96-96 96H640c-53 0-96-43-96-96V640c0-53 43-96 96-96h288c53 0 96 43 96 96z"
                  ></path>
                </svg>
                <svg
                  v-else-if="item === 9"
                  viewBox="0 0 1024 1024"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M267.094423 22.942738c15.17106 15.217597 22.75659 33.73932 22.756589 55.56517v133.188874c0 21.872387-7.58553 40.347573-22.803126 55.56517-15.17106 15.17106-33.646246 22.803127-55.518633 22.803127H78.340378c-21.872387 0-40.347573-7.632067-55.518633-22.803127A75.576077 75.576077 0 0 1 0.018618 211.696782V78.507908C0.018618 56.635521 7.604148 38.160334 22.821745 22.942738 37.992805 7.771678 56.514528 0.186148 78.340378 0.186148h133.188875c21.872387 0 40.347573 7.58553 55.56517 22.75659z m369.271041 0c15.217597 15.217597 22.803127 33.73932 22.803127 55.56517v133.188874c0 21.872387-7.58553 40.347573-22.803127 55.56517-15.17106 15.17106-33.692783 22.803127-55.472096 22.803127H445.28457c-21.779313 0-40.301036-7.632067-55.518633-22.803127a75.576077 75.576077 0 0 1-22.803127-55.56517V78.507908c0-21.872387 7.632067-40.347573 22.803127-55.56517C404.983534 7.771678 423.505257 0.186148 445.28457 0.186148h135.608798c21.779313 0 40.301036 7.58553 55.472096 22.75659z m364.66388 0c15.217597 15.217597 22.803127 33.73932 22.803126 55.56517v133.188874c0 21.872387-7.58553 40.347573-22.803126 55.56517-15.17106 15.17106-33.692783 22.803127-55.518633 22.803127h-135.562262c-21.82585 0-40.301036-7.632067-55.518633-22.803127a75.576077 75.576077 0 0 1-22.803127-55.56517V78.507908c0-21.872387 7.632067-40.347573 22.803127-55.56517 15.217597-15.17106 33.692783-22.75659 55.518633-22.75659h135.562262c21.872387 0 40.347573 7.58553 55.518633 22.75659zM267.14096 389.933467c15.17106 15.217597 22.75659 33.692783 22.756589 55.518633v133.235411c0 21.82585-7.58553 40.347573-22.803126 55.518633-15.17106 15.217597-33.646246 22.803127-55.518633 22.803127H78.340378c-21.872387 0-40.347573-7.58553-55.518633-22.803127A75.576077 75.576077 0 0 1 0.018618 578.687511V445.4521c0-21.82585 7.58553-40.301036 22.803127-55.518633a75.669151 75.669151 0 0 1 55.518633-22.75659h133.188875c21.872387 0 40.347573 7.58553 55.56517 22.803127z m369.271041 0c15.217597 15.217597 22.803127 33.692783 22.803127 55.518633v133.235411c0 21.82585-7.58553 40.347573-22.803127 55.518633-15.17106 15.217597-33.692783 22.803127-55.472096 22.803127H445.28457c-21.779313 0-40.301036-7.58553-55.518633-22.803127a75.576077 75.576077 0 0 1-22.803127-55.518633V445.4521c0-21.82585 7.632067-40.301036 22.803127-55.518633a75.669151 75.669151 0 0 1 55.518633-22.75659h135.608798c21.779313 0 40.301036 7.58553 55.472096 22.803127z m364.663879 0c15.217597 15.217597 22.803127 33.692783 22.803127 55.518633v133.235411c0 21.82585-7.58553 40.347573-22.803127 55.518633-15.17106 15.217597-33.692783 22.803127-55.518632 22.803127h-135.562262c-21.82585 0-40.301036-7.632067-55.518633-22.803127a75.576077 75.576077 0 0 1-22.803127-55.518633v-133.235411c0-21.872387 7.632067-40.301036 22.803127-55.518633a75.669151 75.669151 0 0 1 55.518633-22.75659h135.562262c21.872387 0 40.347573 7.58553 55.518633 22.75659zM267.14096 756.924196c15.17106 15.217597 22.75659 33.692783 22.756589 55.518633v133.235411c0 21.779313-7.58553 40.301036-22.803126 55.518633-15.17106 15.17106-33.646246 22.803127-55.518633 22.803127H78.340378c-21.872387 0-40.347573-7.632067-55.518633-22.803127A75.576077 75.576077 0 0 1 0.018618 945.67824v-133.235411c0-21.872387 7.58553-40.301036 22.803127-55.518633 15.17106-15.17106 33.692783-22.803127 55.518633-22.803127h133.188875c21.872387 0 40.347573 7.632067 55.56517 22.803127z m313.798945-22.803127c21.779313 0 40.301036 7.632067 55.472096 22.803127 15.217597 15.217597 22.803127 33.692783 22.803127 55.518633v133.235411c0 21.779313-7.58553 40.301036-22.803127 55.518633-15.17106 15.17106-33.692783 22.803127-55.472096 22.803127H445.28457c-21.779313 0-40.301036-7.632067-55.518633-22.803127a75.576077 75.576077 0 0 1-22.803127-55.518633v-133.235411c0-21.872387 7.632067-40.301036 22.803127-55.518633 15.217597-15.17106 33.73932-22.803127 55.518633-22.803127h135.608798z m364.617343 0c21.872387 0 40.347573 7.632067 55.518632 22.803127 15.217597 15.217597 22.803127 33.692783 22.803127 55.518633v133.235411c0 21.779313-7.58553 40.301036-22.803127 55.518633-15.17106 15.17106-33.692783 22.803127-55.518632 22.803127h-135.562262c-21.82585 0-40.301036-7.632067-55.518633-22.803127a75.576077 75.576077 0 0 1-22.803127-55.518633v-133.235411c0-21.872387 7.632067-40.301036 22.803127-55.518633 15.217597-15.17106 33.692783-22.803127 55.518633-22.803127h135.562262c21.872387 0 40.347573 7.58553 55.518633 22.75659zM267.14096 756.924196c15.17106 15.217597 22.75659 33.692783 22.756589 55.518633v133.235411c0 21.779313-7.58553 40.301036-22.803126 55.518633-15.17106 15.17106-33.646246 22.803127-55.518633 22.803127H78.340378c-21.872387 0-40.347573-7.632067-55.518633-22.803127A75.576077 75.576077 0 0 1 0.018618 945.67824v-133.235411c0-21.872387 7.58553-40.301036 22.803127-55.518633 15.17106-15.17106 33.692783-22.803127 55.518633-22.803127h133.188875c21.872387 0 40.347573 7.632067 55.56517 22.803127z m313.798945-22.803127c21.779313 0 40.301036 7.632067 55.472096 22.803127 15.217597 15.217597 22.803127 33.692783 22.803127 55.518633v133.235411c0 21.779313-7.58553 40.301036-22.803127 55.518633-15.17106 15.17106-33.692783 22.803127-55.472096 22.803127H445.28457c-21.779313 0-40.301036-7.632067-55.518633-22.803127a75.576077 75.576077 0 0 1-22.803127-55.518633v-133.235411c0-21.872387 7.632067-40.301036 22.803127-55.518633 15.217597-15.17106 33.73932-22.803127 55.518633-22.803127h135.608798z m364.617343 0c21.872387 0 40.347573 7.632067 55.518632 22.803127 15.217597 15.217597 22.803127 33.692783 22.803127 55.518633v133.235411c0 21.779313-7.58553 40.301036-22.803127 55.518633-15.17106 15.17106-33.692783 22.803127-55.518632 22.803127h-135.562262c-21.82585 0-40.301036-7.632067-55.518633-22.803127a75.576077 75.576077 0 0 1-22.803127-55.518633v-133.235411c0-21.872387 7.632067-40.301036 22.803127-55.518633 15.217597-15.17106 33.692783-22.803127 55.518633-22.803127h135.562262c21.872387 0 40.347573 7.58553 55.518633 22.75659zM267.14096 756.924196c15.17106 15.217597 22.75659 33.692783 22.756589 55.518633v133.235411c0 21.779313-7.58553 40.301036-22.803126 55.518633-15.17106 15.17106-33.646246 22.803127-55.518633 22.803127H78.340378c-21.872387 0-40.347573-7.632067-55.518633-22.803127A75.576077 75.576077 0 0 1 0.018618 945.67824v-133.235411c0-21.872387 7.58553-40.301036 22.803127-55.518633 15.17106-15.17106 33.692783-22.803127 55.518633-22.803127h133.188875c21.872387 0 40.347573 7.632067 55.56517 22.803127z m313.798945-22.803127c21.779313 0 40.301036 7.632067 55.472096 22.803127 15.217597 15.217597 22.803127 33.692783 22.803127 55.518633v133.235411c0 21.779313-7.58553 40.301036-22.803127 55.518633-15.17106 15.17106-33.692783 22.803127-55.472096 22.803127H445.28457c-21.779313 0-40.301036-7.632067-55.518633-22.803127a75.576077 75.576077 0 0 1-22.803127-55.518633v-133.235411c0-21.872387 7.632067-40.301036 22.803127-55.518633 15.217597-15.17106 33.73932-22.803127 55.518633-22.803127h135.608798z m364.617343 0c21.872387 0 40.347573 7.632067 55.518632 22.803127 15.217597 15.217597 22.803127 33.692783 22.803127 55.518633v133.235411c0 21.779313-7.58553 40.301036-22.803127 55.518633-15.17106 15.17106-33.692783 22.803127-55.518632 22.803127h-135.562262c-21.82585 0-40.301036-7.632067-55.518633-22.803127a75.576077 75.576077 0 0 1-22.803127-55.518633v-133.235411c0-21.872387 7.632067-40.301036 22.803127-55.518633 15.217597-15.17106 33.692783-22.803127 55.518633-22.803127h135.562262c21.872387 0 40.347573 7.58553 55.518633 22.75659zM267.14096 756.924196c15.17106 15.217597 22.75659 33.692783 22.756589 55.518633v133.235411c0 21.779313-7.58553 40.301036-22.803126 55.518633-15.17106 15.17106-33.646246 22.803127-55.518633 22.803127H78.340378c-21.872387 0-40.347573-7.632067-55.518633-22.803127A75.576077 75.576077 0 0 1 0.018618 945.67824v-133.235411c0-21.872387 7.58553-40.301036 22.803127-55.518633 15.17106-15.17106 33.692783-22.803127 55.518633-22.803127h133.188875c21.872387 0 40.347573 7.632067 55.56517 22.803127z m313.798945-22.803127c21.779313 0 40.301036 7.632067 55.472096 22.803127 15.217597 15.217597 22.803127 33.692783 22.803127 55.518633v133.235411c0 21.779313-7.58553 40.301036-22.803127 55.518633-15.17106 15.17106-33.692783 22.803127-55.472096 22.803127H445.28457c-21.779313 0-40.301036-7.632067-55.518633-22.803127a75.576077 75.576077 0 0 1-22.803127-55.518633v-133.235411c0-21.872387 7.632067-40.301036 22.803127-55.518633 15.217597-15.17106 33.73932-22.803127 55.518633-22.803127h135.608798z m364.617343 0c21.872387 0 40.347573 7.632067 55.518632 22.803127 15.217597 15.217597 22.803127 33.692783 22.803127 55.518633v133.235411c0 21.779313-7.58553 40.301036-22.803127 55.518633-15.17106 15.17106-33.692783 22.803127-55.518632 22.803127h-135.562262c-21.82585 0-40.301036-7.632067-55.518633-22.803127a75.576077 75.576077 0 0 1-22.803127-55.518633v-133.235411c0-21.872387 7.632067-40.301036 22.803127-55.518633 15.217597-15.17106 33.692783-22.803127 55.518633-22.803127h135.562262c21.872387 0 40.347573 7.58553 55.518633 22.75659zM267.14096 756.924196c15.17106 15.217597 22.75659 33.692783 22.756589 55.518633v133.235411c0 21.779313-7.58553 40.301036-22.803126 55.518633-15.17106 15.17106-33.646246 22.803127-55.518633 22.803127H78.340378c-21.872387 0-40.347573-7.632067-55.518633-22.803127A75.576077 75.576077 0 0 1 0.018618 945.67824v-133.235411c0-21.872387 7.58553-40.301036 22.803127-55.518633 15.17106-15.17106 33.692783-22.803127 55.518633-22.803127h133.188875c21.872387 0 40.347573 7.632067 55.56517 22.803127z m313.798945-22.803127c21.779313 0 40.301036 7.632067 55.472096 22.803127 15.217597 15.217597 22.803127 33.692783 22.803127 55.518633v133.235411c0 21.779313-7.58553 40.301036-22.803127 55.518633-15.17106 15.17106-33.692783 22.803127-55.472096 22.803127H445.28457c-21.779313 0-40.301036-7.632067-55.518633-22.803127a75.576077 75.576077 0 0 1-22.803127-55.518633v-133.235411c0-21.872387 7.632067-40.301036 22.803127-55.518633 15.217597-15.17106 33.73932-22.803127 55.518633-22.803127h135.608798z m364.617343 0c21.872387 0 40.347573 7.632067 55.518632 22.803127 15.217597 15.217597 22.803127 33.692783 22.803127 55.518633v133.235411c0 21.779313-7.58553 40.301036-22.803127 55.518633-15.17106 15.17106-33.692783 22.803127-55.518632 22.803127h-135.562262c-21.82585 0-40.301036-7.632067-55.518633-22.803127a75.576077 75.576077 0 0 1-22.803127-55.518633v-133.235411c0-21.872387 7.632067-40.301036 22.803127-55.518633 15.217597-15.17106 33.692783-22.803127 55.518633-22.803127h135.562262c21.872387 0 40.347573 7.58553 55.518633 22.75659z"
                  ></path>
                </svg>
              </span>
              <div class="divider"></div>
              <span class="fullscreen-btn" @click="setFullscreen">
                <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M368.896 192H224a32 32 0 0 0-32 32v137.888a32 32 0 0 0 64 0V256h112.896a32 32 0 0 0 0-64zM784.864 192H640a32 32 0 1 0 0 64h112.864v105.888a32 32 0 1 0 64 0V224a32 32 0 0 0-32-32zM368.896 777.92H256V672a32 32 0 1 0-64 0v137.92a32 32 0 0 0 32 32h144.896a32 32 0 1 0 0-64zM784.864 640a32 32 0 0 0-32 32v105.92H640a32 32 0 1 0 0 64h144.864a32 32 0 0 0 32-32V672a32 32 0 0 0-32-32z"
                  ></path>
                  <path
                    d="M912 48h-800c-35.296 0-64 28.704-64 64v800c0 35.296 28.704 64 64 64h800c35.296 0 64-28.704 64-64v-800c0-35.296-28.704-64-64-64z m-800 864v-800h800l0.064 800H112z"
                  ></path>
                </svg>
              </span>
            </div>
          </div>
          <div class="video-frame" :class="'screen-' + screenCount">
            <div
              v-for="n in screenCount"
              :key="n"
              :id="'easyplayer-container-' + n"
              class="player-box"
              @click="handleScreenClick(n - 1)"
            ></div>
          </div>
        </div>
      </div>

      <div class="right-panel">
        <div class="module-section alert-capture-module">
          <div class="section-title">
            <span>预警抓拍</span>
          </div>
          <div class="alert-grid-wrapper">
            <div
              class="alert-card"
              v-for="(item, idx) in alertList"
              :key="idx"
              :class="[
                'alert-level-' + item.level?.toLowerCase(),
                { unhandled: item.status === '未处理' }
              ]"
              @click="showAlertDrawer(item)"
            >
              <div class="alert-image">
                <img
                  :src="item.img || '/assets/bus.jpg'"
                  :alt="item.title"
                  class="alert-thumbnail"
                />
                <div class="alert-level-badge" :class="'level-' + item.level?.toLowerCase()">
                  {{ item.level }}
                </div>
              </div>
              <div class="alert-info">
                <div class="alert-left">
                  <div class="alert-location">{{ item.location }}</div>
                  <div class="alert-type">告警类型：{{ item.type }}</div>
                </div>
                <div class="alert-right">
                  <div
                    class="alert-status-badge"
                    :class="{
                      'status-unhandled': item.status === '未处理',
                      'status-confirmed': item.status === '已处理',
                      'status-error': item.status === '误报'
                    }"
                  >
                    <svg
                      v-if="item.status === '未处理'"
                      class="status-icon"
                      viewBox="0 0 16 16"
                      width="14"
                      height="14"
                    >
                      <path
                        fill="currentColor"
                        d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0z"
                      />
                    </svg>
                    <svg
                      v-else-if="item.status === '已处理'"
                      class="status-icon"
                      viewBox="0 0 16 16"
                      width="14"
                      height="14"
                    >
                      <path
                        fill="currentColor"
                        d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zm3.78-9.72a.75.75 0 0 0-1.06-1.06L6.75 9.19 5.28 7.72a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l4.5-4.5z"
                      />
                    </svg>
                    <svg
                      v-else-if="item.status === '误报'"
                      class="status-icon"
                      viewBox="0 0 16 16"
                      width="14"
                      height="14"
                    >
                      <path
                        fill="currentColor"
                        d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"
                      />
                      <path
                        fill="currentColor"
                        d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"
                      />
                    </svg>
                    {{ item.status }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="drawerVisible" class="alert-drawer-overlay" @click.self="closeAlertDrawer">
      <div class="alert-drawer monitor-alert-drawer">
        <div class="monitor-alert-header">
          <div class="monitor-alert-title">告警详情</div>
        </div>
        <div class="monitor-alert-info-grid">
          <div class="info-block"
            ><span class="info-label">状态：</span
            ><span
              :style="{
                color: drawerData?.status === '未处理' ? '#f56c6c' : '#67c23a',
                fontWeight: 600
              }"
              >{{ drawerData?.status || '未处理' }}</span
            ></div
          >
          <div class="info-block"
            ><span class="info-label">数据源：</span><span>{{ drawerData?.location || '-' }}</span>
          </div>
          <div class="info-block"
            ><span class="info-label">IP：</span><span>{{ drawerData?.ip || '-' }}</span></div
          >
          <div class="info-block"
            ><span class="info-label">危险等级：</span
            ><span style="font-weight: 600; color: #e6a23c">{{
              drawerData?.level || '-'
            }}</span></div
          >
          <div class="info-block"
            ><span class="info-label">告警类型：</span
            ><span style="font-weight: 600; color: #409eff">{{
              drawerData?.type || '-'
            }}</span></div
          >
          <div class="info-block"
            ><span class="info-label">检测时间：</span
            ><span>{{ drawerData?.time || '-' }}</span></div
          >
        </div>
        <div class="monitor-alert-img-box">
          <img
            :src="drawerData?.img || '/assets/bus.jpg'"
            alt="抓拍图片"
            class="monitor-alert-img"
          />
        </div>
        <div class="monitor-alert-bottom-bar">
          <input class="monitor-alert-input" v-model="drawerRemark" placeholder="处理意见" />
          <div class="monitor-alert-btns">
            <button
              class="monitor-btn confirm"
              @click="drawerData && onAlertActionConfirm(drawerData)"
              :disabled="!drawerData"
              >确认</button
            >
            <button
              class="monitor-btn error"
              @click="drawerData && onAlertActionError(drawerData)"
              :disabled="!drawerData"
              >误报</button
            >
            <button class="monitor-btn reset" @click="onAlertReset(drawerData)">重置</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import '@/assets/styles/monitor.scss'
  import { ref, reactive, nextTick, onMounted, onUnmounted, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessageBox } from 'element-plus'
  import { useI18n } from 'vue-i18n'
  import { useUserStore } from '@/store/modules/user'
  import { useOptions } from '@/composables/useOptions'
  import * as echarts from 'echarts'
  import alertMockService, { type AlertItem } from '@/mock/temp/alertMockData'

  defineOptions({ name: 'MonitorIndex' })

  const router = useRouter()
  const { t } = useI18n()
  const userStore = useUserStore()
  const { fetchOrgs, orgsTree } = useOptions()

  // 配置项
  const CONFIG = {
    API_BASE_URL: 'http://192.168.1.186:5001',
    TOKEN: '123456',
    UPDATE_INTERVALS: {
      DEVICE_LIST: 30000,
      CPU_MEMORY: 3000,
      STORAGE: 5000
    }
  }

  // 响应式数据
  const currentTime = ref('')
  const screenCount = ref(1)
  const selectedScreenId = ref(0)
  const selectedOrgId = ref<string | null>(null)
  const isPlay = ref(false)
  const videoUrl = ref('ws://192.168.1.186/live/test.live.mp4')
  const drawerVisible = ref(false)
  const drawerRemark = ref('')
  const drawerData = ref<AlertItem | null>(null)

  // 播放器相关
  const playerList = ref<any[]>([])
  const playerMap = new Map()

  // 优化的播放器配置 - 减少不必要的功能以提高性能
  const config = {
    container: null,
    videoBuffer: 0.05,
    videoBufferDelay: 1,
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
      screenshot: true,
      play: true,
      audio: false,
      ptz: false,
      quality: false,
      performance: false
    },
    background: '/assets/bus.jpg',
    timeout: 3, // 减少超时时间
    qualityConfig: ['普清', '高清'], // 减少质量选项
    forceNoOffscreen: true,
    isNotMute: true,
    heartTimeout: 2, // 减少心跳超时
    ptzClickType: 'mouseDownAndUp',
    ptzZoomShow: false,
    ptzMoreArrowShow: false,
    ptzApertureShow: false,
    ptzFocusShow: false,
    pauseAndNextPlayUseLastFrameShow: false,
    heartTimeoutReplayUseLastFrameShow: false,
    replayUseLastFrameShow: false,
    lowLatencyMode: true,
    bufferTime: 0.01,
    maxBufferLength: 0.1,
    fullscreenWatermarkConfig: {
      text: ''
    }
  }

  // 设备统计数据
  const deviceStats = reactive({
    total: 0,
    started: 0,
    online: 0
  })

  // 图表实例
  let cpuChartInstance: any = null
  let startupGaugeChartInstance: any = null
  let onlineGaugeChartInstance: any = null

  // CPU/内存图表数据
  const cpuData = ref<number[]>([])
  const memoryData = ref<number[]>([])
  const timeData = ref<string[]>([])

  // 定时器和事件监听器
  const intervals = reactive({
    deviceList: null as any,
    cpuMemory: null as any,
    storage: null as any,
    time: null as any,
    alertUpdate: null as any,
    resizeListener: null as any
  })

  // 告警列表数据
  const alertList = ref<AlertItem[]>([])

  // 告警统计数据
  const alertStats = computed(() => alertMockService.getStatistics())

  // 加载状态
  const isLoading = ref(false)

  // 移动端检测
  const isMobile = ref(false)

  // 检测屏幕尺寸
  const checkMobile = () => {
    isMobile.value = window.innerWidth <= 1200
  }

  // 实时警告生成清理函数
  let stopAlertGeneration: (() => void) | null = null

  // 工具函数
  const formatTime = (date: Date) => {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${weekdays[date.getDay()]} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
  }

  const createGaugeOption = (value: number, color: string) => ({
    series: [
      {
        type: 'gauge',
        startAngle: 90,
        endAngle: -270,
        min: 0,
        max: 100,
        axisLine: {
          lineStyle: {
            width: 7,
            color: [
              [value / 100, color],
              [1, 'rgba(0, 212, 255, 0.1)']
            ]
          }
        },
        pointer: { show: false },
        progress: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          valueAnimation: true,
          fontSize: 12,
          offsetCenter: [0, '0%'],
          formatter: '{value}%',
          color: color
        },
        data: [{ value: parseFloat(value.toString()) }]
      }
    ]
  })

  // 方法
  const goBackToDashboard = () => {
    // 移除monitor专用body样式
    document.body.classList.remove('monitor-page')
    router.push('/dashboard/console')
  }

  const handleLogout = () => {
    // 复用已有的退出登录逻辑
    setTimeout(() => {
      ElMessageBox.confirm(t('common.logOutTips'), t('common.tips'), {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        customClass: 'login-out-dialog'
      })
        .then(() => {
          // 清理定时器
          Object.values(intervals).forEach((interval) => {
            if (interval) clearInterval(interval)
          })
          // 移除monitor专用body样式
          document.body.classList.remove('monitor-page')
          // 使用已有的logOut方法
          userStore.logOut()
        })
        .catch(() => {
          // 用户取消登出，不做任何操作，避免控制台错误
          console.log('用户取消登出')
        })
    }, 200)
  }

  const handleScreenClick = (screenId: number) => {
    selectedScreenId.value = screenId
    console.log('当前选中屏ID:', screenId)
    document.querySelectorAll('.player-box').forEach((box: any, index: number) => {
      if (index === screenId) {
        box.style.border = '2px solid #ff0000'
      } else {
        box.style.border = '1px solid #00d4ff'
      }
    })
  }

  const switchScreen = (count: number) => {
    if (screenCount.value === count) return

    for (const [videoId, player] of playerMap.entries()) {
      if (player) {
        try {
          player.destroy()
        } catch (e) {
          console.warn('销毁播放器时出错:', e)
        }
      }
    }
    playerMap.clear()
    playerList.value = []
    screenCount.value = count
    selectedScreenId.value = 0

    nextTick(() => {
      setTimeout(() => {
        createPlayers()
        if (isPlay.value && videoUrl.value) {
          setTimeout(() => {
            onPlayer()
          }, 200)
        }
      }, 100)
    })
  }

  const createVideoId = (index: number) => {
    return `video${screenCount.value}_${index}`
  }

  const createEasyPlayer = (videoId: string) => {
    const index = parseInt(videoId.split('_')[1])
    const containerId = index + 1
    const container = document.querySelector(`#easyplayer-container-${containerId}`)
    if (!container) {
      console.error(`找不到容器: easyplayer-container-${containerId}`)
      return null
    }

    try {
      if (typeof (window as any).EasyPlayerPro !== 'undefined') {
        const playerConfig = {
          ...config,
          container: container
        }
        const player = new (window as any).EasyPlayerPro(playerConfig)
        return player
      }
      return null
    } catch (error) {
      console.error('创建EasyPlayer失败:', error)
      return null
    }
  }

  const playStart = async (videoId: string, videoUrl: string) => {
    console.log('playStart:', videoId, videoUrl)

    let player = playerMap.get(videoId)
    if (!player) {
      player = createEasyPlayer(videoId)
      if (player) {
        await player.play(videoUrl)
        playerMap.set(videoId, player)
      }
    } else {
      try {
        await player.destroy()
        player = createEasyPlayer(videoId)
        if (player) {
          await player.play(videoUrl)
          playerMap.set(videoId, player)
        }
      } catch (error) {
        console.error('重新创建播放器失败:', error)
      }
    }
  }

  const playStop = async (videoId: string) => {
    console.log('playStop:', videoId)
    const player = playerMap.get(videoId)
    if (player) {
      try {
        await player.destroy()
        playerMap.delete(videoId)
      } catch (error) {
        console.error('销毁播放器失败:', error)
      }
    }
  }

  const createPlayers = () => {
    for (const [videoId, player] of playerMap.entries()) {
      if (player) {
        try {
          player.destroy()
        } catch (error) {
          console.warn('清理播放器时出错:', error)
        }
      }
    }
    playerMap.clear()
    playerList.value = []

    nextTick(() => {
      for (let i = 1; i <= screenCount.value; i++) {
        const container = document.getElementById('easyplayer-container-' + i)
        if (container) {
          container.innerHTML = ''
          playerList.value.push(null)
        } else {
          playerList.value.push(null)
        }
      }
      handleScreenClick(selectedScreenId.value)
    })
  }

  const onPlayer = async () => {
    if (!videoUrl.value) {
      console.error('没有可播放的视频URL')
      return
    }

    try {
      const videoId = createVideoId(selectedScreenId.value)
      await playStart(videoId, videoUrl.value)
      isPlay.value = true
    } catch (error) {
      console.error('播放失败:', error)
      isPlay.value = false
    }
  }

  const onStop = async () => {
    try {
      const videoId = createVideoId(selectedScreenId.value)
      await playStop(videoId)
      isPlay.value = false
    } catch (error) {
      console.error('停止播放失败:', error)
    }
  }

  const setFullscreen = () => {
    const videoSection = document.querySelector('.video-section')
    if (videoSection) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        ;(videoSection as any).requestFullscreen()
      }
    }
  }

  const updateTime = () => {
    currentTime.value = formatTime(new Date())
  }

  // 异步分步初始化图表，避免阻塞主线程
  const initChartsAsync = () => {
    // 第一步：预生成数据
    requestAnimationFrame(() => {
      // 分批生成CPU/内存数据，避免一次性生成过多
      for (let i = 0; i < 5; i++) {
        generateCpuMemoryData(false)
      }

      // 第二步：初始化CPU图表
      requestAnimationFrame(() => {
        // 继续生成剩余数据
        for (let i = 0; i < 5; i++) {
          generateCpuMemoryData(false)
        }

        initCpuChartOptimized()

        // 第三步：初始化仪表盘图表
        requestAnimationFrame(() => {
          initGaugeCharts()
        })
      })
    })
  }

  // 优化的CPU图表初始化函数
  const initCpuChartOptimized = () => {
    const cpuChartDom = document.getElementById('cpu-chart')
    if (!cpuChartDom) {
      console.warn('CPU图表容器未找到')
      return
    }

    // 检查容器尺寸，如果为0则延迟重试
    const rect = cpuChartDom.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      console.log('容器尺寸为0，延迟初始化CPU图表')
      setTimeout(() => initCpuChartOptimized(), 100)
      return
    }

    try {
      if (cpuChartInstance) {
        cpuChartInstance.dispose()
      }

      // 分步执行：先初始化实例
      cpuChartInstance = echarts.init(cpuChartDom, null, {
        renderer: 'canvas',
        useDirtyRect: true,
        width: 'auto',
        height: 'auto'
      })

      // 然后在下一帧设置配置
      requestAnimationFrame(() => {
        if (!cpuChartInstance) return

        const cpuOption = createCpuChartOption()
        cpuChartInstance.setOption(cpuOption, { notMerge: true })

        // 最后在下一帧调用resize
        requestAnimationFrame(() => {
          if (cpuChartInstance) {
            cpuChartInstance.resize()

            // 设置定时器
            let updateTimer: number | null = null
            const throttledUpdate = () => {
              if (updateTimer) return
              updateTimer = window.setTimeout(() => {
                generateCpuMemoryData(true)
                updateTimer = null
              }, 100)
            }
            intervals.cpuMemory = setInterval(throttledUpdate, CONFIG.UPDATE_INTERVALS.CPU_MEMORY)
          }
        })
      })
    } catch (error) {
      console.error('初始化CPU图表失败:', error)
    }
  }

  // 创建CPU图表配置的函数
  const createCpuChartOption = () => {
    return {
      animation: false,
      color: ['#00ff00', '#ffff00'],
      tooltip: {
        trigger: 'axis',
        confine: true,
        textStyle: {
          color: '#fff',
          fontSize: 10
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#00d4ff',
        formatter: function (params: any) {
          if (!params || !params.length) return ''
          let tooltipContent = params[0].name + '<br />'
          params.forEach(function (item: any) {
            const colorSpan = `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${item.color};"></span>`
            tooltipContent += colorSpan + item.seriesName + ': ' + item.value + '%<br />'
          })
          return tooltipContent
        }
      },
      legend: {
        data: ['内存', 'CPU'],
        textStyle: {
          color: '#fff',
          fontSize: 10
        }
      },
      toolbox: {
        feature: {
          saveAsImage: {
            type: 'png',
            title: '',
            iconStyle: {
              borderColor: 'rgba(0, 212, 255, 0.4)',
              color: 'rgba(0, 212, 255, 0.4)',
              borderWidth: 1
            },
            emphasis: {
              iconStyle: {
                borderColor: 'rgba(0, 212, 255, 0.8)',
                color: 'rgba(0, 212, 255, 0.8)',
                borderWidth: 1
              }
            }
          }
        },
        right: '3px',
        top: '3px',
        iconStyle: {
          borderColor: 'rgba(0, 212, 255, 0.4)',
          color: 'rgba(0, 212, 255, 0.4)',
          borderWidth: 1
        }
      },
      grid: {
        top: '15%',
        left: '3%',
        right: '10%',
        bottom: '5%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timeData.value,
        axisLabel: {
          color: '#00d4ff',
          fontSize: 10,
          formatter: function (value: string) {
            return value ? value.substring(3) : ''
          }
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(0, 212, 255, 0.5)'
          }
        },
        axisTick: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}%',
          color: '#00d4ff',
          fontSize: 10
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(0, 212, 255, 0.2)'
          }
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(0, 212, 255, 0.5)'
          }
        },
        min: 0,
        max: 100
      },
      series: [
        {
          name: '内存',
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: '#00ff00',
            width: 2
          },
          areaStyle: {
            opacity: 0.3,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 255, 0, 0.4)' },
              { offset: 1, color: 'rgba(0, 255, 0, 0)' }
            ])
          },
          data: memoryData.value,
          emphasis: {
            focus: 'series'
          }
        },
        {
          name: 'CPU',
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: '#ffff00',
            width: 2
          },
          areaStyle: {
            opacity: 0.3,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(255, 255, 0, 0.4)' },
              { offset: 1, color: 'rgba(255, 255, 0, 0)' }
            ])
          },
          data: cpuData.value,
          emphasis: {
            focus: 'series'
          }
        }
      ]
    }
  }

  const generateCpuMemoryData = (shouldUpdateChart = true) => {
    const now = new Date()
    const timeStr =
      String(now.getHours()).padStart(2, '0') +
      ':' +
      String(now.getMinutes()).padStart(2, '0') +
      ':' +
      String(now.getSeconds()).padStart(2, '0')

    timeData.value.push(timeStr)
    cpuData.value.push(parseFloat((Math.random() * 30 + 30).toFixed(1)))
    memoryData.value.push(parseFloat((Math.random() * 40 + 40).toFixed(1)))

    if (timeData.value.length > 10) {
      timeData.value.shift()
      cpuData.value.shift()
      memoryData.value.shift()
    }

    if (shouldUpdateChart && cpuChartInstance) {
      const option = {
        xAxis: {
          data: timeData.value
        },
        series: [
          {
            name: '内存',
            data: memoryData.value
          },
          {
            name: 'CPU',
            data: cpuData.value
          }
        ]
      }
      cpuChartInstance.setOption(option)
    }
  }

  const initGaugeCharts = () => {
    const startupGaugeDom = document.getElementById('gauge-startup')
    const onlineGaugeDom = document.getElementById('gauge-online')

    if (startupGaugeDom && onlineGaugeDom) {
      startupGaugeChartInstance = echarts.init(startupGaugeDom)
      onlineGaugeChartInstance = echarts.init(onlineGaugeDom)

      startupGaugeChartInstance.setOption(createGaugeOption(0, '#00d4ff'))
      onlineGaugeChartInstance.setOption(createGaugeOption(0, '#00ff00'))

      // 注意：resize事件监听器在后面统一添加，避免重复
    }
  }

  const updateStorageBar = (percent: number) => {
    const bar = document.getElementById('storage-bar-inner')
    const label = document.getElementById('storage-bar-label')
    if (bar && label) {
      bar.style.width = percent + '%'
      label.textContent = percent + '%'
    }
  }

  const showAlertDrawer = (item: AlertItem) => {
    drawerData.value = item
    drawerVisible.value = true
    drawerRemark.value = item.remark || ''
  }

  const closeAlertDrawer = () => {
    drawerVisible.value = false
    drawerData.value = null
    drawerRemark.value = ''
  }

  const onAlertActionConfirm = (item: AlertItem) => {
    if (!item?.id) return

    const success = alertMockService.updateAlertStatus(
      item.id,
      '已处理',
      '系统管理员',
      drawerRemark.value
    )

    if (success) {
      console.log('确认告警:', item.title)
      refreshAlertList()
      closeAlertDrawer()
    }
  }

  const onAlertActionError = (item: AlertItem) => {
    if (!item?.id) return

    const success = alertMockService.updateAlertStatus(
      item.id,
      '误报',
      '系统管理员',
      drawerRemark.value || '标记为误报'
    )

    if (success) {
      console.log('误报告警:', item.title)
      refreshAlertList()
      closeAlertDrawer()
    }
  }

  const onAlertReset = (item: AlertItem | null) => {
    if (!item?.id) return

    const success = alertMockService.updateAlertStatus(
      item.id,
      '未处理',
      '系统管理员',
      '重置为未处理状态'
    )

    if (success) {
      console.log('重置告警:', item.title)
      refreshAlertList()
      drawerRemark.value = ''
      closeAlertDrawer()
    }
  }

  const refreshAlertList = () => {
    alertList.value = alertMockService.getAlerts()
  }

  const renderOrgTree = () => {
    const rootUl = document.getElementById('org-tree-root')
    const orgStates: Record<string, any> = {}

    function renderTree(nodes: readonly any[], parentUl: HTMLElement) {
      nodes.forEach((node) => {
        const li = document.createElement('li')
        const nodeDiv = document.createElement('div')
        nodeDiv.className = 'node-content parent'
        if (node.status === '禁用') nodeDiv.classList.add('disabled')
        if (selectedOrgId.value === node.org_id) nodeDiv.classList.add('selected')

        if (node.children && node.children.length) {
          const indicator = document.createElement('span')
          indicator.className = 'indicator'
          indicator.textContent =
            orgStates[node.org_id] && orgStates[node.org_id].expanded ? '▼' : '▶'

          const expandHandler = function (e: Event) {
            e.stopPropagation()
            orgStates[node.org_id] = orgStates[node.org_id] || { expanded: false }
            orgStates[node.org_id].expanded = !orgStates[node.org_id].expanded
            updateTree()
          }
          indicator.onclick = expandHandler
          nodeDiv.appendChild(indicator)

          const nameSpan = document.createElement('span')
          nameSpan.textContent = node.name
          nameSpan.style.cursor = 'pointer'
          nameSpan.onclick = expandHandler
          nodeDiv.appendChild(nameSpan)
        } else {
          const nameSpan = document.createElement('span')
          nameSpan.textContent = node.name
          nodeDiv.appendChild(nameSpan)
        }

        nodeDiv.onclick = function (e: Event) {
          e.stopPropagation()
          if (node.status === '禁用') return
          selectedOrgId.value = node.org_id
          updateTree()
        }
        li.appendChild(nodeDiv)

        if (
          node.children &&
          node.children.length &&
          orgStates[node.org_id] &&
          orgStates[node.org_id].expanded
        ) {
          const childUl = document.createElement('ul')
          renderTree(node.children, childUl)
          li.appendChild(childUl)
        }
        parentUl.appendChild(li)
      })
    }

    function updateTree() {
      if (rootUl) {
        rootUl.innerHTML = ''
        renderTree(orgsTree.value, rootUl)
      }
    }

    const initOrgStates = (nodes: readonly any[]) => {
      nodes.forEach((node) => {
        orgStates[node.org_id] = { expanded: false }
        if (node.children && node.children.length) {
          initOrgStates(node.children)
        }
      })
    }

    initOrgStates(orgsTree.value)
    updateTree()
  }

  const handleResize = () => {
    if (cpuChartInstance) cpuChartInstance.resize()
    if (startupGaugeChartInstance) startupGaugeChartInstance.resize()
    if (onlineGaugeChartInstance) onlineGaugeChartInstance.resize()
  }

  onMounted(() => {
    // 添加monitor专用body样式
    document.body.classList.add('monitor-page')

    nextTick(async () => {
      try {
        refreshAlertList()
        await fetchOrgs()

        // 分步骤初始化图表，避免阻塞主线程
        initChartsAsync()

        createPlayers()
        updateTime()
        renderOrgTree()

        intervals.time = setInterval(updateTime, 1000)
        intervals.storage = setInterval(() => {
          const percent = Math.floor(Math.random() * 31) + 40
          updateStorageBar(percent)
        }, CONFIG.UPDATE_INTERVALS.STORAGE)

        stopAlertGeneration = alertMockService.startRandomGeneration(45000)

        let resizeTimer: number | null = null
        const throttledResize = () => {
          if (resizeTimer) return
          resizeTimer = window.setTimeout(() => {
            handleResize()
            checkMobile()
            resizeTimer = null
          }, 100) // 减少延迟时间，提高响应性
        }
        window.addEventListener('resize', throttledResize, { passive: true })

        // 保存引用以便在onUnmounted中移除
        intervals.resizeListener = throttledResize

        checkMobile()

        const alertUpdateInterval = setInterval(() => {
          refreshAlertList()
        }, 60000)

        intervals.alertUpdate = alertUpdateInterval
      } catch (error) {
        console.error('组件初始化失败:', error)
      }
    })
  })

  onUnmounted(() => {
    try {
      // 移除monitor专用body样式
      document.body.classList.remove('monitor-page')

      if (stopAlertGeneration) {
        stopAlertGeneration()
        stopAlertGeneration = null
      }

      Object.values(intervals).forEach((interval) => {
        if (interval) clearInterval(interval)
      })

      try {
        if (cpuChartInstance) {
          cpuChartInstance.dispose()
          cpuChartInstance = null
        }
      } catch (e) {
        console.warn('清理CPU图表失败:', e)
      }

      try {
        if (startupGaugeChartInstance) {
          startupGaugeChartInstance.dispose()
          startupGaugeChartInstance = null
        }
      } catch (e) {
        console.warn('清理启动仪表盘失败:', e)
      }

      try {
        if (onlineGaugeChartInstance) {
          onlineGaugeChartInstance.dispose()
          onlineGaugeChartInstance = null
        }
      } catch (e) {
        console.warn('清理在线仪表盘失败:', e)
      }

      for (const [videoId, player] of playerMap.entries()) {
        if (player?.destroy) {
          try {
            player.destroy()
          } catch (error) {
            console.warn(`清理播放器${videoId}时出错:`, error)
          }
        }
      }
      playerMap.clear()

      // 移除resize事件监听器
      if (intervals.resizeListener) {
        window.removeEventListener('resize', intervals.resizeListener)
      }
    } catch (error) {
      console.error('组件清理失败:', error)
    }
  })
</script>
