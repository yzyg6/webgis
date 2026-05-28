<script setup lang="ts">
import * as Cesium from "cesium";
import Menu from "./components/Menu.vue";

Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN;
</script>

<template>
	<div class="app-shell">
		<Menu />
		<main class="app-main">
			<router-view />
		</main>
	</div>
</template>

<style scoped>
.app-shell {
	width: 100%;
	height: 100vh;
	display: flex;
	background: var(--bg-app);
}

.app-main {
	flex: 1;
	min-width: 0;
	position: relative;
	overflow: hidden;
}
</style>
