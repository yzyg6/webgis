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
        <div class="popup-header-info">
          <span class="popup-name">{{ buildingName }}</span>
          <span class="popup-type" v-if="buildingTypeLabel">{{ buildingTypeLabel }}</span>
        </div>
        <button class="popup-close" @click="emit('close')">✕</button>
      </div>
      <div class="popup-body">
        <div class="popup-courses-header">今日课程</div>
        <div v-if="courses.length === 0" class="popup-no-courses">暂无课程</div>
        <div v-else class="popup-course-list">
          <div v-for="course in courses" :key="course.id" class="popup-course-item">
            <div class="popup-course-time">{{ course.startTime }}-{{ course.endTime }}</div>
            <div class="popup-course-name">{{ course.name }}</div>
            <div class="popup-course-meta">{{ course.classroom }}{{ course.teacher ? ' · ' + course.teacher : '' }}</div>
          </div>
        </div>
      </div>
      <button class="popup-detail-btn" @click="emit('show-detail')">查看详情 →</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Course } from '../types/courses';
import type { BuildingType } from '../../shared/types/building';
import { BUILDING_TYPE_LABELS } from '../../shared/types/building';

const props = defineProps<{
  visible: boolean;
  x: number;
  y: number;
  buildingName: string;
  buildingType?: BuildingType;
  courses: Course[];
}>();

const emit = defineEmits<{
  'show-detail': [];
  close: [];
}>();

const buildingTypeLabel = computed(() => {
  return props.buildingType ? BUILDING_TYPE_LABELS[props.buildingType] : '';
});

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
  background: var(--bg-panel);
  border: 1px solid var(--border-tooltip);
  border-radius: 10px;
  width: 240px;
  box-shadow: var(--shadow-popup);
  overflow: hidden;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--bg-accent-tint);
  border-bottom: 1px solid var(--border-subtle);
}

.popup-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-accent);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.popup-header-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.popup-type {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.popup-close {
  background: none;
  border: none;
  color: var(--text-close);
  cursor: pointer;
  font-size: 14px;
  padding: 0 4px;
  line-height: 1;
}

.popup-close:hover {
  color: var(--text-close-hover);
}

.popup-body {
  padding: 8px 12px;
}

.popup-courses-header {
  font-size: 11px;
  color: var(--text-label);
  font-weight: 500;
  margin-bottom: 6px;
}

.popup-no-courses {
  font-size: 12px;
  color: var(--text-muted);
  padding: 8px 0;
  text-align: center;
}

.popup-course-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
}

.popup-course-item {
  padding: 6px 8px;
  background: var(--bg-secondary);
  border-radius: 6px;
}

.popup-course-time {
  font-size: 11px;
  color: var(--text-accent);
  font-weight: 500;
}

.popup-course-name {
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 500;
  margin-top: 2px;
}

.popup-course-meta {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.popup-detail-btn {
  display: block;
  width: 100%;
  padding: 8px;
  background: var(--bg-accent-subtle);
  border: none;
  border-top: 1px solid var(--border-subtle);
  color: var(--text-accent);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.popup-detail-btn:hover {
  background: var(--bg-accent-subtle-hover);
}
</style>
