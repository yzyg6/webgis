<template>
  <div class="flight-panel">
    <div class="panel-section">
      <div class="section-header" @click="roverOpen = !roverOpen">
        <span class="section-icon">🚗</span>
        <span class="section-title">飞行事件</span>
        <span class="section-arrow" :class="{ open: roverOpen }">▾</span>
      </div>
      <transition name="slide">
        <div v-if="roverOpen" class="section-list">
          <div
            v-for="rover in rovers"
            :key="rover.id"
            class="list-item"
            :class="{ active: selectedRoverId === rover.id }"
            @click="emit('selectRover', rover.id)"
          >
            <span class="item-dot rover-dot"></span>
            <span class="item-label">{{ rover.name }}</span>
          </div>
          <div v-if="rovers.length === 0" class="empty-hint">加载中...</div>
        </div>
      </transition>
    </div>

    <div class="panel-section">
      <div class="section-header" @click="landmarkOpen = !landmarkOpen">
        <span class="section-icon">📍</span>
        <span class="section-title">火星地标</span>
        <span class="section-arrow" :class="{ open: landmarkOpen }">▾</span>
      </div>
      <transition name="slide">
        <div v-if="landmarkOpen" class="section-list">
          <div
            v-for="lm in landmarks"
            :key="lm.key"
            class="list-item"
            :class="{ active: selectedLandmarkKey === lm.key }"
            @click="emit('selectLandmark', lm.key)"
          >
            <span class="item-dot landmark-dot"></span>
            <span class="item-label">{{ lm.name }}</span>
          </div>
          <div v-if="landmarks.length === 0" class="empty-hint">加载中...</div>
        </div>
      </transition>
    </div>

    <div class="panel-section" v-if="currentSol !== null">
      <div class="section-header">
        <span class="section-icon">📅</span>
        <span class="section-title">当前状态</span>
      </div>
      <div class="sol-display">
        <span class="sol-label">火星日</span>
        <span class="sol-value">{{ currentSol }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

type RoverItem = { id: string; name: string }
type LandmarkItem = { key: string; name: string }

defineProps<{
  rovers: RoverItem[]
  selectedRoverId: string | null
  landmarks: LandmarkItem[]
  selectedLandmarkKey: string | null
  currentSol: number | null
}>()

const emit = defineEmits<{
  selectRover: [id: string]
  selectLandmark: [key: string]
}>()

const roverOpen = ref(true)
const landmarkOpen = ref(true)
</script>

<style scoped>
.flight-panel {
  width: 220px;
  min-width: 220px;
  background: var(--bg-panel);
  border-right: 1px solid var(--border-primary);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.panel-section {
  border-bottom: 1px solid var(--border-subtle);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.section-header:hover {
  background: var(--bg-hover);
}

.section-icon {
  font-size: 14px;
  line-height: 1;
}

.section-title {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.section-arrow {
  font-size: 10px;
  color: var(--text-secondary);
  transition: transform 0.2s ease;
}

.section-arrow.open {
  transform: rotate(180deg);
}

.section-list {
  padding: 0 8px 8px;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s;
}

.list-item:hover {
  background: var(--bg-hover);
}

.list-item.active {
  background: var(--bg-selected);
}

.item-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.rover-dot {
  background: var(--text-accent);
}

.landmark-dot {
  background: #f3f263;
}

.item-label {
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-hint {
  padding: 8px 10px;
  font-size: 12px;
  color: var(--text-muted);
}

.sol-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px;
  margin: 0 8px 8px;
  background: var(--bg-hover);
  border-radius: 8px;
}

.sol-label {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.sol-value {
  font-size: 28px;
  font-weight: 700;
  font-family: var(--font-display);
  color: var(--text-accent);
}

/* 展开/折叠动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 600px;
}
</style>
