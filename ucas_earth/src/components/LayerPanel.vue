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
  background: rgba(5, 25, 39, 0.95);
  border: 1px solid rgba(160, 224, 255, 0.32);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
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
  border-bottom: 1px solid rgba(160, 224, 255, 0.15);
  cursor: pointer;
  user-select: none;
}

.panel-header:hover {
  background: rgba(32, 84, 124, 0.3);
  border-radius: 10px 10px 0 0;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #daf2ff;
}

.collapsed .panel-title {
  display: none;
}

.panel-arrow {
  font-size: 11px;
  color: rgba(218, 242, 255, 0.7);
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
  color: rgba(190, 224, 243, 0.6);
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
  background: rgba(32, 84, 124, 0.5);
}

.layer-item.selected {
  background: rgba(40, 105, 148, 0.7);
  border: 1px solid rgba(160, 224, 255, 0.4);
}

.layer-name {
  font-size: 12px;
  color: #daf2ff;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-count {
  font-size: 11px;
  color: rgba(218, 242, 255, 0.5);
  flex-shrink: 0;
}
</style>
