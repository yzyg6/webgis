<script setup lang="ts">
import { markRaw, onMounted, onUnmounted, ref, watch } from 'vue'
import * as Cesium from 'cesium'
import Header from './components/Header.vue'
import ViewshedPanel from './components/ViewshedPanel.vue'
import { Viewshed } from './utils/viewshed'
import type { BaseLayerType } from './types/analysis'

const cesiumContainer = ref<HTMLDivElement | null>(null)

// 分析状态
const isPicking = ref(false)
const isAnalyzing = ref(false)
const hasResult = ref(false)
const observerHeight = ref(2)
const targetHeight = ref(2)
const radius = ref(500)

let viewer: Cesium.Viewer | null = null
let handler: Cesium.ScreenSpaceEventHandler | null = null
let viewshedInstance: Viewshed | null = null

// 参数变更时同步到 viewshed 实例
watch([observerHeight, targetHeight, radius], () => {
  viewshedInstance?.updateParams({
    qdOffset: observerHeight.value,
    zdOffset: targetHeight.value,
    radius: radius.value,
  })
})

// === 底图切换 ===
const switchBaseLayer = (layerType: BaseLayerType) => {
  if (!viewer || viewer.isDestroyed()) return

  // 清除现有底图
  while (viewer.imageryLayers.length > 0) {
    viewer.imageryLayers.remove(viewer.imageryLayers.get(0))
  }

  switch (layerType) {
    case 'osm':
      viewer.imageryLayers.addImageryProvider(
        new Cesium.OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' })
      )
      break
    case 'arcgis':
      viewer.imageryLayers.addImageryProvider(
        new Cesium.ArcGisMapServerImageryProvider({ url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer' })
      )
      break
    case 'carto':
      viewer.imageryLayers.addImageryProvider(
        new Cesium.UrlTemplateImageryProvider({ url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', subdomains: ['a', 'b', 'c', 'd'] })
      )
      break
    case 'google-satellite':
      viewer.imageryLayers.addImageryProvider(
        new Cesium.UrlTemplateImageryProvider({ url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}' })
      )
      break
  }
}

// === 分析操作 ===
const handleStartPick = () => {
  isPicking.value = true
  hasResult.value = false
  // 清除旧结果
  viewshedInstance?.clear()
}

const handleAnalyse = (position: Cesium.Cartesian3) => {
  if (!viewshedInstance || !viewer) return
  isAnalyzing.value = true
  viewshedInstance.analyse(position).then(() => {
    hasResult.value = true
    isAnalyzing.value = false
  }).catch(() => {
    isAnalyzing.value = false
  })
}

const handleClearResult = () => {
  viewshedInstance?.clear()
  hasResult.value = false
  isPicking.value = false
}

// === 地图点击交互 ===
const setupClickHandler = () => {
  if (!viewer) return
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
    if (!isPicking.value || !viewer) return
    const ray = viewer.camera.getPickRay(movement.position)
    if (!ray) return
    const position = viewer.scene.globe.pick(ray, viewer.scene)
    if (!position) return
    isPicking.value = false
    handleAnalyse(position)
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}

// === 生命周期 ===
onMounted(async () => {
  if (!cesiumContainer.value) return

  Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN

  try {
    viewer = markRaw(
      new Cesium.Viewer(cesiumContainer.value, {
        baseLayer: false,
        baseLayerPicker: false,
        geocoder: false,
        timeline: false,
        animation: false,
        sceneModePicker: false,
        navigationHelpButton: false,
      }),
    )
  } catch (e) {
    console.error('Cesium Viewer 创建失败:', e)
    return
  }

  if (!viewer) return

  // 加载 OSM 底图
  try {
    viewer.imageryLayers.addImageryProvider(
      new Cesium.OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' }),
    )
  } catch (e) {
    console.warn('底图加载失败:', e)
  }

  // 加载地形
  try {
    const terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(1)
    if (viewer && !viewer.isDestroyed()) {
      viewer.terrainProvider = terrainProvider
      viewer.scene.globe.depthTestAgainstTerrain = true
    }
  } catch (e) {
    console.warn('地形加载失败，使用默认椭球体:', e)
  }

  // 初始化 viewshed 实例
  viewshedInstance = new Viewshed(viewer, {
    qdOffset: observerHeight.value,
    zdOffset: targetHeight.value,
    radius: radius.value,
  })

  // 设置点击交互
  setupClickHandler()

  // 飞到默认位置（阜阳）
  if (viewer && !viewer.isDestroyed()) {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(115.778, 32.886, 5000000),
      duration: 0,
    })
  }
})

onUnmounted(() => {
  handler?.destroy()
  viewshedInstance?.destroy()
  viewshedInstance = null
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy()
    viewer = null
  }
})
</script>

<template>
  <div class="analysis-view">
    <Header @switch-layer="switchBaseLayer" />
    <div class="analysis-content">
      <ViewshedPanel
        :is-picking="isPicking"
        :is-analyzing="isAnalyzing"
        :has-result="hasResult"
        :observer-height="observerHeight"
        :target-height="targetHeight"
        :radius="radius"
        @update:observer-height="observerHeight = $event"
        @update:target-height="targetHeight = $event"
        @update:radius="radius = $event"
        @start-pick="handleStartPick"
        @start-analyse="handleStartAnalyse"
        @clear-result="handleClearResult"
      />
      <div ref="cesiumContainer" class="cesium-container"></div>
    </div>
  </div>
</template>

<style scoped>
.analysis-view {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
}

.analysis-content {
  display: flex;
  overflow: hidden;
}

.cesium-container {
  flex: 1;
  min-width: 0;
  height: 100%;
}
</style>
