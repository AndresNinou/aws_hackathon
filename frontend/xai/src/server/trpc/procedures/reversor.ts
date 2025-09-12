import { z } from 'zod';
import { baseProcedure } from '../main';

// API client for communicating with the FastAPI backend
const BACKEND_URL = 'http://localhost:8000';

// Zod schemas for validation
const UploadHarSchema = z.object({
  harFile: z.instanceof(File),
});

const StartAgentSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  harFilePath: z.string(),
  model: z.string().default('gpt-4o-mini'),
  inputVariables: z.record(z.any()).optional(),
  maxSteps: z.number().default(15),
  generateCode: z.boolean().default(true),
});

const JobStatusSchema = z.object({
  jobId: z.string(),
});

// Helper function to upload HAR file to backend
async function uploadHarFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BACKEND_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload HAR file');
  }

  return response.json();
}

// Helper function to start agent processing
async function startAgent(params: {
  prompt: string;
  harFilePath: string;
  model?: string;
  inputVariables?: Record<string, any>;
  maxSteps?: number;
  generateCode?: boolean;
}) {
  const response = await fetch(`${BACKEND_URL}/agent/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: params.prompt,
      model: params.model || 'gpt-4o-mini',
      input_variables: params.inputVariables,
      max_steps: params.maxSteps || 15,
      generate_code: params.generateCode ?? true,
    }),
    // Include HAR file path as query parameter
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to start agent');
  }

  return response.json();
}

// Helper function to check job status
async function checkJobStatus(jobId: string) {
  const response = await fetch(`${BACKEND_URL}/agent/status/${jobId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get job status');
  }

  return response.json();
}

// Extract endpoints from HAR data for the frontend
function extractEndpointsFromHarUpload(harData: any) {
  const endpoints: Array<{
    id: string;
    method: string;
    path: string;
    status: number;
  }> = [];

  if (!harData.log || !harData.log.entries) {
    throw new Error('Invalid HAR file format');
  }

  harData.log.entries.forEach((entry: any, index: number) => {
    try {
      const url = new URL(entry.request.url);
      
      // Filter for API endpoints (similar to backend logic)
      const isApiEndpoint = 
        url.pathname.includes('/api/') ||
        entry.request.headers?.some((h: any) => 
          h.name.toLowerCase() === 'content-type' && 
          h.value.includes('application/json')
        ) ||
        entry.response.headers?.some((h: any) => 
          h.name.toLowerCase() === 'content-type' && 
          h.value.includes('application/json')
        );

      if (isApiEndpoint) {
        endpoints.push({
          id: `endpoint-${index}`,
          method: entry.request.method,
          path: url.pathname + url.search,
          status: entry.response.status,
        });
      }
    } catch (e) {
      // Skip invalid URLs
      console.warn(`Skipping invalid URL in HAR entry ${index}:`, e);
    }
  });

  return endpoints;
}

// tRPC procedures for the reversor functionality
export const uploadAndParseHar = baseProcedure
  .input(z.object({
    harContent: z.string(),
  }))
  .mutation(async ({ input }) => {
    try {
      // Parse HAR content and extract endpoints for immediate UI feedback
      const harData = JSON.parse(input.harContent);
      const endpoints = extractEndpointsFromHarUpload(harData);
      
      // Create a File object from the HAR content for backend upload
      const harBlob = new Blob([input.harContent], { type: 'application/json' });
      const harFile = new File([harBlob], 'captured.har', { type: 'application/json' });
      
      // Upload to backend
      const uploadResult = await uploadHarFile(harFile);
      
      return {
        success: true,
        endpoints,
        uploadResult,
        message: `Extracted ${endpoints.length} API endpoints and uploaded HAR file`,
      };
    } catch (error) {
      return {
        success: false,
        endpoints: [],
        uploadResult: null,
        message: error instanceof Error ? error.message : 'Failed to process HAR file',
      };
    }
  });

export const startReversorAgent = baseProcedure
  .input(z.object({
    prompt: z.string().min(1, 'Prompt is required'),
    harFilePath: z.string(),
    model: z.string().optional(),
    inputVariables: z.record(z.any()).optional(),
    maxSteps: z.number().optional(),
    generateCode: z.boolean().optional(),
  }))
  .mutation(async ({ input }) => {
    try {
      const result = await startAgent({
        prompt: input.prompt,
        harFilePath: input.harFilePath,
        model: input.model,
        inputVariables: input.inputVariables,
        maxSteps: input.maxSteps,
        generateCode: input.generateCode,
      });
      
      return {
        success: true,
        jobId: result.job_id,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        jobId: null,
        message: error instanceof Error ? error.message : 'Failed to start reversor agent',
      };
    }
  });

export const getJobStatus = baseProcedure
  .input(z.object({
    jobId: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      const status = await checkJobStatus(input.jobId);
      
      return {
        success: true,
        status,
      };
    } catch (error) {
      return {
        success: false,
        status: null,
        message: error instanceof Error ? error.message : 'Failed to get job status',
      };
    }
  });

export const listAllJobs = baseProcedure
  .query(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/jobs`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const jobs = await response.json();
      
      return {
        success: true,
        jobs,
      };
    } catch (error) {
      return {
        success: false,
        jobs: null,
        message: error instanceof Error ? error.message : 'Failed to list jobs',
      };
    }
  });

// Legacy compatibility - redirect old procedures to new ones
export const parseHarFile = uploadAndParseHar;

export const generateMCP = baseProcedure
  .input(z.object({
    serverName: z.string().min(1, 'Server name is required'),
    endpoints: z.array(z.object({
      id: z.string(),
      method: z.string(),
      path: z.string(),
      status: z.number(),
    })),
  }))
  .mutation(async ({ input }) => {
    // This will be called after the agent completes processing
    // For now, return a basic MCP structure
    const serverCode = `// Generated MCP Server for ${input.serverName}
// This server was generated from ${input.endpoints.length} captured API endpoints

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: '${input.serverName}',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

// TODO: Implement tools for captured endpoints:
${input.endpoints.map(e => `// ${e.method} ${e.path} (${e.status})`).join('\n')}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
`;

    const files = {
      'server.ts': serverCode,
      'package.json': JSON.stringify({
        name: input.serverName,
        version: '1.0.0',
        description: 'Generated MCP server from captured HAR data',
        main: 'server.js',
        scripts: {
          start: 'node server.js',
          build: 'tsc',
        },
        dependencies: {
          '@modelcontextprotocol/sdk': '^1.0.0',
        },
      }, null, 2),
      'README.md': `# ${input.serverName}\n\nGenerated from ${input.endpoints.length} captured endpoints.`,
    };

    return {
      success: true,
      files,
      message: 'MCP server template generated',
    };
  });

