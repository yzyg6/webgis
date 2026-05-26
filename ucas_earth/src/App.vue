<script setup lang="ts">
import { computed, markRaw, onMounted, onUnmounted, ref, watch } from "vue";
import Header from "./components/Header.vue";
import CesiumViewer from "./components/CesiumViewer.vue";
import SidebarContainer from "./components/SidebarContainer.vue";
import HoverTooltip from "./components/HoverTooltip.vue";
import EditPanel from "./components/EditPanel.vue";
import BuildingPopup from "./components/BuildingPopup.vue";
import { createLayer as dbCreateLayer, listLayers as dbListLayers, getLayer as dbGetLayer, updateLayer as dbUpdateLayer } from "./api/geojson-db";
import type { GeoJsonLayerMeta } from "./types/geojson-db";
import { getBuildingMeta, getAllBuildingMetas } from "./data/campus-buildings";
import type { BuildingMeta } from "./data/campus-buildings";
import { getBuildingType } from "./data/building-type-mapping";
import { BUILDING_TYPE_LABELS } from "./types/building";
import { createCourse, listCourses, updateCourse, deleteCourse, importCourses } from "./api/courses";
import type { Course, CourseCreateInput, CourseImportRow } from "./types/courses";
import { getCurrentWeek, getCurrentDay } from "./utils/weekRange";
import CourseForm from "./components/CourseForm.vue";
import CourseImport from "./components/CourseImport.vue";
import CourseDetail from "./components/CourseDetail.vue";

type BaseLayerType = "osm" | "arcgis" | "carto";
type GeoJsonObject = Record<string, unknown>;

type CityLayer = {
	id: string;
	name: string;
	visible: boolean;
	geojson: GeoJsonObject;
};

const currentBaseLayer = ref<BaseLayerType>("osm");
const cityLayers = ref<CityLayer[]>([]);
const STORAGE_KEY = "ucas-city-model-layers";

const dbLayers = ref<GeoJsonLayerMeta[]>([]);
const isLoadingFromDb = ref(false);
const showDbPanel = ref(false);

const selectedLayerId = ref<string | null>(null);
const activePanel = ref<string | null>(null);

type HoverInfo = { layerId: string; featureIndex: number; properties: Record<string, unknown>; x: number; y: number };
type EditInfo = { layerId: string; featureIndex: number; properties: Record<string, unknown> };

const hoveredEntity = ref<HoverInfo | null>(null);
const editingEntity = ref<EditInfo | null>(null);

const selectedBuilding = ref<BuildingMeta | null>(null);
const buildingPopupInfo = ref<{
	layerId: string; featureIndex: number;
	properties: Record<string, unknown>; x: number; y: number;
} | null>(null);
const buildingSearchQuery = ref('');
const allBuildings = getAllBuildingMetas();

const courses = ref<Course[]>([]);
const currentWeek = ref(getCurrentWeek());
const currentDay = ref(getCurrentDay());
const courseDetailInfo = ref<{
	buildingName: string;
	courses: Course[];
	x: number;
	y: number;
} | null>(null);
const editingCourse = ref<Course | null>(null);
const showCourseForm = ref(false);
const showCourseImport = ref(false);
const cesiumViewerRef = ref<InstanceType<typeof CesiumViewer> | null>(null);

const layerMetaList = computed(() =>
	cityLayers.value.map((layer) => {
		const fc = layer.geojson as { features?: unknown[] };
		return {
			id: layer.id,
			name: layer.name,
			featureCount: fc.features?.length ?? 0,
		};
	})
);

const selectedLayerName = computed(() => {
	if (!selectedLayerId.value) return "";
	return cityLayers.value.find((l) => l.id === selectedLayerId.value)?.name ?? "";
});

const selectedLayerProperties = computed(() => {
	if (!selectedLayerId.value) return [];
	const layer = cityLayers.value.find((l) => l.id === selectedLayerId.value);
	if (!layer) return [];
	const fc = layer.geojson as { features?: { properties?: Record<string, unknown> }[] };
	return (fc.features ?? []).map((f) => f.properties ?? {});
});

