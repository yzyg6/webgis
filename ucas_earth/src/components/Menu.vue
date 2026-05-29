<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const isCollapse = ref(false)
const activePath = ref(route.meta.activePath as string || '/')

const menuItems = [
	{ index: '/', title: '首页', icon: '⌂' },
	{ index: '/campus', title: '校园展示', icon: '◈' },
	{ index: '/mars', title: '火星探索', icon: '◉' },
	{ index: '/city', title: '城市漫游', icon: '🌆' },
]

const onExpand = () => {
	isCollapse.value = !isCollapse.value
}

const linkTo = (path: string) => {
	activePath.value = path
	router.push(path)
}

watch(
	() => route.meta.activePath,
	(newPath) => {
		if (newPath) activePath.value = newPath as string
	},
	{ immediate: true }
)
</script>

<template>
	<nav class="menu" :class="{ collapsed: isCollapse }">
		<div class="menu-brand">
			<div class="brand-mark">C</div>
			<div class="brand-text" v-if="!isCollapse">
				<span class="brand-title">CESIUM</span>
				<span class="brand-sub">LEARNING SYSTEM</span>
			</div>
		</div>

		<div class="menu-divider"></div>

		<div class="menu-items">
			<button
				v-for="item in menuItems"
				:key="item.index"
				class="menu-item"
				:class="{ active: activePath === item.index }"
				@click="linkTo(item.index)"
			>
				<span class="item-icon">{{ item.icon }}</span>
				<span class="item-label" v-if="!isCollapse">{{ item.title }}</span>
				<span class="item-indicator" v-if="activePath === item.index"></span>
			</button>
		</div>

		<div class="menu-footer">
			<button class="toggle-btn" @click="onExpand">
				<span class="toggle-icon" :class="{ rotated: isCollapse }">‹</span>
			</button>
			<div class="version-tag" v-if="!isCollapse">v1.0</div>
		</div>
	</nav>
</template>

<style scoped>
.menu {
	width: 180px;
	min-height: 100vh;
	background: var(--bg-menu);
	border-right: 1px solid var(--border-subtle);
	display: flex;
	flex-direction: column;
	transition: width 0.2s ease;
	position: relative;
	overflow: hidden;
}

.menu::before {
	content: '';
	position: absolute;
	inset: 0;
	background-image: radial-gradient(circle, rgba(148, 163, 184, 0.04) 1px, transparent 1px);
	background-size: 16px 16px;
	pointer-events: none;
}

.menu.collapsed {
	width: 52px;
}

/* Brand */
.menu-brand {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 16px 14px;
}

.brand-mark {
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-family: var(--font-display);
	font-size: 13px;
	font-weight: 600;
	color: var(--bg-app);
	background: var(--text-accent);
	border-radius: 4px;
	flex-shrink: 0;
}

.brand-text {
	display: flex;
	flex-direction: column;
	gap: 1px;
	overflow: hidden;
}

.brand-title {
	font-family: var(--font-display);
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 2px;
	color: var(--text-primary);
	line-height: 1.2;
}

.brand-sub {
	font-family: var(--font-display);
	font-size: 8px;
	letter-spacing: 1.5px;
	color: var(--text-muted);
	line-height: 1.2;
}

/* Divider */
.menu-divider {
	height: 1px;
	background: var(--border-subtle);
	margin: 0 12px;
}

/* Items */
.menu-items {
	flex: 1;
	padding: 12px 8px;
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.menu-item {
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
	padding: 8px 10px;
	border: none;
	border-radius: 6px;
	background: transparent;
	color: var(--text-muted-strong);
	cursor: pointer;
	transition: all 0.15s ease;
	position: relative;
	font-family: var(--font-body);
	font-size: 13px;
	text-align: left;
}

.menu-item:hover {
	background: var(--bg-hover-strong);
	color: var(--text-primary);
}

.menu-item.active {
	background: var(--bg-accent-subtle);
	color: var(--text-accent);
}

.item-icon {
	font-size: 14px;
	width: 20px;
	text-align: center;
	flex-shrink: 0;
}

.item-label {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.item-indicator {
	position: absolute;
	left: 0;
	top: 50%;
	transform: translateY(-50%);
	width: 2px;
	height: 16px;
	background: var(--text-accent);
	border-radius: 1px;
}

/* Footer */
.menu-footer {
	padding: 12px 8px 16px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-top: 1px solid var(--border-subtle);
}

.toggle-btn {
	width: 28px;
	height: 28px;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1px solid var(--border-subtle);
	border-radius: 6px;
	background: transparent;
	color: var(--text-muted);
	cursor: pointer;
	transition: all 0.15s ease;
}

.toggle-btn:hover {
	background: var(--bg-hover-strong);
	color: var(--text-primary);
	border-color: var(--border-primary);
}

.toggle-icon {
	font-size: 16px;
	display: inline-block;
	transition: transform 0.2s ease;
}

.toggle-icon.rotated {
	transform: rotate(180deg);
}

.version-tag {
	font-family: var(--font-display);
	font-size: 10px;
	color: var(--text-muted);
	letter-spacing: 0.5px;
}
</style>
