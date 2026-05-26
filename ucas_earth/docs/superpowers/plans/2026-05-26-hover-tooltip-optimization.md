# 建筑悬停提示优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化鼠标悬停弹窗，只对建筑实体显示悬停提示，显示简洁的建筑信息（名称、类型、今日课程数）。

**Architecture:** 修改 CesiumViewer 的 hover handler 过滤非建筑实体，简化 HoverTooltip 为三行信息卡片，更新 App.vue 传递课程数据。

**Tech Stack:** TypeScript, Vue 3 Composition API, CesiumJS

---

## File Structure

```
src/
├── components/
│   ├── CesiumViewer.vue    # MODIFY - hover handler 增加 building 类型过滤
│   ├── HoverTooltip.vue    # MODIFY - 简化为名称+类型+课程数
│   └── App.vue             # MODIFY - 更新 HoverTooltip 传参
```

---

### Task 1: 修改 CesiumViewer.vue - 过滤非建筑实体

**Files:**
- Modify: `src/components/CesiumViewer.vue:521-543`

- [ ] **Step 1: 读取当前 hover handler 代码**

读取 `src/components/CesiumViewer.vue` 文件，找到 hover handler 部分（约 521-543 行）。

- [ ] **Step 2: 修改 hover handler 增加建筑类型过滤**

将现有的 hover handler：

```typescript
hoverHandler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
    const picked = viewer.scene.pick(movement.endPosition);
    if (Cesium.defined(picked) && Cesium.defined(picked.id) && picked.id instanceof Cesium.Entity) {
        const entity = toRaw(picked.id as Cesium.Entity);
        const result = findLayerIdForEntity(entity);
        if (result) {
            const featureIndex = findFeatureIndex(entity, result.dataSource);
            highlightEntity(entity);
            emit("hoverEntity", {
                layerId: result.layerId,
                featureIndex,
                properties: getEntityProperties(entity),
                x: movement.endPosition.x,
                y: movement.endPosition.y,
            });
            return;
        }
    }
    restoreHighlight();
    emit("hoverEntity", null);
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
```

修改为：

```typescript
hoverHandler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
    const picked = viewer.scene.pick(movement.endPosition);
    if (Cesium.defined(picked) && Cesium.defined(picked.id) && picked.id instanceof Cesium.Entity) {
        const entity = toRaw(picked.id as Cesium.Entity);
        const result = findLayerIdForEntity(entity);
        if (result) {
            const properties = getEntityProperties(entity);
            const featureResult = getFeatureType(entity.properties);

            // 只对建筑显示悬停
            if (featureResult.type !== 'building') {
                restoreHighlight();
                emit("hoverEntity", null);
                return;
            }

            const featureIndex = findFeatureIndex(entity, result.dataSource);
            highlightEntity(entity);
            emit("hoverEntity", {
                layerId: result.layerId,
                featureIndex,
                properties,
                x: movement.endPosition.x,
                y: movement.endPosition.y,
            });
            return;
        }
    }
    restoreHighlight();
    emit("hoverEntity", null);
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
```

- [ ] **Step 3: 验证 TypeScript 编译**

Run: `cd T:/gkhw/cesium_demo/ucas_earth && npx vue-tsc --noEmit`
Expected: 编译通过，无错误

- [ ] **Step 4: Commit**

```bash
git add src/components/CesiumViewer.vue
git commit -m "feat: hover handler 只对建筑实体显示悬停提示"
```

---

### Task 2: 简化 HoverTooltip.vue

**Files:**
- Modify: `src/components/HoverTooltip.vue`

- [ ] **Step 1: 读取当前 HoverTooltip.vue 内容**

读取 `src/components/HoverTooltip.vue` 文件，了解当前结构。

- [ ] **Step 2: 重写 HoverTooltip.vue**

将整个文件替换为以下内容：

