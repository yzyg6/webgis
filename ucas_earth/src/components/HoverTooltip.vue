<!-- ucas_earth/src/components/HoverTooltip.vue -->
<template>
  <div
    class="hover-tooltip"
    v-if="visible && buildingName"
    :style="{ left: x + 15 + 'px', top: y + 15 + 'px' }"
  >
    <div class="tooltip-content">
      <div class="tooltip-name">{{ buildingName }}</div>
      <div class="tooltip-info">
        <span v-if="buildingType">{{ buildingType }}</span>
        <span v-if="buildingType && courseCount !== undefined"> · </span>
        <span v-if="courseCount !== undefined">今日 {{ courseCount }} 节课</span>
      </div>
      <div class="tooltip-hint">双击查看详情</div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean;
  x: number;
  y: number;
  buildingName: string;
  buildingType?: string;
  courseCount?: number;
}

defineProps<Props>();
</script>

<style scoped>
.hover-tooltip {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
}

.tooltip-content {
  background: var(--bg-panel);
  border: 1px solid var(--border-tooltip);
  border-radius: 8px;
  min-width: 160px;
  max-width: 280px;
  box-shadow: var(--shadow-popup);
  overflow: hidden;
}

.tooltip-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  padding: 10px 12px 4px;
}

.tooltip-info {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 0 12px 8px;
}

.tooltip-hint {
  padding: 6px 12px;
  background: var(--bg-accent-subtle);
  border-top: 1px solid var(--border-subtle);
  font-size: 10px;
  color: var(--text-placeholder);
  text-align: center;
}
</style>
