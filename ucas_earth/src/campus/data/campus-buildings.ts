export type BuildingMeta = {
  name: string;
  purpose: string;
  floors: number;
  capacity: number;
  college: string;
  contact: string;
  description?: string;
};

const MOCK_BUILDING_METAS = new Map<string, BuildingMeta>([
  ['西湖校区图书馆', {
    name: '西湖校区图书馆',
    purpose: '图书馆',
    floors: 6,
    capacity: 2000,
    college: '校直属',
    contact: '0558-2596001',
    description: '阜阳师范大学西湖校区图书馆，馆藏纸质图书200余万册。',
  }],
  ['西湖校区教学楼A', {
    name: '西湖校区教学楼A',
    purpose: '教学楼',
    floors: 5,
    capacity: 1500,
    college: '教务处',
    contact: '0558-2596100',
    description: '主要用于公共课和通识课教学。',
  }],
  ['西湖校区教学楼B', {
    name: '西湖校区教学楼B',
    purpose: '教学楼',
    floors: 5,
    capacity: 1200,
    college: '教务处',
    contact: '0558-2596101',
    description: '主要用于专业课教学。',
  }],
  ['西湖校区实验楼', {
    name: '西湖校区实验楼',
    purpose: '实验楼',
    floors: 4,
    capacity: 800,
    college: '实验中心',
    contact: '0558-2596200',
    description: '物理、化学、生物实验室集中区域。',
  }],
  ['西湖校区行政楼', {
    name: '西湖校区行政楼',
    purpose: '办公楼',
    floors: 4,
    capacity: 300,
    college: '校办公室',
    contact: '0558-2596000',
    description: '学校行政办公中心。',
  }],
  ['西湖校区体育馆', {
    name: '西湖校区体育馆',
    purpose: '体育场馆',
    floors: 2,
    capacity: 3000,
    college: '体育学院',
    contact: '0558-2596300',
    description: '含篮球场、羽毛球场、乒乓球室等。',
  }],
  ['西湖校区学生食堂', {
    name: '西湖校区学生食堂',
    purpose: '食堂',
    floors: 2,
    capacity: 2500,
    college: '后勤处',
    contact: '0558-2596400',
    description: '可同时容纳2500人就餐。',
  }],
  ['西湖校区学生宿舍1号楼', {
    name: '西湖校区学生宿舍1号楼',
    purpose: '学生宿舍',
    floors: 6,
    capacity: 600,
    college: '学生处',
    contact: '0558-2596500',
    description: '男生宿舍，标准4人间。',
  }],
]);

export const getBuildingMeta = (name: string): BuildingMeta | null => {
  return MOCK_BUILDING_METAS.get(name) ?? null;
};

export const getAllBuildingMetas = (): BuildingMeta[] => {
  return Array.from(MOCK_BUILDING_METAS.values());
};

export const searchBuildingMetas = (query: string): BuildingMeta[] => {
  const lowerQuery = query.toLowerCase();
  if (!lowerQuery.trim()) return [];
  return getAllBuildingMetas().filter((meta) =>
    meta.name.toLowerCase().includes(lowerQuery) ||
    meta.purpose.toLowerCase().includes(lowerQuery) ||
    meta.college.toLowerCase().includes(lowerQuery) ||
    meta.description?.toLowerCase().includes(lowerQuery)
  );
};

// 预留数据库接口
export const loadBuildingMetaFromDb = async (): Promise<BuildingMeta[]> => {
  // TODO: 实现从 PostgreSQL 加载建筑元数据
  return getAllBuildingMetas();
};
