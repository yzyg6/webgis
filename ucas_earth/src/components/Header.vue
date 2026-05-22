<template>
  <header class="app-header">
    <div class="title-wrap">
      <h1 class="title">FYUN 校园系统</h1>
      <p class="subtitle">Cesium 内核</p>
    </div>

    <div class="menu-bar">
      <div class="menu-item">
        <span class="menu-icon">🗺️</span>
        <span class="menu-label">图层</span>
        <span class="menu-arrow">▼</span>
        <div class="submenu">
          <button class="submenu-item" type="button" @click="emitSwitchLayer('osm')">
            <span class="submenu-icon">📝</span>
            <span class="submenu-label">OpenStreetMap</span>
          </button>
          <button class="submenu-item" type="button" @click="emitSwitchLayer('arcgis')">
            <span class="submenu-icon">📝</span>
            <span class="submenu-label">ArcGIS World Imagery</span>
          </button>
          <button class="submenu-item" type="button" @click="emitSwitchLayer('carto')">
            <span class="submenu-icon">📝</span>
            <span class="submenu-label">Carto Light</span>
          </button>
        </div>
      </div>

      <div class="menu-item">
        <span class="menu-icon">🏙️</span>
        <span class="menu-label">城市模型</span>
        <span class="menu-arrow">▼</span>
        <div class="submenu">
          <button class="submenu-item" type="button" @click="openFilePicker">
            <span class="submenu-icon">📂</span>
            <span class="submenu-label">选择本地 GeoJSON</span>
          </button>
          <button class="submenu-item" type="button" @click="emitLoadFromDatabase">
            <span class="submenu-icon">🗄️</span>
            <span class="submenu-label">从数据库加载</span>
          </button>
          <input
            ref="fileInput"
            class="hidden-file-input"
            type="file"
            accept=".geojson,.json,application/geo+json,application/json"
            @change="handleFileChange"
          />
          <div class="path-entry">
            <span class="path-tip">已加载图层，可切换显示或删除</span>
          </div>
          <div class="layer-list" v-if="props.cityLayers.length > 0">
            <div class="layer-item" v-for="layer in props.cityLayers" :key="layer.id">
              <span class="layer-name" :title="layer.name">{{ layer.name }}</span>
              <div class="layer-actions">
                <button class="path-load-btn" type="button" @click="emitToggleCityLayer(layer.id)">
                  {{ layer.visible ? "隐藏" : "显示" }}
                </button>
                <button class="path-load-btn danger" type="button" @click="emitRemoveCityLayer(layer.id)">
                  删除
                </button>
              </div>
            </div>
          </div>
          <p class="empty-tip" v-else>暂无已加载图层</p>
        </div>
      </div>
    </div>

    <!-- Database Layer Panel -->
    <div class="db-panel-overlay" v-if="props.showDbPanel" @click.self="emitCloseDbPanel">
      <div class="db-panel">
        <div class="db-panel-header">
          <span class="db-panel-title">数据库图层</span>
          <button class="db-panel-close" type="button" @click="emitCloseDbPanel">✕</button>
        </div>
        <div class="db-panel-content" v-if="props.isLoadingFromDb">
          <p class="db-loading">加载中...</p>
        </div>
        <div class="db-panel-content" v-else-if="props.dbLayers.length === 0">
          <p class="db-empty">数据库中暂无图层</p>
        </div>
        <div class="db-panel-content" v-else>
          <div class="db-group" v-for="group in groupedDbLayers" :key="group.name">
            <div class="db-group-name">{{ group.name }}</div>
            <div class="db-layer-item" v-for="layer in group.layers" :key="layer.id">
              <div class="db-layer-info">
                <span class="db-layer-name">{{ layer.name }}</span>
                <span class="db-layer-meta">{{ formatFileSize(layer.file_size) }} · {{ layer.feature_count ?? '?' }} 要素</span>
              </div>
              <button class="db-load-btn" type="button" @click="emitLoadDbLayer(layer.id)">加载</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="meta">{{ todayText }}</div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

