# RT-monitor 项目页面更改总记录（2024-06-19）

---

## 流信息页面（src/views/videostream/streaminfo/index.vue）

### 2024-06-19

- **AI助手**：操作列按钮字体样式对齐角色管理页，初始为13px、主色、加粗，hover主色加深并下划线。

  ```scss
  :deep(.el-button--text),
  :deep(.el-button.is-link) {
    font-size: 13px;
    color: var(--main-color);
    font-weight: 500;
    padding: 0 8px;
    min-width: 0;
  }
  :deep(.el-button--text):hover,
  :deep(.el-button.is-link):hover {
    color: var(--el-color-primary-dark-2);
    text-decoration: underline;
  }
  ```

- **用户**：将操作列按钮字体大小由13px调整为14px，去除主色、加粗、hover下划线等样式。

  ```scss
  :deep(.el-button--text),
  :deep(.el-button.is-link) {
    font-size: 14px;
  }
  ```

---

## 警告信息页面（src/views/warning/warninginfo/index.vue）

### 2024-06-19

- **AI助手**：

  - 统一页面背景、卡片、表格等区域为主题变量，支持主题切换。
  - 分页器数字颜色、激活色、hover色全部用主题变量，明暗主题下自动适配。
  - 分页器结构、位置、样式与用户管理页面完全一致，移除手动分页器，全部交由 ArtTable 内部渲染。
  - 搜索区、分页区、卡片、抽屉等所有交互和视觉与系统用户管理页保持一致。

  ```scss
  .warning-page {
    background: var(--art-main-bg-color);
  }
  .art-table-card {
    background: var(--art-root-card-border-color);
  }
  .pager-bar :deep(.el-pager li) {
    background: var(--art-main-bg-color);
    color: var(--art-text-gray-800);
  }
  .pager-bar :deep(.el-pager li.is-active) {
    background: #6c7fff;
    color: #fff;
  }
  .pager-bar :deep(.el-pager li:hover) {
    color: var(--art-primary);
  }
  ```

---

## 用户管理页面（src/views/system/user/index.vue）

### 2024-06-19

- **AI助手**：

  - 作为分页、表格、搜索区、操作列等样式和结构的标准参考，供其他管理页面对齐。
  - 分页器、表格、操作列按钮等样式被流信息、警告信息等页面复用。

  ```vue
  <el-pagination
    v-model:current-page="pagination.currentPage"
    v-model:page-size="pagination.pageSize"
    :page-sizes="[10, 20, 30, 50]"
    :total="pagination.total"
    layout="total, sizes, prev, pager, next, jumper"
    background
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
  />
  ```

---

## 角色管理页面（src/views/system/role/index.vue）

### 2024-06-19

- **AI助手**：

  - 作为表格主体、操作列按钮、字体样式等的标准参考，供流信息等页面对齐。
  - 操作列按钮采用 el-button link，字体13px、主色、加粗，hover主色加深。

  ```vue
  <el-button link @click="showPermissionDialog()"> 菜单权限 </el-button>
  <el-button link @click="showDialog('edit', scope.row)"> 编辑 </el-button>
  <el-button link @click="deleteRole()"> 删除 </el-button>
  ```

---

## 算法信息页面（src/views/algorithm/algoinfo/index.vue）

### 2024-06-27

- 算法信息页面（src/views/algorithm/algoinfo/index.vue）功能与体验优化：
  - 新增/编辑弹窗表单：
    - 创建时间由系统自动生成，表单中不再手动填写。
    - 上传文件项（压缩包）为必填，支持多文件，类型限制为zip/rar/7z，文件名横向展示，长文件名自动省略。
    - 上传文件表单项标签添加红色\*号，风格与其他必填项一致。
    - 上传文件可自动上传（设置:action），也可手动上传（FormData+axios），支持与表单数据一同提交。
    - 文件类型校验、UI自适应弹窗宽度，交互体验优化。
  - 表格展示：
    - 创建时间自动格式化显示。
    - 表格字段、搜索项与mock数据结构保持一致。
  - 代码风格与一致性：
    - 保持与项目其他管理页一致的表单、表格、交互风格。
    - 重要变更均有详细注释，便于维护。

---

## 架构与数据同步说明（2024-06-19）

- **前后端分离架构**：所有组织、视频流、用户等核心数据均通过 HTTP 或 WebSocket 请求后端接口，后端统一存储于数据库。
- **页面间无需通信**：主项目与 monitor.html 等页面均直接请求后端，数据的唯一真实来源为后端数据库，无需前端页面间（如 Pinia、localStorage、BroadcastChannel）通信或共享。
- **实时性保障**：
  - 低频数据（如组织结构）可用 HTTP 轮询或页面加载时拉取。
  - 高实时性场景（如告警、设备状态）推荐用 WebSocket 或 SSE，由后端主动推送变动，前端收到后自动刷新。
