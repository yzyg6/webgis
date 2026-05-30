<!-- ucas_earth/src/components/CourseBubble.vue -->
<template>
  <div
    class="course-bubble"
    :class="{ active: isActive }"
    @click="emit('click')"
  >
    <div class="bubble-count">{{ courseCount }} 门课</div>
    <div class="bubble-time" v-if="nextCourseTime">
      {{ nextCourseTime }}
    </div>
    <div class="bubble-status" v-if="isActive">进行中</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  courseCount: number;
  nextCourseTime?: string;
  isActive: boolean;
}>();

const emit = defineEmits<{
  click: [];
}>();
</script>

<style scoped>
.course-bubble {
  background: var(--bg-panel);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: var(--shadow-panel);
  cursor: pointer;
  transition: all 0.15s;
  min-width: 80px;
  text-align: center;
}

.course-bubble:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.course-bubble.active {
  border-color: #4CAF50;
  border-width: 2px;
}

.bubble-count {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.bubble-time {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.bubble-status {
  font-size: 10px;
  color: #4CAF50;
  font-weight: 600;
  margin-top: 4px;
  padding: 2px 6px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 4px;
  display: inline-block;
}
</style>
