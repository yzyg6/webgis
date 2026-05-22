<!-- ucas_earth/src/components/BuildingInfoPanel.vue -->
<template>
  <div class="building-panel" :class="{ collapsed: collapsed }">
    <div class="panel-header" @click="emit('toggle-collapse')">
      <span class="panel-title">🏫 建筑信息</span>
      <span class="panel-arrow">{{ collapsed ? '▶' : '▼' }}</span>
    </div>
    <div class="panel-body" v-show="!collapsed">
      <!-- 搜索框 -->
      <div class="search-box">
        <input
          type="text"
          class="search-input"
          placeholder="搜索建筑名称..."
          :value="searchQuery"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- 建筑列表 -->
      <div class="building-list">
        <div class="empty-tip" v-if="filteredBuildings.length === 0">无匹配建筑</div>
        <div
          class="building-item"
          v-for="meta in filteredBuildings"
          :key="meta.name"
          :class="{ selected: selectedBuilding?.name === meta.name }"
          @click="emit('select-building', meta)"
        >
          <span class="building-item-name">{{ meta.name }}</span>
          <span class="building-item-purpose">{{ meta.purpose }}</span>
        </div>
      </div>

      <!-- 详情区域 -->
      <div class="building-detail" v-if="selectedBuilding">
        <div class="detail-header">{{ selectedBuilding.name }}</div>
        <div class="detail-rows">
          <div class="detail-row">
            <span class="detail-label">用途</span>
            <span class="detail-value">{{ selectedBuilding.purpose }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">楼层</span>
            <span class="detail-value">{{ selectedBuilding.floors }} 层</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">容纳人数</span>
            <span class="detail-value">{{ selectedBuilding.capacity }} 人</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">所属</span>
            <span class="detail-value">{{ selectedBuilding.college }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">联系电话</span>
            <span class="detail-value">{{ selectedBuilding.contact }}</span>
          </div>
          <div class="detail-row" v-if="selectedBuilding.description">
            <span class="detail-label">简介</span>
            <span class="detail-value">{{ selectedBuilding.description }}</span>
          </div>
        </div>

        <!-- GeoJSON 原始属性 -->
        <div class="detail-section" v-if="geoProperties.length > 0">
          <div class="detail-section-title">GeoJSON 属性</div>
          <div
            class="detail-row"
            v-for="prop in geoProperties"
            :key="prop.key"
          >
            <span class="detail-label">{{ prop.key }}</span>
            <span class="detail-value">{{ prop.value }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BuildingMeta } from '../data/campus-buildings';

const props = defineProps<{
  buildings: BuildingMeta[];
  selectedBuilding: BuildingMeta | null;
  searchQuery: string;
  geoProperties: Record<string, unknown>;
  collapsed: boolean;
}>();

const emit = defineEmits<{
  'select-building': [meta: BuildingMeta];
  'update:searchQuery': [query: string];
  'toggle-collapse': [];
}>();

const filteredBuildings = computed(() => {
  if (!props.searchQuery.trim()) {
    return props.buildings;
  }
  const query = props.searchQuery.toLowerCase();
  return props.buildings.filter(
    (meta) =>
      meta.name.toLowerCase().includes(query) ||
      meta.purpose.toLowerCase().includes(query) ||
      meta.college.toLowerCase().includes(query)
  );
});

const HIDDEN_KEYS = new Set([
  'id', 'fid', 'objectid', 'shape_length', 'shape_area',
  'globalid', 'created_user', 'created_date', 'last_edited_user',
  'last_edited_date',
]);

const geoProperties = computed(() => {
  return Object.entries(props.geoProperties)
    .filter(([key, value]) => {
      if (HIDDEN_KEYS.has(key.toLowerCase())) return false;
      if (value === null || value === undefined) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      return true;
    })
    .map(([key, value]) => ({
      key,
      value: String(value),
    }));
});
</script>

<style scoped>
.building-panel {
  width: 320px;
  background: rgba(5, 25, 39, 0.95);
  border: 1px solid rgba(160, 224, 255, 0.32);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
}

.building-panel.collapsed {
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

.panel-body {
  overflow-y: auto;
  max-height: 500px;
  padding: 6px;
}

.collapsed .panel-body {
  display: none;
}

.search-box {
  padding: 4px 6px 8px;
}

.search-input {
  width: 100%;
  padding: 6px 10px;
  background: rgba(10, 35, 50, 0.8);
  border: 1px solid rgba(160, 224, 255, 0.25);
  border-radius: 6px;
  color: #daf2ff;
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: rgba(100, 200, 255, 0.6);
}

.search-input::placeholder {
  color: rgba(160, 224, 255, 0.4);
}

.building-list {
  max-height: 180px;
  overflow-y: auto;
  margin-bottom: 6px;
}

.empty-tip {
  padding: 16px 8px;
  text-align: center;
  font-size: 12px;
  color: rgba(190, 224, 243, 0.6);
}

.building-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.building-item:hover {
  background: rgba(32, 84, 124, 0.5);
}

.building-item.selected {
  background: rgba(40, 105, 148, 0.7);
  border: 1px solid rgba(160, 224, 255, 0.4);
}

.building-item-name {
  font-size: 12px;
  color: #daf2ff;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.building-item-purpose {
  font-size: 11px;
  color: rgba(218, 242, 255, 0.5);
  flex-shrink: 0;
}

.building-detail {
  border-top: 1px solid rgba(160, 224, 255, 0.15);
  padding-top: 8px;
}

.detail-header {
  font-size: 13px;
  font-weight: 600;
  color: #7ee6ff;
  padding: 4px 6px 8px;
}

.detail-rows {
  padding: 0 6px;
}

.detail-row {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  font-size: 11px;
  border-bottom: 1px solid rgba(160, 224, 255, 0.06);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: rgba(160, 224, 255, 0.7);
  min-width: 60px;
  flex-shrink: 0;
}

.detail-value {
  color: #daf2ff;
  word-break: break-all;
}

.detail-section {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(160, 224, 255, 0.1);
}

.detail-section-title {
  font-size: 11px;
  font-weight: 600;
  color: rgba(160, 224, 255, 0.6);
  padding: 0 6px 6px;
}
</style>
