# 建筑高度滑块实时调节 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 BuildingPopup 中添加高度滑块，拖动时实时更新 3D 楼高和渐变颜色，松开后持久化到 GeoJSON。

**Architecture:** CesiumViewer 暴露 `updateBuildingHeight` 方法直接操作实体，BuildingPopup 添加滑块 UI 并 emit 事件，App.vue 连接两者并处理持久化。

**Tech Stack:** TypeScript, Vue 3 Composition API, CesiumJS

---

## File Structure

```
src/
├── components/
│   ├── CesiumViewer.vue    # MODIFY - 新增 updateBuildingHeight 方法
│   ├── BuildingPopup.vue   # MODIFY - 添加高度滑块 UI
│   └── App.vue             # MODIFY - 连接事件 + 持久化
```

---

### Task 1: CesiumViewer.vue — 新增 updateBuildingHeight 方法

**Files:**
- Modify: `src/components/CesiumViewer.vue:493`

- [ ] **Step 1: 读取当前 defineExpose**

读取 `src/components/CesiumViewer.vue` 文件，找到 `defineExpose({ flyToBuildingByName })` （约 493 行）。

- [ ] **Step 2: 添加 updateBuildingHeight 方法**

在 `defineExpose` 之前（`flyToBuildingByName` 函数之后），添加以下代码：

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
```

然后将 `defineExpose` 修改为：

```typescript
defineExpose({ flyToBuildingByName, updateBuildingHeight });
```

- [ ] **Step 3: 验证 TypeScript 编译**

Run: `cd T:/gkhw/cesium_demo/ucas_earth && npx vue-tsc --noEmit`
Expected: 编译通过，无错误

- [ ] **Step 4: Commit**

```bash
git add src/components/CesiumViewer.vue
git commit -m "feat: CesiumViewer 暴露 updateBuildingHeight 方法"
```

---

### Task 2: BuildingPopup.vue — 添加高度滑块

**Files:**
- Modify: `src/components/BuildingPopup.vue`

- [ ] **Step 1: 读取当前 BuildingPopup.vue**

读取 `src/components/BuildingPopup.vue` 文件，了解当前 props、emits 和模板结构。

- [ ] **Step 2: 修改 emits 定义**

将现有的 emits：

```typescript
const emit = defineEmits<{
	'show-detail': [];
	close: [];
}>();
```

修改为：

```typescript
const emit = defineEmits<{
	'show-detail': [];
	close: [];
	'heightChange': [height: number];
	'heightChangeEnd': [height: number];
}>();
```

- [ ] **Step 3: 修改 props 定义**

将现有的 props：

```typescript
const props = defineProps<{
	visible: boolean;
	x: number;
	y: number;
	buildingName: string;
	buildingType?: BuildingType;
	courses: Course[];
}>();
```

修改为：

```typescript
const props = defineProps<{
	visible: boolean;
	x: number;
	y: number;
	buildingName: string;
	buildingType?: BuildingType;
	courses: Course[];
	currentHeight?: number;
}>();
```

- [ ] **Step 4: 添加 sliderHeight ref 和 watch**

在 `import` 语句中确认已有 `ref` 和 `watch`（当前只有 `computed`），需要添加：

```typescript
import { computed, ref, watch } from 'vue';
```

然后在 `buildingTypeLabel` computed 之前添加：

```typescript
const sliderHeight = ref(props.currentHeight ?? 12);

watch(() => props.currentHeight, (val) => {
	if (val !== undefined) {
		sliderHeight.value = val;
	}
});

const onHeightInput = (): void => {
	emit('heightChange', sliderHeight.value);
};

const onHeightChange = (): void => {
	emit('heightChangeEnd', sliderHeight.value);
};
```

- [ ] **Step 5: 添加滑块 UI**

在模板中，在 `<div class="popup-header">` 之后、`<div class="popup-body">` 之前，添加滑块区域：

```html
<div class="popup-height">
	<div class="height-label">
		<span class="height-text">高度</span>
		<span class="height-value">{{ sliderHeight }}m</span>
	</div>
	<input
		type="range"
		class="height-slider"
		:min="5"
		:max="50"
		:step="1"
		v-model.number="sliderHeight"
		@input="onHeightInput"
		@change="onHeightChange"
	/>
	<div class="height-range">
		<span>5m</span>
		<span>50m</span>
	</div>
