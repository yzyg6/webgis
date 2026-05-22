<template>
  <div class="property-table" :class="{ collapsed: collapsed }">
    <div class="panel-header" @click="emit('toggleCollapse')">
      <span class="panel-title">📊 属性表</span>
      <span class="panel-arrow">{{ collapsed ? '▶' : '▼' }}</span>
    </div>
    <div class="panel-body" v-show="!collapsed">
      <div class="empty-tip" v-if="!layerName">请先在上方选择一个图层</div>
      <template v-else>
        <div class="table-title">{{ layerName }}</div>
        <div class="table-scroll">
          <table v-if="columns.length > 0">
            <thead>
              <tr>
                <th class="row-num-col">#</th>
                <th v-for="col in columns" :key="col">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in properties" :key="i">
                <td class="row-num-col">{{ i + 1 }}</td>
                <td v-for="col in columns" :key="col" :title="String(row[col] ?? '')">
                  {{ formatCell(row[col]) }}
                </td>
              </tr>
            </tbody>
          </table>
          <div class="empty-tip" v-else>该图层无属性数据</div>
        </div>
        <div class="table-footer">共 {{ properties.length }} 条记录</div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  layerName: string;
  properties: Record<string, unknown>[];
  collapsed: boolean;
}>();

const emit = defineEmits<{
  toggleCollapse: [];
}>();

const columns = computed(() => {
  if (props.properties.length === 0) return [];
  const keySet = new Set<string>();
  for (const row of props.properties) {
    for (const key of Object.keys(row)) {
      keySet.add(key);
    }
  }
  return Array.from(keySet);
});

const formatCell = (value: unknown): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
};
</script>

<style scoped>
.property-table {
  width: 320px;
  background: rgba(5, 25, 39, 0.95);
  border: 1px solid rgba(160, 224, 255, 0.32);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  min-height: 0;
}

.property-table.collapsed {
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
  flex-shrink: 0;
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
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.collapsed .panel-body {
  display: none;
}

.table-title {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(160, 224, 255, 0.9);
  border-bottom: 1px solid rgba(160, 224, 255, 0.1);
  flex-shrink: 0;
}

.table-scroll {
  overflow: auto;
  max-height: 350px;
  flex: 1;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

th {
  background: rgba(23, 73, 108, 0.9);
  color: #daf2ff;
  padding: 6px 8px;
  text-align: left;
  font-weight: 600;
  white-space: nowrap;
  border-bottom: 1px solid rgba(160, 224, 255, 0.2);
}

td {
  padding: 5px 8px;
  color: rgba(218, 242, 255, 0.85);
  border-bottom: 1px solid rgba(160, 224, 255, 0.08);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

tr:hover td {
  background: rgba(32, 84, 124, 0.4);
}

.row-num-col {
  width: 36px;
  text-align: center;
  color: rgba(218, 242, 255, 0.4);
}

.table-footer {
  padding: 6px 12px;
  font-size: 11px;
  color: rgba(190, 224, 243, 0.5);
  border-top: 1px solid rgba(160, 224, 255, 0.1);
  flex-shrink: 0;
}

.empty-tip {
  padding: 24px 12px;
  text-align: center;
  font-size: 12px;
  color: rgba(190, 224, 243, 0.6);
}
</style>
