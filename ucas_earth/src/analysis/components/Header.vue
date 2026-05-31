<template>
  <header class="app-header">
    <div class="title-wrap">
      <h1 class="title">空间分析</h1>
      <p class="subtitle">Spatial Analysis</p>
    </div>

    <div class="menu-bar">
      <div class="menu-item">
        <span class="menu-icon">🗺️</span>
        <span class="menu-label">底图</span>
        <span class="menu-arrow">▼</span>
        <div class="submenu">
          <button class="submenu-item" type="button" @click="emit('switchLayer', 'osm')">
            <span class="submenu-icon">📝</span>
            <span class="submenu-label">OpenStreetMap</span>
          </button>
          <button class="submenu-item" type="button" @click="emit('switchLayer', 'arcgis')">
            <span class="submenu-icon">📝</span>
            <span class="submenu-label">ArcGIS World Imagery</span>
          </button>
          <button class="submenu-item" type="button" @click="emit('switchLayer', 'carto')">
            <span class="submenu-icon">📝</span>
            <span class="submenu-label">Carto Light</span>
          </button>
          <button class="submenu-item" type="button" @click="emit('switchLayer', 'google-satellite')">
            <span class="submenu-icon">🛰️</span>
            <span class="submenu-label">Google Satellite</span>
          </button>
        </div>
      </div>
    </div>

    <ThemeToggle />
    <div class="meta">{{ todayText }}</div>
  </header>
</template>

<script setup lang="ts">
import ThemeToggle from './ThemeToggle.vue'
import type { BaseLayerType } from '../types/analysis'

const emit = defineEmits<{
  switchLayer: [layer: BaseLayerType]
}>()

const todayText = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
</script>

<style scoped>
.app-header {
  background: var(--bg-header);
  border-bottom: 1px solid var(--border-header);
  padding: 0 20px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 24px;
  box-shadow: var(--shadow-header);
}

.title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.title {
  margin: 0;
  font-size: 22px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: var(--text-primary);
}

.subtitle {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
  letter-spacing: 1px;
}

.meta {
  margin-left: auto;
  padding: 6px 10px;
  border: 1px solid var(--border-badge);
  border-radius: 999px;
  font-size: 12px;
  color: var(--text-primary);
  background: var(--bg-badge);
}

.menu-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.menu-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-menu);
  background: var(--bg-menu);
  color: var(--text-primary);
  cursor: pointer;
  user-select: none;
}

.menu-item::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  height: 12px;
}

.menu-item:hover {
  background: var(--bg-menu-hover);
  border-color: var(--border-menu-hover);
}

.menu-icon,
.menu-label,
.menu-arrow {
  font-size: 13px;
}

.submenu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 240px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
  border-radius: 10px;
  border: 1px solid var(--border-primary);
  background: var(--bg-panel);
  box-shadow: var(--shadow-submenu);
  z-index: 20;
  opacity: 0;
  visibility: hidden;
  transform: translateY(6px);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0s linear 0.4s;
}

.menu-item:hover .submenu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  pointer-events: auto;
  transition-delay: 0s;
}

.submenu-item {
  border: 0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  background: transparent;
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
}

.submenu-item:hover {
  background: var(--bg-hover-strong);
}

@media (max-width: 900px) {
  .app-header { gap: 10px; padding: 0 10px; }
  .title { font-size: 18px; }
  .subtitle, .meta { display: none; }
}
</style>