</div>
```

- [ ] **Step 6: 添加滑块样式**

在 `<style scoped>` 中，在 `.popup-body` 样式之前添加：

```css
.popup-height {
	padding: 8px 12px;
	border-bottom: 1px solid var(--border-subtle);
}

.height-label {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 6px;
}

.height-text {
	font-size: 11px;
	color: var(--text-label);
	font-weight: 500;
}

.height-value {
	font-size: 13px;
	font-weight: 600;
	color: var(--text-accent);
}

.height-slider {
	width: 100%;
	height: 4px;
	-webkit-appearance: none;
	appearance: none;
	background: var(--border-subtle);
	border-radius: 2px;
	outline: none;
	cursor: pointer;
}

.height-slider::-webkit-slider-thumb {
	-webkit-appearance: none;
	appearance: none;
	width: 14px;
	height: 14px;
	border-radius: 50%;
	background: var(--text-accent);
	cursor: pointer;
}

.height-range {
	display: flex;
	justify-content: space-between;
	font-size: 10px;
	color: var(--text-muted);
	margin-top: 4px;
}
```

- [ ] **Step 7: 验证 TypeScript 编译**

Run: `cd T:/gkhw/cesium_demo/ucas_earth && npx vue-tsc --noEmit`
Expected: 编译通过，无错误

- [ ] **Step 8: Commit**

```bash
git add src/components/BuildingPopup.vue
git commit -m "feat: BuildingPopup 添加高度滑块 UI"
```

---

### Task 3: App.vue — 连接事件和持久化

**Files:**
- Modify: `src/App.vue:592-601`

- [ ] **Step 1: 读取当前 BuildingPopup 使用**

读取 `src/App.vue` 文件，找到 BuildingPopup 组件使用（约 592-601 行）。

- [ ] **Step 2: 更新 BuildingPopup 传参**

将现有的 BuildingPopup 使用：

```html
<BuildingPopup
	:visible="buildingPopupInfo !== null"
	:x="buildingPopupInfo?.x ?? 0"
	:y="buildingPopupInfo?.y ?? 0"
	:building-name="String(buildingPopupInfo?.properties?.name || buildingPopupInfo?.properties?.Name || '')"
	:building-type="currentBuildingType"
	:courses="coursesByBuilding.get(String(buildingPopupInfo?.properties?.name || buildingPopupInfo?.properties?.Name || '')) ?? []"
	@show-detail="handleShowBuildingDetail"
	@close="buildingPopupInfo = null"
/>
```

修改为：

```html
<BuildingPopup
	:visible="buildingPopupInfo !== null"
	:x="buildingPopupInfo?.x ?? 0"
	:y="buildingPopupInfo?.y ?? 0"
	:building-name="String(buildingPopupInfo?.properties?.name || buildingPopupInfo?.properties?.Name || '')"
	:building-type="currentBuildingType"
	:courses="coursesByBuilding.get(String(buildingPopupInfo?.properties?.name || buildingPopupInfo?.properties?.Name || '')) ?? []"
	:current-height="Number(buildingPopupInfo?.properties?.Height ?? buildingPopupInfo?.properties?.height ?? 12)"
	:layer-id="buildingPopupInfo?.layerId ?? ''"
	:feature-index="buildingPopupInfo?.featureIndex ?? 0"
	@height-change="handleHeightChange"
	@height-change-end="handleHeightChangeEnd"
	@show-detail="handleShowBuildingDetail"
	@close="buildingPopupInfo = null"
/>
```

- [ ] **Step 3: 添加 handleHeightChange 函数**

在 `handleShowBuildingDetail` 函数之前，添加：

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

- [ ] **Step 4: 验证 TypeScript 编译**

Run: `cd T:/gkhw/cesium_demo/ucas_earth && npx vue-tsc --noEmit`
Expected: 编译通过，无错误

- [ ] **Step 5: Commit**

```bash
git add src/App.vue
git commit -m "feat: App.vue 连接高度滑块事件和持久化"
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
2. 单击建筑 → 弹出 BuildingPopup，显示高度滑块
3. 拖动滑块 → 3D 楼高实时变化，颜色随高度渐变（浅蓝→深蓝）
4. 松开滑块 → 高度值持久化
5. 关闭弹窗再重新打开 → 滑块显示上次保存的高度
6. 道路/水体/绿地 → 不弹出 BuildingPopup

- [ ] **Step 5: Final Commit**

```bash
git add -A
git commit -m "feat: 完成建筑高度滑块实时调节"
```
