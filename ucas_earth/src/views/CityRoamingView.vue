<script setup lang="ts">
import { markRaw, onMounted, onUnmounted, ref } from 'vue'
import * as Cesium from 'cesium'
import Header from '../components/Header.vue'

const cesiumContainer = ref<HTMLDivElement | null>(null)
let viewer: Cesium.Viewer | null = null

onMounted(async () => {
  if (!cesiumContainer.value) return

  Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN

  viewer = markRaw(
    new Cesium.Viewer(cesiumContainer.value, {
      baseLayer: false,
      baseLayerPicker: false,
      geocoder: false,
      timeline: true,
      animation: true,
    }),
  )

  // 默认加载卫星底图
  viewer.imageryLayers.addImageryProvider(
    new Cesium.UrlTemplateImageryProvider({
      url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      tileWidth: 256,
      tileHeight: 256,
      maximumLevel: 20,
    }),
  )

  // 飞到中国上空
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(116.4, 39.9, 5000000),
    duration: 2,
  })
})

onUnmounted(() => {
  viewer?.destroy()
  viewer = null
})
</script>

<template>
  <div class="city-view">
    <Header mode="city" />
    <div class="city-main">
      <div ref="cesiumContainer" class="cesium-container"></div>
    </div>
  </div>
</template>

<style scoped>
.city-view {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
}

.city-main {
  min-height: 0;
}

.cesium-container {
  width: 100%;
  height: 100%;
  min-height: 0;
}
</style>
