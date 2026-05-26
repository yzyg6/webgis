# Observatory UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the FYUN campus system UI from generic dark-blue to an Observatory HUD aesthetic with glassmorphism panels, sci-fi typography, cyan/amber dual-accent colors, and smooth animations.

**Architecture:** Pure CSS/visual changes across 10 files. No logic modifications. CSS variables defined in `style.css` cascade to all components via scoped styles. SVG inline icons replace emoji characters in templates.

**Tech Stack:** Vue 3 + scoped CSS, Google Fonts (Rajdhani, JetBrains Mono), CSS custom properties, backdrop-filter, CSS animations

**Spec:** `docs/superpowers/specs/2026-05-24-observatory-ui-redesign-design.md`

---

## File Map

| File | Responsibility |
|------|---------------|
| `ucas_earth/index.html` | Google Fonts preload |
| `ucas_earth/src/style.css` | CSS variables, global resets, scrollbar, background |
| `ucas_earth/src/components/Header.vue` | Top bar restyle + SVG icons |
| `ucas_earth/src/components/LayerPanel.vue` | Glassmorphism panel + SVG icon |
| `ucas_earth/src/components/PropertyTable.vue` | Glassmorphism panel + SVG icon |
| `ucas_earth/src/components/BuildingInfoPanel.vue` | Glassmorphism panel + SVG icon |
| `ucas_earth/src/components/HoverTooltip.vue` | Entry animation + style tweaks |
| `ucas_earth/src/components/BuildingPopup.vue` | Entry animation + SVG icons |
| `ucas_earth/src/components/EditPanel.vue` | Modal style + input glow |
| `ucas_earth/src/components/CesiumViewer.vue` | Container style + HUD corners |

---

### Task 1: Foundation — index.html + style.css

**Files:**
- Modify: `ucas_earth/index.html`
- Modify: `ucas_earth/src/style.css`

- [ ] **Step 1: Add Google Fonts to index.html**

Open `ucas_earth/index.html`. Add the following lines inside `<head>`, before the `<meta charset>` tag:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet">
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FYUN校园系统</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 2: Replace style.css with Observatory theme**

Replace the entire contents of `ucas_earth/src/style.css` with:

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

  /* 全局字体 */
  font-family: var(--font-body);
  line-height: 1.5;
  font-weight: 400;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

html,
body,
#app {
  margin: 0;
  width: 100%;
  height: 100%;
  min-width: 320px;
}

body {
  overflow: hidden;
  background: var(--bg-deep);
}

