# Cesium 学习系统 + FYUN 校园展示 设计文档

## 目标

将现有 FYUN 校园系统重构为 Cesium 学习系统的一个子页面，搭建左侧菜单 + Cesium 全屏背景 + router-view 覆盖层的主框架。

## 整体架构

```
App.vue (Element Plus 主布局)
├── el-aside → Menu.vue (左侧可折叠菜单)
└── el-main → Cesium 全屏背景 + <router-view> 覆盖层
```

## 路由规划

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | HomeView.vue | 首页，空白 Cesium 地球 |
| `/campus` | CampusView.vue | FYUN 校园展示（现有功能完整迁移） |

## 菜单结构

```
📍 首页
🏫 校园展示
  └── FYUN 校园系统
```

## 文件结构变更

### 新增文件

- `src/router/index.ts` — Vue Router 配置
- `src/components/Menu.vue` — 左侧折叠菜单
- `src/views/HomeView.vue` — 首页
- `src/views/CampusView.vue` — FYUN 校园展示页面

### 修改文件

- `App.vue` — 重构为 Element Plus 主布局壳
- `main.ts` — 注册 Vue Router、Element Plus

### 不变文件

- `CesiumViewer.vue` — 保持不变，作为可复用组件
- 其他所有现有组件 — 完整保留

## 关键设计决策

1. **CesiumViewer 复用** — CesiumViewer 保持为纯展示组件，通过 props 接收配置，通过 emit 向上传递事件。首页和校园展示页各自管理状态。

2. **首页 Cesium 实例** — HomeView 使用独立的 CesiumViewer 实例，仅展示基础地球。

3. **校园展示页** — CampusView 包含完整的 FYUN 功能：Header、SidebarContainer、HoverTooltip、EditPanel、BuildingPopup、CourseForm 等，与现有 App.vue 逻辑完全一致。

4. **Element Plus 按需引入** — 使用 `unplugin-auto-import` 和 `unplugin-vue-components` 自动引入 Element Plus 组件。

5. **Cesium token** — 在 App.vue 的布局级别设置 `Cesium.Ion.defaultAccessToken`，各子页面共享。

## 参考项目

- UI 布局参考 `cesium-vue3-vite` 项目：左侧 `el-aside` + `el-menu`，主区域 Cesium 全屏背景
- 菜单样式：深色背景 (`#545c64`)，激活色 `#ffd04b`，支持折叠
