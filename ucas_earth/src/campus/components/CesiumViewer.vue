<template>
	<div class="viewer-wrap">
		<div id="cesium_container"></div>
	</div>
</template>

<script setup lang="ts">
import { markRaw, onMounted, onUnmounted, ref, toRaw, watch } from "vue";
import * as Cesium from "cesium";
import { getBuildingType } from '../data/building-type-mapping';
import type { BuildingType } from '../../shared/types/building';
import { RainEffect, SnowEffect, type WeatherType } from '../utils/weather-effects';

type BaseLayerType = "osm" | "arcgis" | "carto" | "google-satellite";
type GeoJsonObject = Record<string, unknown>;
type CityLayer = {
	id: string;
	name: string;
	visible: boolean;
	geojson: GeoJsonObject;
};

type EntityWithPolygon = Cesium.Entity & {
	polygon?: Cesium.PolygonGraphics;
};

type EntityHoverInfo = {
	layerId: string;
	featureIndex: number;
	properties: Record<string, unknown>;
	x: number;
	y: number;
};

const props = defineProps<{
	baseLayer: BaseLayerType;
	cityLayers: CityLayer[];
}>();

const emit = defineEmits<{
	hoverEntity: [info: EntityHoverInfo | null];
	editEntity: [info: { layerId: string; featureIndex: number; properties: Record<string, unknown> }];
	selectEntity: [info: { layerId: string; featureIndex: number; properties: Record<string, unknown>; x: number; y: number }];
}>();

const cesiumViewer = ref<Cesium.Viewer | null>(null);
const cityModelDataSources = new Map<string, Cesium.GeoJsonDataSource>();
const cityLayerSignatures = new Map<string, string>();
let cityLayerSyncQueue: Promise<void> = Promise.resolve();
let hoverHandler: Cesium.ScreenSpaceEventHandler | null = null;
let dblClickHandler: Cesium.ScreenSpaceEventHandler | null = null;
let clickHandler: Cesium.ScreenSpaceEventHandler | null = null;
let clickTimer: number | null = null;

// Highlight state
let highlightedEntity: Cesium.Entity | null = null;
const originalStyles = new Map<string, {
	material: Cesium.MaterialProperty | undefined;
	outlineColor: Cesium.Property | undefined;
	outlineWidth: Cesium.Property | undefined;
}>();

const DEFAULT_CENTER = {
	lon: 115.785762,
	lat: 32.898816,
	height: 186.42,
	heading: Cesium.Math.toRadians(225.178018),
	pitch: Cesium.Math.toRadians(-16.644332),
	roll: Cesium.Math.toRadians(359.999948),
};

const getBaseLayerProvider = (layerType: BaseLayerType): Cesium.ImageryProvider => {
	if (layerType === "arcgis") {
		return new Cesium.UrlTemplateImageryProvider({
			url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
		});
	}

	if (layerType === "carto") {
		return new Cesium.UrlTemplateImageryProvider({
			url: "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
		});
	}

	if (layerType === "google-satellite") {
		return new Cesium.UrlTemplateImageryProvider({
			url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
			tileWidth: 256,
			tileHeight: 256,
			maximumLevel: 20,
		});
	}

	return new Cesium.OpenStreetMapImageryProvider({
		url: "https://tile.openstreetmap.org/",
	});
};

const applyBaseLayer = (layerType: BaseLayerType): void => {
	if (!cesiumViewer.value) {
		return;
	}

	const layers = cesiumViewer.value.imageryLayers;
	layers.removeAll();
	layers.addImageryProvider(getBaseLayerProvider(layerType));
};

const applyDefaultView = (duration = 0): void => {
	if (!cesiumViewer.value) {
		return;
	}

	const destination = Cesium.Cartesian3.fromDegrees(
		DEFAULT_CENTER.lon,
		DEFAULT_CENTER.lat,
		DEFAULT_CENTER.height
	);

	const cameraOptions = {
		destination,
		orientation: {
			heading: DEFAULT_CENTER.heading,
			pitch: DEFAULT_CENTER.pitch,
			roll: DEFAULT_CENTER.roll,
		},
		duration,
	};

	if (duration > 0) {
		cesiumViewer.value.camera.flyTo(cameraOptions);
		return;
	}

	cesiumViewer.value.camera.setView(cameraOptions);
};

const DEFAULT_BUILDING_HEIGHT = 12;
const FLOOR_HEIGHT = 3;

