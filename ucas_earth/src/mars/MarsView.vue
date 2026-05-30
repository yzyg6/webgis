<script setup lang="ts">
import { markRaw, nextTick, onMounted, onUnmounted, ref, reactive } from 'vue'
import * as Cesium from 'cesium'
import Header from './components/Header.vue'
import MarsFlightPanel from './components/MarsFlightPanel.vue'

// === 中文翻译映射 ===
const ROVER_NAMES: Record<string, string> = {
  Curiosity: '好奇号',
  Perseverance: '毅力号',
  Ingenuity: '机智号',
  TheMartianJourney: '火星救援路线',
}

const LANDMARK_NAMES: Record<string, string> = {
  'Acidalia Planitia': '阿西达利亚平原',
  'Alba Mons': '阿尔巴山',
  'Arabia Terra': '阿拉伯高地',
  'Elysium Volcanic Region': '极乐世界火山群',
  'Gale Crater (Curiosity)': '盖尔撞击坑（好奇号）',
  'Jezero Crater (Perseverance)': '杰泽罗撞击坑（毅力号）',
  'Marth Crater': '马斯撞击坑',
  'Mawrth Vallis': '马沃斯峡谷',
  'Olympus Mons': '奥林帕斯山',
  'Meridiani Planum (Opportunity)': '子午线平原（机遇号）',
  'Schiaparelli Crater': '斯基亚帕雷利撞击坑',
  'Ares Vallis (Sojourner)': '战神峡谷（旅居者号）',
  'Gusev Crater (Spirit)': '古谢夫撞击坑（勇气号）',
  'Terra Meridiani': '子午线高地',
  'Valles Marineris': '水手号峡谷',
}

const LANDMARK_DESC_ZH: Record<string, string> = {
  'Acidalia Planitia': '火星北部平原，位于塔尔西斯火山省和阿拉伯高地之间，以著名的赛东尼亚区域闻名。',
  'Alba Mons': '位于塔尔西斯北部的巨型火山，是火星表面积最大的火山，火山流场延伸超过1350公里。',
  'Arabia Terra': '火星北半球广阔的高地地带，拥有大量撞击坑和古老地貌。',
  'Elysium Volcanic Region': '火星第二大火山群，包含埃律西昂山、赫卡特斯圆丘等火山结构。',
  'Gale Crater (Curiosity)': '盖尔撞击坑，好奇号火星车着陆点（2012年），拥有5公里高的夏普山沉积层。',
  'Jezero Crater (Perseverance)': '杰泽罗撞击坑，毅力号火星车着陆点（2021年），曾是古代湖泊和三角洲。',
  'Marth Crater': '以天文学家命名的撞击坑，位于火星赤道附近。',
  'Mawrth Vallis': '火星上一条古老的河谷，暴露了丰富的含水矿物层。',
  'Olympus Mons': '太阳系最高的火山，高度约21.9公里，是珠穆朗玛峰的近3倍。',
  'Meridiani Planum (Opportunity)': '子午线平原，机遇号火星车着陆点（2004年），发现了含水矿物证据。',
  'Schiaparelli Crater': '以意大利天文学家命名的大型撞击坑，直径约460公里。',
  'Ares Vallis (Sojourner)': '战神峡谷，旅居者号火星车着陆点（1997年），火星首个成功运行的火星车。',
  'Gusev Crater (Spirit)': '古谢夫撞击坑，勇气号火星车着陆点（2004年），曾是一个古代湖泊。',
  'Terra Meridiani': '子午线高地，包含赤铁矿等矿物，暗示过去的水活动。',
  'Valles Marineris': '水手号峡谷，太阳系最大的峡谷系统，长约4000公里，深达7公里。',
}

// === 状态 ===
const cesiumContainer = ref<HTMLDivElement | null>(null)
const roverMenuOpen = ref(false)
const landmarkMenuOpen = ref(false)
const roverItems = reactive<{ id: string; name: string }[]>([])
const landmarkItems = reactive<{ key: string; name: string }[]>([])

