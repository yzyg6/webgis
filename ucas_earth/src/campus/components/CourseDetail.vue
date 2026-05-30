<!-- ucas_earth/src/components/CourseDetail.vue -->
<template>
  <div
    class="course-detail"
    v-if="visible"
    :style="{ left: x + 'px', top: y + 'px' }"
  >
    <div class="detail-header">
      <span class="detail-title">{{ buildingName }}</span>
      <button class="close-btn" @click="emit('close')">✕</button>
    </div>
    <div class="detail-body">
      <div class="course-list">
        <div
          class="course-card"
          v-for="course in courses"
          :key="course.id"
          :class="{ active: isActive(course) }"
          @click="emit('edit', course)"
        >
          <div class="card-time">
            <span class="time-start">{{ course.startTime }}</span>
            <span class="time-separator">-</span>
            <span class="time-end">{{ course.endTime }}</span>
          </div>
          <div class="card-info">
            <div class="card-name">{{ course.name }}</div>
            <div class="card-classroom">{{ course.classroom }}</div>
            <div class="card-teacher" v-if="course.teacher">
              {{ course.teacher }}
            </div>
          </div>
          <div class="card-status" v-if="isActive(course)">
            进行中
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Course } from '../types/courses';

defineProps<{
  visible: boolean;
  buildingName: string;
  courses: Course[];
  x: number;
  y: number;
}>();

const emit = defineEmits<{
  close: [];
  edit: [course: Course];
}>();

const isActive = (course: Course): boolean => {
  const now = new Date();
  const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  return currentTime >= course.startTime && currentTime <= course.endTime;
};
</script>

<style scoped>
.course-detail {
  position: fixed;
  background: var(--bg-panel);
  border: 1px solid var(--border-primary);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  min-width: 280px;
  max-width: 360px;
  z-index: 1000;
  overflow: hidden;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-selected);
}

.detail-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary);
  transition: all 0.15s;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.detail-body {
  padding: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.course-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.course-card:hover {
  border-color: var(--border-selected);
  background: var(--bg-hover);
}

.course-card.active {
  border-left: 3px solid #4CAF50;
}

.card-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
}

.time-start,
.time-end {
  font-size: 11px;
  color: var(--text-secondary);
}

.time-separator {
  font-size: 10px;
  color: var(--text-muted);
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-classroom {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.card-teacher {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.card-status {
  font-size: 10px;
  color: #4CAF50;
  font-weight: 600;
  padding: 2px 6px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 4px;
}
</style>