// Feature type definitions
type FeatureType = 'building' | 'road' | 'water' | 'green' | 'other';

// Style configurations for different feature types
const FEATURE_STYLES: Record<FeatureType, { color: string; alpha: number; outlineColor: string; outlineAlpha: number; height: number }> = {
	building: {
		color: '#7ccfff',
		alpha: 0.7,
		outlineColor: '#dff6ff',
		outlineAlpha: 0.9,
		height: DEFAULT_BUILDING_HEIGHT,
	},
	road: {
		color: '#888888',
		alpha: 0.8,
		outlineColor: '#666666',
		outlineAlpha: 0.9,
		height: 0.5,
	},
	water: {
		color: '#4488cc',
		alpha: 0.6,
		outlineColor: '#6699cc',
		outlineAlpha: 0.8,
		height: 0.2,
	},
	green: {
		color: '#66cc66',
		alpha: 0.6,
		outlineColor: '#88dd88',
		outlineAlpha: 0.8,
		height: 0.3,
	},
	other: {
		color: '#aaaaaa',
		alpha: 0.5,
		outlineColor: '#cccccc',
		outlineAlpha: 0.7,
		height: 1,
	},
};

const parseHeightValue = (value: unknown): number | null => {
	if (typeof value === "number" && Number.isFinite(value) && value > 0) {
		return value;
	}

	if (typeof value === "string") {
		const parsedValue = Number.parseFloat(value);
		if (Number.isFinite(parsedValue) && parsedValue > 0) {
			return parsedValue;
		}
	}

	return null;
};

const getFeatureType = (properties: Cesium.PropertyBag | undefined): { type: FeatureType; buildingType?: BuildingType } => {
	if (!properties) {
		return { type: 'other' };
	}

	const values = properties.getValue(Cesium.JulianDate.now()) as Record<string, unknown> | undefined;
	if (!values) {
		return { type: 'other' };
	}

	// Check for building
	if (values.building !== undefined && values.building !== null) {
		return { type: 'building', buildingType: getBuildingType(values) };
	}

	// Check for road
	if (values.highway || values.road || values.road_type) {
		return { type: 'road' };
	}

	// Check for water
	if (values.water || values.waterway || values.natural === 'water') {
		return { type: 'water' };
	}

	// Check for green space
	if (values.landuse === 'grass' || values.landuse === 'forest' || values.leisure === 'park' || values.natural === 'wood') {
		return { type: 'green' };
	}

	// Check for building by height properties
	if (values.Height !== undefined || values.height !== undefined || values["building:levels"] !== undefined) {
		return { type: 'building', buildingType: getBuildingType(values) };
	}

	return { type: 'other' };
};

const readBuildingHeight = (properties: Cesium.PropertyBag | undefined): number => {
	if (!properties) {
		return DEFAULT_BUILDING_HEIGHT;
	}

	const values = properties.getValue(Cesium.JulianDate.now()) as Record<string, unknown> | undefined;
	if (!values) {
		return DEFAULT_BUILDING_HEIGHT;
	}

	// 优先检查 Height（大写），然后 height（小写）
	const height = parseHeightValue(values.Height) || parseHeightValue(values.height);
	if (height !== null) {
		return height;
	}

	const levels = parseHeightValue(values["building:levels"]);
	if (levels !== null) {
		return levels * FLOOR_HEIGHT;
	}

	return DEFAULT_BUILDING_HEIGHT;
};

/**
 * 根据建筑高度计算渐变颜色
 * 浅蓝 #a8d8ff (矮楼) → 深蓝 #1a8cff (高楼)
 */
const getBuildingColor = (height: number): Cesium.Color => {
	const minH = 5;
	const maxH = 40;
	const ratio = Math.min(1, Math.max(0, (height - minH) / (maxH - minH)));

	// 浅蓝 #a8d8ff (168, 216, 255) → 深蓝 #1a8cff (26, 140, 255)
	const r = (168 + (26 - 168) * ratio) / 255;
	const g = (216 + (140 - 216) * ratio) / 255;
	const b = 255 / 255;

	return new Cesium.Color(r, g, b, 0.7);
};

