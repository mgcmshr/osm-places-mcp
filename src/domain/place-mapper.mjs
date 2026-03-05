import { haversineMeters } from './distance-service.mjs';

export function mapNominatimResults(rows = []) {
  return rows.map((x) => ({
    display_name: x.display_name,
    lat: Number(x.lat),
    lon: Number(x.lon),
    type: x.type,
    osm_type: x.osm_type,
    osm_id: x.osm_id
  }));
}

export function mapOverpassElements(elements = [], origin = null) {
  const out = [];
  const seen = new Set();

  for (const e of elements) {
    const t = e.tags || {};
    const lat = e.lat ?? e.center?.lat;
    const lon = e.lon ?? e.center?.lon;
    if (!lat || !lon) continue;

    const name = t.name || 'Unknown';
    const key = `${name}|${lat.toFixed(5)}|${lon.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const distance = origin ? Math.round(haversineMeters(origin.lat, origin.lon, lat, lon)) : null;

    out.push({
      name,
      lat,
      lon,
      cuisine: t.cuisine || null,
      vegetarian: t['diet:vegetarian'] || null,
      amenity: t.amenity || null,
      address: [t['addr:street'], t['addr:housenumber'], t['addr:city']].filter(Boolean).join(', ') || null,
      distance_m: distance,
      map: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`
    });
  }

  return out.sort((a, b) => (a.distance_m ?? Number.MAX_SAFE_INTEGER) - (b.distance_m ?? Number.MAX_SAFE_INTEGER));
}
