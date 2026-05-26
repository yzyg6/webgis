# 楼体高度表现优化设计

## 目标

优化楼体的 3D 表现形式：
- 修复高度读取逻辑，支持小写 `height` 属性
- 使用蓝色渐变颜色表示建筑高度差异（矮楼浅色，高楼深色）

## 架构

```
GeoJSON properties
    ↓ Height / height / building:levels
readBuildingHeight()
    ↓ 统一读取高度值
getBuildingColor(height)
    ↓ 根据高度计算渐变颜色
applyFeatureExtrusion()
    ↓ 应用高度和颜色
Cesium 3D 渲染
```

## 改动范围

### 1. 修复高度读取（CesiumViewer.vue）

**当前问题：**
- `readBuildingHeight` 只检查 `Height`（大写）
- 部分 GeoJSON 数据使用 `height`（小写）

**修复方案：**
同时检查 `Height` 和 `height`，优先级：`Height` > `height` > `building:levels` > 默认值

```typescript
const readBuildingHeight = (properties: Cesium.PropertyBag | undefined): number => {
  if (!properties) return DEFAULT_BUILDING_HEIGHT;

  const values = properties.getValue(Cesium.JulianDate.now()) as Record<string, unknown> | undefined;
  if (!values) return DEFAULT_BUILDING_HEIGHT;

  // 优先检查 Height（大写），然后 height（小写）
  const height = parseHeightValue(values.Height) || parseHeightValue(values.height);
  if (height !== null) return height;

  // 检查 building:levels
  const levels = parseHeightValue(values["building:levels"]);
  if (levels !== null) return levels * FLOOR_HEIGHT;

  return DEFAULT_BUILDING_HEIGHT;
};
```

### 2. 高度颜色渐变（CesiumViewer.vue）

**颜色方案：蓝色渐变**

| 高度范围 | 颜色 | 说明 |
|---------|------|------|
| < 10 米 | `#a8d8ff` | 浅蓝（矮楼） |
| 10-20 米 | `#7ccfff` | 中蓝（中楼） |
| 20-30 米 | `#4db8ff` | 蓝色（较高楼） |
| > 30 米 | `#1a8cff` | 深蓝（高楼） |

**实现方式：**
使用 RGB 线性插值，根据高度在 minH(5m) 到 maxH(40m) 范围内平滑过渡。

```typescript
const getBuildingColor = (height: number): Cesium.Color => {
  const minH = 5;
  const maxH = 40;
  const ratio = Math.min(1, Math.max(0, (height - minH) / (maxH - minH)));

  // 浅蓝 #a8d8ff (168, 216, 255) → 深蓝 #1a8cff (26, 140, 255)
  const r = (168 + (26 - 168) * ratio) / 255;
  const g = (216 + (140 - 216) * ratio) / 255;
  const b = 255 / 255;

  return new Cesium.Color(r, g, b, 0.7);
};
```

### 3. 修改 applyFeatureExtrusion

在应用建筑样式时，使用 `getBuildingColor(height)` 替代固定颜色：

```typescript
const applyFeatureExtrusion = (dataSource: Cesium.GeoJsonDataSource): void => {
  for (const entity of dataSource.entities.values) {
    if (!entity.polygon) continue;

    const properties = entity.properties;
    const featureResult = getFeatureType(properties);
    const featureType = featureResult.type;
    const style = FEATURE_STYLES[featureType];
    const height = readFeatureHeight(properties, featureType);

    entity.polygon.height = new Cesium.ConstantProperty(0);
    entity.polygon.extrudedHeight = new Cesium.ConstantProperty(height);

    // 建筑使用高度渐变颜色，其他类型使用固定颜色
    if (featureType === 'building') {
      entity.polygon.material = new Cesium.ColorMaterialProperty(getBuildingColor(height));
    } else {
      entity.polygon.material = new Cesium.ColorMaterialProperty(
        Cesium.Color.fromCssColorString(style.color).withAlpha(style.alpha)
      );
    }

    entity.polygon.outline = new Cesium.ConstantProperty(true);
    entity.polygon.outlineColor = new Cesium.ConstantProperty(
      Cesium.Color.fromCssColorString(style.outlineColor).withAlpha(style.outlineAlpha)
    );
  }
};
```

## 验证标准

1. TypeScript 编译通过
2. 现有单元测试通过（33/33）
3. 有 `Height` 属性的建筑：正确显示高度差异
4. 有 `height`（小写）属性的建筑：正确读取高度
5. 无高度数据的建筑：使用默认高度 12 米
6. 建筑颜色随高度变化：矮楼浅蓝，高楼深蓝
7. 道路/水体/绿地：保持原有固定颜色
