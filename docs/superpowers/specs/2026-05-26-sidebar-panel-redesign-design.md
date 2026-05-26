# 侧边面板重设计：图标侧栏 + 内容区

**日期**: 2026-05-26
**状态**: 已批准
**范围**: 侧边面板的展开/收起逻辑和视觉重构

---

## 1. 目标

将现有的 3 个独立折叠面板（图层列表、建筑信息、属性表）重构为 VS Code 风格的图标侧栏 + 内容区架构，提升交互直觉性和视觉一致性。

## 2. 设计决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 面板布局 | 图标侧栏 + 内容区 | 类似 VS Code，直觉性强 |
| 自动隐藏 | 点击已展开图标 → 内容区收起 | 最大化地图视野 |
| 展开动画 | 宽度展开（0 → 320px） | 推挤地图，空间感明确 |
| 选中指示 | 底部亮色指示线 | 简洁不干扰图标 |
| Tooltip | 悬停 300ms 后显示面板名称 | 辅助识别，不遮挡 |
| 侧栏可见性 | 始终可见 | 40px 固定，无需隐藏 |

## 3. 组件架构

### 3.1 新增组件

#### SidebarNav.vue

左侧图标栏，40px 宽，固定显示。

- **Props**: `activePanel: string | null`
- **Emits**: `update:activePanel`
- **功能**:
  - 渲染 3 个图标按钮（📋 图层、🏫 建筑、📊 属性）
  - 管理选中状态（底部指示线）
  - 管理 Tooltip 悬停提示（300ms 延迟，右侧弹出）
  - 点击已选中图标时 emit `null`（触发收起）

#### SidebarContainer.vue

包装层，管理展开/收起状态和动画。

- **Props**: `activePanel: string | null`
- **Emits**: `update:activePanel`
- **功能**:
  - 包含 SidebarNav + 内容区
  - 内容区宽度 `transition: width 0.25s ease`
  - 内容区 `overflow: hidden`
  - 根据 `activePanel` 动态渲染对应面板

### 3.2 修改组件

#### LayerPanel.vue
- 移除: `collapsed` prop、`toggleCollapse` emit、panel-header 折叠箭头、宽度 transition、外边框/阴影
- 保留: 图层列表内容、选中高亮、点击事件

#### BuildingInfoPanel.vue
- 移除: 同上
- 保留: 搜索框、建筑列表、详情区域

#### PropertyTable.vue
- 移除: 同上
- 保留: 表格内容、表头、滚动

#### App.vue
- 移除: 3 个独立 `collapsed` ref (`layerPanelCollapsed`, `buildingPanelCollapsed`, `propertyPanelCollapsed`)
- 新增: 1 个 `activePanel` ref (`'layers' | 'building' | 'property' | null`)
- 替换: `.side-panels` flex 列 → `SidebarContainer`

## 4. 布局结构

```
.app-main (CSS Grid: auto 1fr, 10px gap)
  ├── .sidebar-area (flex: row, 不收缩)
  │     ├── SidebarNav (40px, 固定)
  │     └── .sidebar-content (动态宽度: 0 ~ 320px, transition)
  │           ├── LayerPanel     (v-if="activePanel === 'layers'")
  │           ├── BuildingInfoPanel (v-if="activePanel === 'building'")
  │           └── PropertyTable  (v-if="activePanel === 'property'")
  └── CesiumViewer (flex: 1)
```

## 5. 动画规范

| 属性 | 值 |
|------|-----|
| 内容区宽度 | 0px → 320px |
| transition | `width 0.25s ease` |
| overflow | `hidden` |
| 触发 | `activePanel` 变化时自动过渡 |

地图区域被内容区推挤，无需手动计算。

## 6. 视觉规范

### 图标侧栏

| 属性 | 值 |
|------|-----|
| 宽度 | 40px |
| 背景 | `var(--bg-panel)` |
| 右边框 | `var(--border-primary)` |
| 图标垂直间距 | 14px |
| 选中指示线 | 底部 2px, `var(--text-accent)` |
| 悬停背景 | `var(--bg-hover)` |
| 圆角 | 10px (左侧) |

### Tooltip

| 属性 | 值 |
|------|-----|
| 位置 | 图标右侧, `left: 100%` |
| 延迟 | 300ms |
| 背景 | `var(--bg-panel-solid)` |
| 边框 | `var(--border-tooltip)` |
| 圆角 | 6px |
| 箭头 | 左侧小三角 |
| 显示条件 | 仅在内容区收起时显示 |

### 内容区

| 属性 | 值 |
|------|-----|
| 背景 | `var(--bg-panel)` |
| 右边框 | `var(--border-primary)` |
| 标题 | 13px 加粗, `var(--text-primary)`, 底部分割线 |
| 圆角 | 右上/右下 10px |
| 最大宽度 | 320px |

## 7. 交互流程

```
用户点击图标
  ├── 无面板展开 → activePanel = 'xxx' → 内容区展开 (0 → 320px)
  ├── 点击已展开图标 → activePanel = null → 内容区收起 (320px → 0)
  └── 点击不同图标 → activePanel 切换 → 内容区直接替换内容（宽度不变）

用户悬停图标 (300ms)
  └── 内容区收起状态 → 显示 Tooltip
      └── 内容区展开状态 → 不显示 Tooltip
```

## 8. 主题适配

所有颜色通过 CSS 变量（`style.css` 中定义）自动适配深浅主题，无需组件级主题判断。

## 9. 不做的事情

- 不修改 Header 菜单逻辑
- 不修改 CesiumViewer 交互逻辑
- 不修改浮层组件（HoverTooltip、BuildingPopup、EditPanel）
- 不添加侧栏整体隐藏功能
- 不添加面板拖拽调整宽度
