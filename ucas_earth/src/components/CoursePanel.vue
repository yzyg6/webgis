<!-- ucas_earth/src/components/CoursePanel.vue -->
<template>
  <div class="course-panel">
    <div class="panel-header">
      <span class="panel-title">📅 课程表</span>
      <div class="header-actions">
        <button class="action-btn" @click="emit('import')" title="导入 Excel">
          📥
        </button>
        <button class="action-btn" @click="emit('add')" title="添加课程">
          ➕
        </button>
      </div>
    </div>
    <div class="panel-body">
      <!-- 当前时间信息 -->
      <div class="time-info">
        <div class="current-week">第 {{ currentWeek }} 周</div>
        <div class="current-day">{{ dayNames[currentDay - 1] }}</div>
      </div>

      <!-- 今日课程列表 -->
      <div class="course-list">
        <div class="empty-tip" v-if="todayCourses.length === 0">
          今日无课程安排
        </div>
        <div
          class="course-item"
          v-for="course in todayCourses"
          :key="course.id"
          :class="{ active: isActive(course) }"
          @click="emit('select', course)"
        >
          <div class="course-time">
            <span class="time-start">{{ course.startTime }}</span>
            <span class="time-separator">-</span>
            <span class="time-end">{{ course.endTime }}</span>
          </div>
          <div class="course-info">
            <div class="course-name">{{ course.name }}</div>
            <div class="course-location">
              {{ course.buildingName }} {{ course.classroom }}
            </div>
            <div class="course-teacher" v-if="course.teacher">
              {{ course.teacher }}
            </div>
          </div>
          <div class="course-status" v-if="isActive(course)">
            进行中
          </div>
        </div>
      </div>

      <!-- 筛选选项 -->
      <div class="filter-section">
        <div class="filter-label">筛选建筑</div>
        <select class="filter-select" v-model="selectedBuilding" @change="emit('filter', selectedBuilding)">
          <option value="">全部建筑</option>
          <option v-for="building in buildings" :key="building" :value="building">
            {{ building }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Course } from '../types/courses';

const props = defineProps<{
  courses: Course[];
  currentWeek: number;
  currentDay: number;
  buildings: string[];
}>();

const emit = defineEmits<{
  add: [];
  edit: [course: Course];
  delete: [id: number];
  import: [];
  select: [course: Course];
  filter: [buildingName: string];
}>();

const selectedBuilding = ref('');

const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const todayCourses = computed(() => {
  let filtered = props.courses.filter(c => c.weekday === props.currentDay);
  if (selectedBuilding.value) {
    filtered = filtered.filter(c => c.buildingName === selectedBuilding.value);
  }
  return filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));
});

const isActive = (course: Course): boolean => {
  const now = new Date();
  const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  return currentTime >= course.startTime && currentTime <= course.endTime;
};
</script>

<style scoped>
.course-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-subtle);
  user-select: none;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s;
}

.action-btn:hover {
  background: var(--bg-hover);
}

.panel-body {
  overflow-y: auto;
  padding: 8px;
  flex: 1;
}

.time-info {
  padding: 8px 10px;
  background: var(--bg-selected);
  border-radius: 6px;
  margin-bottom: 8px;
}

.current-week {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-accent);
}

.current-day {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.empty-tip {
  padding: 24px 12px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}

.course-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.course-item:hover {
  border-color: var(--border-selected);
  background: var(--bg-hover);
}

.course-item.active {
  border-left: 3px solid #4CAF50;
}

.course-time {
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

.course-info {
  flex: 1;
  min-width: 0;
}

.course-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-location {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.course-teacher {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.course-status {
  font-size: 10px;
  color: #4CAF50;
  font-weight: 600;
  padding: 2px 6px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 4px;
}

.filter-section {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
}

.filter-label {
  font-size: 11px;
  color: var(--text-label);
  margin-bottom: 6px;
}

.filter-select {
  width: 100%;
  padding: 6px 8px;
  background: var(--bg-input);
  border: 1px solid var(--border-input);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
}

.filter-select:focus {
  border-color: var(--border-input-focus);
}
</style>
