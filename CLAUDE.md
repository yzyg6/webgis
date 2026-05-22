# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cesium-based 3D earth visualization project ("UCAS地球") built with Vue 3 + TypeScript + Vite. Renders geospatial data and GeoJSON city building models with height extrusion on a Cesium globe.

## Project Structure

- `chapter_1/` — Webpack-based Cesium scaffold (no source files, not runnable)
- `chapter_2/ucas_earth/` — **Main project** (Vue 3 + Vite + Cesium)

## Development Commands

All commands run from `chapter_2/ucas_earth/`:

```bash
npm run dev      # Start Vite dev server (localhost:5173)
npm run build    # Type-check with vue-tsc, then build for production
npm run preview  # Preview production build
```

## Architecture

### Data Flow

`App.vue` is the state owner — it manages `currentBaseLayer` (active imagery) and `cityLayers` (loaded GeoJSON datasets). State flows down via props to child components; events bubble up via `emit`.

```
App.vue (state + GeoJSON parsing/normalization)
├── Header.vue (UI controls: layer switching, file picker, layer list)
└── CesiumViewer.vue (Cesium.Viewer lifecycle, rendering)
```

### Key Concepts

- **GeoJSON normalization** (`App.vue`): Raw file input is parsed through `parseGeoJsonText` → `normalizeGeoJson` pipeline. Supports single Feature, FeatureCollection, bare Geometry, newline-delimited JSON, and arrays. Point/MultiPoint geometries are filtered out (not renderable as 3D extrusions).
- **City layer persistence**: Layers are cached in `localStorage` under key `ucas-city-model-layers`. On mount, cached layers are re-normalized to handle schema evolution.
- **Building extrusion** (`CesiumViewer.vue`): GeoJSON polygon features with a `Height` property get extruded into 3D buildings via `polygon.extrudedHeight`. Building color: `#7ccfff` at 70% alpha.
- **Base layers**: Three imagery providers — OpenStreetMap, ArcGIS World Imagery, Carto Light — swapped by clearing `imageryLayers` and adding a new provider.
- **Default camera**: Centered on Fuyang, Anhui (lon: 115.778, lat: 32.886). Home button is intercepted to fly back to this view.
- **Layer sync queue**: `CesiumViewer` serializes async GeoJSON loading through a promise chain (`cityLayerSyncQueue`) to avoid race conditions when layers change rapidly.

### Sample Data

`data/` directory contains GeoJSON files for testing:
- `FUYANG_Building.geojson` — Large dataset (~62MB), city-wide building footprints with Height properties
- `fynu_xihu_campus.geojson` — Campus-level building data
- `planet_*.osm.geojson` — OSM-sourced area extract

## Tech Stack

- **Runtime**: Vue 3.5 (Composition API + `<script setup>`)
- **Build**: Vite 7 + `vite-plugin-cesium`
- **3D Engine**: Cesium 1.138
- **Type Checking**: TypeScript 5.9 + vue-tsc
- **Styling**: Scoped CSS per component, no CSS framework