/* 全局滚动条 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 229, 255, 0.2);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 229, 255, 0.35);
}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run from `ucas_earth/`:
```bash
npx vue-tsc --noEmit
```
Expected: No errors (CSS-only changes should not affect TypeScript).

- [ ] **Step 4: Commit**

```bash
git add ucas_earth/index.html ucas_earth/src/style.css
git commit -m "style: add Observatory theme foundation — Google Fonts + CSS variables + global styles"
```

---

### Task 2: Header.vue — Top Bar Restyle + SVG Icons

**Files:**
- Modify: `ucas_earth/src/components/Header.vue`

- [ ] **Step 1: Replace Header template with SVG icons**

Replace the entire `<template>` section. The key changes are: emoji replaced with inline SVG icons, date indicator dot added.

```vue
<template>
  <header class="app-header">
    <div class="title-wrap">
      <div class="title-bar"></div>
      <div>
        <h1 class="title">FYUN 校园系统</h1>
        <p class="subtitle">Cesium 内核</p>
      </div>
    </div>

    <div class="menu-bar">
      <div class="menu-item">
        <svg class="menu-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="8" width="12" height="3" rx="1"/>
          <rect x="3" y="4.5" width="10" height="3" rx="1"/>
          <rect x="4" y="1" width="8" height="3" rx="1"/>
        </svg>
        <span class="menu-label">图层</span>
        <svg class="menu-arrow" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1 1l4 4 4-4"/></svg>
        <div class="submenu">
          <button class="submenu-item" type="button" @click="emitSwitchLayer('osm')">
            <svg class="submenu-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M2 6h12M6 2v12"/></svg>
            <span class="submenu-label">OpenStreetMap</span>
          </button>
          <button class="submenu-item" type="button" @click="emitSwitchLayer('arcgis')">
            <svg class="submenu-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M2 6h12M6 2v12"/></svg>
            <span class="submenu-label">ArcGIS World Imagery</span>
          </button>
          <button class="submenu-item" type="button" @click="emitSwitchLayer('carto')">
            <svg class="submenu-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M2 6h12M6 2v12"/></svg>
            <span class="submenu-label">Carto Light</span>
          </button>
        </div>
      </div>

      <div class="menu-item">
        <svg class="menu-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="1" y="6" width="4" height="9" rx="0.5"/>
          <rect x="6" y="3" width="4" height="12" rx="0.5"/>
          <rect x="11" y="1" width="4" height="14" rx="0.5"/>
        </svg>
        <span class="menu-label">城市模型</span>
        <svg class="menu-arrow" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1 1l4 4 4-4"/></svg>
        <div class="submenu">
          <button class="submenu-item" type="button" @click="openFilePicker">
            <svg class="submenu-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 13V3a1 1 0 011-1h4l2 2h4a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1z"/></svg>
            <span class="submenu-label">选择本地 GeoJSON</span>
          </button>
          <button class="submenu-item" type="button" @click="emitLoadFromDatabase">
            <svg class="submenu-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="8" cy="4" rx="6" ry="2.5"/><path d="M2 4v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V4"/><path d="M2 8v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V8"/></svg>
            <span class="submenu-label">从数据库加载</span>
          </button>
          <input
            ref="fileInput"
            class="hidden-file-input"
            type="file"
            accept=".geojson,.json,application/geo+json,application/json"
            @change="handleFileChange"
          />
          <div class="path-entry">
            <span class="path-tip">已加载图层，可切换显示或删除</span>
          </div>
          <div class="layer-list" v-if="props.cityLayers.length > 0">
            <div class="layer-item" v-for="layer in props.cityLayers" :key="layer.id">
              <span class="layer-name" :title="layer.name">{{ layer.name }}</span>
              <div class="layer-actions">
                <button class="path-load-btn" type="button" @click="emitToggleCityLayer(layer.id)">
                  {{ layer.visible ? "隐藏" : "显示" }}
                </button>
                <button class="path-load-btn danger" type="button" @click="emitRemoveCityLayer(layer.id)">
                  删除
                </button>
              </div>
            </div>
          </div>
          <p class="empty-tip" v-else>暂无已加载图层</p>
        </div>
      </div>
    </div>

    <!-- Database Layer Panel -->
    <div class="db-panel-overlay" v-if="props.showDbPanel" @click.self="emitCloseDbPanel">
      <div class="db-panel">
        <div class="db-panel-header">
          <span class="db-panel-title">数据库图层</span>
          <button class="db-panel-close" type="button" @click="emitCloseDbPanel">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
          </button>
        </div>
        <div class="db-panel-content" v-if="props.isLoadingFromDb">
          <p class="db-loading">加载中...</p>
        </div>
        <div class="db-panel-content" v-else-if="props.dbLayers.length === 0">
          <p class="db-empty">数据库中暂无图层</p>
        </div>
        <div class="db-panel-content" v-else>
          <div class="db-group" v-for="group in groupedDbLayers" :key="group.name">
            <div class="db-group-name">{{ group.name }}</div>
            <div class="db-layer-item" v-for="layer in group.layers" :key="layer.id">
              <div class="db-layer-info">
                <span class="db-layer-name">{{ layer.name }}</span>
                <span class="db-layer-meta">{{ formatFileSize(layer.file_size) }} · {{ layer.feature_count ?? '?' }} 要素</span>
              </div>
              <button class="db-load-btn" type="button" @click="emitLoadDbLayer(layer.id)">加载</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="meta">
      <span class="meta-dot"></span>
      {{ todayText }}
    </div>
  </header>
</template>
```

The `<script setup>` section remains unchanged.

- [ ] **Step 2: Replace Header styles**

Replace the entire `<style scoped>` section:

```vue
<style scoped>
.app-header {
  background: var(--bg-panel);
  border-bottom: 1px solid transparent;
  border-image: linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.3), transparent) 1;
  padding: 0 20px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 24px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-bar {
  width: 3px;
  height: 18px;
  background: var(--accent-cyan);
  border-radius: 2px;
  flex-shrink: 0;
}

.title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
  line-height: 1;
  font-weight: 600;
  letter-spacing: 1.5px;
  color: var(--text-primary);
}

.subtitle {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-secondary);
  letter-spacing: 0.5px;
}

.meta {
  margin-left: auto;
  padding: 6px 12px;
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 999px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-secondary);
  background: var(--bg-surface);
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent-cyan);
  flex-shrink: 0;
}

.menu-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.menu-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-glass);
  background: var(--bg-surface);
  color: var(--text-primary);
  cursor: pointer;
  user-select: none;
  transition: border-color var(--duration-fast) ease, background var(--duration-fast) ease;
}

.menu-item::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  height: 12px;
}

.menu-item:hover {
  background: rgba(0, 229, 255, 0.06);
  border-color: var(--border-glow);
}

.menu-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.menu-label {
  font-size: 13px;
}

.menu-arrow {
  width: 10px;
  height: 6px;
  flex-shrink: 0;
  transition: transform var(--duration-fast) ease;
}

.menu-item:hover .menu-arrow {
  transform: rotate(180deg);
}

.submenu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
  border-radius: var(--radius-panel);
  border: 1px solid var(--border-glass);
  background: rgba(6, 13, 21, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 20;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px);
  pointer-events: none;
  transition: opacity var(--duration-fast) ease, transform var(--duration-fast) ease, visibility 0s linear 0.3s;
}

.menu-item:hover .submenu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  pointer-events: auto;
  transition-delay: 0s;
}

.submenu-item {
  border: 0;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  background: transparent;
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  transition: background var(--duration-fast) ease;
}

.submenu-item:hover {
  background: rgba(0, 229, 255, 0.08);
}

.submenu-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--text-secondary);
}

.hidden-file-input {
  display: none;
}

.path-entry {
  display: flex;
  align-items: center;
  padding: 6px 4px;
}

.path-tip {
  font-size: 12px;
  color: var(--text-secondary);
}

.layer-list {
  max-height: 220px;
  overflow-y: auto;
  padding: 2px 4px 4px;
}

.layer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 4px;
  border-top: 1px solid rgba(0, 229, 255, 0.08);
}

.layer-name {
  font-size: 12px;
  color: var(--text-primary);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-actions {
  display: flex;
  gap: 6px;
}

.path-load-btn {
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  padding: 4px 10px;
  background: var(--bg-surface);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 12px;
  transition: border-color var(--duration-fast) ease, background var(--duration-fast) ease;
}

.path-load-btn:hover {
  border-color: var(--border-glow);
  background: rgba(0, 229, 255, 0.08);
}

.path-load-btn.danger {
  border-color: rgba(255, 100, 100, 0.3);
}

.path-load-btn.danger:hover {
  border-color: rgba(255, 100, 100, 0.5);
  background: rgba(255, 60, 60, 0.1);
}

.empty-tip {
  margin: 4px 4px 6px;
  font-size: 12px;
  color: var(--text-muted);
}

@media (max-width: 900px) {
  .app-header {
    gap: 10px;
    padding: 0 10px;
  }

  .title {
    font-size: 18px;
  }

  .subtitle,
  .meta {
    display: none;
  }

  .menu-bar {
    margin-left: auto;
    gap: 6px;
  }

  .menu-item {
    padding: 6px 8px;
  }

  .menu-label {
    display: none;
  }
}

/* Database Panel Styles */
.db-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.db-panel {
  background: rgba(6, 13, 21, 0.95);
  border: 1px solid var(--border-glass);
  border-top: 2px solid var(--accent-cyan);
  border-radius: var(--radius-panel);
  width: 480px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
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

.db-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 229, 255, 0.08);
}

