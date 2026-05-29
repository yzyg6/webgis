<script setup lang="ts">
import CesiumViewer from '../components/CesiumViewer.vue'
import { ref } from 'vue'

const currentBaseLayer = ref<'osm' | 'arcgis' | 'carto' | 'google-satellite'>('osm')
</script>

<template>
	<div class="home-view">
		<CesiumViewer
			:base-layer="currentBaseLayer"
			:city-layers="[]"
		/>
		<div class="welcome-overlay">
			<div class="welcome-line"></div>
			<div class="welcome-content">
				<div class="welcome-tag">RESEARCH STATION</div>
				<h1 class="welcome-title">Cesium 学习系统</h1>
				<p class="welcome-desc">从左侧菜单选择功能模块，开始探索三维地球可视化</p>
			</div>
			<div class="welcome-line"></div>
		</div>
	</div>
</template>

<style scoped>
.home-view {
	position: relative;
	width: 100%;
	height: 100%;
}

.welcome-overlay {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 20px;
	pointer-events: none;
}

.welcome-line {
	width: 60px;
	height: 1px;
	background: var(--text-accent);
	opacity: 0.4;
}

.welcome-content {
	text-align: center;
}

.welcome-tag {
	font-family: var(--font-display);
	font-size: 10px;
	letter-spacing: 3px;
	color: var(--text-accent);
	margin-bottom: 12px;
}

.welcome-title {
	font-family: var(--font-display);
	font-size: 32px;
	font-weight: 300;
	color: var(--text-primary);
	margin: 0 0 12px;
	letter-spacing: 2px;
}

.welcome-desc {
	font-size: 14px;
	color: var(--text-muted);
	margin: 0;
	letter-spacing: 0.5px;
}
</style>
