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
