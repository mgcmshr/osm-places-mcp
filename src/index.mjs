import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_PRIMARY = 'https://overpass-api.de/api/interpreter';
const OVERPASS_FALLBACK = 'https://overpass.kumi.systems/api/interpreter';

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = (d) => (d * Math.PI) / 180;
  const p1 = toRad(lat1), p2 = toRad(lat2);
  const dp = toRad(lat2 - lat1), dl = toRad(lon2 - lon1);
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function overpassQuery(query) {
  const endpoints = [OVERPASS_PRIMARY, OVERPASS_FALLBACK];
  let lastErr;
  for (const ep of endpoints) {
    try {
      return await fetchJson(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: query
      });
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Overpass failed');
}

function mapElements(elements, origin) {
  const out = [];
  const seen = new Set();
  for (const e of elements || []) {
    const t = e.tags || {};
    const lat = e.lat ?? e.center?.lat;
    const lon = e.lon ?? e.center?.lon;
    if (!lat || !lon) continue;
    const name = t.name || 'Unknown';
    const key = `${name}|${lat.toFixed(5)}|${lon.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const dist = origin ? Math.round(haversine(origin.lat, origin.lon, lat, lon)) : null;
    out.push({
      name,
      lat,
      lon,
      cuisine: t.cuisine || null,
      vegetarian: t['diet:vegetarian'] || null,
      amenity: t.amenity || null,
      address: [t['addr:street'], t['addr:housenumber'], t['addr:city']].filter(Boolean).join(', ') || null,
      distance_m: dist,
      map: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`
    });
  }
  return out.sort((a, b) => (a.distance_m ?? 1e12) - (b.distance_m ?? 1e12));
}

const server = new Server({ name: 'osm-places-mcp', version: '0.1.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'geocode',
      description: 'Geocode a place/address using Nominatim',
      inputSchema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } }, required: ['query'] }
    },
    {
      name: 'find_vegetarian_restaurants',
      description: 'Find vegetarian-friendly restaurants around lat/lon',
      inputSchema: {
        type: 'object',
        properties: {
          lat: { type: 'number' }, lon: { type: 'number' }, radius_m: { type: 'number' }, limit: { type: 'number' }
        },
        required: ['lat', 'lon']
      }
    },
    {
      name: 'find_places',
      description: 'Find places by amenity around lat/lon',
      inputSchema: {
        type: 'object',
        properties: {
          lat: { type: 'number' }, lon: { type: 'number' }, radius_m: { type: 'number' }, amenity: { type: 'string' }, limit: { type: 'number' }
        },
        required: ['lat', 'lon']
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: a = {} } = req.params;
  try {
    if (name === 'geocode') {
      const q = String(a.query || '').trim();
      const limit = Number.isFinite(a.limit) ? Number(a.limit) : 5;
      const url = `${NOMINATIM_URL}?format=jsonv2&q=${encodeURIComponent(q)}&limit=${limit}`;
      const data = await fetchJson(url, { headers: { 'User-Agent': 'osm-places-mcp/0.1.0' } });
      const out = (data || []).map((x) => ({
        display_name: x.display_name,
        lat: Number(x.lat),
        lon: Number(x.lon),
        type: x.type,
        osm_type: x.osm_type,
        osm_id: x.osm_id
      }));
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, count: out.length, results: out }) }] };
    }

    if (name === 'find_vegetarian_restaurants') {
      const lat = Number(a.lat), lon = Number(a.lon);
      const radius = Number.isFinite(a.radius_m) ? Number(a.radius_m) : 1500;
      const limit = Number.isFinite(a.limit) ? Number(a.limit) : 20;
      const query = `[out:json][timeout:60];(node["amenity"="restaurant"]["diet:vegetarian"~"yes|only"](around:${radius},${lat},${lon});way["amenity"="restaurant"]["diet:vegetarian"~"yes|only"](around:${radius},${lat},${lon});relation["amenity"="restaurant"]["diet:vegetarian"~"yes|only"](around:${radius},${lat},${lon});node["amenity"="restaurant"]["cuisine"~"vegetarian|vegan", i](around:${radius},${lat},${lon});way["amenity"="restaurant"]["cuisine"~"vegetarian|vegan", i](around:${radius},${lat},${lon});relation["amenity"="restaurant"]["cuisine"~"vegetarian|vegan", i](around:${radius},${lat},${lon}););out center ${limit};`;
      const data = await overpassQuery(query);
      const results = mapElements(data.elements, { lat, lon }).slice(0, limit);
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, resultCount: results.length, results }) }] };
    }

    if (name === 'find_places') {
      const lat = Number(a.lat), lon = Number(a.lon);
      const radius = Number.isFinite(a.radius_m) ? Number(a.radius_m) : 1500;
      const amenity = String(a.amenity || 'restaurant').trim();
      const limit = Number.isFinite(a.limit) ? Number(a.limit) : 20;
      const query = `[out:json][timeout:60];(node["amenity"="${amenity}"](around:${radius},${lat},${lon});way["amenity"="${amenity}"](around:${radius},${lat},${lon});relation["amenity"="${amenity}"](around:${radius},${lat},${lon}););out center ${limit};`;
      const data = await overpassQuery(query);
      const results = mapElements(data.elements, { lat, lon }).slice(0, limit);
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, amenity, resultCount: results.length, results }) }] };
    }

    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  } catch (e) {
    return { content: [{ type: 'text', text: JSON.stringify({ ok: false, error: e.message }) }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
