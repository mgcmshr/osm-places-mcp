import { requireLatLon, optionalNumber } from '../validation/input-validator.mjs';
import { mapOverpassElements } from '../domain/place-mapper.mjs';

function buildVegetarianQuery({ lat, lon, radius, limit }) {
  return `[out:json][timeout:60];(node["amenity"="restaurant"]["diet:vegetarian"~"yes|only"](around:${radius},${lat},${lon});way["amenity"="restaurant"]["diet:vegetarian"~"yes|only"](around:${radius},${lat},${lon});relation["amenity"="restaurant"]["diet:vegetarian"~"yes|only"](around:${radius},${lat},${lon});node["amenity"="restaurant"]["cuisine"~"vegetarian|vegan", i](around:${radius},${lat},${lon});way["amenity"="restaurant"]["cuisine"~"vegetarian|vegan", i](around:${radius},${lat},${lon});relation["amenity"="restaurant"]["cuisine"~"vegetarian|vegan", i](around:${radius},${lat},${lon}););out center ${limit};`;
}

export class FindVegetarianUseCase {
  constructor({ overpassClient }) {
    this.overpassClient = overpassClient;
  }

  async execute(args) {
    const { lat, lon } = requireLatLon(args.lat, args.lon);
    const radius = optionalNumber(args.radius_m, 1500);
    const limit = optionalNumber(args.limit, 20);

    const query = buildVegetarianQuery({ lat, lon, radius, limit });
    const raw = await this.overpassClient.query(query);
    const results = mapOverpassElements(raw.elements, { lat, lon }).slice(0, limit);

    return { ok: true, resultCount: results.length, results };
  }
}