.db-panel-title {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-primary);
}

.db-panel-close {
  background: transparent;
  border: 0;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--duration-fast) ease, background var(--duration-fast) ease;
}

.db-panel-close svg {
  width: 16px;
  height: 16px;
}

.db-panel-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.db-panel-content {
  overflow-y: auto;
  padding: 12px 16px;
  flex: 1;
}

.db-loading,
.db-empty {
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
  padding: 24px 0;
}

.db-group {
  margin-bottom: 16px;
}

.db-group-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-cyan);
  padding: 8px 0 4px;
  border-bottom: 1px solid rgba(0, 229, 255, 0.08);
  margin-bottom: 8px;
  letter-spacing: 0.3px;
}

.db-layer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 4px;
  border-radius: var(--radius-sm);
  transition: background var(--duration-fast) ease;
}

.db-layer-item:hover {
  background: rgba(0, 229, 255, 0.04);
}

.db-layer-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.db-layer-name {
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.db-layer-meta {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
}

.db-load-btn {
  flex-shrink: 0;
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  padding: 6px 14px;
  background: var(--bg-surface);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 12px;
  transition: border-color var(--duration-fast) ease, background var(--duration-fast) ease;
}

.db-load-btn:hover {
  border-color: var(--border-glow);
  background: rgba(0, 229, 255, 0.08);
}
</style>
```

- [ ] **Step 3: Verify TypeScript compilation**

```bash
cd ucas_earth && npx vue-tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add ucas_earth/src/components/Header.vue
git commit -m "style: Observatory HUD redesign for Header — SVG icons, glassmorphism submenu, cyan accents"
```

---

### Task 3: Side Panels — LayerPanel + PropertyTable + BuildingInfoPanel

**Files:**
- Modify: `ucas_earth/src/components/LayerPanel.vue`
- Modify: `ucas_earth/src/components/PropertyTable.vue`
- Modify: `ucas_earth/src/components/BuildingInfoPanel.vue`

- [ ] **Step 1: Update LayerPanel.vue**

Replace the `<template>` (emoji → SVG, add title-bar decoration) and `<style scoped>` sections.

Template changes:
- `📋` → inline SVG layer icon
- Panel arrow `▶/▼` → SVG chevron with rotation

Style changes:
- All hardcoded colors → CSS variables
- `backdrop-filter: blur(12px)` added
- Border → `var(--border-glass)`, hover → `var(--border-glow)`
- `box-shadow: var(--glow-cyan)`
- Border-radius → `var(--radius-panel)`
- Selected item: left cyan border + `rgba(0,229,255,0.1)` background
- Panel header gradient separator line
- Title-bar cyan vertical stripe before title
- Chevron rotation animation on collapse toggle

Full replacement:

```vue
<template>
  <div class="layer-panel" :class="{ collapsed: collapsed }">
    <div class="panel-header" @click="emit('toggleCollapse')">
      <div class="panel-title-wrap">
        <span class="title-bar"></span>
        <svg class="panel-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="8" width="12" height="3" rx="1"/>
          <rect x="3" y="4.5" width="10" height="3" rx="1"/>
          <rect x="4" y="1" width="8" height="3" rx="1"/>
        </svg>
        <span class="panel-title">图层列表</span>
      </div>
      <svg class="panel-chevron" :class="{ rotated: !collapsed }" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1 1l4 4 4-4"/></svg>
    </div>
    <div class="panel-body" v-show="!collapsed">
      <div class="empty-tip" v-if="layers.length === 0">暂无已加载图层</div>
      <div
        class="layer-item"
        v-for="layer in layers"
        :key="layer.id"
        :class="{ selected: layer.id === selectedLayerId }"
        @click="emit('selectLayer', layer.id)"
      >
        <span class="layer-name" :title="layer.name">{{ layer.name }}</span>
        <span class="layer-count">{{ layer.featureCount }} 要素</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type LayerMeta = {
  id: string;
  name: string;
  featureCount: number;
};

defineProps<{
  layers: LayerMeta[];
  selectedLayerId: string | null;
  collapsed: boolean;
}>();

const emit = defineEmits<{
  selectLayer: [id: string];
  toggleCollapse: [];
}>();
</script>

<style scoped>
.layer-panel {
  width: 320px;
  background: var(--bg-panel);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-panel);
  box-shadow: var(--glow-cyan);
  display: flex;
  flex-direction: column;
  transition: width var(--duration-panel) var(--ease-standard);
}

