import { fetchJson } from './http-client.mjs';

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

export class OverpassClient {
  async query(overpassQueryText) {
    let lastErr;
    for (const ep of ENDPOINTS) {
      try {
        return await fetchJson(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: overpassQueryText
        });
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr;
  }
}
