<!-- ucas_earth/src/components/CourseForm.vue -->
<template>
  <div class="course-form-overlay" v-if="visible" @click.self="emit('cancel')">
    <div class="course-form">
      <div class="form-header">
        <span class="form-title">{{ isEdit ? '编辑课程' : '添加课程' }}</span>
        <button class="close-btn" @click="emit('cancel')">✕</button>
      </div>
      <div class="form-body">
        <div class="form-group">
          <label class="form-label">课程名称 <span class="required">*</span></label>
          <input
            type="text"
            class="form-input"
            v-model="formData.name"
            placeholder="请输入课程名称"
          />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">建筑名称 <span class="required">*</span></label>
            <select class="form-input" v-model="formData.buildingName">
              <option value="">请选择建筑</option>
              <option v-for="building in buildings" :key="building" :value="building">
                {{ building }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">教室 <span class="required">*</span></label>
            <input
              type="text"
              class="form-input"
              v-model="formData.classroom"
              placeholder="如: 301"
            />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">星期 <span class="required">*</span></label>
            <select class="form-input" v-model="formData.weekday">
              <option v-for="(day, index) in dayNames" :key="index" :value="index + 1">
                {{ day }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">课程类型</label>
            <select class="form-input" v-model="formData.courseType">
              <option value="required">必修</option>
              <option value="elective">选修</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">开始时间 <span class="required">*</span></label>
            <input
              type="time"
              class="form-input"
              v-model="formData.startTime"
            />
          </div>
          <div class="form-group">
            <label class="form-label">结束时间 <span class="required">*</span></label>
            <input
              type="time"
              class="form-input"
              v-model="formData.endTime"
            />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">周数范围 <span class="required">*</span></label>
          <input
            type="text"
            class="form-input"
            v-model="formData.weekRange"
            placeholder="如: 1-16 或 1,3,5,7 或 单周"
          />
          <div class="form-hint">支持格式: "1-16", "1,3,5,7", "单周", "双周"</div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">教师</label>
            <input
              type="text"
              class="form-input"
              v-model="formData.teacher"
              placeholder="请输入教师姓名"
            />
          </div>
          <div class="form-group">
            <label class="form-label">学分</label>
            <input
              type="number"
              class="form-input"
              v-model.number="formData.credits"
              min="0"
              max="10"
              step="0.5"
            />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">作业截止时间</label>
          <input
            type="datetime-local"
            class="form-input"
            v-model="formData.homeworkDue"
          />
        </div>
        <div class="form-group">
          <label class="form-label">考试时间</label>
          <input
            type="datetime-local"
            class="form-input"
            v-model="formData.examTime"
          />
        </div>
      </div>
      <div class="form-footer">
        <button class="btn btn-secondary" @click="emit('cancel')">取消</button>
        <button class="btn btn-primary" @click="handleSave" :disabled="!isValid">
          {{ isEdit ? '保存' : '添加' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Course, CourseCreateInput } from '../types/courses';

const props = defineProps<{
  visible: boolean;
  course?: Course;
  buildings: string[];
}>();

const emit = defineEmits<{
  save: [input: CourseCreateInput];
  cancel: [];
}>();

const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const isEdit = computed(() => !!props.course);

const formData = ref<CourseCreateInput>({
  name: '',
  classroom: '',
  buildingName: '',
  weekday: 1,
  startTime: '08:00',
  endTime: '09:40',
  weekRange: '1-16',
  teacher: '',
  courseType: 'required',
  credits: 0,
  homeworkDue: '',
  examTime: '',
});

watch(() => props.course, (newCourse) => {
  if (newCourse) {
    formData.value = {
      name: newCourse.name,
      classroom: newCourse.classroom,
      buildingName: newCourse.buildingName,
      weekday: newCourse.weekday,
      startTime: newCourse.startTime,
      endTime: newCourse.endTime,
      weekRange: newCourse.weekRange,
      teacher: newCourse.teacher || '',
      courseType: newCourse.courseType,
      credits: newCourse.credits,
      homeworkDue: newCourse.homeworkDue || '',
      examTime: newCourse.examTime || '',
    };
  } else {
    formData.value = {
      name: '',
      classroom: '',
      buildingName: '',
      weekday: 1,
      startTime: '08:00',
      endTime: '09:40',
      weekRange: '1-16',
      teacher: '',
      courseType: 'required',
      credits: 0,
      homeworkDue: '',
      examTime: '',
    };
  }
}, { immediate: true });

const isValid = computed(() => {
  return (
    formData.value.name.trim() !== '' &&
    formData.value.classroom.trim() !== '' &&
    formData.value.buildingName.trim() !== '' &&
    formData.value.startTime.trim() !== '' &&
    formData.value.endTime.trim() !== '' &&
    formData.value.weekRange.trim() !== '' &&
    formData.value.startTime < formData.value.endTime
  );
});

const handleSave = () => {
  if (isValid.value) {
    emit('save', { ...formData.value });
  }
};
</script>

<style scoped>
.course-form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.course-form {
  background: var(--bg-panel);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  width: 480px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
}

.form-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  color: var(--text-secondary);
  transition: all 0.15s;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.form-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-label);
  margin-bottom: 6px;
}

.required {
  color: #f44336;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-input);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: var(--border-input-focus);
}

.form-input::placeholder {
  color: var(--text-placeholder);
}

.form-hint {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-subtle);
}

.btn {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: none;
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-primary {
  background: var(--text-accent);
  color: white;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
