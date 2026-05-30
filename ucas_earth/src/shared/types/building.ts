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
