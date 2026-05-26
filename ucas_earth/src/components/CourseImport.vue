<!-- ucas_earth/src/components/CourseImport.vue -->
<template>
  <div class="course-import-overlay" v-if="visible" @click.self="emit('cancel')">
    <div class="course-import">
      <div class="import-header">
        <span class="import-title">导入课程表</span>
        <button class="close-btn" @click="emit('cancel')">✕</button>
      </div>
      <div class="import-body">
        <!-- 步骤指示器 -->
        <div class="steps">
          <div class="step" :class="{ active: currentStep === 1, completed: currentStep > 1 }">
            <span class="step-number">1</span>
            <span class="step-text">上传文件</span>
          </div>
          <div class="step" :class="{ active: currentStep === 2, completed: currentStep > 2 }">
            <span class="step-number">2</span>
            <span class="step-text">预览数据</span>
          </div>
          <div class="step" :class="{ active: currentStep === 3 }">
            <span class="step-number">3</span>
            <span class="step-text">确认导入</span>
          </div>
        </div>

        <!-- 步骤 1: 上传文件 -->
        <div class="step-content" v-if="currentStep === 1">
          <div class="upload-area" @click="triggerFileInput" @drop.prevent="handleDrop" @dragover.prevent>
            <input
              type="file"
              ref="fileInput"
              accept=".xlsx,.xls"
              style="display: none"
              @change="handleFileChange"
            />
            <div class="upload-icon">📥</div>
            <div class="upload-text">点击或拖拽 Excel 文件到此处</div>
            <div class="upload-hint">支持 .xlsx, .xls 格式</div>
          </div>
          <button class="btn btn-link" @click="downloadTemplate">
            下载 Excel 模板
          </button>
        </div>

        <!-- 步骤 2: 预览数据 -->
        <div class="step-content" v-if="currentStep === 2">
          <div class="preview-info">
            <span>共找到 {{ parsedData.length }} 条课程记录</span>
            <span class="error-count" v-if="errors.length > 0">
              {{ errors.length }} 条错误
            </span>
          </div>
          <div class="preview-table-wrapper">
            <table class="preview-table">
              <thead>
                <tr>
                  <th>课程名称</th>
                  <th>建筑</th>
                  <th>教室</th>
                  <th>星期</th>
                  <th>时间</th>
                  <th>周数</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in previewData" :key="index" :class="{ error: row.error }">
                  <td>{{ row.name }}</td>
                  <td>{{ row.buildingName }}</td>
                  <td>{{ row.classroom }}</td>
                  <td>{{ dayNames[row.weekday - 1] }}</td>
                  <td>{{ row.startTime }}-{{ row.endTime }}</td>
                  <td>{{ row.weekRange }}</td>
                  <td>
                    <span class="status-error" v-if="row.error">{{ row.error }}</span>
                    <span class="status-valid" v-else>有效</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 步骤 3: 确认导入 -->
        <div class="step-content" v-if="currentStep === 3">
          <div class="confirm-info" v-if="!importing && !importResult">
            <div class="confirm-icon">✅</div>
            <div class="confirm-text">准备导入 {{ validCount }} 条课程记录</div>
            <div class="confirm-hint">点击"开始导入"按钮开始导入</div>
          </div>
          <div class="importing" v-if="importing">
            <div class="spinner"></div>
            <div class="importing-text">正在导入...</div>
          </div>
          <div class="import-result" v-if="importResult">
            <div class="result-icon" :class="{ success: importResult.errors.length === 0 }">
              {{ importResult.errors.length === 0 ? '✅' : '⚠️' }}
            </div>
            <div class="result-text">
              成功导入 {{ importResult.success }} 条记录
            </div>
            <div class="result-errors" v-if="importResult.errors.length > 0">
              <div class="error-title">失败 {{ importResult.errors.length }} 条:</div>
              <div class="error-list">
                <div class="error-item" v-for="(error, index) in importResult.errors" :key="index">
                  {{ error }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="import-footer">
        <button class="btn btn-secondary" @click="handleBack" v-if="currentStep > 1 && !importing">
          上一步
        </button>
        <div class="footer-right">
          <button class="btn btn-secondary" @click="emit('cancel')" v-if="!importing">
            {{ importResult ? '关闭' : '取消' }}
          </button>
          <button
            class="btn btn-primary"
            @click="handleNext"
            v-if="currentStep < 3 && !importing"
            :disabled="!canProceed"
          >
            下一步
          </button>
          <button
            class="btn btn-primary"
            @click="handleImport"
            v-if="currentStep === 3 && !importing && !importResult"
          >
            开始导入
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { CourseImportRow } from '../types/courses';
import * as XLSX from 'xlsx';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  import: [rows: CourseImportRow[]];
  cancel: [];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const currentStep = ref(1);
const parsedData = ref<CourseImportRow[]>([]);
const errors = ref<string[]>([]);
const importing = ref(false);
const importResult = ref<{ success: number; errors: string[] } | null>(null);

const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const previewData = computed(() => {
  return parsedData.value.map((row, index) => ({
    ...row,
    error: errors.value[index] || null,
  }));
});

const validCount = computed(() => {
  return parsedData.value.filter((_, index) => !errors.value[index]).length;
});

const canProceed = computed(() => {
  if (currentStep.value === 1) {
    return parsedData.value.length > 0;
  }
  if (currentStep.value === 2) {
    return validCount.value > 0;
  }
  return false;
});

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    parseExcel(file);
  }
};

const handleDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0];
  if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
    parseExcel(file);
  }
};

const parseExcel = async (file: File) => {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);

    const parsed: CourseImportRow[] = [];
    const parseErrors: string[] = [];

    jsonData.forEach((row: any, index: number) => {
      try {
        const course: CourseImportRow = {
          name: row['课程名称'] || row['name'] || '',
          classroom: row['教室'] || row['classroom'] || '',
          buildingName: row['建筑名称'] || row['buildingName'] || '',
          weekday: parseWeekday(row['星期'] || row['weekday']),
          startTime: row['开始时间'] || row['startTime'] || '',
          endTime: row['结束时间'] || row['endTime'] || '',
          weekRange: row['周数范围'] || row['weekRange'] || '',
          teacher: row['教师'] || row['teacher'] || '',
          courseType: parseCourseType(row['课程类型'] || row['courseType']),
          credits: parseFloat(row['学分'] || row['credits'] || '0') || 0,
          homeworkDue: row['作业截止'] || row['homeworkDue'] || '',
          examTime: row['考试时间'] || row['examTime'] || '',
        };

        const error = validateRow(course, index + 2);
        if (error) {
          parseErrors.push(error);
        }

        parsed.push(course);
      } catch (e) {
        parseErrors.push(`第 ${index + 2} 行解析失败: ${e}`);
      }
    });

    parsedData.value = parsed;
    errors.value = parseErrors;
    currentStep.value = 2;
  } catch (e) {
    alert('文件解析失败，请检查文件格式');
  }
};

const parseWeekday = (value: any): number => {
  if (typeof value === 'number' && value >= 1 && value <= 7) {
    return value;
  }
  const dayMap: Record<string, number> = {
    '周一': 1, '星期一': 1, '1': 1,
    '周二': 2, '星期二': 2, '2': 2,
    '周三': 3, '星期三': 3, '3': 3,
    '周四': 4, '星期四': 4, '4': 4,
    '周五': 5, '星期五': 5, '5': 5,
    '周六': 6, '星期六': 6, '6': 6,
    '周日': 7, '星期日': 7, '7': 7,
  };
  return dayMap[String(value)] || 1;
};

const parseCourseType = (value: any): 'required' | 'elective' => {
  if (value === '选修' || value === 'elective') {
    return 'elective';
  }
  return 'required';
};

const validateRow = (row: CourseImportRow, rowNum: number): string | null => {
  if (!row.name.trim()) return `第 ${rowNum} 行: 课程名称不能为空`;
  if (!row.classroom.trim()) return `第 ${rowNum} 行: 教室不能为空`;
  if (!row.buildingName.trim()) return `第 ${rowNum} 行: 建筑名称不能为空`;
  if (row.weekday < 1 || row.weekday > 7) return `第 ${rowNum} 行: 星期必须在 1-7 之间`;
  if (!row.startTime.trim()) return `第 ${rowNum} 行: 开始时间不能为空`;
  if (!row.endTime.trim()) return `第 ${rowNum} 行: 结束时间不能为空`;
  if (row.startTime >= row.endTime) return `第 ${rowNum} 行: 开始时间必须早于结束时间`;
  if (!row.weekRange.trim()) return `第 ${rowNum} 行: 周数范围不能为空`;
  return null;
};

