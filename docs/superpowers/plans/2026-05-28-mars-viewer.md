# 火星展示子项目实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建一个火星展示子项目，用于教学演示、科学可视化和交互探索

**Architecture:** 使用 Vue 3 + Cesium 实现火星 3D 可视化，包含火星车轨迹、地标和交互功能，通过 `/mars` 路由访问

**Tech Stack:** Vue 3.5, TypeScript 5.9, Cesium 1.138, Vite 7

---

## 文件结构

```
ucas_earth/src/
├── data/
│   └── mars.ts                    # 火星相关常量和配置
├── components/
│   └── MarsPanel.vue              # 左侧信息面板
├── views/
│   └── MarsView.vue               # 火星主视图
└── router/
    └── index.ts                   # 更新路由配置

ucas_earth/public/
└── data/
    └── mars/
        ├── Mars.czml              # 火星车轨迹数据
        └── MarsPointsOfInterest.geojson  # 火星地标数据
```

---

## Task 1: 创建火星数据配置文件

**Files:**
- Create: `ucas_earth/src/data/mars.ts`

- [ ] **Step 1: 创建火星常量配置文件**

```typescript
// 火星相关常量和配置

// Cesium Ion 资产 ID
export const MARS_ION_ASSET_ID = 3644333

// 火星大气配置
export const MARS_ATMOSPHERE = {
  mieCoefficient: [9.0e-5, 2.0e-5, 1.0e-5],
  rayleighCoefficient: [9.0e-6, 2.0e-6, 1.0e-6],
  rayleighScaleHeight: 9000,
  mieScaleHeight: 2700,
  saturationShift: -0.1,
}

// 火星后处理配置
export const MARS_POST_PROCESS = {
  bloom: {
    brightness: -0.5,
    stepSize: 1.0,
    sigma: 3.0,
    delta: 1.5,
  },
  exposure: 1.5,
}

// 火星车配置
export const MARS_ROVERS = [
  {
    id: 'Curiosity',
    name: '好奇号',
    startSol: 3,
    description: 'NASA 的火星探测车，于 2012 年着陆',
  },
  {
    id: 'Perseverance',
    name: '毅力号',
    startSol: 13,
    description: 'NASA 的火星探测车，于 2021 年着陆',
  },
  {
    id: 'Ingenuity',
    name: '机智号',
    description: '火星直升机，仅用于查看',
  },
  {
    id: 'TheMartianJourney',
    name: '火星之旅',
    description: '《火星救援》小说中的路线',
  },
]

// 火星车轨迹文件路径
export const MARS_CZML_PATH = '/data/mars/Mars.czml'

// 火星地标文件路径
export const MARS_LANDMARKS_PATH = '/data/mars/MarsPointsOfInterest.geojson'

// 初始相机位置（火星）
export const MARS_INITIAL_VIEW = {
  longitude: 137.4,
  latitude: -4.5,
  height: 10000000,
}

// Sol 日期转换常量
export const SECONDS_PER_SOL = 24 * 60 * 60 + 39 * 60 + 35

// 轨迹宽度配置
export const ROVER_PATH_WIDTH = {
  near: 0.0,
  nearValue: 15.0,
  far: 1.0e5,
  farValue: 0.0,
}

export const MARTIAN_JOURNEY_WIDTH = {
  near: 0.0,
  nearValue: 10.0,
  far: 1.0e7,
  farValue: 0.0,
}
```

- [ ] **Step 2: 验证文件创建**

Run: `ls -la ucas_earth/src/data/mars.ts`
Expected: 文件存在

- [ ] **Step 3: 提交**

```bash
git add ucas_earth/src/data/mars.ts
git commit -m "feat(mars): 添加火星数据配置文件"
```

---

## Task 2: 创建火星面板组件

**Files:**
- Create: `ucas_earth/src/components/MarsPanel.vue`

- [ ] **Step 1: 创建 MarsPanel 组件**

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { MARS_ROVERS } from '../data/mars'

interface Rover {
  id: string
  name: string
  startSol?: number
  description: string
}

interface Landmark {
  id: string
  name: string
  description?: string
}

const props = defineProps<{
  rovers: Rover[]
  landmarks: Landmark[]
  selectedRover: string | null
  selectedLandmark: string | null
}>()

const emit = defineEmits<{
  selectRover: [id: string]
  selectLandmark: [id: string]
}>()