.layer-panel:hover {
  border-color: var(--border-glow);
}

.layer-panel.collapsed {
  width: 48px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid;
  border-image: linear-gradient(90deg, rgba(0, 229, 255, 0.3), transparent) 1;
  cursor: pointer;
  user-select: none;
}

.panel-header:hover {
  background: rgba(0, 229, 255, 0.04);
  border-radius: var(--radius-panel) var(--radius-panel) 0 0;
}

.panel-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-bar {
  width: 3px;
  height: 14px;
  background: var(--accent-cyan);
  border-radius: 2px;
  flex-shrink: 0;
}

.panel-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--text-secondary);
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.3px;
}

.collapsed .panel-title,
.collapsed .title-bar,
.collapsed .panel-icon {
  display: none;
}

.collapsed .panel-header {
  justify-content: center;
}

.panel-chevron {
  width: 10px;
  height: 6px;
  flex-shrink: 0;
  color: var(--text-secondary);
  transition: transform var(--duration-fast) ease;
}

.panel-chevron.rotated {
  transform: rotate(180deg);
}

.panel-body {
  overflow-y: auto;
  max-height: 400px;
  padding: 6px;
}

.collapsed .panel-body {
  display: none;
}

.empty-tip {
  padding: 16px 8px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}

.layer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--duration-fast) ease;
  border-left: 2px solid transparent;
}

.layer-item:hover {
  background: rgba(0, 229, 255, 0.06);
}

.layer-item.selected {
  background: rgba(0, 229, 255, 0.1);
  border-left-color: var(--accent-cyan);
}

.layer-name {
  font-size: 12px;
  color: var(--text-primary);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-count {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  flex-shrink: 0;
}
</style>
```

- [ ] **Step 2: Update PropertyTable.vue**

Replace the `<template>` and `<style scoped>` sections.

Template changes:
- `📊` → inline SVG grid icon
- Arrow → SVG chevron

Style changes: same pattern as LayerPanel — CSS variables, glassmorphism, gradient separator, title-bar, chevron rotation, table header with `rgba(0,229,255,0.06)`, row hover with cyan tint.

```vue
<template>
  <div class="property-table" :class="{ collapsed: collapsed }">
    <div class="panel-header" @click="emit('toggleCollapse')">
      <div class="panel-title-wrap">
        <span class="title-bar"></span>
        <svg class="panel-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="1" y="1" width="6" height="6" rx="1"/>
          <rect x="9" y="1" width="6" height="6" rx="1"/>
          <rect x="1" y="9" width="6" height="6" rx="1"/>
          <rect x="9" y="9" width="6" height="6" rx="1"/>
        </svg>
        <span class="panel-title">属性表</span>
      </div>
      <svg class="panel-chevron" :class="{ rotated: !collapsed }" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1 1l4 4 4-4"/></svg>
    </div>
    <div class="panel-body" v-show="!collapsed">
      <div class="empty-tip" v-if="!layerName">请先在上方选择一个图层</div>
      <template v-else>
        <div class="table-title">{{ layerName }}</div>
        <div class="table-scroll">
          <table v-if="columns.length > 0">
            <thead>
              <tr>
                <th class="row-num-col">#</th>
                <th v-for="col in columns" :key="col">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in properties" :key="i">
                <td class="row-num-col">{{ i + 1 }}</td>
                <td v-for="col in columns" :key="col" :title="String(row[col] ?? '')">
                  {{ formatCell(row[col]) }}
                </td>
              </tr>
            </tbody>
          </table>
          <div class="empty-tip" v-else>该图层无属性数据</div>
        </div>
        <div class="table-footer">共 {{ properties.length }} 条记录</div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  layerName: string;
  properties: Record<string, unknown>[];
  collapsed: boolean;
}>();

const emit = defineEmits<{
  toggleCollapse: [];
}>();

const columns = computed(() => {
  if (props.properties.length === 0) return [];
  const keySet = new Set<string>();
  for (const row of props.properties) {
    for (const key of Object.keys(row)) {
      keySet.add(key);
    }
  }
  return Array.from(keySet);
});

const formatCell = (value: unknown): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
};
</script>

<style scoped>
.property-table {
  width: 320px;
  background: var(--bg-panel);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-panel);
  box-shadow: var(--glow-cyan);
  display: flex;
  flex-direction: column;
  transition: width var(--duration-panel) var(--ease-standard);
  min-height: 0;
}

