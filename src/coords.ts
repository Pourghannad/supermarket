export function parseCoord(value: string): number | null {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatCoord(value: number): string {
  return value.toFixed(4);
}

export function isValidCoords(lat: string, lng: string): boolean {
  const parsedLat = parseCoord(lat);
  const parsedLng = parseCoord(lng);
  if (parsedLat === null || parsedLng === null) return false;
  return parsedLat >= -90 && parsedLat <= 90 && parsedLng >= -180 && parsedLng <= 180;
}
