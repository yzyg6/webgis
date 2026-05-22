<template>
  <div class="edit-panel-overlay" v-if="visible" @click.self="emit('cancel')">
    <div class="edit-panel">
      <div class="panel-header">
        <span class="panel-title">编辑属性</span>
        <span class="panel-subtitle">{{ layerName }} - 要素 #{{ featureIndex + 1 }}</span>
        <button class="close-btn" type="button" @click="emit('cancel')">✕</button>
      </div>
      <div class="panel-body">
        <div class="form-row" v-for="(value, key) in editData" :key="key">
          <label class="form-label">{{ key }}</label>
          <input
            class="form-input"
            :value="String(value ?? '')"
            @input="onInput(key, ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="empty-tip" v-if="Object.keys(editData).length === 0">无属性数据</div>
      </div>
      <div class="panel-footer">
        <button class="btn btn-cancel" type="button" @click="emit('cancel')">取消</button>
        <button class="btn btn-save" type="button" @click="onSave">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  visible: boolean;
  layerName: string;
  featureIndex: number;
  properties: Record<string, unknown>;
}>();

const emit = defineEmits<{
  save: [properties: Record<string, unknown>];
  cancel: [];
}>();

const editData = ref<Record<string, unknown>>({});

watch(() => props.visible, (val) => {
  if (val) {
    editData.value = { ...props.properties };
  }
});

const onInput = (key: string, value: string): void => {
  const num = Number(value);
  editData.value[key] = value !== '' && !isNaN(num) && isFinite(num) ? num : value;
};

const onSave = (): void => {
  emit('save', { ...editData.value });
};
</script>

<style scoped>
.edit-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-panel {
  background: rgba(5, 25, 39, 0.98);
  border: 1px solid rgba(160, 224, 255, 0.32);
  border-radius: 12px;
  width: 420px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(160, 224, 255, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #daf2ff;
}

.panel-subtitle {
  font-size: 12px;
  color: rgba(218, 242, 255, 0.5);
  flex: 1;
}

.close-btn {
  background: transparent;
  border: 0;
  color: rgba(190, 224, 243, 0.7);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
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
  color: rgba(160, 224, 255, 0.8);
  min-width: 100px;
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  background: rgba(10, 35, 55, 0.8);
  border: 1px solid rgba(160, 224, 255, 0.25);
  border-radius: 6px;
  padding: 6px 10px;
  color: #daf2ff;
  font-size: 12px;
  outline: none;
}

.form-input:focus {
  border-color: rgba(160, 224, 255, 0.5);
}

.panel-footer {
  padding: 12px 20px;
  border-top: 1px solid rgba(160, 224, 255, 0.15);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  border: 1px solid rgba(160, 224, 255, 0.35);
  border-radius: 8px;
  padding: 8px 20px;
  cursor: pointer;
  font-size: 13px;
}

.btn-cancel {
  background: rgba(30, 30, 30, 0.6);
  color: rgba(218, 242, 255, 0.8);
}

.btn-cancel:hover {
  background: rgba(50, 50, 50, 0.8);
}

.btn-save {
  background: rgba(23, 73, 108, 0.9);
  color: #daf2ff;
}

.btn-save:hover {
  background: rgba(40, 105, 148, 0.95);
}

.empty-tip {
  padding: 24px;
  text-align: center;
  font-size: 12px;
  color: rgba(190, 224, 243, 0.6);
}
</style>