const expandedSection = ref<'rovers' | 'landmarks'>('rovers')

const handleRoverClick = (id: string) => {
  emit('selectRover', id)
}

const handleLandmarkClick = (id: string) => {
  emit('selectLandmark', id)
}
</script>

<template>
  <div class="mars-panel">
    <div class="panel-header">
      <h2>火星探索</h2>
    </div>

    <div class="panel-content">
      <!-- 火星车列表 -->
      <div class="section">
        <div
          class="section-header"
          @click="expandedSection = expandedSection === 'rovers' ? 'landmarks' : 'rovers'"
        >
          <span class="section-title">火星车</span>
          <span class="expand-icon">
            {{ expandedSection === 'rovers' ? '▼' : '▶' }}
          </span>
        </div>
        <div v-if="expandedSection === 'rovers'" class="section-content">
          <div
            v-for="rover in rovers"
            :key="rover.id"
            class="list-item"
            :class="{ active: selectedRover === rover.id }"
            @click="handleRoverClick(rover.id)"
          >
            <div class="item-name">{{ rover.name }}</div>
            <div class="item-description">{{ rover.description }}</div>
          </div>
        </div>
      </div>

      <!-- 地标列表 -->
      <div class="section">
        <div
          class="section-header"
          @click="expandedSection = expandedSection === 'landmarks' ? 'rovers' : 'landmarks'"
        >
          <span class="section-title">地标</span>
          <span class="expand-icon">
            {{ expandedSection === 'landmarks' ? '▼' : '▶' }}
          </span>
        </div>
        <div v-if="expandedSection === 'landmarks'" class="section-content">
          <div
            v-for="landmark in landmarks"
            :key="landmark.id"
            class="list-item"
            :class="{ active: selectedLandmark === landmark.id }"
            @click="handleLandmarkClick(landmark.id)"
          >
            <div class="item-name">{{ landmark.name }}</div>
            <div v-if="landmark.description" class="item-description">
              {{ landmark.description }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mars-panel {
  width: 300px;
  height: 100%;
  background: var(--bg-panel, #1e1e1e);
  color: var(--text-primary, #ffffff);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color, #333);
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color, #333);
}

.panel-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
}

.section {
  border-bottom: 1px solid var(--border-color, #333);
}

.section-header {
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-section-header, #252525);
}

.section-header:hover {
  background: var(--bg-section-header-hover, #2a2a2a);
}

.section-title {
  font-weight: 500;
}

.expand-icon {
  font-size: 12px;
}

.section-content {
  max-height: 400px;
  overflow-y: auto;
}

.list-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color-light, #2a2a2a);
}

.list-item:hover {
  background: var(--bg-item-hover, #2a2a2a);
}

.list-item.active {
  background: var(--bg-item-active, #3a3a3a);
}

.item-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.item-description {
  font-size: 12px;
  color: var(--text-secondary, #999);
}
</style>
```

- [ ] **Step 2: 验证文件创建**

Run: `ls -la ucas_earth/src/components/MarsPanel.vue`
Expected: 文件存在

- [ ] **Step 3: 提交**

```bash
git add ucas_earth/src/components/MarsPanel.vue
git commit -m "feat(mars): 添加火星面板组件"
```

---

## Task 3: 创建火星视图组件

**Files:**
- Create: `ucas_earth/src/views/MarsView.vue`

- [ ] **Step 1: 创建 MarsView 组件**

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as Cesium from 'cesium'
import MarsPanel from '../components/MarsPanel.vue'
import {
  MARS_ION_ASSET_ID,
  MARS_ATMOSPHERE,
  MARS_POST_PROCESS,
  MARS_ROVERS,
  MARS_CZML_PATH,
  MARS_LANDMARKS_PATH,
  SECONDS_PER_SOL,
  ROVER_PATH_WIDTH,
  MARTIAN_JOURNEY_WIDTH,
} from '../data/mars'

// 状态
const selectedRover = ref<string | null>(null)
const selectedLandmark = ref<string | null>(null)
const landmarks = ref<Array<{ id: string; name: string; description?: string }>>([])

// Cesium 实例
let viewer: Cesium.Viewer | null = null
let dataSource: Cesium.CzmlDataSource | null = null
let landmarkDataSource: Cesium.GeoJsonDataSource | null = null

// 火星车实体
let curiosity: Cesium.Entity | null = null
let perseverance: Cesium.Entity | null = null
let ingenuity: Cesium.Entity | null = null
let theMartianJourney: Cesium.Entity | null = null

// 辅助函数：创建宽度回调属性
function createWidthCallbackProperty(nearFarScalar: { near: number; nearValue: number; far: number; farValue: number }) {
  return new Cesium.CallbackProperty(() => {
    if (!viewer) return 0
    const distance = viewer.camera.positionCartographic.height
    let t = (distance - nearFarScalar.near) / (nearFarScalar.far - nearFarScalar.near)
    t = Cesium.Math.clamp(t, 0.0, 1.0)
    return Cesium.Math.lerp(nearFarScalar.nearValue, nearFarScalar.farValue, t)
  }, false)
}

// 辅助函数：创建 Sol 日期转换器
function createJulianDateToSolConverter(startJulianDate: Cesium.JulianDate, startSol: number) {
  return (julianDate: Cesium.JulianDate) => {
    const differenceInSeconds = Cesium.JulianDate.secondsDifference(julianDate, startJulianDate)
    const solNumber = Math.floor(differenceInSeconds / SECONDS_PER_SOL) + startSol
    return `Sol ${solNumber}`
  }
}

// 辅助函数：创建 Canvas 纹理
function createCanvasAsTexture(text: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 256

  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  // 背景
  ctx.fillStyle = 'rgba(0, 0, 0, 0)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 文本
  ctx.font = '36px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.strokeStyle = 'rgba(0,0,0,0.1)'
  ctx.lineWidth = 1
  ctx.fillStyle = '#ffffff'

  ctx.strokeText(text, canvas.width / 2, canvas.height / 2)
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)

  return canvas
}

// 辅助函数：创建特征描述
function createPickedFeatureDescription(entity: Cesium.Entity) {
  const properties = entity.properties
  if (!properties) return ''

  return `<img
    width="50%"
    style="float:left; margin: 0 1em 1em 0;"
    src=${properties.imageURL?.getValue() || ''}>
  <p>${properties.description?.getValue() || ''}</p>
  <p>
    Source:
    <a style="color: white"
      target="_blank"
      href="${properties.sourceURL?.getValue() || ''}">${properties.source?.getValue() || ''}</a>
  </p>`
}

// 初始化 Cesium
async function initCesium() {
  // 创建 Viewer
  viewer = new Cesium.Viewer('mars-container', {
    terrainProvider: false,
    baseLayer: false,
    baseLayerPicker: false,
    geocoder: false,
    shadows: false,
    globe: new Cesium.Globe(Cesium.Ellipsoid.MARS),
    skyBox: Cesium.SkyBox.createEarthSkyBox(),
    skyAtmosphere: new Cesium.SkyAtmosphere(Cesium.Ellipsoid.MARS),
  })

  // 隐藏地球
  viewer.scene.globe.show = false

  // 配置大气效果
  const scene = viewer.scene
  scene.skyAtmosphere.atmosphereMieCoefficient = new Cesium.Cartesian3(
    MARS_ATMOSPHERE.mieCoefficient[0],
    MARS_ATMOSPHERE.mieCoefficient[1],
    MARS_ATMOSPHERE.mieCoefficient[2]
  )
  scene.skyAtmosphere.atmosphereRayleighCoefficient = new Cesium.Cartesian3(
    MARS_ATMOSPHERE.rayleighCoefficient[0],
    MARS_ATMOSPHERE.rayleighCoefficient[1],
    MARS_ATMOSPHERE.rayleighCoefficient[2]
  )
  scene.skyAtmosphere.atmosphereRayleighScaleHeight = MARS_ATMOSPHERE.rayleighScaleHeight
  scene.skyAtmosphere.atmosphereMieScaleHeight = MARS_ATMOSPHERE.mieScaleHeight
  scene.skyAtmosphere.saturationShift = MARS_ATMOSPHERE.saturationShift
  scene.skyAtmosphere.perFragmentAtmosphere = true

  // 配置后处理
  const bloom = scene.postProcessStages.bloom
  bloom.enabled = true
  bloom.uniforms.brightness = MARS_POST_PROCESS.bloom.brightness
  bloom.uniforms.stepSize = MARS_POST_PROCESS.bloom.stepSize
  bloom.uniforms.sigma = MARS_POST_PROCESS.bloom.sigma
  bloom.uniforms.delta = MARS_POST_PROCESS.bloom.delta
  scene.highDynamicRange = true
  scene.postProcessStages.exposure = MARS_POST_PROCESS.exposure

  // 加载火星 3D 瓦片
  try {
    const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(MARS_ION_ASSET_ID, {
      enableCollision: true,
    })
    scene.primitives.add(tileset)
  } catch (error) {
    console.error('加载火星瓦片失败:', error)
  }

  // 加载火星车轨迹
  await loadRovers()

  // 加载火星地标
  await loadLandmarks()

  // 设置初始旋转
  setupRotation()

  // 飞往火星
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(137.4, -4.5, 10000000),
    duration: 2,
  })
}

// 加载火星车轨迹
async function loadRovers() {
  if (!viewer) return

  try {
    dataSource = await Cesium.CzmlDataSource.load(MARS_CZML_PATH)
    viewer.dataSources.add(dataSource)

    // 设置火星车
    curiosity = setupRover('Curiosity', 3)
    perseverance = setupRover('Perseverance', 13)
    ingenuity = dataSource.entities.getById('Ingenuity')

    // 设置火星之旅
    theMartianJourney = dataSource.entities.getById('TheMartianJourney')
    if (theMartianJourney) {
      theMartianJourney.polyline!.width = createWidthCallbackProperty(MARTIAN_JOURNEY_WIDTH)
      theMartianJourney.rectangle!.material = new Cesium.ImageMaterialProperty({
        image: createCanvasAsTexture('Mark Watney\'s Journey in "The Martian"'),
        transparent: true,
      })
    }
  } catch (error) {
    console.error('加载火星车轨迹失败:', error)
  }
}

// 设置火星车
function setupRover(entityId: string, startSol: number) {
  if (!dataSource) return null

  const rover = dataSource.entities.getById(entityId)
  if (!rover) return null

  // 设置 Sol 日期标签
  const julianDateToSol = createJulianDateToSolConverter(rover.availability!.start, startSol)
  rover.label!.text = new Cesium.CallbackProperty((time) => {
    return julianDateToSol(time!)
  }, false)

  // 设置轨迹宽度
  const roverPath = dataSource.entities.getById(`${entityId}Path`)
  if (roverPath) {
    roverPath.polyline!.width = createWidthCallbackProperty(ROVER_PATH_WIDTH)
  }

  return rover
}

// 加载火星地标
async function loadLandmarks() {
  if (!viewer) return

  try {
    landmarkDataSource = await Cesium.GeoJsonDataSource.load(MARS_LANDMARKS_PATH)
    viewer.dataSources.add(landmarkDataSource)

    const entities = landmarkDataSource.entities.values
    entities.forEach((entity) => {
      // 设置标签
      entity.label = new Cesium.LabelGraphics({
        text: entity.properties?.text,
        font: '18pt Verdana',
        outlineColor: Cesium.Color.DARKSLATEGREY,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -22),
        scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.5),
        translucencyByDistance: new Cesium.NearFarScalar(2.5e7, 1.0, 4.0e7, 0.0),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      })

      // 设置点
      entity.point = new Cesium.PointGraphics({
        pixelSize: 10,
        color: Cesium.Color.fromBytes(243, 242, 99),
        outlineColor: Cesium.Color.fromBytes(219, 218, 111),
        outlineWidth: 2,
        scaleByDistance: new Cesium.NearFarScalar(1.5e3, 1.0, 4.0e7, 0.1),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      })

      // 设置描述
      entity.description = createPickedFeatureDescription(entity)

      // 添加到地标列表
      landmarks.value.push({
        id: entity.id,
        name: entity.properties?.text?.getValue() || entity.id,
        description: entity.properties?.description?.getValue(),
      })
    })
  } catch (error) {
    console.error('加载火星地标失败:', error)
  }
}

// 设置初始旋转
function setupRotation() {
  if (!viewer) return

  const rotationSpeed = Cesium.Math.toRadians(0.1)
  const removeRotation = viewer.scene.postRender.addEventListener(() => {
    viewer!.scene.camera.rotateRight(rotationSpeed)
  })

  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  const stopRotation = () => {
    removeRotation()
    handler.destroy()
  }

  handler.setInputAction(stopRotation, Cesium.ScreenSpaceEventType.LEFT_DOWN)
  handler.setInputAction(stopRotation, Cesium.ScreenSpaceEventType.RIGHT_DOWN)
  handler.setInputAction(stopRotation, Cesium.ScreenSpaceEventType.MIDDLE_DOWN)
  handler.setInputAction(stopRotation, Cesium.ScreenSpaceEventType.WHEEL)
}

// 飞往火星车
function flyToRover(roverId: string) {
  if (!viewer) return

  let rover: Cesium.Entity | null = null
  switch (roverId) {
    case 'Curiosity':
      rover = curiosity
      break
    case 'Perseverance':
      rover = perseverance
      break
    case 'Ingenuity':
      rover = ingenuity
      break
    case 'TheMartianJourney':
      rover = theMartianJourney
      break
  }

  if (!rover) return

  selectedRover.value = roverId
  selectedLandmark.value = null

  // 飞往火星车
  if (rover === theMartianJourney) {
    viewer.zoomTo(rover)
  } else {
    const position = rover.position?.getValue(viewer.clock.currentTime)
    if (position) {
      const boundingSphere = new Cesium.BoundingSphere(position, 5000.0)
      viewer.camera.flyToBoundingSphere(boundingSphere, {
        offset: new Cesium.HeadingPitchRoll(4.9791, -0.5294, 0.0),
        easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
        maximumHeight: 5e6,
        pitchAdjustHeight: 2.5e6,
        duration: 3.0,
      })
    }
  }
}

// 飞往地标
function flyToLandmark(landmarkId: string) {
  if (!viewer || !landmarkDataSource) return

  const entity = landmarkDataSource.entities.getById(landmarkId)
  if (!entity) return

  selectedLandmark.value = landmarkId
  selectedRover.value = null

  // 获取地标位置
  const position = entity.position?.getValue(viewer.clock.currentTime)
  if (position) {
    const destination = entity.properties?.destination?.getValue()
    const orientation = entity.properties?.orientation?.getValue()

    if (destination && orientation) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromArray(destination),
        orientation: new Cesium.HeadingPitchRoll(orientation[0], orientation[1], orientation[2]),
        easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
        maximumHeight: 5e6,
        pitchAdjustHeight: 2.5e6,
        duration: 3.0,
        complete: () => {
          viewer!.selectedEntity = entity
          viewer!.infoBox.viewModel.showInfo = true
        },
      })
    }
  }
}

// 初始化
onMounted(() => {
  initCesium()
})

// 清理
onUnmounted(() => {
  if (viewer) {
    viewer.destroy()
    viewer = null
  }
})
</script>

<template>
  <div class="mars-view">
    <MarsPanel
      :rovers="MARS_ROVERS"
      :landmarks="landmarks"
      :selectedRover="selectedRover"
      :selectedLandmark="selectedLandmark"
      @selectRover="flyToRover"
      @selectLandmark="flyToLandmark"
    />
    <div id="mars-container" class="mars-container"></div>
  </div>
</template>

<style scoped>
.mars-view {
  width: 100%;
  height: 100%;
  display: flex;
}

.mars-container {
  flex: 1;
  height: 100%;
}
</style>
```

- [ ] **Step 2: 验证文件创建**

Run: `ls -la ucas_earth/src/views/MarsView.vue`
Expected: 文件存在

- [ ] **Step 3: 提交**

```bash
git add ucas_earth/src/views/MarsView.vue
git commit -m "feat(mars): 添加火星视图组件"
```

---

## Task 4: 更新路由配置

**Files:**
- Modify: `ucas_earth/src/router/index.ts`

- [ ] **Step 1: 添加火星路由**

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: '首页' },
  },
  {
    path: '/campus',
    name: 'campus',
    component: () => import('../views/CampusView.vue'),
    meta: { title: 'FYUN 校园系统', activePath: '/campus' },
  },
  {
    path: '/mars',
    name: 'mars',
    component: () => import('../views/MarsView.vue'),
    meta: { title: '火星探索', activePath: '/mars' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
```

- [ ] **Step 2: 验证路由配置**

Run: `cat ucas_earth/src/router/index.ts | grep mars`
Expected: 显示火星路由配置

- [ ] **Step 3: 提交**

```bash
git add ucas_earth/src/router/index.ts
git commit -m "feat(mars): 添加火星路由配置"
```

---

## Task 5: 更新菜单导航

**Files:**
- Modify: `ucas_earth/src/components/Menu.vue`

- [ ] **Step 1: 添加火星菜单项**

```vue
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

const menuItems = [
  { path: '/', name: '首页', icon: '🏠' },
  { path: '/campus', name: '校园系统', icon: '🏫' },
  { path: '/mars', name: '火星探索', icon: '🔴' },
]

const activePath = computed(() => {
  return route.meta.activePath as string || route.path
})

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <nav class="menu">
    <div
      v-for="item in menuItems"
      :key="item.path"
      class="menu-item"
      :class="{ active: activePath === item.path }"
      @click="navigateTo(item.path)"
    >
      <span class="menu-icon">{{ item.icon }}</span>
      <span class="menu-text">{{ item.name }}</span>
    </div>
  </nav>
</template>

<style scoped>
.menu {
  width: 80px;
  height: 100%;
  background: var(--bg-menu, #1a1a1a);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
  border-right: 1px solid var(--border-color, #333);
}

.menu-item {
  width: 100%;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background: var(--bg-menu-hover, #2a2a2a);
}

.menu-item.active {
  background: var(--bg-menu-active, #3a3a3a);
}

.menu-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.menu-text {
  font-size: 12px;
  color: var(--text-primary, #ffffff);
}
</style>
```

- [ ] **Step 2: 验证菜单更新**

Run: `cat ucas_earth/src/components/Menu.vue | grep mars`
Expected: 显示火星菜单项

- [ ] **Step 3: 提交**

```bash
git add ucas_earth/src/components/Menu.vue
git commit -m "feat(mars): 添加火星菜单导航"
```

---

## Task 6: 创建火星数据文件

**Files:**
- Create: `ucas_earth/public/data/mars/Mars.czml`
- Create: `ucas_earth/public/data/mars/MarsPointsOfInterest.geojson`

- [ ] **Step 1: 创建数据目录**

Run: `mkdir -p ucas_earth/public/data/mars`
Expected: 目录创建成功

- [ ] **Step 2: 下载火星车轨迹数据**

从 Cesium 示例下载 `Mars.czml` 文件：
- 来源：https://sandcastle.cesium.com/?src=Mars.html
- 保存到：`ucas_earth/public/data/mars/Mars.czml`

- [ ] **Step 3: 下载火星地标数据**

从 Cesium 示例下载 `MarsPointsOfInterest.geojson` 文件：
- 来源：https://sandcastle.cesium.com/?src=Mars.html
- 保存到：`ucas_earth/public/data/mars/MarsPointsOfInterest.geojson`

- [ ] **Step 4: 验证数据文件**

Run: `ls -la ucas_earth/public/data/mars/`
Expected: 显示两个数据文件

- [ ] **Step 5: 提交**

```bash
git add ucas_earth/public/data/mars/
git commit -m "feat(mars): 添加火星车轨迹和地标数据文件"
```

---

## Task 7: 验证和测试

**Files:**
- Test: 整体功能验证

- [ ] **Step 1: 启动开发服务器**

Run: `cd ucas_earth && npm run dev`
Expected: 服务器启动成功

- [ ] **Step 2: 访问火星页面**

在浏览器中访问：`http://localhost:5173/mars`
Expected: 火星页面正常加载

- [ ] **Step 3: 验证功能**

1. 火星 3D 瓦片是否显示
2. 火星车轨迹是否显示
3. 地标点是否显示
4. 左侧面板是否正常
5. 点击火星车是否飞往
6. 点击地标是否飞往

- [ ] **Step 4: 最终提交**

```bash
git add .
git commit -m "feat(mars): 完成火星展示子项目"
```

---

## 验证清单

完成所有任务后，验证以下内容：

- [ ] `/mars` 路由正常访问
- [ ] 火星 3D 瓦片显示
- [ ] 火星大气效果正常
- [ ] 火星车轨迹显示
- [ ] 火星地标显示
- [ ] 左侧面板正常
- [ ] 点击火星车可飞往
- [ ] 点击地标可飞往
- [ ] 时间轴动画正常
- [ ] 初始旋转正常

---

## 常见问题

### 1. Cesium Ion Token 错误

确保 `.env` 文件中配置了有效的 Cesium Ion Token：

```
VITE_CESIUM_TOKEN=your_cesium_ion_token
```

### 2. 数据文件加载失败

检查数据文件路径是否正确：
- `public/data/mars/Mars.czml`
- `public/data/mars/MarsPointsOfInterest.geojson`

### 3. 火星瓦片不显示

确保 Cesium Ion Token 有权限访问 asset 3644333。

### 4. 样式问题

检查 CSS 变量是否与现有主题一致。
