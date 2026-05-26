# 课程表功能设计

**日期**: 2026-05-26
**状态**: 已批准
**范围**: 课程表管理、地图可视化、Excel 导入

---

## 1. 目标

为 FYUN 校园地球可视化系统添加课程表功能，支持在地图上可视化每天的上课地点，通过建筑气泡标注显示课程信息，并支持从 Excel 批量导入课程数据。

## 2. 设计决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 架构方案 | 独立课程表模块 | 模块化清晰，不影响现有功能，便于扩展 |
| 地图可视化 | 建筑气泡标注 | 直观显示课程分布，不遮挡建筑信息 |
| 侧边栏入口 | 新增 📅 图标 | 与其他面板风格一致，操作便捷 |
| 时间显示 | 今日课程高亮 | 简洁明了，突出当前课程 |
| 数据存储 | PostgreSQL | 支持复杂查询，数据独立管理 |
| 数据导入 | Excel 导入 | 批量导入便捷，符合用户习惯 |

## 3. 数据模型

### 3.1 PostgreSQL 表结构

```sql
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,           -- 课程名称
  classroom VARCHAR(50) NOT NULL,        -- 教室（如 "301"）
  building_name VARCHAR(100) NOT NULL,   -- 建筑名称（关联 BuildingMeta.name）
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 1 AND 7),  -- 星期几 1-7
  start_time TIME NOT NULL,              -- 开始时间
  end_time TIME NOT NULL,                -- 结束时间
  week_range VARCHAR(50) NOT NULL,       -- 周数范围（如 "1-16" 或 "1,3,5,7"）
  teacher VARCHAR(50),                   -- 教师姓名
  course_type VARCHAR(20) DEFAULT 'required',  -- 课程类型：required/elective
  credits DECIMAL(3,1) DEFAULT 0,        -- 学分
  homework_due TIMESTAMP,                -- 作业截止时间
  exam_time TIMESTAMP,                   -- 考试时间
  evaluation TEXT,                       -- 课程评价
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_courses_building ON courses(building_name);
CREATE INDEX idx_courses_weekday ON courses(weekday);
```

### 3.2 TypeScript 接口

```typescript
// api/courses.ts
export interface Course {
  id: number;
  name: string;
  classroom: string;
  buildingName: string;
  weekday: number;  // 1-7
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  weekRange: string;  // "1-16" 或 "1,3,5,7"
  teacher?: string;
  courseType: 'required' | 'elective';
  credits: number;
  homeworkDue?: string;
  examTime?: string;
  evaluation?: string;
}

export interface CourseCreateInput {
  name: string;
  classroom: string;
  buildingName: string;
  weekday: number;
  startTime: string;
  endTime: string;
  weekRange: string;
  teacher?: string;
  courseType?: 'required' | 'elective';
  credits?: number;
  homeworkDue?: string;
  examTime?: string;
}

export interface CourseImportRow {
  name: string;
  classroom: string;
  buildingName: string;
  weekday: number;
  startTime: string;
  endTime: string;
  weekRange: string;
  teacher?: string;
  courseType?: string;
  credits?: number;
  homeworkDue?: string;
  examTime?: string;
}
```

### 3.3 API 接口

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | /api/courses | 获取所有课程 |
| GET | /api/courses/today | 获取今日课程 |
| GET | /api/courses/week/:weekNumber | 获取指定周数的课程 |
| GET | /api/courses/building/:buildingName | 获取指定建筑的课程 |
| POST | /api/courses | 创建课程 |
| PUT | /api/courses/:id | 更新课程 |
| DELETE | /api/courses/:id | 删除课程 |
| POST | /api/courses/import | 批量导入课程（Excel） |
| GET | /api/courses/template | 下载 Excel 模板 |

## 4. 组件架构

### 4.1 新增组件

```
src/components/
├── CoursePanel.vue          # 侧边栏课程表管理面板
├── CourseBubble.vue         # 地图建筑气泡标注
├── CourseDetail.vue         # 课程详情弹窗
├── CourseForm.vue           # 课程添加/编辑表单
└── CourseImport.vue         # Excel 导入组件
```

### 4.2 组件职责

#### CoursePanel.vue

侧边栏课程表管理面板，40px 图标 + 内容区。

- **Props**: `courses: Course[]`, `currentWeek: number`, `currentDay: number`
- **Emits**: `addCourse`, `editCourse`, `deleteCourse`, `importCourses`
- **功能**:
  - 显示当前周数和星期
  - 显示今日课程列表（按时间排序）
  - 高亮正在进行的课程
  - 添加/编辑/删除课程按钮
  - Excel 导入按钮
  - 建筑筛选（可选）