const readFeatureHeight = (properties: Cesium.PropertyBag | undefined, featureType: FeatureType): number => {
	if (featureType === 'building') {
		return readBuildingHeight(properties);
	}

	if (!properties) {
		return FEATURE_STYLES[featureType].height;
	}

	const values = properties.getValue(Cesium.JulianDate.now()) as Record<string, unknown> | undefined;
	if (!values) {
		return FEATURE_STYLES[featureType].height;
	}

	// Try to read height from properties
	const height = parseHeightValue(values.Height) || parseHeightValue(values.height);
	if (height !== null) {
		return height;
	}

	return FEATURE_STYLES[featureType].height;
};

const applyFeatureExtrusion = (dataSource: Cesium.GeoJsonDataSource): void => {
	for (const entity of dataSource.entities.values as EntityWithPolygon[]) {
		if (!entity.polygon) {
			continue;
		}

		const properties = entity.properties;
		const featureResult = getFeatureType(properties);
		const featureType = featureResult.type;
		const style = FEATURE_STYLES[featureType];
		const height = readFeatureHeight(properties, featureType);

		entity.polygon.height = new Cesium.ConstantProperty(0);
		entity.polygon.extrudedHeight = new Cesium.ConstantProperty(height);
		// 建筑使用高度渐变颜色，其他类型使用固定颜色
		if (featureType === 'building') {
			entity.polygon.material = new Cesium.ColorMaterialProperty(getBuildingColor(height));
		} else {
			entity.polygon.material = new Cesium.ColorMaterialProperty(
				Cesium.Color.fromCssColorString(style.color).withAlpha(style.alpha)
			);
		}
		entity.polygon.outline = new Cesium.ConstantProperty(true);
		entity.polygon.outlineColor = new Cesium.ConstantProperty(
			Cesium.Color.fromCssColorString(style.outlineColor).withAlpha(style.outlineAlpha)
		);
	}
};

const HIGHLIGHT_COLOR = Cesium.Color.fromCssColorString("#ffcc00").withAlpha(0.9);
const HIGHLIGHT_OUTLINE_COLOR = Cesium.Color.fromCssColorString("#ffffff").withAlpha(1.0);

const highlightEntity = (entity: Cesium.Entity): void => {
	if (highlightedEntity?.id === entity.id) return;

	// Restore previous highlight
	restoreHighlight();

	const polygon = (entity as EntityWithPolygon).polygon;
	if (!polygon) return;

	// Save original styles using entity ID as key
	originalStyles.set(entity.id, {
		material: polygon.material,
		outlineColor: polygon.outlineColor,
		outlineWidth: polygon.outlineWidth,
	});

	// Apply highlight
	polygon.material = new Cesium.ColorMaterialProperty(HIGHLIGHT_COLOR);
	polygon.outlineColor = new Cesium.ConstantProperty(HIGHLIGHT_OUTLINE_COLOR);
	polygon.outlineWidth = new Cesium.ConstantProperty(3);

	highlightedEntity = entity;
};

const restoreHighlight = (): void => {
	if (!highlightedEntity) return;

	const styles = originalStyles.get(highlightedEntity.id);
	if (styles) {
		const polygon = (highlightedEntity as EntityWithPolygon).polygon;
		if (polygon) {
			if (styles.material) {
				polygon.material = styles.material;
			}
			if (styles.outlineColor) {
				polygon.outlineColor = styles.outlineColor;
			}
			if (styles.outlineWidth) {
				polygon.outlineWidth = styles.outlineWidth;
			}
		}
		originalStyles.delete(highlightedEntity.id);
	}

	highlightedEntity = null;
};

