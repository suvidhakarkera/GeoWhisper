export interface TowerRef {
  towerId: string;
  latitude?: number;
  longitude?: number;
}

function shortId(id: string) {
  return id ? id.substring(0, 8) : 'unknown';
}

export function buildFallbackLabel(tower: TowerRef, userLocation?: { latitude: number; longitude: number }) {
  if (userLocation && tower.latitude && tower.longitude) {
    const R = 6371e3;
    const φ1 = (userLocation.latitude * Math.PI) / 180;
    const φ2 = (tower.latitude * Math.PI) / 180;
    const Δφ = ((tower.latitude - userLocation.latitude) * Math.PI) / 180;
    const Δλ = ((tower.longitude! - userLocation.longitude) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const meters = R * c;
    if (meters < 1000) return `${Math.round(meters)}m away`;
    return `${(meters / 1000).toFixed(1)}km away`;
  }

  if (tower.latitude && tower.longitude) {
    return `${tower.latitude.toFixed(3)}, ${tower.longitude.toFixed(3)}`;
  }

  return `Zone ${shortId(tower.towerId)}`;
}

export function getCachedLabel(towerId: string): string | null {
  try {
    const raw = sessionStorage.getItem(`tower_label_${towerId}`);
    if (!raw) return null;
    return raw;
  } catch (e) {
    return null;
  }
}

export async function fetchAndCacheLabel(tower: TowerRef): Promise<string | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!token || !tower.latitude || !tower.longitude) return null;

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${tower.longitude},${tower.latitude}.json?types=place,locality,neighborhood,address&limit=1&access_token=${token}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const place = data.features && data.features[0];
    if (!place) return null;
    const label = place.text || place.place_name || `${tower.latitude.toFixed(3)},${tower.longitude.toFixed(3)}`;
    try { sessionStorage.setItem(`tower_label_${tower.towerId}`, label); } catch (e) {}
    return label;
  } catch (e) {
    return null;
  }
}
