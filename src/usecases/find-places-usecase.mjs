import { requireLatLon, optionalNumber, requireString } from '../validation/input-validator.mjs';
import { mapOverpassElements } from '../domain/place-mapper.mjs';

function buildOverpassAmenityQuery({ lat, lon, radius, amenity, limit }) {
  return `[out:json][timeout:60];(node["amenity"="${amenity}"](around:${radius},${lat},${lon});way["amenity"="${amenity}"](around:${radius},${lat},${lon});relation["amenity"="${amenity}"](around:${radius},${lat},${lon}););out center ${limit};`;
}

export class FindPlacesUseCase {
  constructor({ overpassClient }) {
    this.overpassClient = overpassClient;
  }

  async execute(args) {
    const { lat, lon } = requireLatLon(args.lat, args.lon);
    const radius = optionalNumber(args.radius_m, 1500);
    const limit = optionalNumber(args.limit, 20);
    const amenity = requireString(args.amenity || 'restaurant', 'amenity');

    const query = buildOverpassAmenityQuery({ lat, lon, radius, amenity, limit });
    const raw = await this.overpassClient.query(query);
    const results = mapOverpassElements(raw.elements, { lat, lon }).slice(0, limit);

    return { ok: true, amenity, resultCount: results.length, results };
  }
}
