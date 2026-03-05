import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TOOL_DEFS } from './transport/tool-registry.mjs';
import { NominatimClient } from './clients/nominatim-client.mjs';
import { OverpassClient } from './clients/overpass-client.mjs';
import { GeocodeUseCase } from './usecases/geocode-usecase.mjs';
import { FindPlacesUseCase } from './usecases/find-places-usecase.mjs';
import { FindVegetarianUseCase } from './usecases/find-vegetarian-usecase.mjs';

const nominatimClient = new NominatimClient();
const overpassClient = new OverpassClient();

const handlers = {
  geocode: new GeocodeUseCase({ nominatimClient }),
  find_places: new FindPlacesUseCase({ overpassClient }),
  find_vegetarian_restaurants: new FindVegetarianUseCase({ overpassClient })
};

const server = new Server({ name: 'osm-places-mcp', version: '0.2.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOL_DEFS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;
  const useCase = handlers[name];
  if (!useCase) {
    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }

  try {
    const result = await useCase.execute(args);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  } catch (e) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ ok: false, error: e.message, code: e.code || 'UNEXPECTED_ERROR' }) }],
      isError: true
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