```vue
<!-- ucas_earth/src/components/HoverTooltip.vue -->
<template>
  <div
    class="hover-tooltip"
    v-if="visible && buildingName"
    :style="{ left: x + 15 + 'px', top: y + 15 + 'px' }"
  >
    <div class="tooltip-content">
      <div class="tooltip-name">{{ buildingName }}</div>
      <div class="tooltip-info">
        <span v-if="buildingType">{{ buildingType }}</span>
        <span v-if="buildingType && courseCount !== undefined"> · </span>
        <span v-if="courseCount !== undefined">今日 {{ courseCount }} 节课</span>
      </div>
      <div class="tooltip-hint">双击查看详情</div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean;
  x: number;
  y: number;
  buildingName: string;
  buildingType?: string;
  courseCount?: number;
}

defineProps<Props>();
</script>

<style scoped>
.hover-tooltip {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
}

.tooltip-content {
  background: var(--bg-panel);
  border: 1px solid var(--border-tooltip);
  border-radius: 8px;
  min-width: 160px;
  max-width: 280px;
  box-shadow: var(--shadow-popup);
  overflow: hidden;
}

.tooltip-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  padding: 10px 12px 4px;
}

.tooltip-info {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 0 12px 8px;
}

.tooltip-hint {
  padding: 6px 12px;
  background: var(--bg-accent-subtle);
  border-top: 1px solid var(--border-subtle);
  font-size: 10px;
  color: var(--text-placeholder);
  text-align: center;
}
</style>
```

- [ ] **Step 3: 验证 TypeScript 编译**

Run: `cd T:/gkhw/cesium_demo/ucas_earth && npx vue-tsc --noEmit`
Expected: 编译通过，无错误

- [ ] **Step 4: Commit**

```bash
git add src/components/HoverTooltip.vue
git commit -m "refactor: 简化 HoverTooltip 为建筑信息卡片"
```

---

### Task 3: 更新 App.vue - HoverTooltip 传参

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: 读取当前 App.vue 中 HoverTooltip 的使用**

读取 `src/App.vue` 文件，找到 HoverTooltip 组件的使用位置。

- [ ] **Step 2: 添加必要的导入**

在 `<script setup>` 的 import 部分确认已有：

```typescript
import { getBuildingType } from './data/building-type-mapping';
import { BUILDING_TYPE_LABELS } from './types/building';
```

如果没有，添加这些导入。

- [ ] **Step 3: 更新 HoverTooltip 组件传参**

将现有的 HoverTooltip 使用：

```html
<HoverTooltip
    :visible="hoveredEntity !== null"
    :x="hoveredEntity?.x ?? 0"
    :y="hoveredEntity?.y ?? 0"
    :properties="hoveredEntity?.properties ?? {}"
/>
```

修改为：

```html
<HoverTooltip
    :visible="hoveredEntity !== null"
    :x="hoveredEntity?.x ?? 0"
    :y="hoveredEntity?.y ?? 0"
    :building-name="String(hoveredEntity?.properties?.name || hoveredEntity?.properties?.Name || '')"
    :building-type="hoveredEntity ? BUILDING_TYPE_LABELS[getBuildingType(hoveredEntity.properties)] : undefined"
    :course-count="coursesByBuilding.get(String(hoveredEntity?.properties?.name || hoveredEntity?.properties?.Name || ''))?.length"
/>
```

- [ ] **Step 4: 验证 TypeScript 编译**

Run: `cd T:/gkhw/cesium_demo/ucas_earth && npx vue-tsc --noEmit`
Expected: 编译通过，无错误

- [ ] **Step 5: Commit**

```bash
git add src/App.vue
git commit -m "feat: App.vue 更新 HoverTooltip 传参支持建筑类型和课程数"
```

---

### Task 4: 最终验证

- [ ] **Step 1: 运行所有单元测试**

Run: `cd T:/gkhw/cesium_demo/ucas_earth && npx vitest run`
Expected: 所有测试通过（33/33）

- [ ] **Step 2: TypeScript 类型检查**

Run: `cd T:/gkhw/cesium_demo/ucas_earth && npx vue-tsc --noEmit`
Expected: 编译通过，无错误

- [ ] **Step 3: 启动开发服务器验证**

Run: `cd T:/gkhw/cesium_demo/ucas_earth && npm run dev`
Expected: 开发服务器启动成功

- [ ] **Step 4: 在浏览器中验证**

1. 加载 GeoJSON 数据
2. 鼠标悬停在建筑上：应显示简洁的建筑信息卡片（名称、类型、今日课程数）
3. 鼠标悬停在道路/水体/绿地上：不应显示任何提示
4. 鼠标移开：提示立即消失
5. 双击建筑：仍然可以编辑属性

- [ ] **Step 5: Final Commit**

```bash
git add -A
git commit -m "feat: 完成建筑悬停提示优化"
```
