# FYUN 校园系统 UI 重设计 — 天文台 HUD 风格

> 日期: 2026-05-24
> 状态: 已批准
> 范围: 纯视觉/样式层改造，不涉及功能逻辑变更

## 目标

将当前通用的深蓝暗色 UI 升级为"天文台任务控制"风格，使用 Glassmorphism 玻璃质感、科技字体、双色强调系统和流畅动效，让界面与 Cesium 3D 地球的太空视角形成统一的视觉语言。

## 设计约束

- 所有交互逻辑不变（hover/click/dblclick/编辑/保存/数据库同步）
- 组件 props/emit 接口不变
- 响应式断点保持 900px
- 不引入新的 npm 依赖（字体通过 Google Fonts CDN 加载）

---

## 1. 字体方案

| 用途 | 字体 | 来源 | 备注 |
|------|------|------|------|
| 标题/导航 | Rajdhani 600 | Google Fonts | 几何半衬线，科技感 |
| 正文/中文 | Segoe UI / PingFang SC | 系统 | 保持中文可读性 |
| 数字/坐标 | JetBrains Mono 400 | Google Fonts | 等宽，控制台感 |

在 `index.html` 的 `<head>` 中添加 Google Fonts 预加载：

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet">
```

## 2. 色彩体系（CSS 变量）

在 `style.css` 的 `:root` 中定义：

```css
:root {
  /* 背景层级 */
  --bg-deep: #060d15;
  --bg-panel: rgba(8, 18, 30, 0.85);
  --bg-surface: rgba(12, 28, 48, 0.7);

  /* 强调色 */
  --accent-cyan: #00e5ff;
  --accent-amber: #ffab00;
  --accent-cyan-dim: rgba(0, 229, 255, 0.15);

  /* 文字层级 */
  --text-primary: #e0f2ff;
  --text-secondary: rgba(200, 230, 255, 0.6);
  --text-muted: rgba(160, 200, 230, 0.35);

  /* 发光效果 */
  --glow-cyan: 0 0 12px rgba(0, 229, 255, 0.3);
  --glow-amber: 0 0 8px rgba(255, 171, 0, 0.4);

  /* 边框 */
  --border-glass: rgba(0, 229, 255, 0.18);
  --border-glow: rgba(0, 229, 255, 0.35);

  /* 圆角 */
  --radius-panel: 12px;
  --radius-sm: 8px;

  /* 字体 */
  --font-display: 'Rajdhani', 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Cascadia Code', monospace;
  --font-body: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;

  /* 动效 */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-panel: 0.35s;
  --duration-fast: 0.15s;
  --duration-popup: 0.25s;
}
```

## 3. 面板玻璃质感（LayerPanel / BuildingInfoPanel / PropertyTable）

所有侧面板统一风格：

```css
.panel {
  background: var(--bg-panel);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-panel);
  box-shadow: var(--glow-cyan);
}

.panel:hover {
  border-color: var(--border-glow);
}

.panel.collapsed {
  width: 48px;
}
```

**面板头部：**
- 底部分隔线改为渐变淡出：`linear-gradient(90deg, rgba(0,229,255,0.3), transparent)`
- 标题前加 3px 宽 cyan 竖条（`::before` 伪元素）
- 展开/收起箭头替换为 SVG chevron，带 `transform: rotate()` 过渡

**展开/收起动画：**
```css
transition: width var(--duration-panel) var(--ease-standard);
```

## 4. Header 顶栏

**背景：**
```css
.app-header {
  background: var(--bg-panel);
  border-bottom: 1px solid transparent;
  border-image: linear-gradient(90deg, transparent, rgba(0,229,255,0.3), transparent) 1;
}
```

**标题：**
```css
.title {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: 1.5px;
  color: var(--text-primary);
}

.subtitle {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-secondary);
}
```

标题左侧加 3px × 18px cyan 竖条装饰。

**菜单按钮：**
- emoji 替换为 SVG inline 图标（`16px`，`stroke` 风格，`currentColor`）
- hover 增加 `backdrop-filter: blur(4px)` + 背景 `rgba(0,229,255,0.06)`
- 下拉箭头替换为 SVG chevron，带旋转过渡

**日期标签：**
```css
.meta {
  font-family: var(--font-mono);
  font-size: 11px;
  border: 1px solid rgba(0, 229, 255, 0.15);
  /* 左侧加 4px cyan 实心圆点 */
}
```

**下拉子菜单：**
```css
.submenu {
  background: rgba(6, 13, 21, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-glass);
  /* 入场动画：translateY(-4px) → 0 + opacity */
}
```

## 5. 弹出层（EditPanel / DB Panel）

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.modal {
  background: rgba(6, 13, 21, 0.95);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-panel);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  /* 顶部 2px 渐变光带 */
  border-top: 2px solid transparent;
  border-image: linear-gradient(90deg, transparent, var(--accent-cyan), transparent) 1;
  /* 弹出动画 */
  animation: modal-in var(--duration-popup) var(--ease-standard);
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

## 6. 交互组件动效

**HoverTooltip：**
```css
.hover-tooltip {
  animation: tooltip-in 0.15s ease;
}