const performSyncCityModelLayers = async (): Promise<void> => {
	if (!cesiumViewer.value) {
		return;
	}

	// Convert reactive array to plain array to avoid Vue proxy issues with Cesium workers
	const plainCityLayers = toRaw(props.cityLayers).map(layer => ({
		...toRaw(layer),
		geojson: JSON.parse(JSON.stringify(toRaw(layer.geojson)))
	}));

	const expectedIds = new Set(plainCityLayers.map((layer) => layer.id));
	for (const [layerId, dataSource] of cityModelDataSources.entries()) {
		if (!expectedIds.has(layerId)) {
			cesiumViewer.value.dataSources.remove(dataSource, true);
			cityModelDataSources.delete(layerId);
			cityLayerSignatures.delete(layerId);
		}
	}

	for (const layer of plainCityLayers) {
		if (cesiumViewer.value.isDestroyed()) {
			return;
		}

		const layerSignature = JSON.stringify(layer.geojson);
		let dataSource = cityModelDataSources.get(layer.id);
		const existingSignature = cityLayerSignatures.get(layer.id);

		if (dataSource && existingSignature !== layerSignature) {
			if (!cesiumViewer.value.isDestroyed()) {
				cesiumViewer.value.dataSources.remove(dataSource, true);
			}

			cityModelDataSources.delete(layer.id);
			cityLayerSignatures.delete(layer.id);
			dataSource = undefined;
		}

		if (!dataSource) {
			try {
				// layer.geojson is already a plain object from the pre-processing above
				const loadedDataSource = await Cesium.GeoJsonDataSource.load(layer.geojson, {
				});
				const viewer = cesiumViewer.value;

				if (!viewer || viewer.isDestroyed() || !plainCityLayers.some((item) => item.id === layer.id)) {
					continue;
				}

				applyFeatureExtrusion(loadedDataSource);
				await viewer.dataSources.add(loadedDataSource);

				if (viewer.isDestroyed() || !plainCityLayers.some((item) => item.id === layer.id)) {
					if (!viewer.isDestroyed()) {
						viewer.dataSources.remove(loadedDataSource, true);
					}
					continue;
				}

				cityModelDataSources.set(layer.id, loadedDataSource);
				cityLayerSignatures.set(layer.id, layerSignature);
				dataSource = loadedDataSource;
			} catch (error) {
				console.error(`Failed to load city layer: ${layer.name}`, error);
				continue;
			}
		}

		dataSource.show = layer.visible;
	}
};

const syncCityModelLayers = async (): Promise<void> => {
	const nextSync = cityLayerSyncQueue.then(() => performSyncCityModelLayers());
	cityLayerSyncQueue = nextSync.catch((error) => {
		console.error("Failed to sync city model layers", error);
	});

	return nextSync;
};

const flyToEntity = (entity: Cesium.Entity): void => {
	const viewer = cesiumViewer.value;
	if (!viewer || viewer.isDestroyed()) return;

	const polygon = (entity as EntityWithPolygon).polygon;
	if (!polygon) return;

	const positions = polygon.hierarchy?.getValue(Cesium.JulianDate.now())?.positions;
	if (!positions || positions.length === 0) return;

	const boundingSphere = Cesium.BoundingSphere.fromPoints(positions);
	const offset = new Cesium.HeadingPitchRange(
		DEFAULT_CENTER.heading,
		DEFAULT_CENTER.pitch,
		boundingSphere.radius * 3
	);

	viewer.camera.flyToBoundingSphere(boundingSphere, {
		duration: 1.2,
		offset,
	});

	highlightEntity(entity);
};

const flyToBuildingByName = (name: string): boolean => {
	for (const [, dataSource] of cityModelDataSources.entries()) {
		for (const entity of dataSource.entities.values) {
			const properties = entity.properties;
			if (!properties) continue;
			const values = properties.getValue(Cesium.JulianDate.now()) as Record<string, unknown> | undefined;
			if (!values) continue;
			const entityName = values.name || values.Name;
			if (entityName === name) {
				flyToEntity(entity);
				return true;
			}
		}
	}
	return false;
};

const printCameraParams = (): void => {
	const viewer = cesiumViewer.value;
	if (!viewer || viewer.isDestroyed()) return;

	const camera = viewer.camera;
	const cartographic = camera.positionCartographic;
	const lon = Cesium.Math.toDegrees(cartographic.longitude);
	const lat = Cesium.Math.toDegrees(cartographic.latitude);
	const height = cartographic.height;
	const heading = Cesium.Math.toDegrees(camera.heading);
	const pitch = Cesium.Math.toDegrees(camera.pitch);
	const roll = Cesium.Math.toDegrees(camera.roll);

	console.log('=== Cesium 相机视角参数 ===');
	console.log(`lon: ${lon.toFixed(6)}`);
	console.log(`lat: ${lat.toFixed(6)}`);
	console.log(`height: ${height.toFixed(2)}`);
	console.log(`heading: ${heading.toFixed(6)}`);
	console.log(`pitch: ${pitch.toFixed(6)}`);
	console.log(`roll: ${roll.toFixed(6)}`);
	console.log('=== 复制用 ===');
	console.log(`lon: ${lon.toFixed(6)},\nlat: ${lat.toFixed(6)},\nheight: ${height.toFixed(2)},\nheading: Cesium.Math.toRadians(${heading.toFixed(6)}),\npitch: Cesium.Math.toRadians(${pitch.toFixed(6)}),\nroll: Cesium.Math.toRadians(${roll.toFixed(6)},`);
};

