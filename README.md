# 外服法务通 LawLink · 前后端一体部署包

> 「瞬时风控，专家直达」——AI + 专家双驱的劳动法务服务原型。
> 本包为可直接部署的完整交付物：**官网落地页 + 在线演示后台 + 零依赖 Node 后端**，无需联网、无需安装任何 npm 依赖。

## 一、包内结构

```
lawlink/
├── server.js        后端：零依赖 Node 静态服务器（静态托管 + gzip + 健康检查 API）
├── package.json     npm 元信息（npm start 即启动）
├── start.bat        Windows 一键启动脚本
├── Dockerfile       Docker 镜像构建文件（含 HEALTHCHECK）
├── README.md        本说明
└── dist/            前端生产构建（Tailwind 已本地编译，无 CDN 依赖）
    ├── index.html   官网落地页（首屏 + 六大能力滚动叙事 + 数据亮点 + 里程碑）
    ├── demo.html    在线演示后台（7 大功能模块完整交互，落地页 CTA 进入）
    ├── css/
    │   ├── tailwind.css   编译后的 Tailwind（压缩版）
    │   └── style.css      自定义样式（动效 / 聊天 / 时间轴 / 打印 / 落地页）
    └── js/
        ├── data.js        ① DATA   演示数据配置（城市库 / 法规专题 / 类案 / 专家库）
        ├── landing.js     ② 落地页渲染与交互（mini demo + 滚动动画）
        ├── render.js      ③ 后台 RENDER 渲染函数
        └── app.js         ④ 后台 EVENTS 交互逻辑 + 移动端抽屉导航
```

## 二、快速启动（三种方式任选）

### 方式 1：直接运行（要求本机已装 Node.js ≥ 14）

```bash
node server.js          # 默认 0.0.0.0:8080
# 或指定端口：
PORT=3000 node server.js
```

Windows 用户可双击 `start.bat`。

### 方式 2：npm 启动

```bash
npm start
```

### 方式 3：Docker（推荐生产环境）

```bash
docker build -t lawlink-app .
docker run -d -p 8080:8080 --name lawlink lawlink-app
```

## 三、启动后验证

| 地址 | 说明 |
| --- | --- |
| `http://localhost:8080/` | 官网落地页（桌面 + 移动端自适应） |
| `http://localhost:8080/demo.html` | 在线演示后台（7 大功能模块完整交互） |
| `http://localhost:8080/api/health` | 健康检查：`{"ok":true,"uptime":"12s",...}` |
| `http://localhost:8080/api/meta` | 服务元信息（名称 / 版本 / Node 版本） |

## 四、后端能力说明

- **静态托管**：`dist/` 全部资源，自动识别 MIME 类型；HTML `no-cache`、静态资源缓存 1 天，保证发版即生效
- **gzip 压缩**：HTML / CSS / JS / JSON / SVG 自动压缩（约 260KB → 传输 < 90KB）
- **安全**：路径归一化防目录穿越；`X-Content-Type-Options: nosniff`
- **SPA 兼容**：未知路径自动回退 `index.html`
- **零依赖**：仅使用 Node 内置模块（http / fs / path / zlib），无需 `npm install`

## 五、端口与环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `8080` | 监听端口 |
| `HOST` | `0.0.0.0` | 监听地址（容器 / 生产保持默认；本机调试可设 `127.0.0.1`） |

## 六、二次开发

- 前端源文件与构建工具不在本包内（见开发工作区）：
  修改 `index.html`（落地页）/ `demo.html`（后台）/ `js/*.js` 后，重新编译 Tailwind 并重建 `dist/`
  （开发工作区 `_build_tools/` 内：`npm install && npm run build:css && python make_dist.py`）
- 接入真实后端：`js/data.js` 中所有演示数据（法规专题、类案、专家、聊天应答）均为结构化配置，
  按相同字段结构返回 JSON 即可无缝替换为接口数据，落地页与后台渲染层均无需改动

## 七、注意事项

- 本项目为**交互原型**：法规、类案、胜诉率等均为演示数据，不代表真实法律意见
- 报告页「导出 / 打印 PDF」使用浏览器打印功能（`window.print()`），已内置打印样式
- 建议生产部署置于 HTTPS 反向代理（nginx / 网关）之后