.property-table:hover {
  border-color: var(--border-glow);
}

.property-table.collapsed {
  width: 48px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid;
  border-image: linear-gradient(90deg, rgba(0, 229, 255, 0.3), transparent) 1;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}

.panel-header:hover {
  background: rgba(0, 229, 255, 0.04);
  border-radius: var(--radius-panel) var(--radius-panel) 0 0;
}

.panel-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-bar {
  width: 3px;
  height: 14px;
  background: var(--accent-cyan);
  border-radius: 2px;
  flex-shrink: 0;
}

.panel-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--text-secondary);
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.3px;
}

.collapsed .panel-title,
.collapsed .title-bar,
.collapsed .panel-icon {
  display: none;
}

.collapsed .panel-header {
  justify-content: center;
}

.panel-chevron {
  width: 10px;
  height: 6px;
  flex-shrink: 0;
  color: var(--text-secondary);
  transition: transform var(--duration-fast) ease;
}

.panel-chevron.rotated {
  transform: rotate(180deg);
}

.panel-body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.collapsed .panel-body {
  display: none;
}

.table-title {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-cyan);
  border-bottom: 1px solid rgba(0, 229, 255, 0.08);
  flex-shrink: 0;
  letter-spacing: 0.3px;
}

.table-scroll {
  overflow: auto;
  max-height: 350px;
  flex: 1;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

th {
  background: rgba(0, 229, 255, 0.06);
  color: var(--text-primary);
  padding: 6px 8px;
  text-align: left;
  font-weight: 600;
  white-space: nowrap;
  border-bottom: 1px solid rgba(0, 229, 255, 0.15);
  letter-spacing: 0.5px;
}

td {
  padding: 5px 8px;
  color: rgba(224, 242, 255, 0.85);
  border-bottom: 1px solid rgba(0, 229, 255, 0.05);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

tr:hover td {
  background: rgba(0, 229, 255, 0.08);
}

.row-num-col {
  width: 36px;
  text-align: center;
  color: var(--text-muted);
}

.table-footer {
  padding: 6px 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  border-top: 1px solid rgba(0, 229, 255, 0.08);
  flex-shrink: 0;
}

.empty-tip {
  padding: 24px 12px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}
</style>
```

- [ ] **Step 3: Update BuildingInfoPanel.vue**

Replace the `<template>` and `<style scoped>` sections. Same glassmorphism pattern. Additionally:
- Detail section separator: gradient line
- Detail label: `var(--text-secondary)`
- Detail value for important fields: `var(--text-primary)` + `font-weight: 500`
- Search input focus: cyan border + glow

```vue
<template>
  <div class="building-panel" :class="{ collapsed: collapsed }">
    <div class="panel-header" @click="emit('toggle-collapse')">
      <div class="panel-title-wrap">
        <span class="title-bar"></span>
        <svg class="panel-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M2 14V5l6-3 6 3v9"/>
          <path d="M6 14V9h4v5"/>
          <path d="M5 7h1M10 7h1"/>
        </svg>
        <span class="panel-title">建筑信息</span>
      </div>
      <svg class="panel-chevron" :class="{ rotated: !collapsed }" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1 1l4 4 4-4"/></svg>
    </div>
    <div class="panel-body" v-show="!collapsed">
      <div class="search-box">
        <input
          type="text"
          class="search-input"
          placeholder="搜索建筑名称..."
          :value="searchQuery"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <div class="building-list">
        <div class="empty-tip" v-if="filteredBuildings.length === 0">无匹配建筑</div>
        <div
          class="building-item"
          v-for="meta in filteredBuildings"
          :key="meta.name"
          :class="{ selected: selectedBuilding?.name === meta.name }"
          @click="emit('select-building', meta)"
          @dblclick="emit('fly-to-building', meta)"
        >
          <span class="building-item-name">{{ meta.name }}</span>
          <span class="building-item-purpose">{{ meta.purpose }}</span>
        </div>
      </div>

      <div class="building-detail" v-if="selectedBuilding">
        <div class="detail-header">{{ selectedBuilding.name }}</div>
        <div class="detail-rows">
          <div class="detail-row">
            <span class="detail-label">用途</span>
            <span class="detail-value important">{{ selectedBuilding.purpose }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">楼层</span>
            <span class="detail-value">{{ selectedBuilding.floors }} 层</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">容纳人数</span>
            <span class="detail-value">{{ selectedBuilding.capacity }} 人</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">所属</span>
            <span class="detail-value">{{ selectedBuilding.college }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">联系电话</span>
            <span class="detail-value mono">{{ selectedBuilding.contact }}</span>
          </div>
          <div class="detail-row" v-if="selectedBuilding.description">
            <span class="detail-label">简介</span>
            <span class="detail-value">{{ selectedBuilding.description }}</span>
          </div>
        </div>

        <div class="detail-section" v-if="geoProperties.length > 0">
          <div class="detail-section-title">GeoJSON 属性</div>
          <div
            class="detail-row"
            v-for="prop in geoProperties"
            :key="prop.key"
          >
            <span class="detail-label">{{ prop.key }}</span>
            <span class="detail-value mono">{{ prop.value }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BuildingMeta } from '../data/campus-buildings';

const props = defineProps<{
  buildings: BuildingMeta[];
  selectedBuilding: BuildingMeta | null;
  searchQuery: string;
  geoProperties: Record<string, unknown>;
  collapsed: boolean;
}>();

const emit = defineEmits<{
  'select-building': [meta: BuildingMeta];
  'fly-to-building': [meta: BuildingMeta];
  'update:searchQuery': [query: string];
  'toggle-collapse': [];
}>();

const filteredBuildings = computed(() => {
  if (!props.searchQuery.trim()) {
    return props.buildings;
  }
  const query = props.searchQuery.toLowerCase();
  return props.buildings.filter(
    (meta) =>
      meta.name.toLowerCase().includes(query) ||
      meta.purpose.toLowerCase().includes(query) ||
      meta.college.toLowerCase().includes(query)
  );
});

const HIDDEN_KEYS = new Set([
  'id', 'fid', 'objectid', 'shape_length', 'shape_area',
  'globalid', 'created_user', 'created_date', 'last_edited_user',
  'last_edited_date',
]);

const geoProperties = computed(() => {
  return Object.entries(props.geoProperties)
    .filter(([key, value]) => {
      if (HIDDEN_KEYS.has(key.toLowerCase())) return false;
      if (value === null || value === undefined) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      return true;
    })
    .map(([key, value]) => ({
      key,
      value: String(value),
    }));
});
</script>

<style scoped>
.building-panel {
  width: 320px;
  background: var(--bg-panel);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-panel);
  box-shadow: var(--glow-cyan);
  display: flex;
  flex-direction: column;
  transition: width var(--duration-panel) var(--ease-standard);
}

.building-panel:hover {
  border-color: var(--border-glow);
}

.building-panel.collapsed {
  width: 48px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid;
  border-image: linear-gradient(90deg, rgba(0, 229, 255, 0.3), transparent) 1;
  cursor: pointer;
  user-select: none;
}

.panel-header:hover {
  background: rgba(0, 229, 255, 0.04);
  border-radius: var(--radius-panel) var(--radius-panel) 0 0;
}

.panel-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-bar {
  width: 3px;
  height: 14px;
  background: var(--accent-cyan);
  border-radius: 2px;
  flex-shrink: 0;
}

.panel-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--text-secondary);
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.3px;
}

.collapsed .panel-title,
.collapsed .title-bar,
.collapsed .panel-icon {
  display: none;
}

.collapsed .panel-header {
  justify-content: center;
}

.panel-chevron {
  width: 10px;
  height: 6px;
  flex-shrink: 0;
  color: var(--text-secondary);
  transition: transform var(--duration-fast) ease;
}

.panel-chevron.rotated {
  transform: rotate(180deg);
}

.panel-body {
  overflow-y: auto;
  max-height: 500px;
  padding: 6px;
}

.collapsed .panel-body {
  display: none;
}

.search-box {
  padding: 4px 6px 8px;
}

.search-input {
  width: 100%;
  padding: 7px 10px;
  background: var(--bg-surface);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
  transition: border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
}

.search-input:focus {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.15);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.building-list {
  max-height: 180px;
  overflow-y: auto;
  margin-bottom: 6px;
}

.empty-tip {
  padding: 16px 8px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}

.building-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--duration-fast) ease;
  border-left: 2px solid transparent;
}