const handleNext = () => {
  if (canProceed.value) {
    currentStep.value++;
  }
};

const handleBack = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const handleImport = async () => {
  importing.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const validRows = parsedData.value.filter((_, index) => !errors.value[index]);
    importResult.value = {
      success: validRows.length,
      errors: [],
    };

    emit('import', validRows);
  } catch (e) {
    importResult.value = {
      success: 0,
      errors: ['导入失败: ' + e],
    };
  } finally {
    importing.value = false;
  }
};

const downloadTemplate = () => {
  const templateData = [
    {
      '课程名称': '高等数学',
      '教室': '301',
      '建筑名称': '教学楼A',
      '星期': 1,
      '开始时间': '08:00',
      '结束时间': '09:40',
      '周数范围': '1-16',
      '教师': '张三',
      '课程类型': '必修',
      '学分': 4,
      '作业截止': '',
      '考试时间': '2026-06-20 09:00',
    },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateData);
  XLSX.utils.book_append_sheet(wb, ws, '课程表模板');
  XLSX.writeFile(wb, '课程表模板.xlsx');
};
</script>

<style scoped>
.course-import-overlay {
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

.course-import {
  background: var(--bg-panel);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  width: 640px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.import-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
}

.import-title {
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

.import-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.steps {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 24px;
}

.step {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.5;
}

.step.active {
  opacity: 1;
}

.step.completed {
  opacity: 0.8;
}

.step-number {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.step.active .step-number {
  background: var(--text-accent);
  color: white;
}

.step.completed .step-number {
  background: #4CAF50;
  color: white;
}

.step-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.step.active .step-text {
  color: var(--text-primary);
  font-weight: 500;
}

.step-content {
  min-height: 200px;
}

.upload-area {
  border: 2px dashed var(--border-primary);
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
}

.upload-area:hover {
  border-color: var(--text-accent);
  background: var(--bg-hover);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 12px;
  color: var(--text-muted);
}

.btn-link {
  background: none;
  border: none;
  color: var(--text-accent);
  cursor: pointer;
  font-size: 13px;
  padding: 8px 0;
  margin-top: 12px;
}

.btn-link:hover {
  text-decoration: underline;
}

.preview-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--text-secondary);
}

.error-count {
  color: #f44336;
  font-weight: 500;
}

.preview-table-wrapper {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.preview-table th {
  background: var(--bg-table-header);
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
}

.preview-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-faint);
  color: var(--text-secondary);
}

.preview-table tr.error td {
  background: rgba(244, 67, 54, 0.05);
}

.status-valid {
  color: #4CAF50;
  font-size: 11px;
}

.status-error {
  color: #f44336;
  font-size: 11px;
}

.confirm-info {
  text-align: center;
  padding: 40px;
}

.confirm-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.confirm-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.confirm-hint {
  font-size: 13px;
  color: var(--text-muted);
}

.importing {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-subtle);
  border-top-color: var(--text-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.importing-text {
  font-size: 14px;
  color: var(--text-secondary);
}

.import-result {
  text-align: center;
  padding: 40px;
}

.result-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.result-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.result-errors {
  text-align: left;
  background: rgba(244, 67, 54, 0.05);
  border-radius: 6px;
  padding: 12px;
}

.error-title {
  font-size: 13px;
  font-weight: 500;
  color: #f44336;
  margin-bottom: 8px;
}

.error-list {
  max-height: 150px;
  overflow-y: auto;
}

.error-item {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 0;
  border-bottom: 1px solid var(--border-faint);
}

.error-item:last-child {
  border-bottom: none;
}

.import-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid var(--border-subtle);
}

.footer-right {
  display: flex;
  gap: 12px;
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
