<!-- ucas_earth/src/components/BuildingPopup.vue -->
<template>
  <div
    class="building-popup"
    v-if="visible"
    :style="{ left: popupX + 'px', top: popupY + 'px' }"
    @click.stop
  >
    <div class="popup-content">
      <div class="popup-header">
        <span class="popup-name">{{ buildingName }}</span>
        <button class="popup-close" @click="emit('close')">✕</button>
      </div>
      <div class="popup-body">
        <div class="popup-row">
          <span class="popup-label">用途</span>
          <span class="popup-value">{{ purpose }}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">楼层</span>
          <span class="popup-value">{{ floors }} 层</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">容纳</span>
          <span class="popup-value">{{ capacity }} 人</span>
        </div>
      </div>
      <button class="popup-detail-btn" @click="emit('show-detail')">查看详情 →</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  visible: boolean;
  x: number;
  y: number;
  buildingName: string;
  purpose: string;
  floors: number;
  capacity: number;
}>();

const emit = defineEmits<{
  'show-detail': [];
  close: [];
}>();

const popupX = computed(() => {
  const offset = 15;
  const popupWidth = 240;
  const viewWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
  if (props.x + offset + popupWidth > viewWidth) {
    return props.x - popupWidth - offset;
  }
  return props.x + offset;
});

const popupY = computed(() => {
  const offset = 15;
  const popupHeight = 200;
  const viewHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  if (props.y + offset + popupHeight > viewHeight) {
    return props.y - popupHeight - offset;
  }
  return props.y + offset;
});
</script>

<style scoped>
.building-popup {
  position: fixed;
  z-index: 1000;
  pointer-events: auto;
}

.popup-content {
  background: rgba(5, 25, 39, 0.95);
  border: 1px solid rgba(160, 224, 255, 0.4);
  border-radius: 10px;
  width: 240px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: rgba(100, 200, 255, 0.15);
  border-bottom: 1px solid rgba(160, 224, 255, 0.2);
}

.popup-name {
  font-size: 14px;
  font-weight: 600;
  color: #7ee6ff;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.popup-close {
  background: none;
  border: none;
  color: rgba(160, 224, 255, 0.6);
  cursor: pointer;
  font-size: 14px;
  padding: 0 4px;
  line-height: 1;
}

.popup-close:hover {
  color: #ff6b6b;
}

.popup-body {
  padding: 8px 12px;
}

.popup-row {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
}

.popup-label {
  color: rgba(160, 224, 255, 0.7);
  min-width: 40px;
  flex-shrink: 0;
}

.popup-value {
  color: #daf2ff;
}

.popup-detail-btn {
  display: block;
  width: 100%;
  padding: 8px;
  background: rgba(100, 200, 255, 0.12);
  border: none;
  border-top: 1px solid rgba(160, 224, 255, 0.15);
  color: #7ee6ff;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.popup-detail-btn:hover {
  background: rgba(100, 200, 255, 0.25);
}
</style>