.building-item:hover {
  background: rgba(0, 229, 255, 0.06);
}

.building-item.selected {
  background: rgba(0, 229, 255, 0.1);
  border-left-color: var(--accent-cyan);
}

.building-item-name {
  font-size: 12px;
  color: var(--text-primary);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.building-item-purpose {
  font-size: 11px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.building-detail {
  border-top: 1px solid;
  border-image: linear-gradient(90deg, rgba(0, 229, 255, 0.3), transparent) 1;
  padding-top: 8px;
}

.detail-header {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-cyan);
  padding: 4px 6px 8px;
}

.detail-rows {
  padding: 0 6px;
}

.detail-row {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  font-size: 11px;
  border-bottom: 1px solid rgba(0, 229, 255, 0.04);
  transition: background var(--duration-fast) ease;
}

.detail-row:hover {
  background: rgba(0, 229, 255, 0.03);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: var(--text-secondary);
  min-width: 60px;
  flex-shrink: 0;
}

.detail-value {
  color: var(--text-primary);
  word-break: break-all;
}

.detail-value.important {
  font-weight: 500;
}

.detail-value.mono {
  font-family: var(--font-mono);
  font-size: 11px;
}

.detail-section {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 229, 255, 0.08);
}

.detail-section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 0 6px 6px;
}
</style>
```

- [ ] **Step 4: Verify TypeScript compilation**

```bash
cd ucas_earth && npx vue-tsc --noEmit
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add ucas_earth/src/components/LayerPanel.vue ucas_earth/src/components/PropertyTable.vue ucas_earth/src/components/BuildingInfoPanel.vue
git commit -m "style: Observatory glassmorphism for side panels — LayerPanel, PropertyTable, BuildingInfoPanel"
```

---

### Task 4: Floating Components — HoverTooltip + BuildingPopup

**Files:**
- Modify: `ucas_earth/src/components/HoverTooltip.vue`
- Modify: `ucas_earth/src/components/BuildingPopup.vue`

- [ ] **Step 1: Update HoverTooltip.vue**

Replace the `<style scoped>` section. Add entry animation. In template, add cyan dot before building name. Replace hint font.

Template changes (minimal — just add a dot span before building-name):
In the `<div class="tooltip-header">`, change:
```html
<div class="tooltip-header" v-if="buildingName">
  <span class="building-dot"></span>
  <span class="building-name">{{ buildingName }}</span>
