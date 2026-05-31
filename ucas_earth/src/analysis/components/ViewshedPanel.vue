<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AnalysisStatus } from '../types/analysis'

const props = defineProps<{
  isPicking: boolean
  isAnalyzing: boolean
  hasResult: boolean
  observerHeight: number
  targetHeight: number
  radius: number
}>()

const emit = defineEmits<{
  'update:observerHeight': [value: number]
  'update:targetHeight': [value: number]
  'update:radius': [value: number]
  'start-pick': []
  'start-analyse': []
  'clear-result': []
}>()

const isCollapsed = ref(false)

const status = computed<AnalysisStatus>(() => {
  if (props.isAnalyzing) return 'analyzing'
  if (props.isPicking) return 'picking'
  if (props.hasResult) return 'done'
  return 'idle'
})

const statusText = computed(() => {
  switch (status.value) {
    case 'picking': return '请在地图上点击选取观察点'
    case 'analyzing': return '正在计算可视域...'
    case 'done': return '分析完成'
    default: return '点击「选取观察点」开始'
  }
})

const statusClass = computed(() => {
  switch (status.value) {
    case 'picking': return 'status-picking'
    case 'analyzing': return 'status-analyzing'
    case 'done': return 'status-done'
    default: return 'status-idle'
  }
})

const onObserverHeightChange = (e: Event) => {
  const val = parseFloat((e.target as HTMLInputElement).value)
  if (!isNaN(val)) emit('update:observerHeight', val)
}

const onTargetHeightChange = (e: Event) => {
  const val = parseFloat((e.target as HTMLInputElement).value)
  if (!isNaN(val)) emit('update:targetHeight', val)
}

const onRadiusChange = (e: Event) => {
  const val = parseFloat((e.target as HTMLInputElement).value)
  if (!isNaN(val)) emit('update:radius', val)
}
</script>

<template>
  <div class="viewshed-panel" :class="{ collapsed: isCollapsed }">
    <div class="panel-header">
      <button class="toggle-btn" @click="isCollapsed = !isCollapsed">
        {{ isCollapsed ? '⊕' : '◀' }}
      </button>
      <h3 v-if="!isCollapsed">⊕ 可视域分析</h3>
    </div>

    <div v-if="!isCollapsed" class="panel-body">
      <!-- 参数区 -->
      <div class="param-group">
        <label class="param-label">观察者高度 (m)</label>
        <input
          type="number"
          class="param-input"
          :value="observerHeight"
          min="0.5"
          max="50"
          step="0.5"
          @change="onObserverHeightChange"
        />
      </div>

      <div class="param-group">
        <label class="param-label">目标高度 (m)</label>
        <input
          type="number"
          class="param-input"
          :value="targetHeight"
          min="0.5"
          max="100"
          step="0.5"
          @change="onTargetHeightChange"
        />
      </div>

      <div class="param-group">
        <label class="param-label">分析半径 (m)</label>
        <input
          type="number"
          class="param-input"
          :value="radius"
          min="100"
          max="5000"
          step="50"
          @change="onRadiusChange"
        />
      </div>

      <!-- 操作区 -->
      <div class="action-group">
        <button
          class="action-btn pick-btn"
          :class="{ active: isPicking }"
          :disabled="isAnalyzing"
          @click="emit('start-pick')"
        >
          📍 {{ isPicking ? '选取中...' : '选取观察点' }}
        </button>

        <button
          class="action-btn analyse-btn"
          :disabled="!hasResult && !isPicking"
          @click="emit('start-analyse')"
        >
          ▶ 开始分析
        </button>

        <button
          class="action-btn clear-btn"
          :disabled="!hasResult && !isPicking"
          @click="emit('clear-result')"
        >
          ✕ 清除结果
        </button>
      </div>

      <!-- 状态区 -->
      <div class="status-area">
        <span class="status-dot" :class="statusClass"></span>
        <span class="status-text">{{ statusText }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.viewshed-panel {
  width: 240px;
  background: var(--bg-panel, rgba(15, 23, 42, 0.9));
  border-right: 1px solid var(--border-primary, rgba(100, 116, 139, 0.2));
  overflow-y: auto;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
}

.viewshed-panel.collapsed {
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
  white-space: nowrap;
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
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.param-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.param-label {
  font-size: 12px;
  color: var(--text-muted, #94a3b8);
  font-weight: 500;
}

.param-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-primary, rgba(100, 116, 139, 0.2));
  border-radius: 6px;
  background: var(--bg-menu, rgba(30, 41, 59, 0.8));
  color: var(--text-primary, #e2e8f0);
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.param-input:focus {
  border-color: var(--accent, #3b82f6);
}

.action-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pick-btn {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #60a5fa;
}

.pick-btn:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.25);
}

.pick-btn.active {
  background: rgba(59, 130, 246, 0.3);
  border-color: #3b82f6;
  color: #93c5fd;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.analyse-btn {
  background: #238636;
  color: white;
}

.analyse-btn:hover:not(:disabled) {
  background: #2ea043;
}

.clear-btn {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.clear-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.25);
}

.status-area {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--bg-menu, rgba(30, 41, 59, 0.8));
  border: 1px solid var(--border-primary, rgba(100, 116, 139, 0.2));
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-idle { background: #64748b; }
.status-picking { background: #60a5fa; animation: pulse 1.5s ease-in-out infinite; }
.status-analyzing { background: #fbbf24; animation: pulse 0.8s ease-in-out infinite; }
.status-done { background: #22c55e; }

.status-text {
  font-size: 12px;
  color: var(--text-muted, #94a3b8);
}
</style>
