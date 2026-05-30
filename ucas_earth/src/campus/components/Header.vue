<template>
  <header class="app-header">
    <div class="title-wrap">
      <h1 class="title">{{ headerTitle }}</h1>
      <p class="subtitle">{{ headerSubtitle }}</p>
    </div>

    <div class="menu-bar">
      <!-- 校园模式菜单 -->
      <template v-if="mode === 'campus'">
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
            <button class="submenu-item" type="button" @click="emitSwitchLayer('google-satellite')">
              <span class="submenu-icon">🛰️</span>
              <span class="submenu-label">Google Satellite</span>
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
            <input ref="fileInput" class="hidden-file-input" type="file"
              accept=".geojson,.json,application/geo+json,application/json" @change="handleFileChange" />
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
      </template>

      <!-- 火星模式菜单 -->
      <template v-if="mode === 'mars'">
        <div class="menu-item">
          <span class="menu-icon">🚗</span>
          <span class="menu-label">火星车</span>
          <span class="menu-arrow">▼</span>
          <div class="submenu">
            <button v-for="rover in marsRovers" :key="rover.id" class="submenu-item" type="button"
              @click="emit('selectRover', rover.id)">
              <span class="submenu-icon">🔬</span>
              <span class="submenu-label">{{ rover.name }}</span>
            </button>
          </div>
        </div>

        <div class="menu-item">
          <span class="menu-icon">📍</span>
          <span class="menu-label">火星地标</span>
          <span class="menu-arrow">▼</span>
          <div class="submenu submenu-landmark">
            <button v-for="lm in marsLandmarks" :key="lm.key" class="submenu-item" type="button"
              @click="emit('selectLandmark', lm.key)">
              <span class="submenu-icon">📌</span>
              <span class="submenu-label">{{ lm.name }}</span>
            </button>
          </div>
        </div>
      </template>

      <!-- 城市漫游模式菜单 -->
      <template v-if="mode === 'city'">
        <div class="menu-item">
          <span class="menu-icon">🌆</span>
          <span class="menu-label">城市漫游</span>
        </div>
      </template>
    </div>

    <!-- Database Layer Panel (campus only) -->
    <div class="db-panel-overlay" v-if="mode === 'campus' && props.showDbPanel" @click.self="emitCloseDbPanel">
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

    <ThemeToggle />
    <div class="meta">{{ todayText }}</div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import ThemeToggle from "./ThemeToggle.vue";

type BaseLayerType = "osm" | "arcgis" | "carto" | "google-satellite";
type HeaderMode = "campus" | "mars" | "city";
type CityLayerMeta = { id: string; name: string; visible: boolean };
type DbLayerMeta = { id: string; name: string; group_name: string | null; file_size: number | null; feature_count: number | null; created_at: string };
type RoverItem = { id: string; name: string };
type LandmarkItem = { key: string; name: string };

const props = withDefaults(defineProps<{
  mode?: HeaderMode;
  cityLayers?: CityLayerMeta[];
  dbLayers?: DbLayerMeta[];
  isLoadingFromDb?: boolean;
  showDbPanel?: boolean;
  marsRovers?: RoverItem[];
  marsLandmarks?: LandmarkItem[];
}>(), {
  mode: "campus",
  cityLayers: () => [],
  dbLayers: () => [],
  isLoadingFromDb: false,
  showDbPanel: false,
  marsRovers: () => [],
  marsLandmarks: () => [],
});

const emit = defineEmits<{
  switchLayer: [layer: BaseLayerType];
  loadCityModelFile: [file: File];
  toggleCityLayerVisibility: [id: string];
  removeCityLayer: [id: string];
  loadFromDatabase: [];
  loadDbLayer: [id: string];
  closeDbPanel: [];
  selectRover: [id: string];
  selectLandmark: [key: string];
}>();

const headerTitle = computed(() => {
  if (props.mode === 'mars') return '火星探索'
  if (props.mode === 'city') return '城市漫游'
  return 'FYUN 校园系统'
})
const headerSubtitle = computed(() => {
  if (props.mode === 'mars') return 'Cesium Mars'
  if (props.mode === 'city') return 'Cesium City'
  return 'Cesium 内核'
})

const emitSwitchLayer = (layer: BaseLayerType): void => { emit("switchLayer", layer); };
const fileInput = ref<HTMLInputElement | null>(null);
const openFilePicker = (): void => { fileInput.value?.click(); };
const handleFileChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) emit("loadCityModelFile", file);
  target.value = "";
};
const emitToggleCityLayer = (id: string): void => { emit("toggleCityLayerVisibility", id); };
const emitRemoveCityLayer = (id: string): void => { emit("removeCityLayer", id); };
const emitLoadFromDatabase = (): void => { emit("loadFromDatabase"); };
const emitLoadDbLayer = (id: string): void => { emit("loadDbLayer", id); };
const emitCloseDbPanel = (): void => { emit("closeDbPanel"); };