- **典型流程**：
  1. 页面加载或定时请求/订阅后端接口。
  2. 后端统一读写数据库，变动时通过 WebSocket 广播。
  3. 所有页面收到推送后自动刷新，无需页面间直接通信。
- **结论**：只要所有数据都走后端接口/数据库，前端页面间无需通信或共享数据，实时性由后端推送或轮询保障。

---

## 系统资源监控数据获取说明（2024-06-19）

- **前端局限**：浏览器前端无法直接获取服务器真实的内存、CPU、存储等硬件信息，只能通过后端接口获取。
- **推荐方案**：
  1. 后端用 Node.js（systeminformation）、Python（psutil）等采集系统资源，定时或实时获取内存、CPU、磁盘等数据。
  2. 后端提供如 `/api/system/status` 的接口，返回上述数据。
  3. 前端用 fetch/axios 定时请求该接口，拿到真实数据后渲染到页面（如 ECharts、进度条等）。
- **实时性**：
  - 低频数据可用 HTTP 轮询。
  - 高实时性场景推荐用 WebSocket/SSE，由后端主动推送。
- **典型流程**：
  1. 页面定时请求/订阅后端接口。
  2. 后端采集并返回最新系统资源数据。
  3. 前端收到后自动刷新展示。
- **结论**：前端只能通过后端API获取真实系统资源数据，不能直接访问服务器硬件信息。

### 后端接口设计建议

- **接口路径**：`GET /api/system/status`
- **请求方式**：HTTP GET
- **返回字段**：
  - `totalMem`：总内存（字节）
  - `freeMem`：可用内存（字节）
  - `usedMem`：已用内存（字节）
  - `cpuUsage`：CPU 当前使用率（百分比，0-100）
  - `diskTotal`：总磁盘空间（字节）
  - `diskUsed`：已用磁盘空间（字节）
  - `diskFree`：可用磁盘空间（字节）
  - 可根据实际需求扩展（如每核CPU、多个磁盘等）

**示例返回值：**

```json
{
  "totalMem": 17179869184,
  "freeMem": 8589934592,
  "usedMem": 8589934592,
  "cpuUsage": 23.5,
  "diskTotal": 500107862016,
  "diskUsed": 200000000000,
  "diskFree": 300107862016
}
```

- **接口调用频率建议**：
  - 内存/CPU：建议每3-5秒请求一次即可，避免高频请求造成服务器压力。
  - 存储空间：可适当降低频率（如30秒~1分钟）。

---

## ZLMediaKit+Python流媒体播放最佳实践（2024-06-19）

- **ZLMediaKit协议支持**：支持RTSP、RTMP、HLS（.m3u8）、HTTP/WS-FLV、fMP4（H5直播）等多种协议，适合多终端接入。
- **前端播放推荐方案**：
  1. **HLS（推荐，兼容性好）**：ZLMediaKit自动转码，前端用 hls.js 播放（Chrome/Edge），Safari可原生播放。
     ```html
     <video id="video" controls autoplay></video>
     <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
     <script>
       if (Hls.isSupported()) {
         var hls = new Hls()
         hls.loadSource('http://your-zlmediakit-ip:8080/live/stream.m3u8')
         hls.attachMedia(document.getElementById('video'))
       } else {
         document.getElementById('video').src = 'http://your-zlmediakit-ip:8080/live/stream.m3u8'
       }
     </script>
     ```
  2. **fMP4（低延迟直播）**：ZLMediaKit支持HTTP/WS fMP4，前端用 mpegts.js 播放。
     ```html
     <video id="video" controls autoplay></video>
     <script src="https://cdn.jsdelivr.net/npm/mpegts.js@latest"></script>
     <script>
       if (mpegts.getFeatureList().mseLivePlayback) {
         var player = mpegts.createPlayer({
           type: 'fmp4',
           url: 'http://your-zlmediakit-ip:8080/live/stream.live.mp4'
         })
         player.attachMediaElement(document.getElementById('video'))
         player.load()
         player.play()
       }
     </script>
     ```
- **Python后端作用**：负责业务接口、流地址分发、鉴权等，ZLMediaKit专注流媒体服务。
- **流地址示例**：
  - HLS: `http://your-zlmediakit-ip:8080/live/stream.m3u8`
  - fMP4: `http://your-zlmediakit-ip:8080/live/stream.live.mp4`
  - RTSP: `rtsp://your-zlmediakit-ip/live/stream`
  - HTTP-FLV: `http://your-zlmediakit-ip:8080/live/stream.live.flv`
  - WebSocket-FLV: `ws://your-zlmediakit-ip:8080/live/stream.live.flv`
- **总结**：ZLMediaKit已为前端协议转换做好准备，推荐用HLS（hls.js）或fMP4（mpegts.js）播放，Python负责流地址分发和业务逻辑。

