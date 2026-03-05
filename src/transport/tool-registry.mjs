export const TOOL_DEFS = [
  {
    name: 'geocode',
    description: 'Geocode a place/address using Nominatim',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' }
      },
      required: ['query']
    }
  },
  {
    name: 'find_vegetarian_restaurants',
    description: 'Find vegetarian-friendly restaurants around lat/lon',
    inputSchema: {
      type: 'object',
      properties: {
        lat: { type: 'number' },
        lon: { type: 'number' },
        radius_m: { type: 'number' },
        limit: { type: 'number' }
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
        lat: { type: 'number' },
        lon: { type: 'number' },
        radius_m: { type: 'number' },
        amenity: { type: 'string' },
        limit: { type: 'number' }
      },
      required: ['lat', 'lon']
    }
  }
];
