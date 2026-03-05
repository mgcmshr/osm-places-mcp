import { requireString, optionalNumber } from '../validation/input-validator.mjs';
import { mapNominatimResults } from '../domain/place-mapper.mjs';

export class GeocodeUseCase {
  constructor({ nominatimClient }) {
    this.nominatimClient = nominatimClient;
  }

  async execute(args) {
    const query = requireString(args.query, 'query');
    const limit = optionalNumber(args.limit, 5);
    const rows = await this.nominatimClient.geocode(query, limit);
    const results = mapNominatimResults(rows);
    return { ok: true, count: results.length, results };
  }
}
