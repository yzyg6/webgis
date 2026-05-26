# 校园建筑类型动态映射 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为所有 GeoJSON 建筑数据统一添加校园功能分类类型（教学类、住宿类、生活服务类、行政办公类、体育类），实现加载时自动识别并在 UI 中显示。

**Architecture:** 采用动态映射方案，不修改原始 GeoJSON 文件。创建独立的类型定义和映射模块，在数据加载时根据 properties 字段（name 关键词、Function、building）智能判断建筑类型。

**Tech Stack:** TypeScript, Vue 3 Composition API, Vitest

---

## File Structure

```
src/
├── types/
│   └── building.ts                    # NEW - BuildingType 枚举和标签
├── data/
│   └── building-type-mapping.ts       # NEW - 映射配置和 getBuildingType 函数
├── utils/
│   └── __tests__/
│       └── building-type-mapping.test.ts  # NEW - 单元测试
├── components/
│   ├── CesiumViewer.vue               # MODIFY - 集成 getBuildingType
│   ├── BuildingPopup.vue              # MODIFY - 显示建筑类型
│   └── HoverTooltip.vue               # MODIFY - 显示建筑类型
```

---

### Task 1: 创建建筑类型定义

**Files:**
- Create: `src/types/building.ts`

- [ ] **Step 1: 创建 BuildingType 类型定义文件**

```typescript
// src/types/building.ts

/** 校园建筑功能分类 */
export type BuildingType =
  | 'teaching'      // 教学类：教学楼、实验楼、图书馆
  | 'residential'   // 住宿类：学生宿舍、教师公寓
  | 'service'       // 生活服务类：食堂、超市、医院
  | 'office'        // 行政办公类：行政楼、办公楼
  | 'sports'        // 体育类：体育馆、操场、运动场
  | 'other';        // 其他

/** 建筑类型显示名称 */
export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  teaching: '教学楼',
  residential: '宿舍',
  service: '生活服务',
  office: '行政办公',
  sports: '体育场馆',
  other: '其他',
};
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `cd T:/gkhw/cesium_demo/ucas_earth && npx vue-tsc --noEmit`
Expected: 编译通过，无错误

- [ ] **Step 3: Commit**

```bash
git add src/types/building.ts
git commit -m "feat: 添加 BuildingType 类型定义"
```

---

### Task 2: 创建建筑类型映射模块

**Files:**
- Create: `src/data/building-type-mapping.ts`

- [ ] **Step 1: 创建映射配置和函数**

```typescript
// src/data/building-type-mapping.ts
import type { BuildingType } from '../types/building';

/** name 字段关键词到类型的映射 */
const KEYWORD_MAP: Array<{ keywords: string[]; type: BuildingType }> = [
  { keywords: ['教学楼', '实验楼', '图书馆', '逸夫', '教室', '教学'], type: 'teaching' },
  { keywords: ['宿舍', '公寓', '学生宿舍', '教师公寓'], type: 'residential' },
  { keywords: ['食堂', '餐厅', '超市', '商店', '医院', '便利店'], type: 'service' },
  { keywords: ['行政楼', '办公楼', '办公室', '行政'], type: 'office' },
  { keywords: ['体育馆', '操场', '运动场', '球场', '游泳池', '健身房'], type: 'sports' },
];

/** Function 字段映射（FUYANG_Building.geojson） */
const FUNCTION_MAP: Record<string, BuildingType> = {
  'Office': 'office',
  'Residence': 'residential',
  'Public service': 'service',
  'Education': 'teaching',
};

/** building 字段映射（OSM 标准） */
const OSM_BUILDING_MAP: Record<string, BuildingType> = {
  'university': 'teaching',
  'apartments': 'residential',
  'dormitory': 'residential',
  'commercial': 'service',
  'office': 'office',
  'civic': 'office',
  'government': 'office',
};

/**
 * 根据 GeoJSON properties 判断建筑类型
 * 优先级：name 关键词 > Function 字段 > building 字段 > 默认 'other'
 */
