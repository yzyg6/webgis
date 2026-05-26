<template>
  <div class="sidebar-container">
    <SidebarNav
      :active-panel="activePanel"
      @update:active-panel="emit('update:activePanel', $event)"
    />
    <div class="sidebar-content" :class="{ expanded: activePanel !== null }">
      <div class="content-inner">
        <LayerPanel
          v-if="activePanel === 'layers'"
          :layers="layers"
          :selected-layer-id="selectedLayerId"
          @select-layer="(id) => emit('selectLayer', id)"
        />
        <BuildingInfoPanel
          v-if="activePanel === 'building'"
          :buildings="buildings"
          :selected-building="selectedBuilding"
          :search-query="searchQuery"
          :geo-properties="geoProperties"
          @select-building="(meta) => emit('selectBuilding', meta)"
          @update:search-query="(q) => emit('update:searchQuery', q)"
        />
        <PropertyTable
          v-if="activePanel === 'property'"
          :layer-name="layerName"
          :properties="properties"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SidebarNav from './SidebarNav.vue';
import LayerPanel from './LayerPanel.vue';
import BuildingInfoPanel from './BuildingInfoPanel.vue';
import PropertyTable from './PropertyTable.vue';
import type { BuildingMeta } from '../data/campus-buildings';

type LayerMeta = {
  id: string;
  name: string;
  featureCount: number;
};

defineProps<{
  activePanel: string | null;
  layers: LayerMeta[];
  selectedLayerId: string | null;
  buildings: BuildingMeta[];
  selectedBuilding: BuildingMeta | null;
  searchQuery: string;
  geoProperties: Record<string, unknown>;
  layerName: string;
  properties: Record<string, unknown>[];
}>();

const emit = defineEmits<{
  'update:activePanel': [value: string | null];
  selectLayer: [id: string];
  selectBuilding: [meta: BuildingMeta];
  'update:searchQuery': [query: string];
}>();
</script>

<style scoped>
.sidebar-container {
  display: flex;
  flex-direction: row;
  min-width: 0;
  flex-shrink: 0;
}

.sidebar-content {
  width: 0;
  overflow: hidden;
  transition: width 0.25s ease;
  background: var(--bg-panel);
  border-right: 1px solid var(--border-primary);
  border-radius: 0 10px 10px 0;
}

.sidebar-content.expanded {
  width: 320px;
}

.content-inner {
  width: 320px;
  height: 100%;
  overflow-y: auto;
}
</style>
