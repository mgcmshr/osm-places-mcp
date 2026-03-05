import { fetchJson } from './http-client.mjs';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export class NominatimClient {
  async geocode(query, limit = 5) {
    const url = `${NOMINATIM_URL}?format=jsonv2&q=${encodeURIComponent(query)}&limit=${limit}`;
    return fetchJson(url, {
      headers: {
        'User-Agent': 'osm-places-mcp/0.2.0'
      }
    });
  }
}
