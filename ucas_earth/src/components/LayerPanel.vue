<template>
  <div class="layer-panel" :class="{ collapsed: collapsed }">
    <div class="panel-header" @click="emit('toggleCollapse')">
      <span class="panel-title">📋 图层列表</span>
      <span class="panel-arrow">{{ collapsed ? '▶' : '▼' }}</span>
    </div>
    <div class="panel-body" v-show="!collapsed">
      <div class="empty-tip" v-if="layers.length === 0">暂无已加载图层</div>
      <div
        class="layer-item"
        v-for="layer in layers"
        :key="layer.id"
        :class="{ selected: layer.id === selectedLayerId }"
        @click="emit('selectLayer', layer.id)"
      >
        <span class="layer-name" :title="layer.name">{{ layer.name }}</span>
        <span class="layer-count">{{ layer.featureCount }} 要素</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type LayerMeta = {
  id: string;
  name: string;
  featureCount: number;
};

defineProps<{
  layers: LayerMeta[];
  selectedLayerId: string | null;
  collapsed: boolean;
}>();

const emit = defineEmits<{
  selectLayer: [id: string];
  toggleCollapse: [];
}>();
</script>

<style scoped>
.layer-panel {
  width: 320px;
  background: var(--bg-panel);
  border: 1px solid var(--border-primary);
  border-radius: 10px;
  box-shadow: var(--shadow-panel);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
}

.layer-panel.collapsed {
  width: 40px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
  user-select: none;
}

.panel-header:hover {
  background: var(--bg-hover);
  border-radius: 10px 10px 0 0;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.collapsed .panel-title {
  display: none;
}

.panel-arrow {
  font-size: 11px;
  color: var(--text-secondary);
}

.collapsed .panel-arrow {
  transform: rotate(0deg);
}

.panel-body {
  overflow-y: auto;
  max-height: 400px;
  padding: 6px;
}

.collapsed .panel-body {
  display: none;
}

.empty-tip {
  padding: 16px 8px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}

.layer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.layer-item:hover {
  background: var(--bg-hover-strong);
}

.layer-item.selected {
  background: var(--bg-selected);
  border: 1px solid var(--border-selected);
}

.layer-name {
  font-size: 12px;
  color: var(--text-primary);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-count {
  font-size: 11px;
  color: var(--text-secondary);
  flex-shrink: 0;
}
</style>