#### CourseBubble.vue

Cesium 实体组件，在建筑上方显示气泡。

- **Props**: `buildingName: string`, `courseCount: number`, `nextCourseTime: string`, `isActive: boolean`
- **功能**:
  - 在建筑中心上方 50px 显示气泡
  - 显示课程数量和最近课程时间
  - 进行中课程显示绿色边框
  - 点击触发 CourseDetail 弹窗

#### CourseDetail.vue

课程详情弹窗。

- **Props**: `visible: boolean`, `buildingName: string`, `courses: Course[]`, `x: number`, `y: number`
- **Emits**: `close`, `editCourse`
- **功能**:
  - 显示该建筑今日所有课程
  - 课程详情卡片（时间、课程名、教室、教师）
  - 快速编辑入口

#### CourseForm.vue

课程添加/编辑表单弹窗。

- **Props**: `visible: boolean`, `course?: Course`, `buildings: string[]`
- **Emits**: `save`, `cancel`
- **功能**:
  - 课程信息录入表单
  - 建筑选择（下拉列表）
  - 教室输入
  - 时间选择器
  - 周数范围输入（支持 "1-16" 或 "1,3,5" 格式）
  - 表单验证

#### CourseImport.vue

Excel 导入组件。

- **Props**: `visible: boolean`
- **Emits**: `import`, `cancel`
- **功能**:
  - Excel 文件上传
  - 列映射配置
  - 数据预览
  - 错误提示
  - 下载模板按钮

### 4.3 修改组件

#### SidebarNav.vue
- 新增第 4 个图标：📅 课程表
- 图标 ID: `'course'`

#### SidebarContainer.vue
- 新增 CoursePanel 的渲染逻辑
- 传递课程相关 props 和 events

#### App.vue
- 新增课程相关状态管理
- 新增课程 API 调用逻辑
- 新增课程气泡管理

#### CesiumViewer.vue
- 新增 CourseBubble 渲染逻辑
- 处理气泡点击事件

## 5. 交互流程

### 5.1 课程管理

```
用户点击侧边栏 📅 图标
  → CoursePanel 展开
  → 显示今日课程列表
  → 点击 "+" 按钮
  → CourseForm 弹窗打开
  → 填写课程信息
  → 保存到 PostgreSQL
  → 地图气泡更新
```

### 5.2 Excel 导入

```
用户点击 "导入 Excel" 按钮
  → CourseImport 弹窗打开
  → 上传 .xlsx 文件
  → 解析并预览数据
  → 用户确认列映射
  → 批量导入到 PostgreSQL
  → 刷新课程列表
```

### 5.3 地图交互

```
页面加载
  → 获取今日课程
  → 按建筑分组
  → 在建筑上方添加气泡标注
  → 气泡显示课程数量

用户点击气泡
  → CourseDetail 弹窗打开
  → 显示该建筑今日所有课程
  → 显示课程详情
```

### 5.4 时间高亮

```
当前时间在课程时间内
  → 课程卡片高亮显示
  → 气泡显示 "进行中" 状态
```

## 6. 视觉规范

### 6.1 气泡标注

| 属性 | 值 |
|------|-----|
| 形状 | 圆角矩形 |
| 背景 | `var(--bg-panel)` + 80% 透明度 |
| 边框 | `var(--border-primary)` |
| 阴影 | `var(--shadow-panel)` |
| 圆角 | 8px |
| 内边距 | 8px 12px |
| 字体 | 12px |
| 位置 | 建筑中心上方 50px |
| 高亮 | 进行中时显示绿色边框 `#4CAF50` |

### 6.2 课程卡片

| 属性 | 值 |
|------|-----|
| 背景 | `var(--bg-card)` |
| 边框 | `var(--border-subtle)` |
| 圆角 | 6px |
| 内边距 | 10px 12px |
| 时间字体 | 11px, `var(--text-secondary)` |
| 课程名字体 | 13px, `var(--text-primary)` |
| 教室字体 | 11px, `var(--text-muted)` |
| 进行中 | 左边框 3px, `#4CAF50` |

### 6.3 表单样式

| 属性 | 值 |
|------|-----|
| 输入框背景 | `var(--bg-input)` |
| 输入框边框 | `var(--border-input)` |
| 输入框聚焦 | `var(--border-input-focus)` |
| 标签字体 | 12px, `var(--text-label)` |
| 必填标记 | 红色 * |