type BaseLayerType = "osm" | "arcgis" | "carto";
type CityLayerMeta = {
  id: string;
  name: string;
  visible: boolean;
};

type DbLayerMeta = {
  id: string;
  name: string;
  group_name: string | null;
  file_size: number | null;
  feature_count: number | null;
  created_at: string;
};

const props = defineProps<{
  cityLayers: CityLayerMeta[];
  dbLayers: DbLayerMeta[];
  isLoadingFromDb: boolean;
  showDbPanel: boolean;
}>();

const emit = defineEmits<{
  switchLayer: [layer: BaseLayerType];
  loadCityModelFile: [file: File];
  toggleCityLayerVisibility: [id: string];
  removeCityLayer: [id: string];
  loadFromDatabase: [];
  loadDbLayer: [id: string];
  closeDbPanel: [];
}>();

const emitSwitchLayer = (layer: BaseLayerType): void => {
  emit("switchLayer", layer);
};

const fileInput = ref<HTMLInputElement | null>(null);

const openFilePicker = (): void => {
  fileInput.value?.click();
};

const handleFileChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    emit("loadCityModelFile", file);
  }

  target.value = "";
};

const emitToggleCityLayer = (id: string): void => {
  emit("toggleCityLayerVisibility", id);
};

const emitRemoveCityLayer = (id: string): void => {
  emit("removeCityLayer", id);
};

const emitLoadFromDatabase = (): void => {
  emit("loadFromDatabase");
};

const emitLoadDbLayer = (id: string): void => {
  emit("loadDbLayer", id);
};

const emitCloseDbPanel = (): void => {
  emit("closeDbPanel");
};

const groupedDbLayers = computed(() => {
  const groups = new Map<string, DbLayerMeta[]>();
  for (const layer of props.dbLayers) {
    const groupName = layer.group_name || "未分组";
    if (!groups.has(groupName)) {
      groups.set(groupName, []);
    }
    groups.get(groupName)!.push(layer);
  }
  return Array.from(groups.entries()).map(([name, layers]) => ({ name, layers }));
});

const formatFileSize = (bytes: number | null): string => {
  if (bytes === null || bytes === undefined) return "未知";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const todayText = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
</script>

<style scoped>
.app-header {
  background: linear-gradient(110deg, rgba(0, 20, 38, 0.95), rgba(0, 48, 72, 0.85));
  border-bottom: 1px solid rgba(180, 229, 255, 0.25);
  padding: 0 20px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 24px;
  box-shadow: 0 4px 22px rgba(0, 0, 0, 0.35);
}

.title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.title {
  margin: 0;
  font-size: 22px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: #daf2ff;
}

.subtitle {
  margin: 0;
  font-size: 12px;
  color: rgba(218, 242, 255, 0.75);
  letter-spacing: 1px;
}

.meta {
  margin-left: auto;
  padding: 6px 10px;
  border: 1px solid rgba(140, 200, 237, 0.4);
  border-radius: 999px;
  font-size: 12px;
  color: #d8f2ff;
  background: rgba(10, 34, 56, 0.45);
}

.menu-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 菜单项样式 */
.menu-item {
  /* 定位模式为相对定位 */
  position: relative;

  /* flex 的布局 */
  display: flex;
  align-items: center;
  gap: 4px;

  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(155, 217, 251, 0.22);
  background: rgba(7, 33, 54, 0.55);
  color: #d7f0ff;
  cursor: pointer;
  user-select: none;
}

/* 扩展一级菜单下方的悬停命中区，避免移动到二级菜单时瞬间丢失 hover */
.menu-item::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  height: 12px;
}

.menu-item:hover {
  background: rgba(18, 58, 89, 0.8);
  border-color: rgba(175, 229, 255, 0.4);
}

.menu-icon,
.menu-label,
.menu-arrow {
  font-size: 13px;
}

