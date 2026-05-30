<script setup lang="ts">
import { markRaw, onMounted, onUnmounted, ref } from 'vue'
import * as Cesium from 'cesium'
import Header from './components/Header.vue'
import CityPanel from './components/CityPanel.vue'
import type { HotCity } from './types/city'

const cesiumContainer = ref<HTMLDivElement | null>(null)
const searchQuery = ref('')
const selectedCity = ref<string | null>(null)
let viewer: Cesium.Viewer | null = null

const flyToCity = (city: HotCity) => {
  if (!viewer) return
  selectedCity.value = city.nameEn
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(city.lon, city.lat, 2000),
    orientation: {
      heading: 0,
      pitch: Cesium.Math.toRadians(-45),
      roll: 0,
    },
    duration: 2,
  })
}

const searchCity = async () => {
  if (!viewer || !searchQuery.value.trim()) return
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery.value.trim())}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'zh-CN' } }
    )
    const data = await res.json()
    if (data.length > 0) {
      const { lat, lon, display_name } = data[0]
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(parseFloat(lon), parseFloat(lat), 2000),
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-45),
          roll: 0,
        },
        duration: 2,
      })
    }
  } catch (e) {
    console.warn('搜索失败:', e)
  }
}

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
      new Cesium.OpenStreetMapImageryProvider({
        url: "https://tile.openstreetmap.org/",
      }),
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
    console.warn('地形加载失败:', e)
  }

  // 加载 OSM Buildings
  try {
    if (viewer && !viewer.isDestroyed()) {
      const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(96188)
      viewer.scene.primitives.add(tileset)
      await viewer.zoomTo(tileset)

      // 应用默认样式
      const extras = tileset.asset.extras
      if (
        Cesium.defined(extras) &&
        Cesium.defined((extras as any).ion) &&
        Cesium.defined((extras as any).ion.defaultStyle)
      ) {
        tileset.style = new Cesium.Cesium3DTileStyle((extras as any).ion.defaultStyle)
      }
    }
  } catch (e) {
    console.warn('OSM Buildings 加载失败:', e)
  }

  // 飞到中国上空
  if (viewer && !viewer.isDestroyed()) {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(116.4, 39.9, 5000000),
      duration: 0,
    })
  }
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
      <CityPanel
        :selected-city="selectedCity"
        @select-city="flyToCity"
      />
      <div class="cesium-wrapper">
        <div class="search-box">
          <input
            v-model="searchQuery"
            class="search-input"
            type="text"
            placeholder="搜索城市..."
            @keydown.enter="searchCity"
          />
          <button class="search-btn" @click="searchCity">搜索</button>
        </div>
        <div ref="cesiumContainer" class="cesium-container"></div>
      </div>
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
  display: grid;
  grid-template-columns: auto 1fr;
}

.cesium-wrapper {
  position: relative;
  min-height: 0;
}

.cesium-container {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.search-box {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  display: flex;
  gap: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.search-input {
  padding: 8px 14px;
  border: none;
  outline: none;
  font-size: 14px;
  width: 220px;
  background: var(--bg-panel-solid);
  color: var(--text-primary);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-btn {
  padding: 8px 16px;
  border: none;
  background: var(--text-accent);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.search-btn:hover {
  filter: brightness(1.1);
}
</style>
