<script setup lang="ts">
import { ref, computed } from 'vue'
import type { HotCity } from '../types/city'

const props = defineProps<{
  selectedCity: string | null
}>()

const emit = defineEmits<{
  'select-city': [city: HotCity]
}>()

const isCollapsed = ref(false)

const hotCities: HotCity[] = [
  { name: '北京', nameEn: 'beijing', lon: 116.4, lat: 39.9, region: '中国', emoji: '🇨🇳' },
  { name: '上海', nameEn: 'shanghai', lon: 121.5, lat: 31.2, region: '中国', emoji: '🇨🇳' },
  { name: '广州', nameEn: 'guangzhou', lon: 113.3, lat: 23.1, region: '中国', emoji: '🇨🇳' },
  { name: '深圳', nameEn: 'shenzhen', lon: 114.1, lat: 22.5, region: '中国', emoji: '🇨🇳' },
  { name: '成都', nameEn: 'chengdu', lon: 104.1, lat: 30.6, region: '中国', emoji: '🇨🇳' },
  { name: '杭州', nameEn: 'hangzhou', lon: 120.2, lat: 30.3, region: '中国', emoji: '🇨🇳' },
  { name: '西安', nameEn: 'xian', lon: 108.9, lat: 34.3, region: '中国', emoji: '🇨🇳' },
  { name: '重庆', nameEn: 'chongqing', lon: 106.5, lat: 29.6, region: '中国', emoji: '🇨🇳' },
  { name: '东京', nameEn: 'tokyo', lon: 139.7, lat: 35.7, region: '亚洲', emoji: '🇯🇵' },
  { name: '迪拜', nameEn: 'dubai', lon: 55.3, lat: 25.3, region: '亚洲', emoji: '🇦🇪' },
  { name: '纽约', nameEn: 'newyork', lon: -74.0, lat: 40.7, region: '美洲', emoji: '🇺🇸' },
  { name: '伦敦', nameEn: 'london', lon: -0.1, lat: 51.5, region: '欧洲', emoji: '🇬🇧' },
  { name: '巴黎', nameEn: 'paris', lon: 2.3, lat: 48.9, region: '欧洲', emoji: '🇫🇷' },
  { name: '悉尼', nameEn: 'sydney', lon: 151.2, lat: -33.9, region: '大洋洲', emoji: '🇦🇺' },
  { name: '开罗', nameEn: 'cairo', lon: 31.2, lat: 30.0, region: '非洲', emoji: '🇪🇬' },
]

const regions = computed(() => {
  const order = ['中国', '亚洲', '欧洲', '美洲', '大洋洲', '非洲']
  const existing = new Set(hotCities.map(c => c.region))
  return order.filter(r => existing.has(r))
})

const citiesByRegion = computed(() => {
  const map: Record<string, HotCity[]> = {}
  for (const city of hotCities) {
    if (!map[city.region]) map[city.region] = []
    map[city.region].push(city)
  }
  return map
})

const handleSelect = (city: HotCity) => {
  emit('select-city', city)
}
</script>

<template>
  <div class="city-panel" :class="{ collapsed: isCollapsed }">
    <div class="panel-header">
      <button class="toggle-btn" @click="isCollapsed = !isCollapsed">
        {{ isCollapsed ? '🌆' : '◀' }}
      </button>
      <h3 v-if="!isCollapsed">热门城市</h3>
    </div>
    <div v-if="!isCollapsed" class="panel-body">
      <div v-for="region in regions" :key="region" class="region-group">
        <div class="region-label">{{ region }}</div>
        <div class="city-grid">
          <button
            v-for="city in citiesByRegion[region]"
            :key="city.nameEn"
            class="city-btn"
            :class="{ active: selectedCity === city.nameEn }"
            @click="handleSelect(city)"
          >
            <span class="city-emoji">{{ city.emoji }}</span>
            <span class="city-name">{{ city.name }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.city-panel {
  width: 220px;
  background: var(--bg-panel, rgba(15, 23, 42, 0.9));
  border-right: 1px solid var(--border-primary, rgba(100, 116, 139, 0.2));
  overflow-y: auto;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
}

.city-panel.collapsed {
  width: 40px;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid var(--border-primary, rgba(100, 116, 139, 0.2));
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #e2e8f0);
}

.toggle-btn {
  background: none;
  border: 1px solid var(--border-primary, rgba(100, 116, 139, 0.2));
  border-radius: 6px;
  color: var(--text-primary, #e2e8f0);
  cursor: pointer;
  padding: 4px 8px;
  font-size: 14px;
  transition: background 0.2s;
}

.toggle-btn:hover {
  background: var(--bg-menu-hover, rgba(100, 116, 139, 0.15));
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.region-group {
  margin-bottom: 12px;
}

.region-label {
  font-size: 11px;
  color: var(--text-muted, #94a3b8);
  text-transform: uppercase;
  padding: 4px 8px;
  letter-spacing: 0.5px;
}

.city-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.city-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1px solid var(--border-primary, rgba(100, 116, 139, 0.2));
  border-radius: 6px;
  background: var(--bg-menu, rgba(30, 41, 59, 0.8));
  color: var(--text-primary, #e2e8f0);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.city-btn:hover {
  background: var(--bg-menu-hover, rgba(100, 116, 139, 0.15));
  border-color: var(--border-menu-hover, rgba(180, 122, 10, 0.35));
}

.city-btn.active {
  background: var(--bg-active, rgba(59, 130, 246, 0.2));
  border-color: var(--accent, #3b82f6);
}

.city-emoji {
  font-size: 14px;
}

.city-name {
  white-space: nowrap;
}
</style>
