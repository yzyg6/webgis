# 火星展示子项目设计文档

## 1. 项目概述

### 1.1 目标
创建一个火星展示子项目，用于教学演示、科学可视化和交互探索。

### 1.2 核心目标
- **教学演示** - 展示 Cesium 的高级功能（CZML、3D Tiles、自定义椭球体）
- **科学可视化** - 真实的火星地理数据展示
- **交互探索** - 用户可以自由探索火星表面

### 1.3 路由
`/mars`，与现有 `/campus` 并列。

---

## 2. 技术架构

### 2.1 文件结构
```
ucas_earth/src/
├── views/
│   └── MarsView.vue          # 火星主视图
├── components/
│   └── MarsPanel.vue         # 左侧信息面板
└── data/
    └── mars.ts               # 火星相关常量和配置
```

### 2.2 依赖
- **Cesium**：1.138（已有）
- **Cesium Ion 资产**：ID 3644333（火星 3D 瓦片）
- **CZML 数据**：火星车轨迹（好奇号、毅力号、机智号）
- **GeoJSON 数据**：火星地标

### 2.3 技术栈
- Vue 3.5（Composition API + `<script setup>`）
- TypeScript 5.9
- Cesium 1.138
- Vite 7

---

## 3. 核心功能

### 3.1 火星初始化
- 设置 `Cesium.Ellipsoid.MARS` 为默认椭球体
- 禁用地球相关的地形和底图
- 配置火星大气效果：
  - Mie 系数：`(9.0e-5, 2.0e-5, 1.0e-5)`
  - Rayleigh 系数：`(9.0e-6, 2.0e-6, 1.0e-6)`
  - Rayleigh 高度：9000m
  - Mie 高度：2700m
- 启用 HDR 和 Bloom 后处理

### 3.2 数据加载
#### 火星 3D 瓦片
- 来源：Cesium Ion asset 3644333
- 配置：`enableCollision: true`

#### 火星车轨迹
- 来源：本地 CZML 文件
- 实体：
  - Curiosity（好奇号）- 起始 Sol 3
  - Perseverance（毅力号）- 起始 Sol 13
  - Ingenuity（机智号）- 仅查看
  - TheMartianJourney（火星之旅）- 小说路线

#### 火星地标
- 来源：本地 GeoJSON 文件
- 显示：点 + 标签
- 交互：点击飞往

### 3.3 交互功能
#### 火星车选择
- 点击左侧面板中的火星车
- 飞往火星车当前位置
- 启动时间轴动画

#### 地标飞往
- 点击地标列表中的地标
- 飞往地标位置
- 显示详细信息

#### 轨迹动画
- 时间轴控制火星车移动
- 速度控制（multiplier）
- Sol 日期显示

#### 初始旋转
- 加载时火星自动旋转
- 用户交互后停止旋转

### 3.4 左侧面板（MarsPanel）
#### 火星车列表
- 好奇号（Curiosity）
- 毅力号（Perseverance）
- 机智号（Ingenuity）
- 火星之旅（The Martian Journey）

#### 地标列表
- 从 GeoJSON 动态加载
- 显示地标名称

#### 当前选中信息
- 显示选中实体的详细信息
- 火星车：当前位置、Sol 日期
- 地标：名称、描述、图片

---

## 4. 关键实现细节

### 4.1 Vue 3 适配
- 使用 `<script setup>` 语法
- 使用 `onMounted` 生命周期初始化 Cesium
- 使用 `ref` 和 `reactive` 管理状态
- 使用 `watch` 监听选中实体变化

### 4.2 代码复用
从参考代码提取：
- 火星初始化逻辑
- 火星车加载和配置
- 地标加载和配置
- 辅助函数：
  - `createWidthCallbackProperty` - 宽度回调
  - `createJulianDateToSolConverter` - Sol 日期转换
  - `createCanvasAsTexture` - Canvas 纹理
  - `createPickedFeatureDescription` - 特征描述

### 4.3 数据文件
需要从 Cesium 示例获取：
- `Mars.czml` - 火星车轨迹数据
- `MarsPointsOfInterest.geojson` - 火星地标数据

存放位置：`ucas_earth/public/data/mars/`

### 4.4 样式设计
- 左侧面板宽度：300px
- 背景色：深色主题（与现有系统一致）
- 字体：系统默认

---

## 5. 验证标准

1. **路由访问**：`/mars` 路由正常加载
2. **火星渲染**：显示火星 3D 瓦片和大气效果
3. **火星车轨迹**：显示好奇号、毅力号、机智号轨迹
4. **地标显示**：显示火星地标点和标签
5. **交互功能**：点击火星车/地标可飞往
6. **面板功能**：左侧面板正常显示和交互
7. **动画控制**：时间轴可控制火星车动画

---

## 6. 后续扩展

### 6.1 可能的功能
- 火星车详细信息弹窗
- 火星地形分析工具
- 火星车路径回放
- 火星车状态监控

### 6.2 数据扩展
- 更多火星车数据
- 火星地形数据
- 火星大气数据

---

## 7. 参考资料

- Cesium Mars 示例：https://sandcastle.cesium.com/?src=Mars.html
- Cesium Ion 资产：https://cesium.com/ion/assets/3644333
- CZML 格式：https://github.com/AnalyticalGraphicsInc/czml-writer/wiki/CZML-Guide