## 7. Excel 导入格式

### 7.1 标准模板

| 课程名称 | 教室 | 建筑名称 | 星期 | 开始时间 | 结束时间 | 周数范围 | 教师 | 课程类型 | 学分 | 作业截止 | 考试时间 |
|---------|------|---------|------|---------|---------|---------|------|---------|------|---------|---------|
| 高等数学 | 301 | 教学楼A | 1 | 08:00 | 09:40 | 1-16 | 张三 | 必修 | 4 | | 2026-06-20 |
| 英语听说 | 201 | 外语楼 | 3 | 14:00 | 15:40 | 1-8 | 李四 | 选修 | 2 | 2026-05-30 | |
| 数据结构 | 405 | 计算机楼 | 2 | 10:00 | 11:40 | 1-16 | 王五 | 必修 | 3 | | |
| 体育 | 操场 | 体育馆 | 5 | 15:00 | 16:40 | 1-16 | 赵六 | 必修 | 1 | | |

### 7.2 列说明

| 列名 | 必填 | 说明 |
|------|------|------|
| 课程名称 | ✅ | 课程全称 |
| 教室 | ✅ | 教室编号或名称 |
| 建筑名称 | ✅ | 必须与 BuildingMeta.name 匹配 |
| 星期 | ✅ | 1-7，1=周一，7=周日 |
| 开始时间 | ✅ | HH:mm 格式 |
| 结束时间 | ✅ | HH:mm 格式 |
| 周数范围 | ✅ | 支持 "1-16"、"1,3,5,7"、"1-8,10-16"、"单周"、"双周" |
| 教师 | ❌ | 教师姓名 |
| 课程类型 | ❌ | "必修" 或 "选修"，默认 "必修" |
| 学分 | ❌ | 数字，默认 0 |
| 作业截止 | ❌ | YYYY-MM-DD HH:mm 格式 |
| 考试时间 | ❌ | YYYY-MM-DD HH:mm 格式 |

### 7.3 周数范围格式

| 格式 | 示例 | 说明 |
|------|------|------|
| 范围 | `1-16` | 第1到16周 |
| 列表 | `1,3,5,7` | 第1、3、5、7周 |
| 混合 | `1-8,10-16` | 第1到8周和第10到16周 |
| 单周 | `单周` | 自动转换为 1,3,5,7,9,11,13,15 |
| 双周 | `双周` | 自动转换为 2,4,6,8,10,12,14,16 |

## 8. 示例 Excel 文件

项目将提供示例 Excel 文件 `data/course_template.xlsx`，包含：

1. **模板表**：标准列结构，无数据
2. **示例数据表**：包含 5-10 条示例课程数据
3. **说明表**：列说明和格式要求

### 示例数据内容

| 课程名称 | 教室 | 建筑名称 | 星期 | 开始时间 | 结束时间 | 周数范围 | 教师 | 课程类型 | 学分 |
|---------|------|---------|------|---------|---------|---------|------|---------|------|
| 高等数学 | 301 | 教学楼A | 1 | 08:00 | 09:40 | 1-16 | 张三 | 必修 | 4 |
| 大学英语 | 201 | 外语楼 | 1 | 10:00 | 11:40 | 1-16 | 李四 | 必修 | 3 |
| 数据结构 | 405 | 计算机楼 | 2 | 14:00 | 15:40 | 1-16 | 王五 | 必修 | 3 |
| 体育 | 操场 | 体育馆 | 3 | 15:00 | 16:40 | 1-16 | 赵六 | 必修 | 1 |
| 线性代数 | 302 | 教学楼A | 4 | 08:00 | 09:40 | 1-16 | 钱七 | 必修 | 3 |
| 思政课 | 101 | 综合楼 | 5 | 10:00 | 11:40 | 1-16 | 孙八 | 必修 | 2 |
| 选修课 | 501 | 艺术楼 | 6 | 14:00 | 15:40 | 1-8 | 周九 | 选修 | 2 |

## 9. 不做的事情

- 不修改现有建筑信息功能
- 不添加课程冲突检测（可后续扩展）
- 不添加课程提醒功能（可后续扩展）
- 不添加课程评价系统（可后续扩展）
- 不添加课程分享功能

## 10. 后续扩展

- 课程冲突检测
- 课程提醒（浏览器通知）
- 课程评价和笔记
- 课程分享（导出为图片/PDF）
- 多学期支持
- 课程统计分析