</div>
```
And change the hint div:
```html
<div class="tooltip-hint">双击编辑属性</div>
```
(no template change needed for hint, just style)

Style replacement:

```vue
<style scoped>
.hover-tooltip {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
  animation: tooltip-in 0.15s ease;
}

@keyframes tooltip-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tooltip-content {
  background: var(--bg-panel);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  max-width: 320px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.tooltip-header {
  padding: 8px 12px;
  background: rgba(0, 229, 255, 0.06);
  border-bottom: 1px solid rgba(0, 229, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
}

.building-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-cyan);
  flex-shrink: 0;
}

.building-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-cyan);
}

.tooltip-body {
  padding: 6px 12px;
}

.tooltip-row {
  display: flex;
  gap: 8px;
  padding: 3px 0;
  font-size: 11px;
  border-bottom: 1px solid rgba(0, 229, 255, 0.04);
}

.tooltip-row:last-child {
  border-bottom: none;
}

.tooltip-row.highlight-row {
  background: rgba(255, 171, 0, 0.06);
  margin: 0 -12px;
  padding: 4px 12px;
  border-bottom: 1px solid rgba(255, 171, 0, 0.12);
}

.tooltip-key {
  color: var(--text-secondary);
  min-width: 60px;
  flex-shrink: 0;
}

.highlight-row .tooltip-key {
  color: rgba(255, 200, 80, 0.9);
}

.tooltip-value {
  color: var(--text-primary);
  word-break: break-all;
}

.highlight-row .tooltip-value {
  color: #fff;
  font-weight: 500;
}

.tooltip-hint {
  padding: 6px 12px;
  background: rgba(0, 229, 255, 0.04);
  border-top: 1px solid rgba(0, 229, 255, 0.08);
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
  text-align: center;
}
</style>
```

- [ ] **Step 2: Update BuildingPopup.vue**

Template changes:
- Replace `✕` close button with SVG icon
- Add SVG building icon before building name

Replace the popup-header section in template:
```html
<div class="popup-header">
  <div class="popup-name-wrap">
    <svg class="popup-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M2 14V5l6-3 6 3v9"/>
      <path d="M6 14V9h4v5"/>
    </svg>
    <span class="popup-name">{{ buildingName }}</span>
  </div>
  <button class="popup-close" @click="emit('close')">
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
  </button>
</div>
```

Replace the detail button:
```html
<button class="popup-detail-btn" @click="emit('show-detail')">
  查看详情
  <svg class="btn-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6 3l5 5-5 5"/></svg>
</button>
```

Style replacement:

```vue
<style scoped>
.building-popup {
  position: fixed;
  z-index: 1000;
  pointer-events: auto;
  animation: popup-in 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes popup-in {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.popup-content {
  background: var(--bg-panel);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-panel);
  width: 240px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: rgba(0, 229, 255, 0.06);
  border-bottom: 1px solid rgba(0, 229, 255, 0.1);
}

.popup-name-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.popup-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: var(--accent-cyan);
}

.popup-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-cyan);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.popup-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 2px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: color var(--duration-fast) ease, background var(--duration-fast) ease;
}

.popup-close svg {
  width: 14px;
  height: 14px;
}

.popup-close:hover {
  color: #ff6b6b;
  background: rgba(255, 100, 100, 0.1);
}

.popup-body {
  padding: 8px 12px;
}

.popup-row {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
}

.popup-label {
  color: var(--text-secondary);
  min-width: 40px;
  flex-shrink: 0;
}

.popup-value {
  color: var(--text-primary);
}

.popup-detail-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  padding: 8px;
  background: rgba(0, 229, 255, 0.06);
  border: none;
  border-top: 1px solid rgba(0, 229, 255, 0.08);
  color: var(--accent-cyan);
  font-size: 12px;
  cursor: pointer;
  transition: background var(--duration-fast) ease;
}

.popup-detail-btn:hover {
  background: rgba(0, 229, 255, 0.12);
}

.btn-arrow {
  width: 14px;
  height: 14px;
  transition: transform var(--duration-fast) ease;
}

