export interface Coordinate {
  latitude: number;
  longitude: number;
}

export function calculateDistanceMeters(from: Coordinate, to: Coordinate): number {
  const earthRadiusMeters = 6_371_000;
  const latitude1 = (from.latitude * Math.PI) / 180;
  const latitude2 = (to.latitude * Math.PI) / 180;
  const latitudeDelta = ((to.latitude - from.latitude) * Math.PI) / 180;
  const longitudeDelta = ((to.longitude - from.longitude) * Math.PI) / 180;

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function isPlausibleLocationStep(options: {
  distanceMeters: number;
  elapsedSeconds: number;
  accuracyMeters: number | null;
}): boolean {
  if (options.accuracyMeters != null && options.accuracyMeters > 50) return false;
  if (options.distanceMeters < 1.5) return false;
  return options.distanceMeters / Math.max(1, options.elapsedSeconds) <= 9;
}