const groupedDbLayers = computed(() => {
  const groups = new Map<string, DbLayerMeta[]>();
  for (const layer of props.dbLayers) {
    const groupName = layer.group_name || "未分组";
    if (!groups.has(groupName)) groups.set(groupName, []);
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

const todayText = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
</script>

<style scoped>
.app-header { background: var(--bg-header); border-bottom: 1px solid var(--border-header); padding: 0 20px; display: flex; justify-content: flex-start; align-items: center; gap: 24px; box-shadow: var(--shadow-header); }
.title-wrap { display: flex; flex-direction: column; gap: 2px; }
.title { margin: 0; font-size: 22px; line-height: 1; font-weight: 700; letter-spacing: 0.8px; color: var(--text-primary); }
.subtitle { margin: 0; font-size: 12px; color: var(--text-secondary); letter-spacing: 1px; }
.meta { margin-left: auto; padding: 6px 10px; border: 1px solid var(--border-badge); border-radius: 999px; font-size: 12px; color: var(--text-primary); background: var(--bg-badge); }
.menu-bar { display: flex; align-items: center; gap: 10px; }
.menu-item { position: relative; display: flex; align-items: center; gap: 4px; padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border-menu); background: var(--bg-menu); color: var(--text-primary); cursor: pointer; user-select: none; }
.menu-item::after { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 12px; }
.menu-item:hover { background: var(--bg-menu-hover); border-color: var(--border-menu-hover); }
.menu-icon, .menu-label, .menu-arrow { font-size: 13px; }
.submenu { position: absolute; top: calc(100% + 6px); left: 0; min-width: 320px; display: flex; flex-direction: column; gap: 2px; padding: 6px; border-radius: 10px; border: 1px solid var(--border-primary); background: var(--bg-panel); box-shadow: var(--shadow-submenu); z-index: 20; opacity: 0; visibility: hidden; transform: translateY(6px); pointer-events: none; transition: opacity 0.2s ease, transform 0.2s ease, visibility 0s linear 0.4s; }
.menu-item:hover .submenu { opacity: 1; visibility: visible; transform: translateY(0); pointer-events: auto; transition-delay: 0s; }
.submenu-landmark { max-height: 500px; overflow-y: auto; }
.submenu-item { border: 0; border-radius: 8px; display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px; background: transparent; color: var(--text-primary); text-align: left; cursor: pointer; }
.submenu-item:hover { background: var(--bg-hover-strong); }
.hidden-file-input { display: none; }
.path-entry { padding: 6px 8px; }
.path-tip { font-size: 12px; color: var(--text-muted); }
.layer-list { display: flex; flex-direction: column; gap: 4px; }
.layer-item { display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; border-radius: 6px; background: var(--bg-hover); }
.layer-name { font-size: 13px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px; }
.layer-actions { display: flex; gap: 4px; }
.path-load-btn { border: 0; border-radius: 4px; padding: 3px 8px; font-size: 11px; cursor: pointer; background: var(--bg-btn); color: var(--text-primary); }
.path-load-btn:hover { background: var(--bg-btn-hover); }
.path-load-btn.danger { color: var(--text-close-hover); }
.empty-tip { padding: 6px 8px; font-size: 12px; color: var(--text-muted); text-align: center; }
.db-panel-overlay { position: fixed; inset: 0; background: var(--bg-overlay); display: flex; align-items: center; justify-content: center; z-index: 100; }
.db-panel { background: var(--bg-panel-solid); border-radius: 12px; width: 480px; max-height: 80vh; display: flex; flex-direction: column; box-shadow: var(--shadow-modal); }
.db-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid var(--border-subtle); }
.db-panel-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.db-panel-close { border: 0; background: transparent; color: var(--text-close); font-size: 18px; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
.db-panel-close:hover { background: var(--bg-close-hover); color: var(--text-close-hover); }
.db-panel-content { padding: 16px; overflow-y: auto; flex: 1; }
.db-loading, .db-empty { text-align: center; color: var(--text-muted); padding: 20px; }
.db-group { margin-bottom: 16px; }
.db-group-name { font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
.db-layer-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border-radius: 6px; margin-bottom: 4px; }
.db-layer-item:hover { background: var(--bg-hover); }
.db-layer-info { display: flex; flex-direction: column; gap: 2px; }
.db-layer-name { font-size: 14px; color: var(--text-primary); }
.db-layer-meta { font-size: 12px; color: var(--text-muted); }
.db-load-btn { border: 0; border-radius: 6px; padding: 6px 14px; font-size: 13px; cursor: pointer; background: var(--bg-accent-subtle); color: var(--text-accent); font-weight: 500; }
.db-load-btn:hover { background: var(--bg-accent-subtle-hover); }
@media (max-width: 900px) { .app-header { gap: 10px; padding: 0 10px; } .title { font-size: 18px; } .subtitle, .meta { display: none; } }
</style>