const courseBuildings = computed(() => {
	const buildings = new Set(courses.value.map(c => c.buildingName));
	return Array.from(buildings).sort();
});

const coursesByBuilding = computed(() => {
	const map = new Map<string, Course[]>();
	for (const course of courses.value) {
		if (course.weekday === currentDay.value) {
			const list = map.get(course.buildingName) || [];
			list.push(course);
			map.set(course.buildingName, list);
		}
	}
	return map;
});

const currentBuildingType = computed(() => {
	if (!buildingPopupInfo.value) return undefined;
	const properties = buildingPopupInfo.value.properties as Record<string, unknown>;
	return getBuildingType(properties);
});

const handleSwitchLayer = (layer: BaseLayerType): void => {
	currentBaseLayer.value = layer;
};

const isPlainObject = (value: unknown): value is GeoJsonObject => {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const isUnsupportedPointGeometry = (geometry: unknown): boolean => {
	if (!isPlainObject(geometry)) {
		return false;
	}

	return geometry.type === "Point" || geometry.type === "MultiPoint";
};

const isRenderableFeature = (feature: unknown): feature is GeoJsonObject => {
	if (!isPlainObject(feature)) {
		return false;
	}

	return !isUnsupportedPointGeometry(feature.geometry);
};

const normalizeGeoJson = (value: unknown): GeoJsonObject | null => {
	if (!isPlainObject(value)) {
		return null;
	}

	const type = value.type;

	if (type === "FeatureCollection" && Array.isArray(value.features)) {
		const filteredFeatures = value.features.filter(isRenderableFeature);
		if (filteredFeatures.length === 0) {
			return null;
		}

		return {
			type: "FeatureCollection",
			features: filteredFeatures,
		};
	}

	if (type === "Feature" && isPlainObject(value.geometry)) {
		if (isUnsupportedPointGeometry(value.geometry)) {
			return null;
		}

		return {
			type: "FeatureCollection",
			features: [value],
		};
	}

	const geometryTypes = new Set([
		"Point",
		"MultiPoint",
		"LineString",
		"MultiLineString",
		"Polygon",
		"MultiPolygon",
		"GeometryCollection",
	]);

	if (typeof type === "string" && geometryTypes.has(type)) {
		if (type === "Point" || type === "MultiPoint") {
			return null;
		}

		return {
			type: "FeatureCollection",
			features: [
				{
					type: "Feature",
					properties: {},
					geometry: value,
				},
			],
		};
	}

	return null;
};

const normalizeGeoJsonArray = (value: unknown): GeoJsonObject | null => {
	if (!Array.isArray(value) || value.length === 0) {
		return null;
	}

	const features: GeoJsonObject[] = [];
	for (const item of value) {
		const normalizedItem = normalizeGeoJson(item);
		if (!normalizedItem) {
			return null;
		}

		if (normalizedItem.type === "FeatureCollection" && Array.isArray(normalizedItem.features)) {
			features.push(...normalizedItem.features.filter(isRenderableFeature));
			continue;
		}

		if (isRenderableFeature(normalizedItem)) {
			features.push(normalizedItem);
		}
	}

	if (features.length === 0) {
		return null;
	}

	return {
		type: "FeatureCollection",
		features,
	};
};

const parseGeoJsonText = (text: string): unknown => {
	try {
		return JSON.parse(text) as unknown;
	} catch {
		const lineItems = text
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter((line) => line.length > 0);

		if (lineItems.length > 0) {
			try {
				return lineItems.map((line) => JSON.parse(line) as unknown);
			} catch {
				// Fall through to the wrapped parse below.
			}
		}

		try {
			return JSON.parse(`[${text}]`) as unknown;
		} catch {
			return null;
		}
	}
};

const getUniqueLayerName = (name: string): string => {
	const existingNames = new Set(cityLayers.value.map((layer) => layer.name));
	if (!existingNames.has(name)) {
		return name;
	}

	let index = 2;
	let nextName = `${name} (${index})`;
	while (existingNames.has(nextName)) {
		index += 1;
		nextName = `${name} (${index})`;
	}

	return nextName;
};

const handleLoadCityModelFile = async (file: File): Promise<void> => {
	try {
		const text = await file.text();
		const parsed = parseGeoJsonText(text);
		const normalized = normalizeGeoJson(parsed) ?? normalizeGeoJsonArray(parsed);

		if (!normalized) {
			window.alert("文件格式不正确，请选择有效的 GeoJSON 文件。");
			return;
		}

		const baseName = file.name.replace(/\.geojson$/i, "").replace(/\.json$/i, "");
		const layerName = getUniqueLayerName(baseName || "未命名图层");

		cityLayers.value.push({
			id: `city-layer-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
			name: layerName,
			visible: true,
			geojson: markRaw(normalized),
		});

		// Fire-and-forget: save to database
		dbCreateLayer(layerName, normalized).catch((err) => {
			console.warn("Failed to save layer to database:", err);
		});
	} catch {
		window.alert("文件格式不正确，请选择有效的 GeoJSON 文件。");
	}
};

const handleToggleCityLayerVisibility = (id: string): void => {
	const layer = cityLayers.value.find((item) => item.id === id);
	if (!layer) {
		return;
	}

	layer.visible = !layer.visible;
};

const handleRemoveCityLayer = (id: string): void => {
	cityLayers.value = cityLayers.value.filter((item) => item.id !== id);
};

const handleLoadFromDatabase = async (): Promise<void> => {
	isLoadingFromDb.value = true;
	showDbPanel.value = true;
	try {
		dbLayers.value = await dbListLayers();
	} catch (err) {
		console.warn("Failed to load layers from database:", err);
		window.alert("无法从数据库加载图层列表，请确保 API 服务器正在运行。");
		showDbPanel.value = false;
	} finally {
		isLoadingFromDb.value = false;
	}
};

const handleLoadDbLayer = async (layerId: string): Promise<void> => {
	try {
		const layer = await dbGetLayer(layerId);
		const normalized = normalizeGeoJson(layer.geojson) ?? normalizeGeoJsonArray(layer.geojson);
		if (!normalized) {
			window.alert("该图层数据格式不正确，无法加载。");
			return;
		}
		const layerName = getUniqueLayerName(layer.name);
		cityLayers.value.push({
			id: `city-layer-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
			name: layerName,
			visible: true,
			geojson: markRaw(normalized),
		});
	} catch (err) {
		console.warn("Failed to load layer from database:", err);
		window.alert("从数据库加载图层失败。");
	}
};

const handleCloseDbPanel = (): void => {
	showDbPanel.value = false;
};

const handleHoverEntity = (info: HoverInfo | null): void => {
	hoveredEntity.value = info;
};

const handleEditEntity = (info: EditInfo): void => {
	buildingPopupInfo.value = null;
	editingEntity.value = info;
};

const editingLayerName = computed(() => {
	if (!editingEntity.value) return "";
	return cityLayers.value.find((l) => l.id === editingEntity.value!.layerId)?.name ?? "";
});

const handleSaveProperties = (newProps: Record<string, unknown>): void => {
	if (!editingEntity.value) return;
	const editingInfo = editingEntity.value;
	if (!editingInfo) return;
	const layer = cityLayers.value.find((l) => l.id === editingInfo.layerId);
	if (!layer) return;
	const fc = layer.geojson as { features: { properties: Record<string, unknown> }[] };
	if (fc.features && fc.features[editingInfo.featureIndex]) {
		fc.features[editingInfo.featureIndex]!.properties = newProps;
	}
	layer.geojson = markRaw({ ...layer.geojson });

	dbUpdateLayer(layer.name, layer.geojson).catch((err) => {
		console.warn("Failed to sync to database:", err);
	});

	editingEntity.value = null;
};

const handleSelectEntity = (info: { layerId: string; featureIndex: number; properties: Record<string, unknown>; x: number; y: number }): void => {
	if (!info.layerId) {
		buildingPopupInfo.value = null;
		return;
	}
	buildingPopupInfo.value = info;
};

const handleEditHeightChange = (height: number): void => {
	if (!editingEntity.value) return;
	cesiumViewerRef.value?.updateBuildingHeight(
		editingEntity.value.layerId,
		editingEntity.value.featureIndex,
		height
	);
};

const handleShowBuildingDetail = (): void => {
	if (!buildingPopupInfo.value) return;
	const name = String(buildingPopupInfo.value.properties.name || buildingPopupInfo.value.properties.Name || '');
	const meta = getBuildingMeta(name);
	if (meta) {
		selectedBuilding.value = meta;
	}
	buildingPopupInfo.value = null;
};

const handleSelectBuildingFromPanel = (meta: BuildingMeta): void => {
	selectedBuilding.value = meta;
	cesiumViewerRef.value?.flyToBuildingByName(meta.name);
};

const handleKeydown = (e: KeyboardEvent): void => {
	if (e.key === 'Escape' && buildingPopupInfo.value) {
		buildingPopupInfo.value = null;
	}
};

const handleLoadCourses = async () => {
	try {
		courses.value = await listCourses();
	} catch (err) {
		console.warn("Failed to load courses:", err);
	}
};

const handleAddCourse = () => {
	editingCourse.value = null;
	showCourseForm.value = true;
};

const handleEditCourse = (course: Course) => {
	editingCourse.value = course;
	showCourseForm.value = true;
};

const handleSaveCourse = async (input: CourseCreateInput) => {
	try {
		if (editingCourse.value) {
			await updateCourse({ ...input, id: editingCourse.value.id });
		} else {
			await createCourse(input);
		}
		await handleLoadCourses();
		showCourseForm.value = false;
		editingCourse.value = null;
	} catch (err) {
		console.warn("Failed to save course:", err);
		window.alert("保存课程失败");
	}
};

const handleDeleteCourse = async (id: number) => {
	if (!window.confirm("确定要删除这个课程吗？")) return;
	try {
		await deleteCourse(id);
		await handleLoadCourses();
	} catch (err) {
		console.warn("Failed to delete course:", err);
		window.alert("删除课程失败");
	}
};

const handleImportCourses = () => {
	showCourseImport.value = true;
};

const handleImportCoursesSubmit = async (rows: CourseImportRow[]) => {
	try {
		await importCourses(rows);
		await handleLoadCourses();
		showCourseImport.value = false;
	} catch (err) {
		console.warn("Failed to import courses:", err);
		window.alert("导入课程失败");
	}
};

const handleSelectCourse = (course: Course) => {
	cesiumViewerRef.value?.flyToBuildingByName(course.buildingName);
};

const handleFilterCourses = (buildingName: string) => {
	// 可以在这里添加筛选逻辑
};

const handleCourseBubbleClick = (buildingName: string, x: number, y: number) => {
	const buildingCourses = coursesByBuilding.value.get(buildingName) || [];
	courseDetailInfo.value = {
		buildingName,
		courses: buildingCourses,
		x,
		y,
	};
};

onMounted(() => {
	window.addEventListener('keydown', handleKeydown);
	handleLoadCourses();
	const cached = localStorage.getItem(STORAGE_KEY);
	if (!cached) {
		return;
	}

	try {
		const parsed = JSON.parse(cached) as CityLayer[];
		if (Array.isArray(parsed)) {
			cityLayers.value = parsed
				.filter((item) => item && typeof item.id === "string" && typeof item.name === "string")
				.map((item) => ({
					...item,
					geojson: markRaw(normalizeGeoJson(item.geojson) ?? normalizeGeoJsonArray(item.geojson) ?? item.geojson),
				}));
		}
	} catch {
		localStorage.removeItem(STORAGE_KEY);
	}
});

watch(
	cityLayers,
	(layers) => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(layers));
		} catch (error) {
			if (error instanceof DOMException && error.name === "QuotaExceededError") {
				console.warn("City layer persistence skipped because localStorage quota was exceeded.");
				return;
			}

			throw error;
		}
	},
	{ deep: true }
);