---

## EasyPlayer播放ZLMediaKit流的适用性与优势（2024-06-19）

- **EasyPlayer支持协议广泛**：可直接播放RTSP、HLS、fMP4、FLV等，适配ZLMediaKit所有主流输出协议。
- **与原生video/hls.js/mpgts.js区别**：
  - EasyPlayer可直接播放RTSP（通过WebSocket转码），原生video/hls.js/mpgts.js不支持。
  - EasyPlayer适合多路流、低延迟、安防监控等专业场景。
  - 原生video/hls.js/mpgts.js更适合普通网页直播/点播，协议有限。
- **适用场景**：
  - 多路监控、安防、RTSP流、低延迟直播，优先推荐EasyPlayer。
  - 普通直播/点播可用hls.js/mpgts.js/原生video。
- **用法示例**：
  ```html
  <div id="easyplayer-container"></div>
  <script src="https://cdn.jsdelivr.net/npm/easyplayer/dist/easyplayer.min.js"></script>
  <script>
    new EasyPlayerPro(document.getElementById('easyplayer-container'), {
      url: 'ws://your-zlmediakit-ip:8080/live/stream.live.flv',
      hasAudio: true,
      autoplay: true
    })
  </script>
  ```
- **总结**：EasyPlayer更适合专业流媒体和安防监控场景，兼容性和协议支持优于原生video/hls.js/mpgts.js。

---

## 前端打包与Python+ZLMediaKit本地一体化部署方案（2024-06-19）

- **前端打包**：`npm run build`，生成 `dist/` 目录（静态资源）。
- **Python后端托管静态资源**：将 `dist/` 拷贝到 Python 项目目录下，Flask 示例：
  ```python
  from flask import Flask, send_from_directory
  app = Flask(__name__, static_folder='dist', static_url_path='/')
  @app.route('/')
  def index():
      return send_from_directory(app.static_folder, 'index.html')
  # 其它API路由...
  if __name__ == '__main__':
      app.run(host='0.0.0.0', port=5000)
  ```
- **ZLMediaKit独立运行**：负责流媒体服务，前端通过API获取流地址，直接访问ZLMediaKit端口（如8080、554等）。
- **本地部署流程**：
  1. 启动ZLMediaKit
  2. 启动Python后端
  3. 前端打包并拷贝到后端static目录
  4. 浏览器访问 `http://localhost:5000/`，即可访问前端、API和流媒体服务
- **注意事项**：
  - 跨域问题：如端口不同需处理CORS或用nginx反向代理
  - 配置流地址：前端需配置正确的ZLMediaKit流媒体地址
  - 端口冲突：确保各服务端口不冲突
- **总结**：推荐用Python后端托管前端静态资源，API、前端、流媒体一体化本地部署，简单高效。

---

## 本地部署时前后端合并部署与分开部署对比与推荐（2024-06-19）

- **合并部署（推荐）**：前端静态资源由后端服务（如Flask/FastAPI/Django）托管，API和页面同源同端口。
  - 优点：部署简单、无跨域、配置少、本地体验好，便于一键访问和演示。
  - 缺点：前端升级需重启后端，灵活性略低（但本地影响小）。
- **分开部署**：前端用nginx/http-server等单独托管，后端单独启动。
  - 优点：前后端独立开发、重启互不影响，贴近微服务架构。
  - 缺点：有跨域、端口多、部署步骤多，本地体验略繁琐。
- **本地部署推荐**：优先合并部署，简单高效，维护成本低。分开部署仅在有特殊需求时采用。

---

## 一键启动流媒体服务、后端和前端的方案（2024-06-19）

- **Windows批处理（.bat）**：
  ```bat
  @echo off
  REM 启动 ZLMediaKit
  start "" "ZLMediaKit\Release\Win64\ZLMediaKit.exe"
  REM 启动 Python 后端
  cd backend
  start "" python app.py
  cd ..
  REM 打开前端页面（假设由后端托管，访问 http://localhost:5000/）
  start http://localhost:5000/
  ```
- **Linux/Mac shell脚本（.sh）**：
  ```sh
  #!/bin/bash
  nohup ./ZLMediaKit/release/linux/ZLMediaKit > zlm.log 2>&1 &
  cd backend
  nohup python3 app.py > backend.log 2>&1 &
  cd ..
  xdg-open http://localhost:5000/
  ```
- **Python脚本一键启动**：
  ```python
  import subprocess, webbrowser, os
  zlm_path = os.path.abspath('ZLMediaKit/Release/Win64/ZLMediaKit.exe')
  subprocess.Popen([zlm_path])
  backend_path = os.path.abspath('backend')
  subprocess.Popen(['python', 'app.py'], cwd=backend_path)
  webbrowser.open('http://localhost:5000/')
  ```
