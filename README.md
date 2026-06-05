# UCAS 地球 — Cesium 三维地球学习系统

基于 **Cesium** 构建的三维地球可视化学习平台，集成校园建筑展示、火星探索、城市漫游三大功能模块。采用 **Vue 3 + TypeScript + Vite** 前端架构，搭配 **Express + PostgreSQL** 后端服务，支持 GeoJSON 数据管理、课程调度和多底图切换。

---

## 目录

- [功能模块](#功能模块)
  - [首页](#首页)
  - [校园展示](#校园展示)
  - [火星探索](#火星探索)
  - [城市漫游](#城市漫游)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [可用命令](#可用命令)
- [后端服务](#后端服务)
- [数据说明](#数据说明)
- [配置说明](#配置说明)
- [开发约定](#开发约定)

---

## 功能模块

### 首页

欢迎页面，展示 Cesium 三维地球默认视图（以安徽阜阳为中心），提供功能模块导航入口。

- 左侧可折叠导航菜单
- 支持多种底图切换（OpenStreetMap、ArcGIS、Carto Light、Google 卫星）

### 校园展示

面向阜阳师范大学校园的三维可视化系统，是本项目最核心的模块。

- **3D 建筑渲染**：加载 GeoJSON 建筑数据，根据 `Height` 属性自动拉伸为三维建筑体块
- **建筑信息查询**：点击建筑弹出详情面板，展示名称、用途、楼层、容量、所属学院、联系方式等
- **建筑类型分类**：按教学楼、宿舍、生活服务、行政办公、体育场馆、其他六大类着色区分
- **课程管理**：支持课程的增删改查，按教学楼筛选课程，点击建筑气泡查看关联课程
- **课程导入**：支持通过 Excel 文件批量导入课程数据
- **GeoJSON 图层管理**：支持从本地文件或 PostgreSQL 数据库加载 GeoJSON 图层，含分组管理
- **属性悬浮提示**：鼠标悬停建筑时显示属性 tooltip
- **属性编辑面板**：支持在线编辑 GeoJSON 要素属性
- **属性表格**：以表格形式展示当前选中图层的所有要素属性

### 火星探索

基于 Cesium Ion 火星地形数据的火星表面探索系统。

- **火星地形**：加载 Cesium Ion 火星高程模型（Asset ID: 3644333）
- **大气效果**：模拟火星大气的米氏散射和瑞利散射，支持后处理泛光效果
- **火星车路线**：展示好奇号（Curiosity）、毅力号（Perseverance）等探测车的行驶轨迹
- **火星地标**：15 个火星著名地标（奥林帕斯山、水手号峡谷、盖尔撞击坑等），含中文名称和介绍
- **飞行面板**：支持一键飞往火星车或地标位置，自动旋转展示
- **《火星救援》路线**：还原电影中的经典路线（The Martian Journey）

### 城市漫游

基于全球城市搜索的城市飞行漫游系统。

- **城市搜索**：通过 Nominatim（OpenStreetMap）地理编码搜索全球任意城市
- **热门城市**：内置国内热门城市列表，一键飞往目标城市
- **Google 3D Tiles**：支持切换 Google Photorealistic 3D Tiles（Cesium Ion Asset ID: 2275207）
- **暗色/亮色主题**：支持主题切换

---

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Vue 3（Composition API + `<script setup>`） | ^3.5.25 |
| 构建工具 | Vite | ^7.3.1 |
| 3D 引擎 | Cesium | ^1.141.0 |
| 类型检查 | TypeScript + vue-tsc | ~5.9.3 |
| UI 组件库 | Element Plus（按需导入） | ^2.14.0 |
| 路由 | Vue Router | ^5.1.0 |
| 地理空间计算 | Turf.js | ^7.3.5 |
| Excel 处理 | SheetJS (xlsx) | ^0.18.5 |
| 后端框架 | Express | ^4.22.2 |
| 数据库 | PostgreSQL (pg) | ^8.16.0 |

---

## 项目结构

```
ucas_earth/
├── index.html                    # 入口 HTML
├── package.json                  # 项目配置与依赖
├── vite.config.ts                # Vite 配置（Cesium 插件、Element Plus 按需导入、API 代理）
├── data/                         # 示例 GeoJSON 数据
│   ├── FUYANG_Building.geojson   #   阜阳市建筑数据（~62MB）
│   ├── fynu_xihu_campus.geojson  #   阜阳师范大学西湖校区建筑数据
│   └── planet_*.osm.geojson      #   OSM 导出区域数据
├── server/                       # Express 后端服务
│   ├── index.ts                  #   服务入口（端口 9999）
│   ├── db.ts                     #   PostgreSQL 连接池
│   ├── db/
│   │   └── courses.sql           #   课程表 DDL
│   ├── routes/
│   │   ├── courses.ts            #   课程 CRUD API
│   │   └── layers.ts             #   GeoJSON 图层 CRUD API
│   └── utils/
│       └── grouping.ts           #   图层分组工具
├── public/
│   └── data/mars/                # 火星静态数据
│       ├── Mars.czml             #   火星车路线 CZML
│       ├── MarsPointsOfInterest.geojson
│       └── models/               #   3D 模型文件
└── src/
    ├── app/                      # 应用入口
    │   ├── main.ts               #   Vue 应用初始化
    │   ├── App.vue               #   根组件（导航 + 路由视图）
    │   ├── style.css             #   全局样式与 CSS 变量
    │   ├── components/
    │   │   ├── CesiumViewer.vue  #   通用 Cesium 地球组件
    │   │   └── Menu.vue          #   左侧导航菜单
    │   ├── router/
    │   │   └── index.ts          #   路由配置（/ /campus /mars /city）
    │   └── views/
    │       └── HomeView.vue      #   首页视图
    ├── campus/                   # 🏫 校园展示模块
    │   ├── CampusView.vue        #   主视图
    │   ├── components/           #   组件（建筑弹窗、课程面板、图层管理等）
    │   ├── api/                  #   API 调用（courses, geojson-db）
    │   ├── composables/          #   组合式函数
    │   ├── data/                 #   建筑元数据与类型映射
    │   ├── types/                #   类型定义（courses, geojson-db）
    │   └── utils/                #   工具函数（周次计算等）
    ├── mars/                     # 🔴 火星探索模块
    │   ├── MarsView.vue          #   主视图
    │   ├── components/           #   组件（Header、飞行面板、主题切换）
    │   ├── composables/          #   组合式函数（useTheme）
    │   ├── data/                 #   火星常量配置
    │   └── types/                #   类型定义
    ├── city/                     # 🌆 城市漫游模块
    │   ├── CityRoamingView.vue   #   主视图
    │   ├── components/           #   组件（城市面板、Header、主题切换）
    │   ├── composables/          #   组合式函数
    │   ├── data/                 #   热门城市数据
    │   └── types/                #   类型定义（HotCity）
    └── shared/                   # 🔗 共享模块
        ├── cdk/                  #   通用 CDK
        ├── components/           #   共享组件
        └── types/                #   共享类型（BuildingType 等）
```

---

## 环境要求

- **Node.js** >= 18
- **npm** >= 9
- **PostgreSQL** >= 14（课程管理与 GeoJSON 图层持久化功能需要）
- **Cesium Ion 账号**（部分功能依赖 Cesium Ion 资产，如火星地形、Google 3D Tiles）

---

## 快速开始

### 1. 安装依赖

```bash
cd ucas_earth
npm install
```

### 2. 配置 Cesium Ion Token（必须）

**⚠️ 重要：Cesium Ion Token 是本项目的核心配置，没有 Token 将无法加载 3D 地球、地形和建筑数据。**

1. 访问 [Cesium Ion 官网](https://cesium.com/ion/tokens) 注册并登录账号
2. 在 Dashboard 中创建一个新的 Access Token（选择 "Default" 类型）
3. 在项目根目录创建 `.env` 文件，添加以下内容：

```env
VITE_CESIUM_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_token_here
```

> 💡 **提示**：Token 格式为 `eyJ...` 开头的 JWT 字符串，确保不要有空格或换行。

4. 重启开发服务器使配置生效：

```bash
npm run dev
```

**没有 Token 的影响：**
- 火星探索模块：无法加载火星地形
- 城市漫游模块：无法加载 Google 3D Tiles
- 空间分析模块：无法加载地形数据，影响可视域分析精度

**Token 获取步骤截图说明：**
1. 登录 Cesium Ion → 进入 Dashboard
2. 点击 "Create Token" 按钮
3. 选择 Token 类型为 "Default"（免费）
4. 复制生成的 Token
5. 粘贴到 `.env` 文件中

### 3. 配置数据库（可选）

如果需要使用课程管理的后端功能，创建 `.env` 文件中添加数据库连接信息：

```env
# PostgreSQL 连接串
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fynu_campus

# 后端端口
PORT=9999
```

然后初始化数据库：

```bash
psql -U postgres -d fynu_campus -f server/db/courses.sql
```

### 3. 启动开发服务器

```bash
# 前端开发服务器（默认 http://localhost:5173）
npm run dev

# 后端 API 服务器（默认 http://localhost:9999），按需启动
npm run server
```

### 4. 构建生产版本

```bash
npm run build
npm run preview
```

---

## 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 前端开发服务器 |
| `npm run build` | TypeScript 类型检查 + 生产构建 |
| `npm run preview` | 预览生产构建产物 |
| `npm run server` | 启动 Express 后端 API 服务 |

---

## 后端服务

后端提供两个 RESTful API 模块，运行在 `http://localhost:9999`，前端通过 Vite 代理（`/api`）访问。

### 课程管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/courses` | 获取所有课程（支持 `weekday`、`buildingName` 查询参数） |
| GET | `/api/courses/today` | 获取今日课程 |
| GET | `/api/courses/week/:weekNumber` | 获取指定周次课程 |
| GET | `/api/courses/building/:buildingName` | 获取指定建筑的课程 |
| POST | `/api/courses` | 新增课程 |
| PUT | `/api/courses/:id` | 更新课程 |
| DELETE | `/api/courses/:id` | 删除课程 |
| POST | `/api/courses/import` | 批量导入课程 |

### GeoJSON 图层 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/geojson-layers` | 获取所有图层元数据 |
| GET | `/api/geojson-layers/:id` | 获取单个图层（含完整 GeoJSON） |
| POST | `/api/geojson-layers` | 创建新图层（自动分组） |
| PUT | `/api/geojson-layers/:id` | 更新图层 |
| DELETE | `/api/geojson-layers/:id` | 删除图层 |

---

## 数据说明

### 示例 GeoJSON 文件

| 文件 | 说明 | 特点 |
|------|------|------|
| `FUYANG_Building.geojson` | 阜阳市城市建筑 | 约 62MB，大规模建筑底面 |
| `fynu_xihu_campus.geojson` | 阜阳师范大学西湖校区 | 校园级建筑数据，含 `Height` 属性 |
| `planet_*.osm.geojson` | OSM 区域导出 | 街区级地理数据 |
| `test_buildings.geojson` | 测试用建筑数据 | 小规模，适合快速调试 |

### 火星静态资源

| 文件 | 说明 |
|------|------|
| `public/data/mars/Mars.czml` | 火星车行驶路线（CZML 格式） |
| `public/data/mars/MarsPointsOfInterest.geojson` | 火星地标点位 |
| `public/data/mars/models/` | 3D 模型文件目录 |

---

## 配置说明

### Vite 配置

`vite.config.ts` 中包含以下关键配置：

- **`vite-plugin-cesium`**：自动处理 Cesium 静态资源拷贝和 Worker 加载
- **`unplugin-auto-import` + `unplugin-vue-components`**：Element Plus 按需自动导入
- **开发代理**：`/api` 请求代理至 `http://localhost:9999`

### 环境变量

项目使用 Vite 环境变量配置，在根目录 `.env` 文件中设置：

| 变量名 | 必须 | 说明 |
|--------|------|------|
| `VITE_CESIUM_TOKEN` | ✅ 必须 | Cesium Ion Access Token，用于加载 3D 地球、地形、建筑数据 |
| `DATABASE_URL` | ❌ 可选 | PostgreSQL 连接字符串（课程管理功能需要） |
| `PORT` | ❌ 可选 | 后端 API 服务端口（默认 9999） |

### Cesium Ion Token

**Token 是什么？**
Cesium Ion Token 是 Cesium 平台的访问凭证，用于授权访问其托管的 3D 地球数据、地形服务和建筑模型。

**为什么需要 Token？**
- 加载全球地形数据（Cesium World Terrain）
- 加载火星地形模型（Mars Terrain）
- 加载 Google Photorealistic 3D Tiles
- 加载 OSM Buildings 3D 模型

**Token 使用示例：**

```env
# .env 文件内容
VITE_CESIUM_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
```

**Token 用量说明：**
- **免费额度**：每月 100,000 次 API 调用
- **个人学习**：完全足够
- **生产环境**：建议升级到付费计划

**Token 安全提示：**
- ⚠️ 不要将 Token 提交到 Git 仓库（已在 .gitignore 中排除）
- ⚠️ 不要在公共代码仓库中分享 Token
- ✅ 建议定期轮换 Token

---

## 开发约定

- 使用 Vue 3 Composition API + `<script setup>` 语法
- TypeScript 严格模式
- 组件样式使用 scoped CSS，无 CSS 框架
- 状态管理通过 props/emit 向下传递，无需 Pinia/Vuex
- Cesium API 调用封装在生命周期钩子（`onMounted`、`onUnmounted`）中
- 修改场景后调用 `viewer.scene.requestRender()` 按需渲染
- 各模块（campus / mars / city）独立目录，共享类型提取至 `shared/types`

---

## 许可

本项目仅供学习和教学使用。