let keyHandler: ((e: KeyboardEvent) => void) | null = null;
let cameraBtnEl: HTMLButtonElement | null = null;
let toastEl: HTMLDivElement | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let weatherBtnEl: HTMLButtonElement | null = null;
let weatherMenuEl: HTMLDivElement | null = null;
let rainEffect: RainEffect | null = null;
let snowEffect: SnowEffect | null = null;
let currentWeather: WeatherType = "clear";
let fogDensityBackup = 0;

const showCameraToast = (text: string): void => {
	if (toastEl) {
		clearTimeout(toastTimer!);
		toastEl.remove();
		toastEl = null;
	}

	const viewer = cesiumViewer.value;
	if (!viewer || viewer.isDestroyed()) return;

	const container = viewer.container;
	toastEl = document.createElement('div');
	toastEl.className = 'camera-toast';
	toastEl.textContent = text;
	container.appendChild(toastEl);

	toastTimer = setTimeout(() => {
		toastEl?.remove();
		toastEl = null;
	}, 3000);
};

const handleCameraButtonClick = (): void => {
	const viewer = cesiumViewer.value;
	if (!viewer || viewer.isDestroyed()) return;

	const camera = viewer.camera;
	const cartographic = camera.positionCartographic;
	const lon = Cesium.Math.toDegrees(cartographic.longitude);
	const lat = Cesium.Math.toDegrees(cartographic.latitude);
	const height = cartographic.height;
	const heading = Cesium.Math.toDegrees(camera.heading);
	const pitch = Cesium.Math.toDegrees(camera.pitch);
	const roll = Cesium.Math.toDegrees(camera.roll);

	console.log('=== Cesium 相机视角参数 ===');
	console.log(`lon: ${lon.toFixed(6)}`);
	console.log(`lat: ${lat.toFixed(6)}`);
	console.log(`height: ${height.toFixed(2)}`);
	console.log(`heading: ${heading.toFixed(6)}`);
	console.log(`pitch: ${pitch.toFixed(6)}`);
	console.log(`roll: ${roll.toFixed(6)}`);

	const clipboardText = `lon: ${lon.toFixed(6)},\nlat: ${lat.toFixed(6)},\nheight: ${height.toFixed(2)},\nheading: Cesium.Math.toRadians(${heading.toFixed(6)}),\npitch: Cesium.Math.toRadians(${pitch.toFixed(6)}),\nroll: Cesium.Math.toRadians(${roll.toFixed(6)}),`;

	const toastText = `lon: ${lon.toFixed(6)}\nlat: ${lat.toFixed(6)}\nheight: ${height.toFixed(2)}\nheading: ${heading.toFixed(6)}°\npitch: ${pitch.toFixed(6)}°\nroll: ${roll.toFixed(6)}°\n✓ 已复制到剪贴板`;

	navigator.clipboard.writeText(clipboardText).catch(() => {
		/* clipboard may fail in some contexts */
	});

	showCameraToast(toastText);
};

