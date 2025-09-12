import { z } from 'zod';
import { publicProcedure } from '../main';

// Zod schemas for validation
const HarFileSchema = z.object({
  log: z.object({
    entries: z.array(z.object({
      request: z.object({
        method: z.string(),
        url: z.string(),
        headers: z.array(z.object({
          name: z.string(),
          value: z.string(),
        })).optional(),
        postData: z.object({
          mimeType: z.string().optional(),
          text: z.string().optional(),
        }).optional(),
      }),
      response: z.object({
        status: z.number(),
        statusText: z.string(),
        headers: z.array(z.object({
          name: z.string(),
          value: z.string(),
        })).optional(),
        content: z.object({
          mimeType: z.string().optional(),
          text: z.string().optional(),
        }).optional(),
      }),
    })),
  }),
});

const GenerateMCPSchema = z.object({
  serverName: z.string().min(1, 'Server name is required'),
  endpoints: z.array(z.object({
    id: z.string(),
    method: z.string(),
    path: z.string(),
    status: z.number(),
  })),
});

// Helper function to extract API endpoints from HAR
function extractEndpointsFromHar(harData: z.infer<typeof HarFileSchema>) {
  const endpoints: Array<{
    id: string;
    method: string;
    path: string;
    status: number;
    headers?: Record<string, string>;
    requestBody?: string;
    responseBody?: string;
  }> = [];

  harData.log.entries.forEach((entry, index) => {
    const url = new URL(entry.request.url);
    
    // Filter out static assets and focus on API endpoints
    const isApiEndpoint = 
      url.pathname.includes('/api/') ||
      entry.request.headers?.some(h => 
        h.name.toLowerCase() === 'content-type' && 
        h.value.includes('application/json')
      ) ||
      entry.response.headers?.some(h => 
        h.name.toLowerCase() === 'content-type' && 
        h.value.includes('application/json')
      );

    if (isApiEndpoint) {
      const headers: Record<string, string> = {};
      entry.request.headers?.forEach(h => {
        headers[h.name] = h.value;
      });

      endpoints.push({
        id: `endpoint-${index}`,
        method: entry.request.method,
        path: url.pathname + url.search,
        status: entry.response.status,
        headers,
        requestBody: entry.request.postData?.text,
        responseBody: entry.response.content?.text,
      });
    }
  });

  return endpoints;
}

// Helper function to generate MCP server code
function generateMCPServerCode(serverName: string, endpoints: Array<{
  id: string;
  method: string;
  path: string;
  status: number;
}>) {
  const serverCode = `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

const server = new Server(
  {
    name: '${serverName}',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

${endpoints.map(endpoint => `
// Tool for ${endpoint.method} ${endpoint.path}
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: '${endpoint.method.toLowerCase()}_${endpoint.path.replace(/[^a-zA-Z0-9]/g, '_')}',
        description: '${endpoint.method} request to ${endpoint.path}',
        inputSchema: {
          type: 'object',
          properties: {
            // Add parameters based on the endpoint
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === '${endpoint.method.toLowerCase()}_${endpoint.path.replace(/[^a-zA-Z0-9]/g, '_')}') {
    // Implement the actual API call here
    return {
      content: [
        {
          type: 'text',
          text: 'API call result would go here',
        },
      ],
    };
  }
});
`).join('\n')}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
`;

  const packageJson = {
    name: serverName,
    version: '1.0.0',
    description: 'Generated MCP server',
    main: 'server.js',
    scripts: {
      start: 'node server.js',
      build: 'tsc',
    },
    dependencies: {
      '@modelcontextprotocol/sdk': '^1.0.0',
      'zod': '^3.22.0',
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      'typescript': '^5.0.0',
    },
  };

  const readmeMd = `# ${serverName}

Generated MCP server for captured API endpoints.

## Installation

\`\`\`bash
npm install
npm run build
npm start
\`\`\`

## Endpoints

${endpoints.map(e => `- ${e.method} ${e.path} (${e.status})`).join('\n')}
`;

  return {
    'server.ts': serverCode,
    'package.json': JSON.stringify(packageJson, null, 2),
    'README.md': readmeMd,
  };
}

// tRPC procedures
export const parseHarFile = publicProcedure
  .input(z.object({
    harContent: z.string(),
  }))
  .mutation(async ({ input }) => {
    try {
      const harData = JSON.parse(input.harContent);
      const validatedHar = HarFileSchema.parse(harData);
      const endpoints = extractEndpointsFromHar(validatedHar);
      
      return {
        success: true,
        endpoints: endpoints.map(e => ({
          id: e.id,
          method: e.method,
          path: e.path,
          status: e.status,
        })),
        message: `Extracted ${endpoints.length} API endpoints`,
      };
    } catch (error) {
      return {
        success: false,
        endpoints: [],
        message: error instanceof Error ? error.message : 'Failed to parse HAR file',
      };
    }
  });

export const generateMCP = publicProcedure
  .input(GenerateMCPSchema)
  .mutation(async ({ input }) => {
    try {
      const files = generateMCPServerCode(input.serverName, input.endpoints);
      
      return {
        success: true,
        files,
        message: 'MCP server generated successfully',
      };
    } catch (error) {
      return {
        success: false,
        files: {},
        message: error instanceof Error ? error.message : 'Failed to generate MCP server',
      };
    }
  });

export const getApiSpec = publicProcedure
  .input(z.object({
    endpoints: z.array(z.object({
      id: z.string(),
      method: z.string(),
      path: z.string(),
      status: z.number(),
    })),
  }))
  .query(async ({ input }) => {
    // Generate OpenAPI spec from endpoints
    const spec = {
      openapi: '3.0.0',
      info: {
        title: 'Captured API',
        version: '1.0.0',
        description: 'API specification generated from captured HAR data',
      },
      paths: {} as Record<string, any>,
    };

    input.endpoints.forEach(endpoint => {
      const pathKey = endpoint.path.split('?')[0]; // Remove query params for OpenAPI path
      const method = endpoint.method.toLowerCase();
      
      if (!spec.paths[pathKey]) {
        spec.paths[pathKey] = {};
      }
      
      spec.paths[pathKey][method] = {
        summary: `${endpoint.method} ${pathKey}`,
        responses: {
          [endpoint.status]: {
            description: endpoint.status >= 200 && endpoint.status < 300 ? 'Success' : 'Error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    // This would be populated with actual response schema analysis
                  },
                },
              },
            },
          },
        },
      };
    });

    return {
      success: true,
      spec,
    };
  });
