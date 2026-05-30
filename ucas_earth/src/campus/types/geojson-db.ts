export interface GeoJsonLayerMeta {
  id: string;
  name: string;
  group_id: string | null;
  group_name: string | null;
  file_size: number | null;
  feature_count: number | null;
  created_at: string;
}

export interface GeoJsonLayerFull extends GeoJsonLayerMeta {
  geojson: Record<string, unknown>;
}
