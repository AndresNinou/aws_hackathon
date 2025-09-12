import {
  createCallerFactory,
  createTRPCRouter,
} from "~/server/trpc/main";
import { 
  uploadAndParseHar,
  startReversorAgent,
  getJobStatus,
  listAllJobs,
  runReverseEngineering,
  parseHarFile,
  generateMCP,
  getApiSpec 
} from "~/server/trpc/procedures/reversor";

export const appRouter = createTRPCRouter({
  // Reversor agent integration
  uploadAndParseHar,
  startReversorAgent,
  getJobStatus,
  listAllJobs,
  runReverseEngineering,
  
  // Legacy compatibility
  parseHarFile,
  generateMCP,
  getApiSpec,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
