<template>
  <div class="property-table">
    <div class="panel-header">
      <span class="panel-title">📊 属性表</span>
    </div>
    <div class="panel-body">
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
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-subtle);
  user-select: none;
  flex-shrink: 0;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.panel-body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.table-title {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-accent-strong);
  border-bottom: 1px solid var(--border-divider);
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
  background: var(--bg-table-header);
  color: var(--text-primary);
  padding: 6px 8px;
  text-align: left;
  font-weight: 600;
  white-space: nowrap;
  border-bottom: 1px solid var(--border-subtle);
}

td {
  padding: 5px 8px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-faint);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

tr:hover td {
  background: var(--bg-row-hover);
}

.row-num-col {
  width: 36px;
  text-align: center;
  color: var(--text-row-num);
}

.table-footer {
  padding: 6px 12px;
  font-size: 11px;
  color: var(--text-footer);
  border-top: 1px solid var(--border-divider);
  flex-shrink: 0;
}

.empty-tip {
  padding: 24px 12px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}
</style>
