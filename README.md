# EdgeTrendHub - 边缘热榜聚合平台

> 一站式掌握全网热点，基于阿里云 ESA 边缘计算构建的实时热榜聚合应用

![EdgeTrendHub Banner](screenshots/banner.png)

## 本项目由[阿里云ESA](https://www.aliyun.com/product/esa)提供加速、计算和保护

![阿里云ESA](https://img.alicdn.com/imgextra/i3/O1CN01H1UU3i1Cti9lYtFrs_!!6000000000139-2-tps-7534-844.png)

---

## 项目简介

**EdgeTrendHub** 是一款基于阿里云 ESA Pages 边缘计算平台开发的实时热榜资讯聚合 Web 应用。通过边缘函数聚合微博、知乎、B站、抖音、百度等 10+ 主流平台的热榜数据，配合通义千问 AI 生成智能摘要，让用户一站式掌握全网热点。

### 核心特色

- **多源聚合**：微博、知乎、B站、抖音、百度、头条、豆瓣、掘金、GitHub、V2EX 等热榜一网打尽
- **AI 智能摘要**：集成通义千问 API，一键生成热点摘要，快速了解新闻要点
- **边缘加速**：KV 缓存 + 边缘函数，全球节点就近响应，毫秒级加载
- **智能去重**：基于标题相似度算法，自动折叠重复热点
- **Mobile First**：手机端卡片流式布局，完美适配移动端

---

## 功能特性

### 已实现功能

| 功能 | 说明 |
|------|------|
| 多平台热榜聚合 | 支持 10+ 主流平台热榜数据 |
| 频道订阅管理 | 自定义订阅感兴趣的平台 |
| AI 智能摘要 | 通义千问一键生成热点摘要 |
| 千问 API Key 配置 | 设置页面配置个人 API Key |
| 标题相似度去重 | 自动折叠重复热点 |
| 收藏/稍后读 | 本地存储感兴趣的内容 |
| 关键词屏蔽 | 过滤不想看的内容 |
| 搜索功能 | 在热榜中搜索关键词 |
| 夜间模式 | 暗色主题，护眼设计 |
| PWA 支持 | 可添加到主屏幕 |
| 字号调节 | 适老化设计 |

---

## How We Use Edge

### 边缘函数应用场景

EdgeTrendHub 充分利用了阿里云 ESA 的边缘计算能力，以下是边缘函数在项目中的核心应用：

| 边缘函数 | 功能 | 边缘优势 |
|---------|------|---------|
| `/api/trends` | 热榜数据聚合 | 边缘节点就近抓取各平台 API，减少跨境延迟 |
| `/api/summary` | AI 摘要生成 | 安全代理千问 API 调用，隐藏用户 API Key |
| `/api/settings` | 用户设置存储 | KV 存储用户偏好，全球边缘节点就近读写 |
| `/api/search` | 热榜搜索 | 在边缘缓存中实时搜索，无需回源 |

### 边缘缓存策略

```
用户请求 → 边缘缓存检查(5min TTL) → KV 存储 → 源站 API
                    ↓
              命中返回(X-Cache: HIT)
              响应时间 < 50ms
```

### 技术架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        用户设备                              │
│                   (Mobile / Desktop)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   阿里云 ESA 边缘节点                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ 静态资源CDN  │  │  边缘函数   │  │  Edge KV   │         │
│  │  (React)    │  │ (Node.js)  │  │  (缓存)    │         │
│  └─────────────┘  └──────┬──────┘  └─────────────┘         │
└──────────────────────────┼──────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ DailyHot │ │ 通义千问  │ │ 其他API  │
        │   API    │ │   API    │ │          │
        └──────────┘ └──────────┘ └──────────┘
```

### 边缘计算的不可替代性

1. **低延迟响应**：热榜数据在边缘节点缓存，用户请求无需回源，响应时间 < 50ms
2. **API Key 安全**：用户的千问 API Key 存储在边缘 KV 中，前端代码无法获取
3. **智能去重**：在边缘节点完成标题相似度计算，减少传输数据量
4. **全球加速**：静态资源通过 ESA CDN 分发，全球用户都能快速访问

---

## 千问 API Key 配置

### 获取 API Key

1. 访问 [阿里云百炼控制台](https://dashscope.console.aliyun.com/)
2. 开通通义千问服务
3. 创建 API Key

### 在应用中配置

1. 打开 EdgeTrendHub 应用
2. 点击底部导航栏「设置」
3. 在「千问 API Key」区域输入您的 API Key
4. 点击「保存」按钮

配置完成后，即可在热榜卡片上点击「AI 摘要」生成智能摘要。

> **安全说明**：API Key 通过边缘函数加密存储在 Edge KV 中，不会暴露在前端代码中。

---

## 技术栈

### 前端

- **框架**：React 18 + Vite 5
- **状态管理**：Zustand
- **样式**：TailwindCSS
- **图标**：Lucide React
- **图表**：Recharts
- **路由**：React Router DOM

### 边缘计算

- **平台**：阿里云 ESA Pages
- **运行时**：Edge Functions (Node.js 18)
- **存储**：Edge KV
- **缓存**：ESA Cache API

### 数据源

- **热榜 API**：[DailyHotApi](https://github.com/imsyy/DailyHotApi) - 开源热榜聚合 API
- **AI 服务**：通义千问 Qwen-turbo

---

## 本地开发

### 环境要求

- Node.js >= 18.0.0
- npm 或 pnpm

### 安装依赖

```bash
cd frontend
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

---

## 部署指南

### ESA Pages 部署

1. 将代码推送到 GitHub 仓库
2. 登录 [阿里云 ESA 控制台](https://esa.console.aliyun.com/)
3. 创建 Pages 应用，选择「导入 Git 仓库」
4. 配置构建参数：
   - **安装命令**：`cd frontend && npm install`
   - **构建命令**：`cd frontend && npm run build`
   - **静态资源目录**：`frontend/dist`
   - **函数文件路径**：`functions`
   - **Node.js 版本**：22.x
5. 添加 KV 命名空间（可选）：
   - `TREND_KV`：热榜缓存
   - `USER_KV`：用户设置
6. 点击部署

### 环境变量（可选）

| 变量名 | 说明 |
|--------|------|
| `QWEN_API_KEY` | 默认千问 API Key（用户未配置时使用） |

---

## 项目结构

```
24_EdgeTrendHub_热榜聚合/
├── frontend/                    # 前端代码
│   ├── src/
│   │   ├── components/         # React 组件
│   │   ├── pages/              # 页面组件
│   │   ├── store/              # 状态管理
│   │   ├── utils/              # 工具函数
│   │   ├── App.jsx             # 应用入口
│   │   └── index.css           # 全局样式
│   ├── public/                 # 静态资源
│   └── package.json
├── functions/                   # 边缘函数
│   ├── trends.js               # 热榜聚合
│   ├── summary.js              # AI 摘要
│   ├── settings.js             # 用户设置
│   ├── search.js               # 搜索
│   └── health.js               # 健康检查
├── screenshots/                 # 截图
├── esa.jsonc                   # ESA 配置
└── README.md
```

---

## 截图展示

### 移动端

| 首页热榜 | AI 摘要 | 设置页面 |
|---------|--------|---------|
| ![首页](screenshots/mobile-home.png) | ![摘要](screenshots/mobile-summary.png) | ![设置](screenshots/mobile-settings.png) |

### 桌面端

![桌面端](screenshots/desktop.png)

---

## 致谢

- [DailyHotApi](https://github.com/imsyy/DailyHotApi) - 提供热榜数据聚合 API
- [阿里云 ESA](https://www.aliyun.com/product/esa) - 提供边缘计算平台
- [通义千问](https://dashscope.console.aliyun.com/) - 提供 AI 摘要能力

---

## License

MIT License

---

## 作者

EdgeTrendHub Team

**本项目由[阿里云ESA](https://www.aliyun.com/product/esa)提供加速、计算和保护**