- **建议**：确保依赖已安装、端口不冲突，日志可用 nohup 或 start 输出，便于调试。

---

## 边缘盒子批量部署推荐Docker方式（2024-06-19）

- **Docker部署优势**：环境一致、跨平台、易批量分发和升级、隔离性好、便于自动化运维。
- **传统本地部署劣势**：环境易出错、升级麻烦、兼容性差，维护成本高。
- **边缘场景推荐**：强烈建议用Docker部署，只需装好Docker，所有服务用镜像分发和启动，升级回滚极其方便。
- **典型流程**：
  1. 编写Dockerfile，打包所有依赖和服务。
  2. 构建镜像，推送到仓库。
  3. 盒子上拉取镜像并运行，升级只需拉新镜像重启。
- **docker-compose一键编排**：推荐用docker-compose.yml一键启动ZLMediaKit、后端、前端等多个服务，端口和网络自动管理。
- **总结**：边缘盒子批量部署，Docker是最方便、最可靠的方式，建议提前准备Dockerfile和docker-compose。

---

## 离线环境通过导入升级包升级服务的流程（2024-06-19）

- **升级包形式**：
  - Docker镜像包（推荐）：用docker save导出新镜像为tar文件，离线用docker load导入。
  - 压缩包（zip/tar.gz）：包含前端静态资源、后端代码、依赖包等，解压覆盖旧文件。
  - 数据库迁移脚本：如有表结构/数据变更，随升级包附带SQL或迁移脚本。
- **典型升级步骤（以Docker为例）**：
  1. 有网环境构建新镜像，docker save导出tar包，准备迁移脚本和升级说明。
  2. 拷贝升级包到离线环境。
  3. docker load导入新镜像。
  4. 停止旧服务（docker-compose down等）。
  5. 执行数据库迁移脚本（如有）。
  6. 启动新服务（docker-compose up -d等）。
  7. 验证服务正常。
- **非Docker方式**：解压新包覆盖旧文件，重启服务，安装新依赖。
- **升级包内容建议**：新版镜像/压缩包、数据库迁移脚本、升级说明文档、一键升级脚本。
- **回滚方案**：升级前备份旧镜像/代码/数据库，升级失败时恢复。
- **总结**：推荐用Docker镜像包升级，流程为"导入新镜像→停旧服务→数据迁移→启新服务→验证"，安全高效，易于批量和回滚。

---

## 非Docker环境下通过页面上传升级压缩包的升级方案（2024-06-19）

- **升级流程**：
  1. 升级页面上传升级包（zip/tar.gz），后端接收并保存到临时目录。
  2. 后端自动解压升级包到目标目录（如backend/、dist/等），覆盖同名文件。
  3. 升级前自动备份旧文件/目录，升级失败可回滚。
  4. 如有数据库变更，升级包中应包含迁移脚本，自动执行。
  5. 升级后自动重启相关服务（如Python后端、nginx等），前端页面可自动刷新或提示用户重启。
- **注意事项**：
  - 升级包中不要包含用户自定义配置、数据库等，避免被覆盖。
  - 升级脚本应排除敏感/数据文件，确保安全。
  - 可用supervisor、pm2、systemd等管理后端服务，便于自动重启。
- **升级包内容建议**：dist/、backend/、数据库迁移脚本、升级说明、manifest等。
- **总结**：非Docker环境下，升级包上传后即"解压覆盖+重启服务"，升级前自动备份，升级包中如有数据库迁移脚本应自动执行，便于安全升级和回滚。

---

## 远程隧道（端口转发）实现方案（2024-06-19）

- **原理**：通过SSH远程端口转发（remote forwarding），将本地服务端口映射到远程服务器端口，实现内网穿透和远程访问。
- **典型命令**：
  ```bash
  ssh -N -R <远程端口>:localhost:<本地端口> <用户名>@<远程IP> -p <ssh端口>
  # 示例：
  ssh -N -R 10881:localhost:9092 root@120.48.133.15 -p 22
  ```
- **批量转发**：可一次性转发多个端口，适合流媒体、Web、API等多服务场景。
- **页面实现**：前端收集远程IP、用户名、密码、ssh端口、本地/远程端口等参数，后端用SSH命令（如paramiko/sshpass/plink）发起隧道。
- **注意事项**：远程服务器需允许端口转发（GatewayPorts yes），防火墙放行，建议用密钥认证。
- **其它工具**：如需长期、批量穿透，推荐frp、ngrok、zerotier等专业工具。
- **总结**：远程隧道本质是SSH远程端口转发，适合本地服务远程暴露和内网穿透，页面参数配置+后端自动发起隧道。

---

> 本文件用于汇总记录 2024-06-19 各页面所有结构和样式更改，便于团队全局查阅和同步修改习惯。