export function getBuildingType(properties: Record<string, unknown>): BuildingType {
  // 1. 优先检查 name 字段关键词
  const name = String(properties.name || properties.Name || '');
  for (const { keywords, type } of KEYWORD_MAP) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return type;
    }
  }

  // 2. 检查 Function 字段
  const func = String(properties.Function || properties.function || '');
  if (func && FUNCTION_MAP[func]) {
    return FUNCTION_MAP[func];
  }

  // 3. 检查 building 字段
  const building = String(properties.building || '');
  if (building && OSM_BUILDING_MAP[building]) {
    return OSM_BUILDING_MAP[building];
  }

  // 4. 默认返回 'other'
  return 'other';
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `cd T:/gkhw/cesium_demo/ucas_earth && npx vue-tsc --noEmit`
Expected: 编译通过，无错误

- [ ] **Step 3: Commit**

```bash
git add src/data/building-type-mapping.ts
git commit -m "feat: 添加建筑类型映射模块"
```

---

### Task 3: 编写单元测试

**Files:**
- Create: `src/utils/__tests__/building-type-mapping.test.ts`

- [ ] **Step 1: 创建测试文件**

```typescript
// src/utils/__tests__/building-type-mapping.test.ts
import { describe, it, expect } from 'vitest';
import { getBuildingType } from '../../data/building-type-mapping';

describe('getBuildingType', () => {
  describe('name 关键词映射', () => {
    it('应识别教学楼', () => {
      expect(getBuildingType({ name: '教学楼A' })).toBe('teaching');
    });

    it('应识别图书馆', () => {
      expect(getBuildingType({ name: '阜阳师范大学逸夫图书馆' })).toBe('teaching');
    });

    it('应识别实验楼', () => {
      expect(getBuildingType({ name: '实验楼' })).toBe('teaching');
    });

    it('应识别宿舍', () => {
      expect(getBuildingType({ name: '学生宿舍1号楼' })).toBe('residential');
    });

    it('应识别食堂', () => {
      expect(getBuildingType({ name: '学生食堂' })).toBe('service');
    });

    it('应识别行政楼', () => {
      expect(getBuildingType({ name: '行政楼' })).toBe('office');
    });

    it('应识别体育馆', () => {
      expect(getBuildingType({ name: '体育馆' })).toBe('sports');
    });

    it('应识别操场', () => {
      expect(getBuildingType({ name: '操场' })).toBe('sports');
    });
  });

  describe('Function 字段映射', () => {
    it('应识别 Office', () => {
      expect(getBuildingType({ Function: 'Office' })).toBe('office');
    });

    it('应识别 Residence', () => {
      expect(getBuildingType({ Function: 'Residence' })).toBe('residential');
    });

    it('应识别 Public service', () => {
      expect(getBuildingType({ Function: 'Public service' })).toBe('service');
    });

    it('应识别 Education', () => {
      expect(getBuildingType({ Function: 'Education' })).toBe('teaching');
    });
  });

  describe('building 字段映射', () => {
    it('应识别 university', () => {
      expect(getBuildingType({ building: 'university' })).toBe('teaching');
    });

    it('应识别 apartments', () => {
      expect(getBuildingType({ building: 'apartments' })).toBe('residential');
    });

    it('应识别 commercial', () => {
      expect(getBuildingType({ building: 'commercial' })).toBe('service');
    });
  });

  describe('默认值', () => {
    it('空属性应返回 other', () => {
      expect(getBuildingType({})).toBe('other');
    });

    it('未知属性应返回 other', () => {
      expect(getBuildingType({ foo: 'bar' })).toBe('other');
    });

    it('building=yes 应返回 other', () => {
      expect(getBuildingType({ building: 'yes' })).toBe('other');
    });
  });

  describe('优先级', () => {
    it('name 优先于 Function', () => {
      expect(getBuildingType({ name: '教学楼A', Function: 'Office' })).toBe('teaching');
    });

    it('name 优先于 building', () => {
      expect(getBuildingType({ name: '食堂', building: 'university' })).toBe('service');
    });

    it('Function 优先于 building', () => {
      expect(getBuildingType({ Function: 'Office', building: 'university' })).toBe('office');
    });
  });
});
```

