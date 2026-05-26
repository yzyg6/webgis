<template>
  <div
    class="hover-tooltip"
    v-if="visible"
    :style="{ left: x + 15 + 'px', top: y + 15 + 'px' }"
  >
    <div class="tooltip-content">
      <div class="tooltip-header" v-if="buildingName">
        <span class="building-name">{{ buildingName }}</span>
        <span class="tooltip-type" v-if="buildingType"> · {{ buildingType }}</span>
      </div>
      <div class="tooltip-body">
        <div
          class="tooltip-row"
          v-for="item in filteredProperties"
          :key="item.key"
          :class="{ 'highlight-row': item.highlight }"
        >
          <span class="tooltip-key">{{ item.label }}</span>
          <span class="tooltip-value">{{ item.value }}</span>
        </div>
      </div>
      <div class="tooltip-hint">双击编辑属性</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getBuildingType } from '../data/building-type-mapping';
import { BUILDING_TYPE_LABELS } from '../types/building';

interface Props {
  visible: boolean;
  x: number;
  y: number;
  properties: Record<string, unknown>;
}

const props = defineProps<Props>();

// Hidden internal properties
const HIDDEN_KEYS = new Set([
  'id', 'fid', 'objectid', 'shape_length', 'shape_area',
  'globalid', 'created_user', 'created_date', 'last_edited_user',
  'last_edited_date', 'globalid_1', 'objectid_1'
]);

// Important properties to highlight and show first
const IMPORTANT_KEYS: Record<string, { label: string; priority: number }> = {
  'name': { label: '名称', priority: 1 },
  'building': { label: '类型', priority: 2 },
  'Height': { label: '高度', priority: 3 },
  'height': { label: '高度', priority: 3 },
  'building:levels': { label: '层数', priority: 4 },
  'addr:street': { label: '地址', priority: 5 },
  'addr:housenumber': { label: '门牌号', priority: 6 },
};

// Property key display labels
const KEY_LABELS: Record<string, string> = {
  'name': '名称',
  'building': '类型',
  'Height': '高度',
  'height': '高度',
  'building:levels': '层数',
  'building:material': '材料',
  'building:colour': '颜色',
  'addr:street': '街道',
  'addr:housenumber': '门牌号',
  'addr:city': '城市',
  'addr:postcode': '邮编',
  'phone': '电话',
  'website': '网站',
  'opening_hours': '营业时间',
  'operator': '运营商',
  'source': '数据来源',
  'ele': '海拔',
  'layer': '图层',
};

const buildingName = computed(() => {
  const name = props.properties.name || props.properties.Name;
  return name ? String(name) : null;
});

const buildingType = computed(() => {
  const type = getBuildingType(props.properties as Record<string, unknown>);
  return BUILDING_TYPE_LABELS[type];
});

const filteredProperties = computed(() => {
  const entries = Object.entries(props.properties)
    .filter(([key, value]) => {
      // Filter out hidden keys
      if (HIDDEN_KEYS.has(key.toLowerCase())) return false;
      // Filter out null/undefined values
      if (value === null || value === undefined) return false;
      // Filter out empty strings
      if (typeof value === 'string' && value.trim() === '') return false;
      return true;
    })
    .map(([key, value]) => {
      const important = IMPORTANT_KEYS[key];
      const label = KEY_LABELS[key] || key;
      const formattedValue = formatValue(key, value);
      const highlight = !!important;

      return {
        key,
        label,
        value: formattedValue,
        priority: important?.priority ?? 100,
        highlight,
      };
    })
    .sort((a, b) => a.priority - b.priority);

  return entries;
});

const formatValue = (key: string, value: unknown): string => {
  if (value === null || value === undefined) return '-';

  // Format height values
  if (key === 'Height' || key === 'height') {
    const num = Number(value);
    if (!isNaN(num)) {
      return `${num.toFixed(1)} 米`;
    }
  }

  // Format building levels
  if (key === 'building:levels') {
    const num = Number(value);
    if (!isNaN(num)) {
      return `${num} 层`;
    }
  }

  // Format elevation
  if (key === 'ele') {
    const num = Number(value);
    if (!isNaN(num)) {
      return `${num.toFixed(1)} 米`;
    }
  }

  return String(value);
};
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
  max-width: 320px;
  box-shadow: var(--shadow-popup);
  overflow: hidden;
}

.tooltip-header {
  padding: 8px 12px;
  background: var(--bg-accent-tint);
  border-bottom: 1px solid var(--border-subtle);
}

.building-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-accent);
}

.tooltip-type {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: normal;
}

.tooltip-body {
  padding: 6px 12px;
}

.tooltip-row {
  display: flex;
  gap: 8px;
  padding: 3px 0;
  font-size: 11px;
  border-bottom: 1px solid var(--border-faint);
}

.tooltip-row:last-child {
  border-bottom: none;
}

.tooltip-row.highlight-row {
  background: var(--bg-highlight-row);
  margin: 0 -12px;
  padding: 4px 12px;
  border-bottom: 1px solid var(--border-highlight);
}

.tooltip-key {
  color: var(--text-label);
  min-width: 60px;
  flex-shrink: 0;
}

.highlight-row .tooltip-key {
  color: var(--text-highlight-key);
}

.tooltip-value {
  color: var(--text-primary);
  word-break: break-all;
}

.highlight-row .tooltip-value {
  color: var(--text-highlight-value);
  font-weight: 500;
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