.popup-detail-btn:hover .btn-arrow {
  transform: translateX(3px);
}
</style>
```

- [ ] **Step 3: Verify TypeScript compilation**

```bash
cd ucas_earth && npx vue-tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add ucas_earth/src/components/HoverTooltip.vue ucas_earth/src/components/BuildingPopup.vue
git commit -m "style: Observatory animations and glassmorphism for HoverTooltip and BuildingPopup"
```

---

### Task 5: EditPanel — Modal Restyle

**Files:**
- Modify: `ucas_earth/src/components/EditPanel.vue`

- [ ] **Step 1: Update EditPanel.vue**

Replace the `<style scoped>` section. Add modal entry animation, input focus glow, form row hover effect.

Style replacement:

```vue
<style scoped>
.edit-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-panel {
  background: rgba(6, 13, 21, 0.95);
  border: 1px solid var(--border-glass);
  border-top: 2px solid var(--accent-cyan);
  border-radius: var(--radius-panel);
  width: 420px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
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

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 229, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-title {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.5px;
}

.panel-subtitle {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
  flex: 1;
}

.close-btn {
  background: transparent;
  border: 0;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: color var(--duration-fast) ease, background var(--duration-fast) ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.panel-body {
  overflow-y: auto;
  padding: 12px 20px;
  flex: 1;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 4px;
  border-radius: 4px;
  transition: background var(--duration-fast) ease;
}

.form-row:hover {
  background: rgba(0, 229, 255, 0.03);
}

.form-label {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 100px;
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  background: var(--bg-surface);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
  transition: border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
}

.form-input:focus {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.15);
}

.panel-footer {
  padding: 12px 20px;
  border-top: 1px solid rgba(0, 229, 255, 0.08);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  padding: 8px 20px;
  cursor: pointer;
  font-size: 13px;
  transition: border-color var(--duration-fast) ease, background var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
}

.btn-cancel {
  background: rgba(30, 30, 30, 0.6);
  color: var(--text-secondary);
}

.btn-cancel:hover {
  background: rgba(50, 50, 50, 0.8);
  border-color: var(--border-glow);
}

.btn-save {
  background: var(--bg-surface);
  color: var(--text-primary);
}

.btn-save:hover {
  border-color: var(--accent-cyan);
  box-shadow: var(--glow-cyan);
  background: rgba(0, 229, 255, 0.08);
}

.empty-tip {
  padding: 24px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}
</style>
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd ucas_earth && npx vue-tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add ucas_earth/src/components/EditPanel.vue
git commit -m "style: Observatory modal redesign for EditPanel — glassmorphism, input glow, animations"
```

---

### Task 6: CesiumViewer — Container + HUD Corners

**Files:**
- Modify: `ucas_earth/src/components/CesiumViewer.vue`

- [ ] **Step 1: Update CesiumViewer template and styles**

The template needs an additional wrapper for bottom HUD corners (CSS only allows 2 pseudo-elements per element). Replace the template:

```vue
<template>
  <div class="viewer-wrap">
    <div class="hud-corner hud-tl"></div>
    <div class="hud-corner hud-tr"></div>
    <div class="hud-corner hud-bl"></div>
    <div class="hud-corner hud-br"></div>
    <div id="cesium_container"></div>
  </div>
</template>
```

Replace the `<style scoped>` section:

```vue
<style scoped>
.viewer-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  border: 1px solid rgba(0, 229, 255, 0.12);
  border-radius: var(--radius-panel);
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

#cesium_container {
  width: 100%;
  height: 100%;
}

/* HUD 装饰角标 */
.hud-corner {
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: rgba(0, 229, 255, 0.4);
  border-style: solid;
  z-index: 1;
  pointer-events: none;
}

.hud-tl {
  top: 8px;
  left: 8px;
  border-width: 2px 0 0 2px;
}

.hud-tr {
  top: 8px;
  right: 8px;
  border-width: 2px 2px 0 0;
}

.hud-bl {
  bottom: 8px;
  left: 8px;
  border-width: 0 0 2px 2px;
}

.hud-br {
  bottom: 8px;
  right: 8px;
  border-width: 0 2px 2px 0;
}
</style>
```

- [ ] **Step 2: Update App.vue background**

In `ucas_earth/src/App.vue`, update the `.app-shell` style:

```css
.app-shell {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: 64px 1fr;
  background:
    radial-gradient(circle at 30% 0%, rgba(0, 40, 60, 0.3) 0%, transparent 50%),
    var(--bg-deep);
}
```

- [ ] **Step 3: Verify TypeScript compilation**

```bash
cd ucas_earth && npx vue-tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add ucas_earth/src/components/CesiumViewer.vue ucas_earth/src/App.vue
git commit -m "style: Observatory HUD corners for Cesium viewer + App background update"
```

---

### Task 7: Final Verification

- [ ] **Step 1: Run full type check**

```bash
cd ucas_earth && npx vue-tsc --noEmit
```
Expected: No errors.

- [ ] **Step 2: Start dev server and visual check**

```bash
cd ucas_earth && npm run dev
```

Open `http://localhost:5173` in browser. Verify:
- Header has Rajdhani font title, cyan title-bar, SVG icons, date with dot indicator
- Side panels have glassmorphism effect (blur visible when earth is behind)
- Panel headers have gradient separator line and cyan title-bar
- Chevron icons rotate on collapse/expand
- Selected items have left cyan border
- HoverTooltip has fade-up entry animation
- BuildingPopup has scale-in entry animation, arrow slides on hover
- EditPanel has modal entry animation, inputs glow cyan on focus
- Cesium container has HUD corner brackets
- Scrollbars are thin and cyan-tinted

- [ ] **Step 3: Commit all remaining changes if any**

```bash
git status
```
If any uncommitted changes remain:
```bash
git add -A && git commit -m "style: final Observatory UI adjustments"
```