- [ ] **Step 2: 运行测试验证通过**

Run: `cd T:/gkhw/cesium_demo/ucas_earth && npx vitest run src/utils/__tests__/building-type-mapping.test.ts`
Expected: 全部测试通过

- [ ] **Step 3: Commit**

```bash
git add src/utils/__tests__/building-type-mapping.test.ts
git commit -m "test: 添加建筑类型映射单元测试"
```

---

### Task 4: 集成到 CesiumViewer.vue

**Files:**
- Modify: `src/components/CesiumViewer.vue`

- [ ] **Step 1: 导入 getBuildingType 函数**

在 `<script setup>` 的 import 部分添加：

```typescript
import { getBuildingType } from '../data/building-type-mapping';
import type { BuildingType } from '../types/building';
```

- [ ] **Step 2: 修改 getFeatureType 函数**

将现有的 `getFeatureType` 函数（约 186-222 行）修改为同时返回建筑子类型：

```typescript
const getFeatureType = (properties: Cesium.PropertyBag | undefined): { type: FeatureType; buildingType?: BuildingType } => {
	if (!properties) {
		return { type: 'other' };
	}

	const values = properties.getValue(Cesium.JulianDate.now()) as Record<string, unknown> | undefined;
	if (!values) {
		return { type: 'other' };
	}

	// Check for building
	if (values.building !== undefined && values.building !== null) {
		return { type: 'building', buildingType: getBuildingType(values) };
	}

	// Check for road
	if (values.highway || values.road || values.road_type) {
		return { type: 'road' };
	}

	// Check for water
	if (values.water || values.waterway || values.natural === 'water') {
		return { type: 'water' };
	}

	// Check for green space
	if (values.landuse === 'grass' || values.landuse === 'forest' || values.leisure === 'park' || values.natural === 'wood') {
		return { type: 'green' };
	}

	// Check for building by height properties
	if (values.Height !== undefined || values.height !== undefined || values["building:levels"] !== undefined) {
		return { type: 'building', buildingType: getBuildingType(values) };
	}

	return { type: 'other' };
};
```

- [ ] **Step 3: 更新 getFeatureType 调用处**

搜索文件中所有调用 `getFeatureType` 的地方，更新为使用新的返回值格式。需要将 `featureType` 改为 `featureResult.type`，并可选地存储 `featureResult.buildingType`。

- [ ] **Step 4: 验证 TypeScript 编译**

Run: `cd T:/gkhw/cesium_demo/ucas_earth && npx vue-tsc --noEmit`
Expected: 编译通过，无错误

- [ ] **Step 5: Commit**

```bash
git add src/components/CesiumViewer.vue
git commit -m "feat: CesiumViewer 集成建筑类型识别"
```

---

### Task 5: 更新 BuildingPopup.vue 显示建筑类型

**Files:**
- Modify: `src/components/BuildingPopup.vue`

- [ ] **Step 1: 添加 buildingType 属性**

在 props 定义中添加 `buildingType`：

```typescript
import { computed } from 'vue';
import type { Course } from '../types/courses';
import type { BuildingType } from '../types/building';
import { BUILDING_TYPE_LABELS } from '../types/building';

const props = defineProps<{
  visible: boolean;
  x: number;
  y: number;
  buildingName: string;
  buildingType?: BuildingType;
  courses: Course[];
}>();

const buildingTypeLabel = computed(() => {
  return props.buildingType ? BUILDING_TYPE_LABELS[props.buildingType] : '';
});
```

- [ ] **Step 2: 更新模板显示类型**

在 popup-header 中添加类型显示：

```html
<div class="popup-header">
  <div class="popup-header-info">
    <span class="popup-name">{{ buildingName }}</span>
    <span class="popup-type" v-if="buildingTypeLabel">{{ buildingTypeLabel }}</span>
  </div>
  <button class="popup-close" @click="emit('close')">✕</button>
</div>
```