export const runReverseEngineering = baseProcedure
  .mutation(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/reverse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to run reverse engineering');
      }

      const result = await response.json();
      
      return {
        success: result.success,
        message: result.message,
        harFileCreated: result.har_file_created,
        harFilePath: result.har_file_path,
        harFileSize: result.har_file_size,
        cookiesFileCreated: result.cookies_file_created,
        cookiesFilePath: result.cookies_file_path,
        stdout: result.stdout,
        stderr: result.stderr,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to run reverse engineering',
        harFileCreated: false,
        harFilePath: null,
        harFileSize: null,
        cookiesFileCreated: false,
        cookiesFilePath: null,
        stdout: null,
        stderr: null,
      };
    }
  });

export const getApiSpec = baseProcedure
  .input(z.object({
    endpoints: z.array(z.object({
      id: z.string(),
      method: z.string(),
      path: z.string(),
      status: z.number(),
    })),
  }))
  .query(async ({ input }) => {
    // Generate basic OpenAPI spec
    const spec = {
      openapi: '3.0.0',
      info: {
        title: 'Captured API',
        version: '1.0.0',
        description: 'API specification from captured HAR data',
      },
      paths: {} as Record<string, unknown>,
    };

    input.endpoints.forEach(endpoint => {
      const pathKey = endpoint.path.split('?')[0];
      const method = endpoint.method.toLowerCase();
      
      if (!spec.paths[pathKey]) {
        spec.paths[pathKey] = {};
      }
      
      (spec.paths[pathKey] as Record<string, unknown>)[method] = {
        summary: `${endpoint.method} ${pathKey}`,
        responses: {
          [endpoint.status]: {
            description: endpoint.status >= 200 && endpoint.status < 300 ? 'Success' : 'Error',
          },
        },
      };
    });

    return {
      success: true,
      spec,
    };
  });
