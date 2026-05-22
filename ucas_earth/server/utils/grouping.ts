export function extractGroupName(fileName: string): string {
  let base = fileName
    .replace(/\.geojson$/i, '')
    .replace(/\.json$/i, '')
    .replace(/\.osm$/, '');

  const parts = base.split('_');
  if (parts.length > 1 && /^\d/.test(parts[1])) {
    return parts[0];
  }
  return base;
}
