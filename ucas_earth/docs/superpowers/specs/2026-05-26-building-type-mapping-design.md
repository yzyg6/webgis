# 校园建筑类型动态映射设计

## 目标

为所有 GeoJSON 建筑数据统一添加校园功能分类类型，实现：
- 加载任意 GeoJSON 时自动识别建筑类型
- 在 UI 中显示建筑类型信息
- 集中管理映射规则，便于维护和扩展

## 架构

采用动态映射方案：不修改原始 GeoJSON 文件，而是在数据加载时根据 properties 字段智能判断建筑类型。

```
GeoJSON 加载 → properties 解析 → 映射规则匹配 → BuildingType 类型
     ↓
CesiumViewer 渲染（可用类型区分样式）
     ↓
BuildingPopup / HoverTooltip 显示类型
```

## 建筑类型枚举

```typescript
export type BuildingType = 
  | 'teaching'      // 教学类：教学楼、实验楼、图书馆
  | 'residential'   // 住宿类：学生宿舍、教师公寓
  | 'service'       // 生活服务类：食堂、超市、医院
  | 'office'        // 行政办公类：行政楼、办公楼
  | 'sports'        // 体育类：体育馆、操场、运动场
  | 'other';        // 其他
```

## 映射规则

### 1. 关键词映射（name 字段）

| 关键词 | 类型 |
|--------|------|
| 教学楼、实验楼、图书馆、逸夫、教室 | teaching |
| 宿舍、公寓 | residential |
| 食堂、餐厅、超市、商店、医院 | service |
| 行政楼、办公楼、办公室 | office |
| 体育馆、操场、运动场、球场 | sports |

### 2. Function 字段映射（FUYANG_Building.geojson）

| Function 值 | 类型 |
|-------------|------|
| Office | office |
| Residence | residential |
| Public service | service |
| Education | teaching |

### 3. building 字段映射（OSM 标准）

| building 值 | 类型 |
|-------------|------|
| university | teaching |
| apartments | residential |
| dormitory | residential |
| commercial | service |
| office | office |
| yes | other |

### 4. 默认值

无匹配时返回 `'other'`

## 实现细节

### 新增文件

1. **`src/types/building.ts`** - 建筑类型定义
2. **`src/data/building-type-mapping.ts`** - 映射配置和函数

### 修改文件

1. **`src/components/CesiumViewer.vue`**
   - `getFeatureType()` 中集成 `getBuildingType()`
   - 可选：根据类型使用不同渲染颜色

2. **`src/components/BuildingPopup.vue`**
   - 显示建筑类型名称

3. **`src/components/HoverTooltip.vue`**
   - 在悬停提示中显示类型

## 类型显示名称

```typescript
export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  teaching: '教学楼',
  residential: '宿舍',
  service: '生活服务',
  office: '行政办公',
  sports: '体育场馆',
  other: '其他',
};
```

## 验证标准

1. TypeScript 编译通过
2. 现有单元测试通过（12/12）
3. 加载 fynu_xihu_campus.geojson 后，建筑弹窗显示正确类型
4. 加载 FUYANG_Building.geojson 后，建筑弹窗显示正确类型
5. HoverTooltip 显示类型信息

## 范围限制

- 不修改原始 GeoJSON 文件
- 不改变现有渲染逻辑（仅添加类型显示）
- 映射规则可通过配置文件扩展
