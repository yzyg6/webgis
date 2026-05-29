<script setup lang="ts">
import { markRaw, nextTick, onMounted, onUnmounted, ref } from 'vue'
import * as Cesium from 'cesium'

const cesiumContainer = ref<HTMLDivElement | null>(null)
let viewer: Cesium.Viewer | null = null

onMounted(async () => {
  await nextTick()
  if (!cesiumContainer.value) return

  Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN
  Cesium.Ellipsoid.default = Cesium.Ellipsoid.MARS

  try {
    viewer = markRaw(
      new Cesium.Viewer(cesiumContainer.value, {
        globe: false,
        sceneModePicker: false,
        baseLayerPicker: false,
        geocoder: false,
      }),
    )

    const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(3644333)
    if (viewer && !viewer.isDestroyed()) {
      viewer.scene.primitives.add(tileset)

      // 飞往火星模型
      viewer.zoomTo(tileset)
    }
  } catch (error) {
    console.error('Mars viewer error:', error)
  }
})

onUnmounted(() => {
  viewer?.destroy()
  viewer = null
  Cesium.Ellipsoid.default = Cesium.Ellipsoid.WGS84
})
</script>

<template>
  <div class="mars-view">
    <div ref="cesiumContainer" class="cesium-container"></div>
  </div>
</template>

<style scoped>
.mars-view {
  width: 100%;
  height: 100%;
}

.cesium-container {
  width: 100%;
  height: 100%;
}
</style>