let viewer: Cesium.Viewer | null = null
let handler: Cesium.ScreenSpaceEventHandler | null = null
let removeRotation: (() => void) | null = null

// 存储回调函数，供模板调用
let flyToRover: ((id: string) => void) | null = null
let flyToLandmark: ((key: string) => void) | null = null

const closeAll = () => {
  roverMenuOpen.value = false
  landmarkMenuOpen.value = false
}

const selectedRoverId = ref<string | null>(null)
const selectedLandmarkKey = ref<string | null>(null)
const currentSol = ref<number | null>(null)

const handleSelectRover = (id: string) => {
  selectedRoverId.value = id
  selectedLandmarkKey.value = null
  flyToRover?.(id)
}

const handleSelectLandmark = (key: string) => {
  selectedLandmarkKey.value = key
  selectedRoverId.value = null
  flyToLandmark?.(key)
}

onMounted(async () => {
  await nextTick()
  if (!cesiumContainer.value) return

  Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN
  Cesium.Ellipsoid.default = Cesium.Ellipsoid.MARS

  try {
    viewer = markRaw(
      new Cesium.Viewer(cesiumContainer.value, {
        terrainProvider: false,
        baseLayer: false,
        baseLayerPicker: false,
        geocoder: false,
        shadows: false,
        globe: new Cesium.Globe(Cesium.Ellipsoid.MARS),
        skyBox: Cesium.SkyBox.createEarthSkyBox(),
        skyAtmosphere: new Cesium.SkyAtmosphere(Cesium.Ellipsoid.MARS),
        infoBox: true,
      }),
    )
    viewer.scene.globe.show = false

    const scene = viewer.scene
    const clock = viewer.clock
    const navHelp = viewer.navigationHelpButton

    // 火星大气
    scene.skyAtmosphere.atmosphereMieCoefficient = new Cesium.Cartesian3(9.0e-5, 2.0e-5, 1.0e-5)
    scene.skyAtmosphere.atmosphereRayleighCoefficient = new Cesium.Cartesian3(9.0e-6, 2.0e-6, 1.0e-6)
    scene.skyAtmosphere.atmosphereRayleighScaleHeight = 9000
    scene.skyAtmosphere.atmosphereMieScaleHeight = 2700.0
    scene.skyAtmosphere.saturationShift = -0.1

    // 后处理
    const bloom = viewer.scene.postProcessStages.bloom
    bloom.enabled = true
    bloom.uniforms.brightness = -0.5
    bloom.uniforms.stepSize = 1.0
    bloom.uniforms.sigma = 3.0
    bloom.uniforms.delta = 1.5
    scene.highDynamicRange = true
    viewer.scene.postProcessStages.exposure = 1.5

    // === 工具函数 ===
    function createWidthCallbackProperty(nearFarScalar: Cesium.NearFarScalar) {
      return new Cesium.CallbackProperty(() => {
        const distance = viewer!.camera.positionCartographic.height
        let t = (distance - nearFarScalar.near) / (nearFarScalar.far - nearFarScalar.near)
        t = Cesium.Math.clamp(t, 0.0, 1.0)
        return Cesium.Math.lerp(nearFarScalar.nearValue, nearFarScalar.farValue, t)
      }, false)
    }

    function createJulianDateToSolConverter(startJulianDate: Cesium.JulianDate, startSol: number) {
      return (julianDate: Cesium.JulianDate) => {
        const secondsPerSol = 24 * 60 * 60 + 39 * 60 + 35
        const differenceInSeconds = Cesium.JulianDate.secondsDifference(julianDate, startJulianDate)
        return `火星日 ${Math.floor(differenceInSeconds / secondsPerSol) + startSol}`
      }
    }

    function createCanvasAsTexture(text: string) {
      const canvas = document.createElement('canvas')
      canvas.width = 1024
      canvas.height = 256
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = 'rgba(0, 0, 0, 0)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = '36px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const isLight = document.documentElement.dataset.theme === 'light'
      const textColor = isLight ? '#1e293b' : '#ffffff'
      const strokeColor = isLight ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = 2
      ctx.fillStyle = textColor
      ctx.strokeText(text, canvas.width / 2, canvas.height / 2)
      ctx.fillText(text, canvas.width / 2, canvas.height / 2)
      return canvas
    }

    function createPickedFeatureDescription(entity: Cesium.Entity) {
      const name = entity.properties!.text.getValue()
      const zhName = LANDMARK_NAMES[name] || name
      const zhDesc = LANDMARK_DESC_ZH[name] || entity.properties!.description.getValue()
      return `<img width="50%" style="float:left; margin: 0 1em 1em 0;" src=${entity.properties!.imageURL}>` +
        `<p><strong>${zhName}</strong></p><p>${zhDesc}</p>` +
        `<p>来源: <a target="_blank" href="${entity.properties!.sourceURL}">${entity.properties!.source}</a></p>`
    }

    // 状态管理
    function highlightAnimationViewModel() {
      if (clock.shouldAnimate) return
      const playPath = viewer!.animation.container.querySelector('#animation_pathPlay')
      if (!playPath) return
      const playButton = playPath.closest('g.cesium-animation-rectButton') as SVGElement
      const ringG = viewer!.animation.container.querySelector('.cesium-animation-shuttleRingG') as SVGElement
      if (!playButton || !ringG) return
      playButton.classList.add('highlight-animation')
      ringG.classList.add('highlight-animation')
      playButton.addEventListener('click', removeHighlight, { once: true })
      setTimeout(removeHighlight, 30000)
    }

    function removeHighlight() {
      const playPath = viewer!.animation.container.querySelector('#animation_pathPlay')
      if (!playPath) return
      const playButton = playPath.closest('g.cesium-animation-rectButton') as SVGElement
      const ringG = viewer!.animation.container.querySelector('.cesium-animation-shuttleRingG') as SVGElement
      playButton?.classList.remove('highlight-animation')
      ringG?.classList.remove('highlight-animation')
    }

    function reset() {
      clock.multiplier = 1
      viewer!.selectedEntity = undefined
      viewer!.trackedEntity = undefined
      viewer!.timeline.zoomTo(clock.startTime, clock.stopTime)
      removeRotation?.()
      removeHighlight()
    }

    // === 加载火星 3D Tileset ===
    try {
      const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(3644333, { enableCollision: true })
      if (viewer && !viewer.isDestroyed()) {
        viewer.scene.primitives.add(tileset)
        viewer.zoomTo(tileset)
      }
    } catch (error) {
      console.log(error)
    }

    // === 加载火星车 CZML ===
    let curiosity: any, perseverance: any, ingenuity: any, theMartianJourney: any
    try {
      const dataSource = await Cesium.CzmlDataSource.load('/data/mars/Mars.czml')
      if (!viewer || viewer.isDestroyed()) return
      viewer.dataSources.add(dataSource)

      const onSelectRover = (rover: any) => {
        reset()
        const roverAnimStartIso = rover.properties.animationStartTime.getValue(Cesium.JulianDate.now())
        clock.multiplier = 604800
        clock.currentTime = Cesium.JulianDate.fromIso8601(roverAnimStartIso)
        viewer!.timeline.zoomTo(rover.availability.start, rover.availability.stop)
        const boundingSphere = new Cesium.BoundingSphere(rover.position.getValue(clock.currentTime), 5000.0)
        scene.camera.flyToBoundingSphere(boundingSphere, {
          offset: new Cesium.HeadingPitchRoll(4.9791, -0.5294, 0.0),
          easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
          maximumHeight: 5e6,
          pitchAdjustHeight: 2.5e6,
          duration: 3.0,
          complete: () => {
            highlightAnimationViewModel()
            navHelp.viewModel.showInstructions = true
          },
        })
      }

      const setupRover = (entityId: string, startSol: number) => {
        const rover = dataSource.entities.getById(entityId)
        const julianDateToSol = createJulianDateToSolConverter(rover!.availability!.start!, startSol)
        ;(rover as any).label.text = new Cesium.CallbackProperty((time) => julianDateToSol(time!), false)
        const roverPath = dataSource.entities.getById(`${entityId}Path`)
        ;(roverPath as any).polyline.width = createWidthCallbackProperty(new Cesium.NearFarScalar(0.0, 15.0, 1.0e5, 0.0))
        roverItems.push({ id: entityId, name: ROVER_NAMES[entityId] || entityId })
        return rover
      }

      curiosity = setupRover('Curiosity', 3)
      perseverance = setupRover('Perseverance', 13)
      ingenuity = dataSource.entities.getById('Ingenuity')
      roverItems.push({ id: 'Ingenuity', name: ROVER_NAMES['Ingenuity'] })

      theMartianJourney = dataSource.entities.getById('TheMartianJourney')
      ;(theMartianJourney as any).polyline.width = createWidthCallbackProperty(new Cesium.NearFarScalar(0.0, 10.0, 1.0e7, 0.0))
      ;(theMartianJourney as any).rectangle.material = new Cesium.ImageMaterialProperty({
        image: createCanvasAsTexture('马克·沃特尼的火星救援之旅'),
        transparent: true,
      })
      roverItems.push({ id: 'TheMartianJourney', name: ROVER_NAMES['TheMartianJourney'] })

      flyToRover = (id: string) => {
        closeAll()
        if (id === 'TheMartianJourney') {
          reset()
          viewer!.zoomTo(theMartianJourney)
        } else {
          const entity = dataSource.entities.getById(id)
          if (entity) onSelectRover(entity)
        }
      }
    } catch (error) {
      console.log(`Error loading CZML: ${error}`)
    }

    // === 加载火星地标 GeoJSON ===
    try {
      const dataSource = await Cesium.GeoJsonDataSource.load('/data/mars/MarsPointsOfInterest.geojson')
      if (!viewer || viewer.isDestroyed()) return
      viewer.dataSources.add(dataSource)

      const onSelectLandmark = (landmark: any) => {
        reset()
        scene.camera.flyTo(landmark)
      }

      const entities = dataSource.entities.values
      entities.forEach((entity) => {
        const name = entity.properties!.text.getValue()
        const zhName = LANDMARK_NAMES[name] || name

        entity.label = new Cesium.LabelGraphics({
          text: zhName,
          font: '18pt Verdana',
          outlineColor: Cesium.Color.DARKSLATEGREY,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -22),
          scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.5),
          translucencyByDistance: new Cesium.NearFarScalar(2.5e7, 1.0, 4.0e7, 0.0),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        })

        entity.point = new Cesium.PointGraphics({
          pixelSize: 10,
          color: Cesium.Color.fromBytes(243, 242, 99),
          outlineColor: Cesium.Color.fromBytes(219, 218, 111),
          outlineWidth: 2,
          scaleByDistance: new Cesium.NearFarScalar(1.5e3, 1.0, 4.0e7, 0.1),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        })

        entity.name = zhName
        entity.description = createPickedFeatureDescription(entity)
        landmarkItems.push({ key: name, name: zhName })
      })

      flyToLandmark = (key: string) => {
        closeAll()
        const entity = entities.find((e) => e.properties!.text.getValue() === key)
        if (entity) {
          const dest = Cesium.Cartesian3.fromArray(entity.properties!.destination.getValue())
          const ori = entity.properties!.orientation.getValue()
          onSelectLandmark({
            destination: dest,
            orientation: new Cesium.HeadingPitchRoll(ori[0], ori[1], ori[2]),
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
    } catch (error) {
      console.log(`Error loading GeoJSON: ${error}`)
    }

    // === 自动旋转 ===
    const rotationSpeed = Cesium.Math.toRadians(0.1)
    removeRotation = viewer.scene.postRender.addEventListener(() => {
      viewer!.scene.camera.rotateRight(rotationSpeed)
    })

    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    const stopRotation = () => { removeRotation?.() }
    handler.setInputAction(stopRotation, Cesium.ScreenSpaceEventType.LEFT_DOWN)
    handler.setInputAction(stopRotation, Cesium.ScreenSpaceEventType.RIGHT_DOWN)
    handler.setInputAction(stopRotation, Cesium.ScreenSpaceEventType.MIDDLE_DOWN)
    handler.setInputAction(stopRotation, Cesium.ScreenSpaceEventType.WHEEL)

    viewer.homeButton.viewModel.command.beforeExecute.addEventListener(() => { reset() })

    const entitiesToDisableLightingFor = [curiosity, perseverance, ingenuity].filter(Boolean)
    Cesium.knockout.getObservable(viewer.clockViewModel, 'shouldAnimate').subscribe((shouldAnimate: boolean) => {
      if (shouldAnimate && clock.multiplier >= 100000) {
        entitiesToDisableLightingFor.forEach((entity) => { entity.model.lightColor = new Cesium.Color(0, 0, 0) })
      } else {
        entitiesToDisableLightingFor.forEach((entity) => { entity.model.lightColor = new Cesium.Color(1, 1, 1) })
      }
    })
  } catch (error) {
    console.log('Mars viewer error:', error)
  }
})

onUnmounted(() => {
  // 先恢复全局椭球体，再销毁 Viewer（避免影响其他组件）
  Cesium.Ellipsoid.default = Cesium.Ellipsoid.WGS84
  handler?.destroy()
  handler = null
  viewer?.destroy()
  viewer = null
})
</script>

<template>
  <div class="mars-view">
    <Header
      mode="mars"
      :mars-rovers="roverItems"
      :mars-landmarks="landmarkItems"
      @select-rover="handleSelectRover"
      @select-landmark="handleSelectLandmark"
    />
    <div class="mars-main">
      <MarsFlightPanel
        :rovers="roverItems"
        :selected-rover-id="selectedRoverId"
        :landmarks="landmarkItems"
        :selected-landmark-key="selectedLandmarkKey"
        :current-sol="currentSol"
        @select-rover="handleSelectRover"
        @select-landmark="handleSelectLandmark"
      />
      <div ref="cesiumContainer" class="cesium-container"></div>
    </div>
  </div>
</template>

<style scoped>
.mars-view {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
}

.mars-main {
  min-height: 0;
  display: grid;
  grid-template-columns: auto 1fr;
}

.cesium-container {
  width: 100%;
  height: 100%;
  min-height: 0;
}

/* === Cesium 控件主题适配 === */

/* 暗色模式（默认）：浅色控件 */
:deep(.cesium-timeline-main) {
  background: rgba(13, 17, 23, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 6px;
}

:deep(.cesium-timeline-ticLabel) {
  color: rgba(226, 232, 240, 0.8);
  text-shadow: none;
}

:deep(.cesium-timeline-bar) {
  background: rgba(48, 58, 72, 0.8);
}

:deep(.cesium-timeline-highlight) {
  background: rgba(232, 171, 56, 0.5);
}

:deep(.cesium-animation-theme) svg text {
  fill: #e2e8f0;
}

:deep(.cesium-animation-svgText) {
  fill: #e2e8f0;
}

:deep(.cesium-animation-rectButton) rect {
  fill: rgba(35, 43, 55, 0.85);
  stroke: rgba(148, 163, 184, 0.3);
}

:deep(.cesium-animation-rectButton:hover) rect {
  fill: rgba(48, 58, 72, 0.9);
}

:deep(.cesium-animation-button) {
  color: #e2e8f0;
}

:deep(.cesium-animation-shuttleRingOuter) {
  fill: rgba(35, 43, 55, 0.85);
  stroke: rgba(148, 163, 184, 0.25);
}

:deep(.cesium-animation-shuttleRingSwoop) {
  stroke: rgba(232, 171, 56, 0.6);
}

:deep(.cesium-animation-knobOuter) {
  fill: rgba(232, 171, 56, 0.8);
}

:deep(.cesium-viewer-toolbar .cesium-button) {
  background: rgba(13, 17, 23, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.25);
  color: #e2e8f0;
  fill: #e2e8f0;
}

:deep(.cesium-viewer-toolbar .cesium-button:hover) {
  background: rgba(35, 43, 55, 0.95);
}

:deep(.cesium-viewer-toolbar .cesium-button svg) {
  fill: #e2e8f0;
  stroke: #e2e8f0;
}

:deep(.cesium-infoBox) {
  background: rgba(13, 17, 23, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #e2e8f0;
}

:deep(.cesium-infoBox-title) {
  background: rgba(22, 28, 36, 0.95);
  color: #e2e8f0;
}

:deep(.cesium-infoBox-body) {
  color: rgba(226, 232, 240, 0.9);
}

:deep(.cesium-infoBox-body a) {
  color: #e8ab38;
}

:deep(.cesium-infoBox-close) {
  fill: rgba(148, 163, 184, 0.7);
}

:deep(.cesium-infoBox-close:hover) {
  fill: #f87171;
}

/* 亮色模式：深色控件 */
:root[data-theme="light"] :deep(.cesium-timeline-main) {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(100, 116, 139, 0.25);
}

:root[data-theme="light"] :deep(.cesium-timeline-ticLabel) {
  color: rgba(30, 41, 59, 0.85);
}

:root[data-theme="light"] :deep(.cesium-timeline-bar) {
  background: rgba(203, 210, 220, 0.8);
}

:root[data-theme="light"] :deep(.cesium-timeline-highlight) {
  background: rgba(180, 122, 10, 0.4);
}

:root[data-theme="light"] :deep(.cesium-animation-theme) svg text {
  fill: #1e293b;
}

:root[data-theme="light"] :deep(.cesium-animation-svgText) {
  fill: #1e293b;
}

:root[data-theme="light"] :deep(.cesium-animation-rectButton) rect {
  fill: rgba(224, 228, 235, 0.9);
  stroke: rgba(100, 116, 139, 0.3);
}

:root[data-theme="light"] :deep(.cesium-animation-rectButton:hover) rect {
  fill: rgba(203, 210, 220, 0.95);
}

:root[data-theme="light"] :deep(.cesium-animation-button) {
  color: #1e293b;
}

:root[data-theme="light"] :deep(.cesium-animation-shuttleRingOuter) {
  fill: rgba(224, 228, 235, 0.9);
  stroke: rgba(100, 116, 139, 0.3);
}

:root[data-theme="light"] :deep(.cesium-animation-shuttleRingSwoop) {
  stroke: rgba(180, 122, 10, 0.6);
}

:root[data-theme="light"] :deep(.cesium-animation-knobOuter) {
  fill: rgba(180, 122, 10, 0.8);
}

:root[data-theme="light"] :deep(.cesium-viewer-toolbar .cesium-button) {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(100, 116, 139, 0.25);
  color: #1e293b;
  fill: #1e293b;
}

:root[data-theme="light"] :deep(.cesium-viewer-toolbar .cesium-button:hover) {
  background: rgba(240, 242, 245, 0.98);
}

:root[data-theme="light"] :deep(.cesium-viewer-toolbar .cesium-button svg) {
  fill: #1e293b;
  stroke: #1e293b;
}

:root[data-theme="light"] :deep(.cesium-infoBox) {
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(100, 116, 139, 0.25);
  color: #1e293b;
}

:root[data-theme="light"] :deep(.cesium-infoBox-title) {
  background: rgba(240, 242, 245, 0.98);
  color: #1e293b;
}

:root[data-theme="light"] :deep(.cesium-infoBox-body) {
  color: rgba(30, 41, 59, 0.9);
}

:root[data-theme="light"] :deep(.cesium-infoBox-body a) {
  color: #b47a0a;
}

:root[data-theme="light"] :deep(.cesium-infoBox-close) {
  fill: rgba(100, 116, 139, 0.7);
}

:root[data-theme="light"] :deep(.cesium-infoBox-close:hover) {
  fill: #dc2626;
}

/* 动画高亮 */
:deep(.highlight-animation) {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
