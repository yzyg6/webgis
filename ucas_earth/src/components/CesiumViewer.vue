<template>
	<div class="viewer-wrap">
		<div id="cesium_container"></div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, toRaw, watch } from "vue";
import * as Cesium from "cesium";

type BaseLayerType = "osm" | "arcgis" | "carto";
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
	lon: 115.778033,
	lat: 32.886053,
	height: 591.41,
	heading: Cesium.Math.toRadians(12.200237),
	pitch: Cesium.Math.toRadians(-43.867719),
	roll: Cesium.Math.toRadians(0.001039),
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

const getFeatureType = (properties: Cesium.PropertyBag | undefined): FeatureType => {
	if (!properties) {
		return 'other';
	}

	const values = properties.getValue(Cesium.JulianDate.now()) as Record<string, unknown> | undefined;
	if (!values) {
		return 'other';
	}

	// Check for building
	if (values.building !== undefined && values.building !== null) {
		return 'building';
	}

	// Check for road
	if (values.highway || values.road || values.road_type) {
		return 'road';
	}

	// Check for water
	if (values.water || values.waterway || values.natural === 'water') {
		return 'water';
	}

	// Check for green space
	if (values.landuse === 'grass' || values.landuse === 'forest' || values.leisure === 'park' || values.natural === 'wood') {
		return 'green';
	}

	// Check for building by height properties
	if (values.Height !== undefined || values.height !== undefined || values["building:levels"] !== undefined) {
		return 'building';
	}

	return 'other';
};

const readBuildingHeight = (properties: Cesium.PropertyBag | undefined): number => {
	if (!properties) {
		return DEFAULT_BUILDING_HEIGHT;
	}

	const values = properties.getValue(Cesium.JulianDate.now()) as Record<string, unknown> | undefined;
	if (!values) {
		return DEFAULT_BUILDING_HEIGHT;
	}

	const height = parseHeightValue(values.Height);
	if (height !== null) {
		return height;
	}

	const levels = parseHeightValue(values["building:levels"]);
	if (levels !== null) {
		return levels * FLOOR_HEIGHT;
	}

	return DEFAULT_BUILDING_HEIGHT;
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
		const featureType = getFeatureType(properties);
		const style = FEATURE_STYLES[featureType];
		const height = readFeatureHeight(properties, featureType);

		entity.polygon.height = new Cesium.ConstantProperty(0);
		entity.polygon.extrudedHeight = new Cesium.ConstantProperty(height);
		entity.polygon.material = new Cesium.ColorMaterialProperty(
			Cesium.Color.fromCssColorString(style.color).withAlpha(style.alpha)
		);
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

defineExpose({ flyToBuildingByName });

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
			// Use toRaw() to remove Vue proxy wrapper from picked entity
			const entity = toRaw(picked.id as Cesium.Entity);
			const result = findLayerIdForEntity(entity);
			if (result) {
				const featureIndex = findFeatureIndex(entity, result.dataSource);
				highlightEntity(entity);
				emit("hoverEntity", {
					layerId: result.layerId,
					featureIndex,
					properties: getEntityProperties(entity),
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
	cesiumViewer.value = new Cesium.Viewer("cesium_container", {
		baseLayer: false,
		terrainProvider: new Cesium.EllipsoidTerrainProvider(),
		baseLayerPicker: true,
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
	});

	applyBaseLayer(props.baseLayer);
	applyDefaultView(0);
	await syncCityModelLayers();
	setupMouseHandlers();

	if (cesiumViewer.value.homeButton) {
		cesiumViewer.value.homeButton.viewModel.command.beforeExecute.addEventListener((event) => {
			event.cancel = true;
			applyDefaultView(1.2);
		});
	}
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
	border: 1px solid rgba(167, 225, 255, 0.35);
	border-radius: 14px;
	overflow: hidden;
	box-shadow: 0 14px 32px rgba(0, 0, 0, 0.38);
}

#cesium_container {
	width: 100%;
	height: 100%;
}
</style>
