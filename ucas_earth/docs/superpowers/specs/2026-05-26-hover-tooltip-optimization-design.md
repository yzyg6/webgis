# 建筑悬停提示优化设计

## 目标

优化鼠标悬停弹窗效果：
- 只对建筑实体显示悬停提示（忽略道路、水体、绿地等）
- 显示简洁的建筑信息（名称、类型、今日课程数）
- 即时显示/隐藏，符合用户直觉

## 架构

```
CesiumViewer hover handler
    ↓ 判断 featureType === 'building'
    ↓ 只对建筑 emit hoverEntity
App.vue
    ↓ 传递 buildingName + coursesByBuilding
HoverTooltip
    ↓ 显示：名称 + 类型 + 今日课程数
```

## 改动范围

### 1. CesiumViewer.vue

**改动位置：** hover handler（约 521-543 行）

**改动内容：**
- 在 emit hoverEntity 之前，调用 `getFeatureType()` 判断类型
- 只有 `featureType === 'building'` 时才 emit 和高亮
- 非建筑实体调用 `restoreHighlight()` 并 emit null

```typescript
hoverHandler.setInputAction((movement) => {
  const picked = viewer.scene.pick(movement.endPosition);
  if (Cesium.defined(picked) && Cesium.defined(picked.id) && picked.id instanceof Cesium.Entity) {
    const entity = toRaw(picked.id);
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

### 2. HoverTooltip.vue

**改动内容：**
- 移除 `filteredProperties` 相关逻辑（HIDDEN_KEYS, IMPORTANT_KEYS, KEY_LABELS, formatValue）
- 添加 `courseCount` 属性
- 简化模板为三行：名称、类型+课程数、提示

**新 Props：**
```typescript
interface Props {
  visible: boolean;
  x: number;
  y: number;
  buildingName: string;
  buildingType?: string;
  courseCount?: number;
}
```

**新模板：**
```html
<div class="hover-tooltip" v-if="visible && buildingName"
  :style="{ left: x + 15 + 'px', top: y + 15 + 'px' }">
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
```

**新样式：**
```css
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
```

### 3. App.vue

**改动内容：**
- HoverTooltip 组件传参更新

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

## 验证标准

1. TypeScript 编译通过
2. 现有单元测试通过（33/33）
3. 鼠标悬停在建筑上：显示简洁的建筑信息卡片
4. 鼠标悬停在道路/水体/绿地上：不显示任何提示
5. 鼠标移开：提示立即消失
6. 双击建筑：仍然可以编辑属性
