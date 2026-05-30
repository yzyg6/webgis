<template>
	<div class="viewer-wrap">
		<div id="cesium_container"></div>
	</div>
</template>

<script setup lang="ts">
import { markRaw, onMounted, onUnmounted } from "vue";
import * as Cesium from "cesium";

Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN;

const DEFAULT_CENTER = {
	lon: 115.785762,
	lat: 32.898816,
	height: 5000000,
};

let viewer: Cesium.Viewer | null = null;

onMounted(() => {
	const container = document.getElementById("cesium_container");
	if (!container) return;

	viewer = markRaw(
		new Cesium.Viewer(container, {
			baseLayer: false,
			baseLayerPicker: false,
			geocoder: false,
			timeline: false,
			animation: false,
			sceneModePicker: false,
			navigationHelpButton: false,
		}),
	);

	// 加载 OSM 底图
	viewer.imageryLayers.addImageryProvider(
		new Cesium.OpenStreetMapImageryProvider({
			url: "https://tile.openstreetmap.org/",
		}),
	);

	viewer.camera.flyTo({
		destination: Cesium.Cartesian3.fromDegrees(
			DEFAULT_CENTER.lon,
			DEFAULT_CENTER.lat,
			DEFAULT_CENTER.height,
		),
		orientation: {
			heading: 0,
			pitch: Cesium.Math.toRadians(-45),
			roll: 0,
		},
		duration: 0,
	});
});

onUnmounted(() => {
	if (viewer) {
		viewer.destroy();
		viewer = null;
	}
});
</script>

<style scoped>
.viewer-wrap {
	width: 100%;
	height: 100%;
}

#cesium_container {
	width: 100%;
	height: 100%;
}
</style>
