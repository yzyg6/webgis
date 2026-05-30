<template>
  <div class="edit-panel-overlay" v-if="visible" @click.self="emit('cancel')">
    <div class="edit-panel">
      <div class="panel-header">
        <span class="panel-title">编辑属性</span>
        <span class="panel-subtitle">{{ layerName }} - 要素 #{{ featureIndex + 1 }}</span>
        <button class="close-btn" type="button" @click="emit('cancel')">✕</button>
      </div>
      <div class="panel-body">
        <div class="height-section">
          <div class="height-label">
            <span class="height-text">建筑高度</span>
            <span class="height-value">{{ sliderHeight }}m</span>
          </div>
          <input
            type="range"
            class="height-slider"
            :min="HEIGHT_MIN"
            :max="HEIGHT_MAX"
            :step="1"
            v-model.number="sliderHeight"
            @input="onHeightInput"
          />
          <div class="height-range">
            <span>{{ HEIGHT_MIN }}m</span>
            <span>{{ HEIGHT_MAX }}m</span>
          </div>
        </div>
        <div class="form-row" v-for="[key, value] in filteredEntries" :key="key">
          <label class="form-label">{{ key }}</label>
          <input
            class="form-input"
            :value="String(value ?? '')"
            @input="onInput(key, ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="empty-tip" v-if="filteredEntries.length === 0">无属性数据</div>
      </div>
      <div class="panel-footer">
        <button class="btn btn-cancel" type="button" @click="emit('cancel')">取消</button>
        <button class="btn btn-save" type="button" @click="onSave">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  visible: boolean;
  layerName: string;
  featureIndex: number;
  properties: Record<string, unknown>;
}>();

const emit = defineEmits<{
  save: [properties: Record<string, unknown>];
  cancel: [];
  'heightChange': [height: number];
}>();

const HEIGHT_MIN = 5;
const HEIGHT_MAX = 50;

const editData = ref<Record<string, unknown>>({});
const sliderHeight = ref(12);

watch(() => props.visible, (val) => {
  if (val) {
    editData.value = { ...props.properties };
    sliderHeight.value = Number(editData.value.Height ?? editData.value.height ?? 12);
  }
});

const onInput = (key: string, value: string): void => {
  const num = Number(value);
  editData.value[key] = value !== '' && !isNaN(num) && isFinite(num) ? num : value;
};

const onHeightInput = (): void => {
  editData.value.Height = sliderHeight.value;
  editData.value.height = sliderHeight.value;
  emit('heightChange', sliderHeight.value);
};

const onSave = (): void => {
  editData.value.Height = sliderHeight.value;
  editData.value.height = sliderHeight.value;
  emit('save', { ...editData.value });
};

const filteredEntries = computed(() => {
  return Object.entries(editData.value).filter(([key]) => key !== 'Height' && key !== 'height');
});
</script>

<style scoped>
.edit-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-overlay);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-panel {
  background: var(--bg-panel-solid);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  width: 420px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-modal);
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.panel-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  flex: 1;
}

.close-btn {
  background: transparent;
  border: 0;
  color: var(--text-close);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.close-btn:hover {
  background: var(--bg-close-hover);
  color: var(--text-primary);
}

.panel-body {
  overflow-y: auto;
  padding: 12px 20px;
  flex: 1;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
}

.form-label {
  font-size: 12px;
  color: var(--text-label-strong);
  min-width: 100px;
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  background: var(--bg-input);
  border: 1px solid var(--border-input);
  border-radius: 6px;
  padding: 6px 10px;
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
}

.form-input:focus {
  border-color: var(--border-input-focus);
}

.height-section {
  padding: 10px 0 14px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 10px;
}

.height-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.height-text {
  font-size: 12px;
  color: var(--text-label-strong);
  font-weight: 500;
}

.height-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-accent);
}

.height-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--border-subtle);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.height-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--text-accent);
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.height-range {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 6px;
}

.panel-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  border: 1px solid var(--border-btn);
  border-radius: 8px;
  padding: 8px 20px;
  cursor: pointer;
  font-size: 13px;
}

.btn-cancel {
  background: var(--bg-cancel);
  color: var(--text-secondary);
}

.btn-cancel:hover {
  background: var(--bg-cancel-hover);
}

.btn-save {
  background: var(--bg-btn);
  color: var(--text-primary);
}

.btn-save:hover {
  background: var(--bg-btn-hover);
}

.empty-tip {
  padding: 24px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}
</style>
