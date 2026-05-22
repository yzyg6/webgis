# Campus Building Information Query — Design Spec

## Overview

Add campus building information query functionality to the Cesium 3D earth visualization project. Users can click buildings to view summary info in a popup, expand to full details in a side panel, and search/navigate to buildings via a searchable list.

## Goals

- Click any campus building on the 3D globe to see a summary popup (name, purpose, floors, capacity)
- Expand popup to a side panel showing full building details (metadata + GeoJSON properties)
- Search buildings by name with real-time filtering
- Browse all buildings in a list and click to fly to any building
- Preserve all existing functionality (hover tooltips, double-click edit, layer management, base layer switching)

## Non-Goals

- Real database integration for building metadata (mock data first, DB later)
- Indoor navigation or floor plans
- Facility booking/scheduling (reserved for future phase)
- Data visualization dashboard (reserved for future phase)

## Architecture

### Data Layer

**File:** `src/data/campus-buildings.ts`

- Define `BuildingMeta` type with fields: name, purpose, floors, capacity, college, contact, description
- Provide `MOCK_BUILDING_METAS`: a `Map<string, BuildingMeta>` keyed by building name
- Export `getBuildingMeta(name: string): BuildingMeta | null` for lookup
- Export `getAllBuildingMetas(): BuildingMeta[]` for list rendering
- Stub `loadBuildingMetaFromDb()` with async signature for future DB integration

```ts
type BuildingMeta = {
  name: string;
  purpose: string;
  floors: number;
  capacity: number;
  college: string;
  contact: string;
  description?: string;
};
```

### Components

#### `BuildingPopup.vue` — Summary Popup

- **Props:** `visible`, `x`, `y`, `buildingName`, `purpose`, `floors`, `capacity`
- **Emits:** `show-detail`, `close`
- Positioned absolutely near click location
- Dark semi-transparent background, rounded corners, consistent with existing HoverTooltip style
- "View Details" button at bottom emits `show-detail`

#### `BuildingInfoPanel.vue` — Side Detail Panel

- **Props:** `buildings` (full list), `selectedBuilding`, `searchQuery`
- **Emits:** `select-building`, `update:searchQuery`
- **Sections:**
  1. Search input at top with real-time filtering
  2. Building list (scrollable), each item clickable to fly to building
  3. Detail area below list: shows BuildingMeta fields + raw GeoJSON properties when a building is selected
- Positioned in the side panels area below `LayerPanel`

### State Management (App.vue)

New reactive state:

```ts
const selectedBuilding = ref<BuildingMeta | null>(null);
const buildingPopupInfo = ref<{
  x: number; y: number; layerId: string; featureIndex: number;
  properties: Record<string, unknown>;
} | null>(null);
const searchQuery = ref<string>('');
```

### Interaction Flows

#### Flow 1: Click Building → Popup → Details

1. User single-clicks a building entity on the Cesium globe
2. `CesiumViewer` emits `select-entity` with screen coordinates, layer ID, feature index, and properties
3. `App.vue` sets `buildingPopupInfo` → `BuildingPopup` appears at click position
4. User clicks "View Details" in popup
5. `App.vue` looks up `BuildingMeta` by building name from properties → sets `selectedBuilding`
6. `BuildingInfoPanel` displays full details

#### Flow 2: Search and Navigate

1. User types in search box in `BuildingInfoPanel`
2. Building list filters in real-time by name match
3. User clicks a building in the list
4. `App.vue` calls `CesiumViewer.flyToBuildingByName(name)` via `defineExpose`
5. `CesiumViewer` finds the entity, computes bounding sphere, flies camera to it, and highlights the entity

#### Flow 3: Dismiss Popup

- Click on empty space or press Escape → `buildingPopupInfo` set to null → popup closes

### CesiumViewer Changes

- **New emit:** `select-entity` (single-click, distinct from existing `hover-entity` on mouse move)
- **New method:** `flyToEntity(entity)` — uses `BoundingSphere` from entity polygon to compute camera target, flies with offset height
- **New method:** `flyToBuildingByName(name: string)` — searches all cityModelDataSources for entity matching name, calls `flyToEntity`
- **Exposed via `defineExpose`:** `flyToBuildingByName`
- Single-click handler added alongside existing hover and double-click handlers

## File Changes

| Operation | File | Description |
|-----------|------|-------------|
| New | `src/data/campus-buildings.ts` | Building metadata types + mock data + query functions |
| New | `src/components/BuildingPopup.vue` | Summary popup card |
| New | `src/components/BuildingInfoPanel.vue` | Side panel: search + list + details |
| Modify | `src/App.vue` | Add building selection/search state, integrate new components |
| Modify | `src/components/CesiumViewer.vue` | Add single-click event, flyTo, defineExpose |
| Unchanged | `Header.vue`, `LayerPanel.vue`, `PropertyTable.vue`, `HoverTooltip.vue`, `EditPanel.vue` | No changes |

## Preserved Functionality

- Hover highlight and HoverTooltip (mouse move)
- Double-click to edit properties (EditPanel)
- Layer management (add/remove/toggle visibility)
- Base layer switching (OSM/ArcGIS/Carto)
- GeoJSON normalization pipeline
- Database layer sync (PostgreSQL via Express API)
- localStorage persistence

## Mock Data

Initial mock data will cover 5-10 buildings from the `fynu_xihu_campus.geojson` dataset. Each entry includes name, purpose, floors, capacity, college, contact, and optional description. The mock data module is designed so that replacing it with a database call requires implementing only `loadBuildingMetaFromDb()`.

## Future Extensions

- **Phase 2:** Facility resource management (room status visualization)
- **Phase 3:** Data visualization dashboard (statistics overlay on 3D globe)
- **Database integration:** Implement `loadBuildingMetaFromDb()` to fetch from PostgreSQL
- **Building metadata editing:** Allow users to edit building info through the detail panel
