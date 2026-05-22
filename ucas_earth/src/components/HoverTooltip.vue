<template>
  <div
    class="hover-tooltip"
    v-if="visible"
    :style="{ left: x + 15 + 'px', top: y + 15 + 'px' }"
  >
    <div class="tooltip-content">
      <div class="tooltip-header" v-if="buildingName">
        <span class="building-name">{{ buildingName }}</span>
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
  background: rgba(5, 25, 39, 0.95);
  border: 1px solid rgba(160, 224, 255, 0.4);
  border-radius: 8px;
  max-width: 320px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.tooltip-header {
  padding: 8px 12px;
  background: rgba(100, 200, 255, 0.15);
  border-bottom: 1px solid rgba(160, 224, 255, 0.2);
}

.building-name {
  font-size: 13px;
  font-weight: 600;
  color: #7ee6ff;
}

.tooltip-body {
  padding: 6px 12px;
}

.tooltip-row {
  display: flex;
  gap: 8px;
  padding: 3px 0;
  font-size: 11px;
  border-bottom: 1px solid rgba(160, 224, 255, 0.06);
}

.tooltip-row:last-child {
  border-bottom: none;
}

.tooltip-row.highlight-row {
  background: rgba(255, 204, 0, 0.08);
  margin: 0 -12px;
  padding: 4px 12px;
  border-bottom: 1px solid rgba(255, 204, 0, 0.15);
}

.tooltip-key {
  color: rgba(160, 224, 255, 0.7);
  min-width: 60px;
  flex-shrink: 0;
}

.highlight-row .tooltip-key {
  color: rgba(255, 220, 100, 0.9);
}

.tooltip-value {
  color: #daf2ff;
  word-break: break-all;
}

.highlight-row .tooltip-value {
  color: #fff;
  font-weight: 500;
}

.tooltip-hint {
  padding: 6px 12px;
  background: rgba(100, 200, 255, 0.08);
  border-top: 1px solid rgba(160, 224, 255, 0.15);
  font-size: 10px;
  color: rgba(160, 224, 255, 0.5);
  text-align: center;
}
</style>