const injectCameraButton = (): void => {
	const viewer = cesiumViewer.value;
	if (!viewer || viewer.isDestroyed()) return;

	const toolbar = viewer.container.querySelector('.cesium-viewer-toolbar');
	if (!toolbar) return;

	cameraBtnEl = document.createElement('button');
	cameraBtnEl.className = 'cesium-button cesium-toolbar-button camera-params-btn';
	cameraBtnEl.title = '获取相机参数';
	cameraBtnEl.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`;
	cameraBtnEl.addEventListener('click', handleCameraButtonClick);
	toolbar.insertBefore(cameraBtnEl, toolbar.firstChild);
};

const WEATHER_LABELS: Record<WeatherType, string> = {
	clear: "☀️ 晴天",
	rain: "🌧️ 雨天",
	snow: "❄️ 雪天",
	fog: "🌫️ 雾天",
};

const applyWeather = (type: WeatherType): void => {
	const viewer = cesiumViewer.value;
	if (!viewer || viewer.isDestroyed()) return;

	currentWeather = type;

	// 关闭所有天气效果
	rainEffect?.show(false);
	snowEffect?.show(false);
	viewer.scene.fog.enabled = false;
	viewer.scene.fog.density = fogDensityBackup;

	switch (type) {
		case "rain":
			if (!rainEffect) rainEffect = new RainEffect(viewer);
			rainEffect.show(true);
			break;
		case "snow":
			if (!snowEffect) snowEffect = new SnowEffect(viewer);
			snowEffect.show(true);
			break;
		case "fog":
			viewer.scene.fog.enabled = true;
			viewer.scene.fog.density = 0.002;
			break;
	}

	// 更新菜单高亮
	if (weatherMenuEl) {
		const items = weatherMenuEl.querySelectorAll('.weather-menu-item');
		items.forEach((item) => {
			const el = item as HTMLElement;
			el.style.background = el.dataset.weather === type ? 'rgba(64,158,255,0.3)' : 'transparent';
		});
	}
};

const toggleWeatherMenu = (): void => {
	if (weatherMenuEl) {
		weatherMenuEl.style.display = weatherMenuEl.style.display === 'none' ? 'block' : 'none';
	}
};

const injectWeatherButton = (): void => {
	const viewer = cesiumViewer.value;
	if (!viewer || viewer.isDestroyed()) return;

	const toolbar = viewer.container.querySelector('.cesium-viewer-toolbar');
	if (!toolbar) return;

	// 天气按钮
	weatherBtnEl = document.createElement('button');
	weatherBtnEl.className = 'cesium-button cesium-toolbar-button';
	weatherBtnEl.title = '天气模拟';
	weatherBtnEl.innerHTML = '🌤️';
	weatherBtnEl.style.fontSize = '16px';
	weatherBtnEl.addEventListener('click', toggleWeatherMenu);

	// 下拉菜单
	weatherMenuEl = document.createElement('div');
	weatherMenuEl.className = 'weather-menu';
	weatherMenuEl.style.cssText = `
		display: none;
		position: absolute;
		right: 40px;
		top: 0;
		background: rgba(0,0,0,0.85);
		border-radius: 6px;
		padding: 4px 0;
		z-index: 999;
		min-width: 100px;
	`;

	(Object.keys(WEATHER_LABELS) as WeatherType[]).forEach((type) => {
		const item = document.createElement('div');
		item.className = 'weather-menu-item';
		item.dataset.weather = type;
		item.textContent = WEATHER_LABELS[type];
		item.style.cssText = `
			padding: 8px 14px;
			color: #fff;
			font-size: 13px;
			cursor: pointer;
			background: ${type === currentWeather ? 'rgba(64,158,255,0.3)' : 'transparent'};
		`;
		item.addEventListener('mouseenter', () => { item.style.background = 'rgba(64,158,255,0.5)'; });
		item.addEventListener('mouseleave', () => { item.style.background = type === currentWeather ? 'rgba(64,158,255,0.3)' : 'transparent'; });
		item.addEventListener('click', () => {
			applyWeather(type);
			weatherMenuEl!.style.display = 'none';
		});
		weatherMenuEl!.appendChild(item);
	});

	// 关闭菜单
	const closeMenu = (e: MouseEvent): void => {
		if (weatherMenuEl && !weatherMenuEl.contains(e.target as Node) && e.target !== weatherBtnEl) {
			weatherMenuEl.style.display = 'none';
		}
	};
	document.addEventListener('click', closeMenu);

	toolbar.insertBefore(weatherMenuEl, toolbar.firstChild);
	toolbar.insertBefore(weatherBtnEl, weatherMenuEl);
};

const updateBuildingHeight = (layerId: string, featureIndex: number, height: number): void => {
	const dataSource = cityModelDataSources.get(layerId);
	if (!dataSource) return;
	const entities = dataSource.entities.values;
	const entity = entities[featureIndex] as EntityWithPolygon;
	if (!entity?.polygon) return;

	entity.polygon.extrudedHeight = new Cesium.ConstantProperty(height);
	entity.polygon.material = new Cesium.ColorMaterialProperty(getBuildingColor(height));
};

defineExpose({ flyToBuildingByName, updateBuildingHeight });

watch(
	() => props.baseLayer,
	(layerType) => {
		applyBaseLayer(layerType);
	}
);

watch(
	() => props.cityLayers,
	() => {
		void syncCityModelLayers();
	},
	{ deep: true }
);

const findLayerIdForEntity = (entity: Cesium.Entity): { layerId: string; dataSource: Cesium.GeoJsonDataSource } | null => {
	// Use entity ID for lookup instead of contains() which fails with Vue proxies
	const entityId = entity.id;
	for (const [layerId, dataSource] of cityModelDataSources.entries()) {
		const found = dataSource.entities.getById(entityId);
		if (found) {
			return { layerId, dataSource };
		}
	}
	return null;
};

const findFeatureIndex = (entity: Cesium.Entity, dataSource: Cesium.GeoJsonDataSource): number => {
	// Use entity ID for lookup instead of indexOf() which fails with Vue proxies
	const entityId = entity.id;
	const entities = dataSource.entities.values;
	for (let i = 0; i < entities.length; i++) {
		if (entities[i]?.id === entityId) {
			return i;
		}
	}
	return -1;
};

const getEntityProperties = (entity: Cesium.Entity): Record<string, unknown> => {
	const values = entity.properties?.getValue(Cesium.JulianDate.now()) as Record<string, unknown> | undefined;
	return values ?? {};
};

const setupMouseHandlers = (): void => {
	const viewer = cesiumViewer.value;
	if (!viewer) return;

	hoverHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
	hoverHandler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
		const picked = viewer.scene.pick(movement.endPosition);
		if (Cesium.defined(picked) && Cesium.defined(picked.id) && picked.id instanceof Cesium.Entity) {
			const entity = toRaw(picked.id as Cesium.Entity);
			const result = findLayerIdForEntity(entity);
			if (result) {
				const properties = getEntityProperties(entity);
				const featureResult = getFeatureType(entity.properties);

				// 只对建筑显示悬停
				if (featureResult.type !== 'building') {
					restoreHighlight();
					emit("hoverEntity", null);
					return;
				}

				const featureIndex = findFeatureIndex(entity, result.dataSource);
				highlightEntity(entity);
				emit("hoverEntity", {
					layerId: result.layerId,
					featureIndex,
					properties,
					x: movement.endPosition.x,
					y: movement.endPosition.y,
				});
				return;
			}
		}
		restoreHighlight();
		emit("hoverEntity", null);
	}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

	dblClickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
	dblClickHandler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
		// 双击时取消待执行的单击
		if (clickTimer !== null) {
			clearTimeout(clickTimer);
			clickTimer = null;
		}
		const picked = viewer.scene.pick(click.position);
		if (Cesium.defined(picked) && Cesium.defined(picked.id) && picked.id instanceof Cesium.Entity) {
			// Use toRaw() to remove Vue proxy wrapper from picked entity
			const entity = toRaw(picked.id as Cesium.Entity);
			const result = findLayerIdForEntity(entity);
			if (result) {
				const featureIndex = findFeatureIndex(entity, result.dataSource);
				emit("editEntity", {
					layerId: result.layerId,
					featureIndex,
					properties: getEntityProperties(entity),
				});
			}
		}
	}, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

	// 单击建筑 → 延迟 300ms 后弹出摘要气泡（双击会在此期间取消）
	clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
	clickHandler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
		if (clickTimer !== null) {
			clearTimeout(clickTimer);
		}
		const posX = click.position.x;
		const posY = click.position.y;
		clickTimer = window.setTimeout(() => {
			clickTimer = null;
			const picked = viewer.scene.pick(new Cesium.Cartesian2(posX, posY));
			if (Cesium.defined(picked) && Cesium.defined(picked.id) && picked.id instanceof Cesium.Entity) {
				// Use toRaw() to remove Vue proxy wrapper from picked entity
				const entity = toRaw(picked.id as Cesium.Entity);
				const result = findLayerIdForEntity(entity);
				if (result) {
					const featureIndex = findFeatureIndex(entity, result.dataSource);
					highlightEntity(entity);
					emit("selectEntity", {
						layerId: result.layerId,
						featureIndex,
						properties: getEntityProperties(entity),
						x: posX,
						y: posY,
					});
					return;
				}
			}
			restoreHighlight();
			emit("selectEntity", {
				layerId: '',
				featureIndex: -1,
				properties: {},
				x: 0,
				y: 0,
			});
		}, 300);
	}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
};

onMounted(async () => {
	// 确保使用地球椭球（火星页面可能修改了默认值）
	Cesium.Ellipsoid.default = Cesium.Ellipsoid.WGS84;
	Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN;

	cesiumViewer.value = markRaw(new Cesium.Viewer("cesium_container", {
		baseLayer: false,
		terrainProvider: new Cesium.EllipsoidTerrainProvider(),
		baseLayerPicker: false,
		geocoder: false,
		homeButton: true,
		sceneModePicker: true,
		navigationHelpButton: true,
		animation: true,
		timeline: true,
		fullscreenButton: true,
		selectionIndicator: false,
		infoBox: false,
		vrButton: true,
		navigationInstructionsInitiallyVisible: true,
	}));

	// 光照与阴影
	cesiumViewer.value.scene.globe.enableLighting = true;
	cesiumViewer.value.shadows = true;
	cesiumViewer.value.terrainShadows = Cesium.ShadowMode.ENABLED;

	// 设置时间为上午 10 点以获得适合的光照角度
	const startTime = Cesium.JulianDate.fromDate(new Date(2026, 4, 28, 10, 0, 0));
	cesiumViewer.value.clock.startTime = startTime.clone();
	cesiumViewer.value.clock.currentTime = startTime.clone();
	cesiumViewer.value.clock.clockRange = Cesium.ClockRange.UNBOUNDED;

	applyBaseLayer(props.baseLayer);
	applyDefaultView(0);
	await syncCityModelLayers();
	setupMouseHandlers();
	injectCameraButton();
	injectWeatherButton();
	fogDensityBackup = cesiumViewer.value.scene.fog.density;

	if (cesiumViewer.value.homeButton) {
		cesiumViewer.value.homeButton.viewModel.command.beforeExecute.addEventListener((event) => {
			event.cancel = true;
			applyDefaultView(1.2);
		});
	}

	// 按 P 键打印相机参数
	keyHandler = (e: KeyboardEvent) => {
		if (e.key === 'p' || e.key === 'P') {
			printCameraParams();
		}
	};
	window.addEventListener('keydown', keyHandler);
});

onUnmounted(() => {
	// Clean up highlight state
	restoreHighlight();
	originalStyles.clear();

	if (hoverHandler) {
		hoverHandler.destroy();
		hoverHandler = null;
	}
	if (dblClickHandler) {
		dblClickHandler.destroy();
		dblClickHandler = null;
	}
	if (clickHandler) {
		clickHandler.destroy();
		clickHandler = null;
	}
	if (clickTimer !== null) {
		clearTimeout(clickTimer);
		clickTimer = null;
	}
	if (keyHandler) {
		window.removeEventListener('keydown', keyHandler);
		keyHandler = null;
	}
	if (cameraBtnEl) {
		cameraBtnEl.removeEventListener('click', handleCameraButtonClick);
		cameraBtnEl.remove();
		cameraBtnEl = null;
	}
	if (toastTimer !== null) {
		clearTimeout(toastTimer);
		toastTimer = null;
	}
	if (toastEl) {
		toastEl.remove();
		toastEl = null;
	}
	rainEffect?.destroy();
	rainEffect = null;
	snowEffect?.destroy();
	snowEffect = null;
	if (weatherBtnEl) {
		weatherBtnEl.remove();
		weatherBtnEl = null;
	}
	if (weatherMenuEl) {
		weatherMenuEl.remove();
		weatherMenuEl = null;
	}
	if (cesiumViewer.value) {
		for (const dataSource of cityModelDataSources.values()) {
			cesiumViewer.value.dataSources.remove(dataSource, true);
		}
	}
	cityModelDataSources.clear();
	cesiumViewer.value?.destroy();
	cesiumViewer.value = null;
});
</script>

<style scoped>
.viewer-wrap {
	position: relative;
	width: 100%;
	height: 100%;
	border: 1px solid var(--border-viewer);
	border-radius: 14px;
	overflow: hidden;
	box-shadow: var(--shadow-viewer);
}

#cesium_container {
	width: 100%;
	height: 100%;
}

.camera-params-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 4px;
}

.camera-toast {
	position: absolute;
	top: 10px;
	right: 40px;
	z-index: 999;
	background: rgba(0, 0, 0, 0.8);
	color: #fff;
	padding: 10px 14px;
	border-radius: 6px;
	font-family: monospace;
	font-size: 12px;
	line-height: 1.6;
	white-space: pre;
	pointer-events: none;
	animation: camera-toast-in 0.2s ease-out;
}

@keyframes camera-toast-in {
	from { opacity: 0; transform: translateY(-8px); }
	to { opacity: 1; transform: translateY(0); }
}
</style>
