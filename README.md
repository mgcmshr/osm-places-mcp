# osm-places-mcp

Simple MCP server using open-source geodata services:
- Nominatim (geocoding)
- Overpass (POI search)

## Tools
- `geocode(query)`
- `find_vegetarian_restaurants(lat, lon, radius_m=1500, limit=20)`
- `find_places(lat, lon, radius_m=1500, amenity='restaurant', limit=20)`

## Run

```bash
npm install
npm start
```

Uses stdio transport.
