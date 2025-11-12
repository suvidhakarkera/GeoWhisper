export function getTowerLabel(towerId?: string): string {
  if (!towerId) return 'Tower';

  try {
    const key = 'gw_tower_index_map_v1';
    const raw = sessionStorage.getItem(key);
    let map: Record<string, number> = raw ? JSON.parse(raw) : {};

    if (map[towerId]) {
      return `Tower ${map[towerId]}`;
    }

    // assign next number
    const next = Object.keys(map).length + 1;
    map[towerId] = next;
    try { sessionStorage.setItem(key, JSON.stringify(map)); } catch (e) {}
    return `Tower ${next}`;
  } catch (e) {
    // fallback short label
    return `Tower ${towerId?.substring(0, 6)}`;
  }
}
