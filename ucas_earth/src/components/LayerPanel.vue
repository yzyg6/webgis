<template>
  <div class="layer-panel">
    <div class="panel-header">
      <span class="panel-title">📋 图层列表</span>
    </div>
    <div class="panel-body">
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
}>();

const emit = defineEmits<{
  selectLayer: [id: string];
}>();
</script>

<style scoped>
.layer-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-subtle);
  user-select: none;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.panel-body {
  overflow-y: auto;
  max-height: 400px;
  padding: 6px;
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
