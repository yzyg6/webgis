<template>
  <div class="sidebar-nav">
    <div
      v-for="item in panelItems"
      :key="item.id"
      class="nav-item"
      :class="{ active: activePanel === item.id }"
      @click="handleClick(item.id)"
      @mouseenter="handleMouseEnter(item)"
      @mouseleave="handleMouseLeave"
    >
      <span class="nav-icon">{{ item.icon }}</span>
      <div class="active-indicator" v-if="activePanel === item.id"></div>
    </div>

    <!-- Tooltip -->
    <div
      class="tooltip"
      v-if="tooltip.visible"
      :style="{ top: tooltip.y + 'px' }"
    >
      <span class="tooltip-text">{{ tooltip.text }}</span>
      <div class="tooltip-arrow"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

type PanelItem = {
  id: string;
  icon: string;
  label: string;
};

const props = defineProps<{
  activePanel: string | null;
}>();

const emit = defineEmits<{
  'update:activePanel': [value: string | null];
}>();

const panelItems: PanelItem[] = [
  { id: 'layers', icon: '📋', label: '图层列表' },
  { id: 'building', icon: '🏫', label: '建筑信息' },
  { id: 'property', icon: '📊', label: '属性表' },
];

const tooltip = reactive({
  visible: false,
  text: '',
  y: 0,
});

let tooltipTimeout: ReturnType<typeof setTimeout> | null = null;

const handleClick = (panelId: string): void => {
  if (props.activePanel === panelId) {
    emit('update:activePanel', null);
  } else {
    emit('update:activePanel', panelId);
  }
};

const handleMouseEnter = (item: PanelItem): void => {
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
  }
  tooltipTimeout = setTimeout(() => {
    tooltip.text = item.label;
    tooltip.y = panelItems.indexOf(item) * 56 + 16;
    tooltip.visible = true;
  }, 300);
};

const handleMouseLeave = (): void => {
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = null;
  }
  tooltip.visible = false;
};
</script>

<style scoped>
.sidebar-nav {
  width: 40px;
  background: var(--bg-panel);
  border-right: 1px solid var(--border-primary);
  border-radius: 10px 0 0 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 8px;
  gap: 14px;
  flex-shrink: 0;
  position: relative;
}

.nav-item {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}

.nav-item:hover {
  background: var(--bg-hover);
}

.nav-item.active {
  background: var(--bg-selected);
}

.nav-icon {
  font-size: 18px;
  line-height: 1;
}

.active-indicator {
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: var(--text-accent);
  border-radius: 1px;
}

.tooltip {
  position: absolute;
  left: 100%;
  margin-left: 8px;
  background: var(--bg-panel-solid);
  border: 1px solid var(--border-tooltip);
  border-radius: 6px;
  padding: 6px 10px;
  white-space: nowrap;
  z-index: 1000;
  pointer-events: none;
}

.tooltip-text {
  font-size: 12px;
  color: var(--text-primary);
}

.tooltip-arrow {
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-right: 6px solid var(--border-tooltip);
}
</style>