- [ ] **Step 3: 添加类型样式**

在 `<style scoped>` 中添加：

```css
.popup-header-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.popup-type {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}
```

- [ ] **Step 4: 验证 TypeScript 编译**

Run: `cd T:/gkhw/cesium_demo/ucas_earth && npx vue-tsc --noEmit`
Expected: 编译通过，无错误

- [ ] **Step 5: Commit**

```bash
git add src/components/BuildingPopup.vue
git commit -m "feat: BuildingPopup 显示建筑类型"
```

---

### Task 6: 更新 App.vue 传递 buildingType

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: 导入 getBuildingType**

在 `<script setup>` 的 import 部分添加：

```typescript
import { getBuildingType } from './data/building-type-mapping';
```

- [ ] **Step 2: 添加计算属性获取当前建筑类型**

```typescript
const currentBuildingType = computed(() => {
  if (!buildingPopupInfo.value) return undefined;
  const properties = buildingPopupInfo.value.properties as Record<string, unknown>;
  return getBuildingType(properties);
});
```

- [ ] **Step 3: 更新 BuildingPopup 组件传参**

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

- [ ] **Step 4: 验证 TypeScript 编译**

Run: `cd T:/gkhw/cesium_demo/ucas_earth && npx vue-tsc --noEmit`
Expected: 编译通过，无错误

- [ ] **Step 5: Commit**

```bash
git add src/App.vue
git commit -m "feat: App.vue 传递建筑类型到 BuildingPopup"
```

---

### Task 7: 更新 HoverTooltip.vue 显示建筑类型

**Files:**
- Modify: `src/components/HoverTooltip.vue`

- [ ] **Step 1: 导入 getBuildingType 和 BUILDING_TYPE_LABELS**

```typescript
import { getBuildingType } from '../data/building-type-mapping';
import { BUILDING_TYPE_LABELS } from '../types/building';
```

- [ ] **Step 2: 添加计算属性获取建筑类型**

```typescript
const buildingType = computed(() => {
  const type = getBuildingType(props.properties as Record<string, unknown>);
  return BUILDING_TYPE_LABELS[type];
});
```

- [ ] **Step 3: 更新模板显示类型**

在 tooltip 的 buildingName 后面添加类型显示：

```html
<div class="tooltip-name" v-if="buildingName">
  {{ buildingName }}
  <span class="tooltip-type" v-if="buildingType"> · {{ buildingType }}</span>
</div>
```

- [ ] **Step 4: 添加类型样式**

```css
.tooltip-type {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: normal;
}
```

- [ ] **Step 5: 验证 TypeScript 编译**

Run: `cd T:/gkhw/cesium_demo/ucas_earth && npx vue-tsc --noEmit`
Expected: 编译通过，无错误

- [ ] **Step 6: Commit**

```bash
git add src/components/HoverTooltip.vue
git commit -m "feat: HoverTooltip 显示建筑类型"
```

---

### Task 8: 最终验证

- [ ] **Step 1: 运行所有单元测试**

Run: `cd T:/gkhw/cesium_demo/ucas_earth && npx vitest run`
Expected: 所有测试通过

- [ ] **Step 2: TypeScript 类型检查**

Run: `cd T:/gkhw/cesium_demo/ucas_earth && npx vue-tsc --noEmit`
Expected: 编译通过，无错误

- [ ] **Step 3: 启动开发服务器验证**

Run: `cd T:/gkhw/cesium_demo/ucas_earth && npm run dev`
Expected: 开发服务器启动成功

- [ ] **Step 4: 在浏览器中验证**

1. 加载 fynu_xihu_campus.geojson
2. 点击建筑，验证弹窗显示正确的建筑类型
3. 悬停建筑，验证 tooltip 显示类型
4. 加载 FUYANG_Building.geojson，重复验证

- [ ] **Step 5: Final Commit**

```bash
git add -A
git commit -m "feat: 完成校园建筑类型动态映射功能"
```
