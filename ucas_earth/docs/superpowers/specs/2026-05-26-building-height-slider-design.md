# 建筑高度滑块实时调节设计

## 目标

在 BuildingPopup 弹窗中添加高度滑块，用户拖动滑块时实时更新 3D 楼高和渐变颜色，松开后持久化到 GeoJSON。

## 架构

```
BuildingPopup (滑块 input)
  → emit('heightChange', height)
  → App.vue
  → cesiumViewerRef.updateBuildingHeight(layerId, featureIndex, height)
  → 直接修改 entity.polygon.extrudedHeight + material
  → 视觉即时更新

滑块松开 (change 事件)
  → emit('heightChangeEnd', height)
  → App.vue 更新 GeoJSON + 数据库持久化
```

核心思路：滑块拖动时直接操作 Cesium 实体（毫秒级响应），松开后才写入 GeoJSON（避免频繁序列化）。

## 改动范围

### 1. CesiumViewer.vue

**新增方法：** `updateBuildingHeight(layerId, featureIndex, height)`

通过 featureIndex 定位实体，直接修改 `extrudedHeight` 和渐变颜色，无需重新加载整个图层。

```typescript
const updateBuildingHeight = (layerId: string, featureIndex: number, height: number): void => {
    const dataSource = cityModelDataSources.get(layerId);
    if (!dataSource) return;
    const entities = dataSource.entities.values;
    const entity = entities[featureIndex] as EntityWithPolygon;
    if (!entity?.polygon) return;

    entity.polygon.extrudedHeight = new Cesium.ConstantProperty(height);
    entity.polygon.material = new Cesium.ColorMaterialProperty(getBuildingColor(height));
};

defineExpose({ flyToBuildingByName, updateBuildingHeight });
```

### 2. BuildingPopup.vue

**新增 Props：**
- `layerId: string` — 图层 ID
- `featureIndex: number` — 要素索引
- `currentHeight: number` — 当前高度值

**新增 Events：**
- `heightChange(height: number)` — 滑块拖动时触发（input 事件）
- `heightChangeEnd(height: number)` — 滑块松开时触发（change 事件）

**新增 UI：** 在建筑名称下方、今日课程上方添加滑块区域

```
┌─────────────────────┐
│ 逸夫图书馆  教学楼   │
│─────────────────────│
│ 高度: ═══●═══ 18m   │
│        5m      50m  │
│─────────────────────│
│ 今日课程             │
│ 08:00-09:40 数据结构  │
│─────────────────────│
│  查看详情 →          │
└─────────────────────┘
```

**实现细节：**
- 本地 `sliderHeight` ref 跟踪拖动中的值
- `@input` 触发 `emit('heightChange', sliderHeight)` — 实时更新 3D
- `@change` 触发 `emit('heightChangeEnd', sliderHeight)` — 松开后持久化
- 滑块范围：5m - 50m
- 显示当前高度数值

### 3. App.vue

**BuildingPopup 传参更新：**
```html
<BuildingPopup
    :current-height="Number(buildingPopupInfo?.properties?.Height ?? buildingPopupInfo?.properties?.height ?? 12)"
    :layer-id="buildingPopupInfo?.layerId ?? ''"
    :feature-index="buildingPopupInfo?.featureIndex ?? 0"
    @height-change="handleHeightChange"
    @height-change-end="handleHeightChangeEnd"
/>
```

**新增事件处理：**
```typescript
const handleHeightChange = (height: number): void => {
    if (!buildingPopupInfo.value) return;
    cesiumViewerRef.value?.updateBuildingHeight(
        buildingPopupInfo.value.layerId,
        buildingPopupInfo.value.featureIndex,
        height
    );
};

const handleHeightChangeEnd = (height: number): void => {
    if (!buildingPopupInfo.value) return;
    const info = buildingPopupInfo.value;
    const layer = cityLayers.value.find((l) => l.id === info.layerId);
    if (!layer) return;
    const fc = layer.geojson as { features: { properties: Record<string, unknown> }[] };
    if (fc.features && fc.features[info.featureIndex]) {
        fc.features[info.featureIndex]!.properties.Height = height;
        fc.features[info.featureIndex]!.properties.height = height;
    }
    layer.geojson = markRaw({ ...layer.geojson });
    info.properties.Height = height;
    info.properties.height = height;

    dbUpdateLayer(layer.name, layer.geojson).catch((err) => {
        console.warn("Failed to sync height to database:", err);
    });
};
```

## 验证标准

1. TypeScript 编译通过
2. 现有单元测试通过（33/33）
3. 单击建筑弹出 BuildingPopup，显示高度滑块
4. 拖动滑块：3D 楼高实时变化，颜色随高度渐变（浅蓝→深蓝）
5. 松开滑块：高度值持久化到 GeoJSON
6. 道路/水体/绿地：不显示滑块（BuildingPopup 不会弹出）
7. 滑块范围 5-50m，显示当前高度数值