.submenu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
  border-radius: 10px;
  border: 1px solid rgba(160, 224, 255, 0.32);
  background: rgba(5, 25, 39, 0.95);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
  z-index: 20;
  opacity: 0;
  visibility: hidden;
  transform: translateY(6px);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0s linear 0.4s;
}

.menu-item:hover .submenu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  pointer-events: auto;
  transition-delay: 0s;
}

.submenu-item {
  border: 0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  background: transparent;
  color: #daf2ff;
  text-align: left;
  cursor: pointer;
}

.submenu-item:hover {
  background: rgba(32, 84, 124, 0.7);
}

.hidden-file-input {
  display: none;
}

.path-entry {
  display: flex;
  align-items: center;
  padding: 6px 4px;
}

.path-tip {
  font-size: 12px;
  color: rgba(190, 224, 243, 0.88);
}

.layer-list {
  max-height: 220px;
  overflow-y: auto;
  padding: 2px 4px 4px;
}

.layer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 4px;
  border-top: 1px solid rgba(160, 224, 255, 0.14);
}

.layer-name {
  font-size: 12px;
  color: #daf2ff;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-actions {
  display: flex;
  gap: 6px;
}

.path-load-btn {
  border: 1px solid rgba(160, 224, 255, 0.35);
  border-radius: 8px;
  padding: 4px 8px;
  background: rgba(23, 73, 108, 0.86);
  color: #daf2ff;
  cursor: pointer;
  font-size: 12px;
}

.path-load-btn:hover {
  background: rgba(40, 105, 148, 0.92);
}

.path-load-btn.danger {
  border-color: rgba(253, 151, 151, 0.45);
  background: rgba(118, 37, 37, 0.86);
}

.path-load-btn.danger:hover {
  background: rgba(155, 44, 44, 0.92);
}

.empty-tip {
  margin: 4px 4px 6px;
  font-size: 12px;
  color: rgba(190, 224, 243, 0.7);
}

@media (max-width: 900px) {
  .app-header {
    gap: 10px;
    padding: 0 10px;
  }

  .title {
    font-size: 18px;
  }

  .subtitle,
  .meta {
    display: none;
  }

  .menu-bar {
    margin-left: auto;
    gap: 6px;
  }

  .menu-item {
    padding: 6px 8px;
  }

  .menu-label {
    display: none;
  }
}

/* Database Panel Styles */
.db-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.db-panel {
  background: rgba(5, 25, 39, 0.98);
  border: 1px solid rgba(160, 224, 255, 0.32);
  border-radius: 12px;
  width: 480px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}

.db-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(160, 224, 255, 0.15);
}

.db-panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #daf2ff;
}

.db-panel-close {
  background: transparent;
  border: 0;
  color: rgba(190, 224, 243, 0.7);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.db-panel-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.db-panel-content {
  overflow-y: auto;
  padding: 12px 16px;
  flex: 1;
}

.db-loading,
.db-empty {
  text-align: center;
  color: rgba(190, 224, 243, 0.7);
  font-size: 14px;
  padding: 24px 0;
}

.db-group {
  margin-bottom: 16px;
}

.db-group-name {
  font-size: 13px;
  font-weight: 600;
  color: rgba(160, 224, 255, 0.9);
  padding: 8px 0 4px;
  border-bottom: 1px solid rgba(160, 224, 255, 0.1);
  margin-bottom: 8px;
}

.db-layer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 4px;
}

.db-layer-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.db-layer-name {
  font-size: 13px;
  color: #daf2ff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.db-layer-meta {
  font-size: 11px;
  color: rgba(190, 224, 243, 0.6);
}

.db-load-btn {
  flex-shrink: 0;
  border: 1px solid rgba(160, 224, 255, 0.35);
  border-radius: 8px;
  padding: 6px 14px;
  background: rgba(23, 73, 108, 0.86);
  color: #daf2ff;
  cursor: pointer;
  font-size: 12px;
}

.db-load-btn:hover {
  background: rgba(40, 105, 148, 0.92);
}
</style>
