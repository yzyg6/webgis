<!-- ucas_earth/src/components/BuildingInfoPanel.vue -->
<template>
  <div class="building-panel">
    <div class="panel-header">
      <span class="panel-title">🏫 建筑信息</span>
    </div>
    <div class="panel-body">
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
}>();

const emit = defineEmits<{
  'select-building': [meta: BuildingMeta];
  'update:searchQuery': [query: string];
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
  max-height: 500px;
  padding: 6px;
}

.search-box {
  padding: 4px 6px 8px;
}

.search-input {
  width: 100%;
  padding: 6px 10px;
  background: var(--bg-input);
  border: 1px solid var(--border-input);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: var(--border-input-focus);
}

.search-input::placeholder {
  color: var(--text-placeholder);
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
  color: var(--text-muted);
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
  background: var(--bg-hover-strong);
}

.building-item.selected {
  background: var(--bg-selected);
  border: 1px solid var(--border-selected);
}

.building-item-name {
  font-size: 12px;
  color: var(--text-primary);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.building-item-purpose {
  font-size: 11px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.building-detail {
  border-top: 1px solid var(--border-subtle);
  padding-top: 8px;
}

.detail-header {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-accent);
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
  border-bottom: 1px solid var(--border-faint);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: var(--text-label);
  min-width: 60px;
  flex-shrink: 0;
}

.detail-value {
  color: var(--text-primary);
  word-break: break-all;
}

.detail-section {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-divider);
}

.detail-section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-label);
  padding: 0 6px 6px;
}
</style>
