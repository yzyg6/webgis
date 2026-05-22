import type { GeoJsonLayerMeta, GeoJsonLayerFull } from '../types/geojson-db';

const API_BASE = '/api/geojson-layers';

export async function listLayers(): Promise<GeoJsonLayerMeta[]> {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error('Failed to list layers');
  return res.json();
}

export async function getLayer(id: string): Promise<GeoJsonLayerFull> {
  const res = await fetch(`${API_BASE}/${id}`);
  if (!res.ok) throw new Error('Failed to get layer');
  return res.json();
}

export async function createLayer(name: string, geojson: Record<string, unknown>): Promise<void> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, geojson }),
  });
  if (!res.ok) throw new Error('Failed to create layer');
}

export async function deleteLayer(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete layer');
}

export async function updateLayer(name: string, geojson: Record<string, unknown>): Promise<void> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, geojson }),
  });
  if (!res.ok) throw new Error('Failed to update layer');
}