onUnmounted(() => {
	window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
	<div class="app-shell">
		<Header
			:city-layers="cityLayers"
			:db-layers="dbLayers"
			:is-loading-from-db="isLoadingFromDb"
			:show-db-panel="showDbPanel"
			@switch-layer="handleSwitchLayer"
			@load-city-model-file="handleLoadCityModelFile"
			@toggle-city-layer-visibility="handleToggleCityLayerVisibility"
			@remove-city-layer="handleRemoveCityLayer"
			@load-from-database="handleLoadFromDatabase"
			@load-db-layer="handleLoadDbLayer"
			@close-db-panel="handleCloseDbPanel"
		/>
		<main class="app-main">
			<SidebarContainer
				:active-panel="activePanel"
				:layers="layerMetaList"
				:selected-layer-id="selectedLayerId"
				:buildings="allBuildings"
				:selected-building="selectedBuilding"
				:search-query="buildingSearchQuery"
				:geo-properties="buildingPopupInfo?.properties ?? {}"
				:layer-name="selectedLayerName"
				:properties="selectedLayerProperties"
				:courses="courses"
				:current-week="currentWeek"
				:current-day="currentDay"
				:course-buildings="courseBuildings"
				@update:active-panel="(v) => (activePanel = v)"
				@select-layer="(id) => (selectedLayerId = id)"
				@select-building="handleSelectBuildingFromPanel"
				@update:search-query="(q) => (buildingSearchQuery = q)"
				@add-course="handleAddCourse"
				@edit-course="handleEditCourse"
				@delete-course="handleDeleteCourse"
				@import-courses="handleImportCourses"
				@select-course="handleSelectCourse"
				@filter-courses="handleFilterCourses"
			/>
			<CesiumViewer
				ref="cesiumViewerRef"
				:base-layer="currentBaseLayer"
				:city-layers="cityLayers"
				@hover-entity="handleHoverEntity"
				@edit-entity="handleEditEntity"
				@select-entity="handleSelectEntity"
			/>
		</main>
		<BuildingPopup
			:visible="buildingPopupInfo !== null"
			:x="buildingPopupInfo?.x ?? 0"
			:y="buildingPopupInfo?.y ?? 0"
			:building-name="String(buildingPopupInfo?.properties?.name || buildingPopupInfo?.properties?.Name || '')"
			:building-type="currentBuildingType"
			:courses="coursesByBuilding.get(String(buildingPopupInfo?.properties?.name || buildingPopupInfo?.properties?.Name || '')) ?? []"
			@show-detail="handleShowBuildingDetail"
			@close="buildingPopupInfo = null"
		/>
		<HoverTooltip
			:visible="hoveredEntity !== null"
			:x="hoveredEntity?.x ?? 0"
			:y="hoveredEntity?.y ?? 0"
			:building-name="String(hoveredEntity?.properties?.name || hoveredEntity?.properties?.Name || '')"
			:building-type="BUILDING_TYPE_LABELS[getBuildingType(hoveredEntity?.properties ?? {})]"
			:course-count="coursesByBuilding.get(String(hoveredEntity?.properties?.name || hoveredEntity?.properties?.Name || ''))?.length"
		/>
		<EditPanel
			:visible="editingEntity !== null"
			:layer-name="editingLayerName"
			:feature-index="editingEntity?.featureIndex ?? 0"
			:properties="editingEntity?.properties ?? {}"
			@save="handleSaveProperties"
			@cancel="editingEntity = null"
			@height-change="handleEditHeightChange"
		/>
		<CourseForm
			:visible="showCourseForm"
			:course="editingCourse"
			:buildings="courseBuildings"
			@save="handleSaveCourse"
			@cancel="showCourseForm = false"
		/>
		<CourseImport
			:visible="showCourseImport"
			@import="handleImportCoursesSubmit"
			@cancel="showCourseImport = false"
		/>
		<CourseDetail
			:visible="courseDetailInfo !== null"
			:building-name="courseDetailInfo?.buildingName ?? ''"
			:courses="courseDetailInfo?.courses ?? []"
			:x="courseDetailInfo?.x ?? 0"
			:y="courseDetailInfo?.y ?? 0"
			@close="courseDetailInfo = null"
			@edit="handleEditCourse"
		/>
	</div>
</template>

<style scoped>
.app-shell {
	width: 100%;
	height: 100%;
	display: grid;
	grid-template-rows: 64px 1fr;
	background: var(--bg-app);
}

.app-main {
	min-height: 0;
	padding: 10px;
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 10px;
}
</style>
