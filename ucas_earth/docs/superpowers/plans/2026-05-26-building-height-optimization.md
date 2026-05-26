# 楼体高度表现优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化楼体 3D 表现形式，修复高度读取逻辑支持小写 `height`，使用蓝色渐变颜色表示建筑高度差异。

**Architecture:** 修改 CesiumViewer.vue 中的 `readBuildingHeight` 函数支持小写 height，新增 `getBuildingColor` 函数实现高度颜色渐变，修改 `applyFeatureExtrusion` 应用渐变颜色。

**Tech Stack:** TypeScript, Vue 3 Composition API, CesiumJS

---

## File Structure

```
src/
├── components/
│   └── CesiumViewer.vue    # MODIFY - 修复高度读取 + 添加颜色渐变
```

---

### Task 1: 修复高度读取逻辑

**Files:**
- Modify: `src/components/CesiumViewer.vue:226-247`

- [ ] **Step 1: 读取当前 readBuildingHeight 函数**

读取 `src/components/CesiumViewer.vue` 文件，找到 `readBuildingHeight` 函数（约 226-247 行）。

- [ ] **Step 2: 修改 readBuildingHeight 函数**

将现有的 `readBuildingHeight` 函数：

```typescript
const readBuildingHeight = (properties: Cesium.PropertyBag | undefined): number => {
	if (!properties) {
		return DEFAULT_BUILDING_HEIGHT;
	}

	const values = properties.getValue(Cesium.JulianDate.now()) as Record<string, unknown> | undefined;
	if (!values) {
		return DEFAULT_BUILDING_HEIGHT;
	}

	const height = parseHeightValue(values.Height);
	if (height !== null) {
		return height;
	}

	const levels = parseHeightValue(values["building:levels"]);
	if (levels !== null) {
		return levels * FLOOR_HEIGHT;
	}

	return DEFAULT_BUILDING_HEIGHT;
};
```

修改为：

```typescript
const readBuildingHeight = (properties: Cesium.PropertyBag | undefined): number => {
	if (!properties) {
		return DEFAULT_BUILDING_HEIGHT;
	}

	const values = properties.getValue(Cesium.JulianDate.now()) as Record<string, unknown> | undefined;
	if (!values) {
		return DEFAULT_BUILDING_HEIGHT;
	}

	// 优先检查 Height（大写），然后 height（小写）
	const height = parseHeightValue(values.Height) || parseHeightValue(values.height);
	if (height !== null) {
		return height;
	}

	// 检查 building:levels
	const levels = parseHeightValue(values["building:levels"]);
	if (levels !== null) {
		return levels * FLOOR_HEIGHT;
	}

	return DEFAULT_BUILDING_HEIGHT;
};
```

- [ ] **Step 3: 验证 TypeScript 编译**

Run: `cd T:/gkhw/cesium_demo/ucas_earth && npx vue-tsc --noEmit`
Expected: 编译通过，无错误

- [ ] **Step 4: Commit**

```bash
git add src/components/CesiumViewer.vue
git commit -m "fix: 修复建筑高度读取支持小写 height 属性"
```

---

### Task 2: 添加高度颜色渐变函数

**Files:**
- Modify: `src/components/CesiumViewer.vue`

- [ ] **Step 1: 在 readBuildingHeight 函数后添加 getBuildingColor 函数**

在 `readBuildingHeight` 函数之后，`readFeatureHeight` 函数之前，添加以下代码：

```typescript
/**
 * 根据建筑高度计算渐变颜色
 * 浅蓝 #a8d8ff (矮楼) → 深蓝 #1a8cff (高楼)
 */
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

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `cd T:/gkhw/cesium_demo/ucas_earth && npx vue-tsc --noEmit`
Expected: 编译通过，无错误

- [ ] **Step 3: Commit**

```bash
git add src/components/CesiumViewer.vue
git commit -m "feat: 添加建筑高度颜色渐变函数"
```

---

### Task 3: 修改 applyFeatureExtrusion 应用渐变颜色

**Files:**
- Modify: `src/components/CesiumViewer.vue:272-295`

- [ ] **Step 1: 读取当前 applyFeatureExtrusion 函数**

读取 `src/components/CesiumViewer.vue` 文件，找到 `applyFeatureExtrusion` 函数（约 272-295 行）。

- [ ] **Step 2: 修改 applyFeatureExtrusion 函数**

将现有的 `applyFeatureExtrusion` 函数中设置 material 的部分：

```typescript
entity.polygon.material = new Cesium.ColorMaterialProperty(
	Cesium.Color.fromCssColorString(style.color).withAlpha(style.alpha)
);
```

修改为：

```typescript
// 建筑使用高度渐变颜色，其他类型使用固定颜色
if (featureType === 'building') {
	entity.polygon.material = new Cesium.ColorMaterialProperty(getBuildingColor(height));
} else {
	entity.polygon.material = new Cesium.ColorMaterialProperty(
		Cesium.Color.fromCssColorString(style.color).withAlpha(style.alpha)
	);
}
```

完整的 `applyFeatureExtrusion` 函数应为：

```typescript
const applyFeatureExtrusion = (dataSource: Cesium.GeoJsonDataSource): void => {
	for (const entity of dataSource.entities.values as EntityWithPolygon[]) {
		if (!entity.polygon) {
			continue;
		}

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

- [ ] **Step 3: 验证 TypeScript 编译**

Run: `cd T:/gkhw/cesium_demo/ucas_earth && npx vue-tsc --noEmit`
Expected: 编译通过，无错误

- [ ] **Step 4: Commit**

```bash
git add src/components/CesiumViewer.vue
git commit -m "feat: 建筑使用高度渐变颜色渲染"
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

1. 加载 fynu_xihu_campus.geojson
2. 观察建筑颜色：有 Height 属性的建筑应显示不同深浅的蓝色
3. 高楼（如 20 米）应比矮楼（如 10 米）颜色更深
4. 道路/水体/绿地应保持原有固定颜色

- [ ] **Step 5: Final Commit**

```bash
git add -A
git commit -m "feat: 完成楼体高度表现优化"
```