@keyframes tooltip-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
```
- 建筑名称前加 cyan 小圆点指示器
- "双击编辑属性" 改用 `var(--font-mono)`，颜色 `var(--text-muted)`

**BuildingPopup：**
```css
.building-popup {
  animation: popup-in 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes popup-in {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
```
- 建筑名前加 SVG 建筑小图标
- "查看详情 →" hover 时箭头 `translateX(3px)` 滑动
- ✕ 替换为 SVG close icon

**EditPanel 输入框：**
```css
.form-input:focus {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.15);
}

.form-row:hover {
  background: rgba(0, 229, 255, 0.03);
}
```

**PropertyTable 表头：**
```css
th {
  background: rgba(0, 229, 255, 0.06);
  letter-spacing: 0.5px;
}

tr:hover td {
  background: rgba(0, 229, 255, 0.08);
}

/* 选中行左边框 */
tr.selected td:first-child {
  border-left: 2px solid var(--accent-cyan);
}
```

**LayerPanel / BuildingInfoPanel 选中项：**
```css
.layer-item.selected,
.building-item.selected {
  background: rgba(0, 229, 255, 0.1);
  border-left: 2px solid var(--accent-cyan);
}
```

## 7. Cesium 容器

```css
.viewer-wrap {
  border-radius: var(--radius-panel);
  border: 1px solid rgba(0, 229, 255, 0.12);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  position: relative;
}

/* 四角 HUD 装饰角标 */
.viewer-wrap::before,
.viewer-wrap::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: rgba(0, 229, 255, 0.4);
  border-style: solid;
  z-index: 1;
  pointer-events: none;
}

.viewer-wrap::before {
  top: 8px;
  left: 8px;
  border-width: 2px 0 0 2px;
}

.viewer-wrap::after {
  top: 8px;
  right: 8px;
  border-width: 2px 2px 0 0;
}
```

底部两个角标通过额外的 wrapper 或子元素实现（CSS 只有两个伪元素）。

## 8. 全局细节

**滚动条：**
```css
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: rgba(0, 229, 255, 0.2);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 229, 255, 0.35);
}
```

**App 背景：**
```css
.app-shell {
  background:
    radial-gradient(circle at 30% 0%, rgba(0, 40, 60, 0.3) 0%, transparent 50%),
    var(--bg-deep);
}
```

## 9. SVG 图标替换清单

| 原 emoji | 位置 | 替换图标描述 |
|----------|------|-------------|
| 📋 | LayerPanel 标题 | 图层叠放（3 层矩形叠放） |
| 📊 | PropertyTable 标题 | 网格/表格（4 宫格） |
| 🏫 | BuildingInfoPanel 标题 | 建筑轮廓（矩形+三角屋顶） |
| 🗺️ | Header 图层菜单 | 地球/圆形图层 |
| 🏙️ | Header 城市模型菜单 | 城市天际线（多个矩形高低错落） |
| 📂 | 文件选择按钮 | 文件夹 |
| 🗄️ | 数据库加载按钮 | 数据库（圆柱体） |
| 📝 | 底图子菜单项 | 地图/纸张 |

全部使用 `stroke` 风格，`stroke-width: 1.5`，`fill: none`，`currentColor`，尺寸 `16px`。

## 10. 文件变更范围

| 文件 | 变更类型 |
|------|---------|
| `index.html` | 添加 Google Fonts 链接 |
| `src/style.css` | CSS 变量 + 全局样式（滚动条、背景） |
| `src/components/Header.vue` | 样式重构 + emoji → SVG |
| `src/components/LayerPanel.vue` | 样式重构 + emoji → SVG |
| `src/components/PropertyTable.vue` | 样式重构 + emoji → SVG |
| `src/components/BuildingInfoPanel.vue` | 样式重构 + emoji → SVG |
| `src/components/HoverTooltip.vue` | 动效 + 样式微调 |
| `src/components/BuildingPopup.vue` | 动效 + 样式 + emoji → SVG |
| `src/components/EditPanel.vue` | 动效 + 样式微调 |
| `src/components/CesiumViewer.vue` | 容器样式 + HUD 角标 |

不涉及任何逻辑代码变更，所有改动仅限 `<template>` 中的图标替换和 `<style>` 块。
