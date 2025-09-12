import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";
import { Input } from "~/components/ui/Input";
import { Modal } from "~/components/ui/Modal";
import { reversorToast } from "~/components/ui/Toast";
import { useTRPC } from "~/trpc/react";
import { 
  Upload, 
  Play, 
  Square, 
  Download, 
  Settings, 
  FileText, 
  Code, 
  Zap,
  Key,
  Circle,
  Diamond,
  ArrowRight,
  Folder,
  File,
  Package,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

export const Route = createFileRoute("/app/reversor")({
  component: ReversorPage,
});

type JobStatus = 'running' | 'completed' | 'failed';

interface AgentJob {
  job_id: string;
  status: JobStatus;
  progress?: string;
  result?: any;
  error?: string;
  created_at: string;
  updated_at: string;
}

function ReversorPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'spec' | 'mcp' | 'jobs'>('spec');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [endpoints, setEndpoints] = useState<Array<{
    id: string;
    method: string;
    path: string;
    status: number;
  }>>([]);
  const [currentJob, setCurrentJob] = useState<AgentJob | null>(null);
  const [harFilePath, setHarFilePath] = useState<string>('');
  const [apiSpec, setApiSpec] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const trpc = useTRPC();
  
  // tRPC mutations and queries
  const uploadHarMutation = useMutation(trpc.uploadAndParseHar.mutationOptions());
  const startAgentMutation = useMutation(trpc.startReversorAgent.mutationOptions());
  const reverseMutation = useMutation(trpc.runReverseEngineering.mutationOptions());
  
  // Job status polling
  const jobStatusQuery = useQuery(
    trpc.getJobStatus.queryOptions(
      { jobId: currentJob?.job_id || '' },
      { 
        enabled: !!currentJob?.job_id && currentJob.status === 'running',
        refetchInterval: 2000, // Poll every 2 seconds
      }
    )
  );

  const allJobsQuery = useQuery(
    trpc.listAllJobs.queryOptions(undefined, {
      refetchInterval: 5000, // Refresh jobs list every 5 seconds
    })
  );

  const getApiSpecQuery = useQuery(
    trpc.getApiSpec.queryOptions(
      { endpoints },
      { enabled: endpoints.length > 0 }
    )
  );

  // Update job status when query returns
  useEffect(() => {
    if (jobStatusQuery.data?.success && jobStatusQuery.data.status) {
      const updatedJob = jobStatusQuery.data.status;
      setCurrentJob(updatedJob);
      
      // Show completion notification
      if (updatedJob.status === 'completed' && currentJob?.status === 'running') {
        reversorToast.success("Agent completed! MCP server generated successfully.");
      } else if (updatedJob.status === 'failed' && currentJob?.status === 'running') {
        reversorToast.error("Agent failed", updatedJob.error);
      }
    }
  }, [jobStatusQuery.data, currentJob?.status]);

  // Update apiSpec when query data changes
  useEffect(() => {
    if (getApiSpecQuery.data?.success) {
      setApiSpec(getApiSpecQuery.data.spec);
    }
  }, [getApiSpecQuery.data]);

  const handleReverse = async () => {
    setIsRecording(true);
    reversorToast.success("Starting browser automation to reverse engineer APIs...");
    
    try {
      const result = await reverseMutation.mutateAsync();
      
      if (result.success) {
        reversorToast.success(result.message || "Reverse engineering completed!");
        
        if (result.harFileCreated && result.harFilePath) {
          setHarFilePath(result.harFilePath);
          reversorToast.info(`HAR file created: ${Math.round((result.harFileSize || 0) / 1024)} KB`);
        }
        
        // If HAR file was created, automatically parse it
        if (result.harFilePath) {
          // You could automatically load and parse the HAR file here
          reversorToast.info("HAR file ready for processing. Upload it to continue.");
        }
      } else {
        reversorToast.error(result.message || "Reverse engineering failed");
      }
    } catch (error) {
      reversorToast.error("Failed to run reverse engineering", error instanceof Error ? error.message : undefined);
    } finally {
      setIsRecording(false);
    }
  };

  const handleStartAgent = () => {
    if (!harFilePath) {
      reversorToast.error("Please upload a HAR file first");
      return;
    }
    setShowAgentModal(true);
  };

  const handleUploadHAR = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const harContent = e.target?.result as string;
      
      try {
        const result = await uploadHarMutation.mutateAsync({ harContent });
        
        if (result.success) {
          setEndpoints(result.endpoints);
          setHarFilePath(result.uploadResult?.path || '');
          reversorToast.success(result.message);
        } else {
          reversorToast.error("Couldn't parse this HAR file", result.message);
        }
      } catch (error) {
        reversorToast.error("Failed to process HAR file", error instanceof Error ? error.message : undefined);
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="h-screen bg-bg-base flex">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".har"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {/* Left Pane - Capture */}
      <div className="w-capture-min lg:w-capture-max bg-bg-surface border-r border-border-subtle flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border-subtle">
          <h2 className="text-h3 font-semibold text-text-primary mb-4">Capture & Process</h2>
          
          {/* Recording Controls */}
          <div className="space-y-3">
            {!isRecording ? (
              <Button 
                onClick={handleReverse}
                disabled={reverseMutation.isPending}
                className="bg-accent-brand hover:bg-accent-brand-hover text-white"
                size="sm"
              >
                <Play size={16} className="mr-2" />
                Reverse
              </Button>
            ) : (
              <Button 
                disabled={true}
                className="bg-semantic-error-solid hover:bg-semantic-error-solid-hover text-white opacity-50 cursor-not-allowed"
                size="sm"
              >
                <Square size={16} className="mr-2" />
                Running...
              </Button>
            )}
            
            <Button 
              onClick={handleUploadHAR}
              variant="secondary"
              className="w-full"
              size="sm"
              disabled={uploadHarMutation.isPending}
            >
              <Upload size={16} className="mr-2" />
              {uploadHarMutation.isPending ? 'Processing...' : 'Upload HAR'}
            </Button>
          </div>
        </div>
        
        {/* HAR Status */}
        {harFilePath && (
          <div className="p-6 border-b border-border-subtle">
            <div className="flex items-center space-x-2 text-success">
              <CheckCircle size={16} />
              <span className="text-small">HAR file uploaded</span>
            </div>
            <p className="text-code-sm text-text-muted mt-1 truncate">
              {harFilePath.split('/').pop()}
            </p>
          </div>
        )}
        
        {/* Current Job Status */}
        {currentJob && (
          <div className="p-6 border-b border-border-subtle">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-small font-medium text-text-primary">Agent Status</h3>
              <div className="flex items-center space-x-2">
                {currentJob.status === 'running' && (
                  <>
                    <Clock size={14} className="text-info animate-spin" />
                    <span className="text-small text-info">Running</span>
                  </>
                )}
                {currentJob.status === 'completed' && (
                  <>
                    <CheckCircle size={14} className="text-success" />
                    <span className="text-small text-success">Completed</span>
                  </>
                )}
                {currentJob.status === 'failed' && (
                  <>
                    <AlertCircle size={14} className="text-danger" />
                    <span className="text-small text-danger">Failed</span>
                  </>
                )}
              </div>
            </div>
            
            {currentJob.progress && (
              <p className="text-code-sm text-text-secondary">
                {currentJob.progress}
              </p>
            )}
            
            {currentJob.error && (
              <p className="text-code-sm text-danger mt-2">
                Error: {currentJob.error}
              </p>
            )}
          </div>
        )}
        
        {/* Captured Endpoints */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h3 className="text-small font-medium text-text-primary mb-4">
            Captured Endpoints ({endpoints.length})
          </h3>
          
          <div className="space-y-2">
            {endpoints.map((endpoint) => (
              <Card 
                key={endpoint.id}
                hover
                className={`p-3 cursor-pointer transition-colors duration-micro ${
                  selectedNode === endpoint.id ? 'ring-1 ring-accent-brand' : ''
                }`}
                onClick={() => setSelectedNode(endpoint.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={endpoint.method as any}>
                    {endpoint.method}
                  </Badge>
                  <span className={`text-code-sm font-mono ${
                    endpoint.status >= 200 && endpoint.status < 300 
                      ? 'text-success' 
                      : endpoint.status >= 400 
                        ? 'text-danger' 
                        : 'text-warning'
                  }`}>
                    {endpoint.status}
                  </span>
                </div>
                <p className="text-code-sm font-mono text-text-secondary truncate">
                  {endpoint.path}
                </p>
              </Card>
            ))}
          </div>
          
          {endpoints.length === 0 && (
            <div className="text-center py-8 text-text-muted">
              <Circle size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-small">No endpoints captured yet</p>
            </div>
          )}
        </div>
        
        {/* Start Agent CTA */}
        <div className="p-6 border-t border-border-subtle">
          <Button 
            onClick={handleStartAgent}
            className="w-full"
            disabled={!harFilePath || currentJob?.status === 'running'}
          >
            <Zap size={16} className="mr-2" />
            {currentJob?.status === 'running' ? 'Agent Running...' : 'Start Reversor Agent'}
          </Button>
        </div>
      </div>
      
      {/* Center Pane - Flow Graph */}
      <div className="flex-1 bg-bg-surface relative">
        {/* Graph Canvas */}
        <div className="absolute inset-0 graph-canvas">
          {endpoints.length === 0 ? (
            // Empty State
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-bg-elevated rounded-card flex items-center justify-center mx-auto mb-4 shadow-level-1">
                  <ArrowRight size={24} className="text-text-muted" />
                </div>
                <h3 className="text-h3 font-medium text-text-primary mb-2">
                  Upload a HAR file to reverse engineer APIs
                </h3>
                <p className="text-small text-text-muted">
                  Start by uploading an existing HAR file to visualize API relationships and generate MCP servers.
                </p>
              </div>
            </div>
          ) : (
            // Graph Visualization with Real Data
            <div className="relative p-8 h-full">
              {/* Render nodes based on actual endpoints */}
              <div className="absolute top-20 left-20">
                <div className="flex flex-wrap items-center gap-8">
                  {endpoints.slice(0, 5).map((endpoint, index) => (
                    <div key={endpoint.id} className="relative">
                      <div className={`w-20 h-12 bg-slate border-t-2 rounded-card flex items-center justify-center shadow-level-1 cursor-pointer transition-all duration-micro ${
                        selectedNode === endpoint.id ? 'ring-2 ring-accent-brand' : ''
                      } ${
                        endpoint.method === 'GET' ? 'border-t-info' :
                        endpoint.method === 'POST' ? 'border-t-accent-brand' :
                        endpoint.method === 'PUT' ? 'border-t-purple-500' :
                        endpoint.method === 'PATCH' ? 'border-t-warning' :
                        endpoint.method === 'DELETE' ? 'border-t-danger' :
                        'border-t-steel'
                      }`} onClick={() => setSelectedNode(endpoint.id)}>
                        <Badge variant={endpoint.method as any} className="scale-75">
                          {endpoint.method}
                        </Badge>
                      </div>
                      <div className="absolute -bottom-6 left-0 text-code-sm text-text-muted truncate w-20">
                        {endpoint.path.split('/').pop() || 'api'}
                      </div>
                      
                      {/* Connection lines */}
                      {index < endpoints.length - 1 && index < 4 && (
                        <div className="absolute top-6 -right-8 w-16 h-px bg-steel"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Active Path Indicator */}
              {endpoints.length > 0 && (
                <div className="absolute top-32 left-20 w-64 h-px bg-gradient-to-r from-accent-brand to-transparent animate-trace-backwards"></div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Right Pane - Results */}
      <div className="w-spec-min lg:w-spec-max bg-bg-surface border-l border-border-subtle flex flex-col">
        {/* Tabs */}
        <div className="border-b border-border-subtle">
          <div className="flex space-x-6 px-6 pt-6">
            {(['spec', 'mcp', 'jobs'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-small font-medium border-b-2 transition-colors duration-micro ${
                  activeTab === tab
                    ? 'text-text-primary border-accent-brand'
                    : 'text-text-secondary border-transparent hover:text-text-primary hover:border-text-muted'
                }`}
              >
                {tab === 'spec' && 'API Spec'}
                {tab === 'mcp' && 'Generated MCP'}
                {tab === 'jobs' && 'Agent Jobs'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'spec' && (
            <div className="p-6">
              {apiSpec ? (
                <div className="code-block">
                  <pre className="text-code text-text-secondary whitespace-pre-wrap">
                    {JSON.stringify(apiSpec, null, 2)}
                  </pre>
                </div>
              ) : endpoints.length > 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="skeleton w-full h-64 rounded-card"></div>
                </div>
              ) : (
                <div className="text-center py-8 text-text-muted">
                  <Code size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-small">No API spec available</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'mcp' && (
            <div className="p-6">
              {currentJob?.result ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-success mb-4">
                    <CheckCircle size={16} />
                    <span className="text-small font-medium">MCP Server Generated</span>
                  </div>
                  
                  {currentJob.result.generated_code && (
                    <div className="code-block">
                      <h4 className="text-small font-medium text-text-primary mb-2">Generated Code</h4>
                      <pre className="text-code text-text-secondary whitespace-pre-wrap bg-bg-base p-4 rounded-card">
                        {currentJob.result.generated_code}
                      </pre>
                    </div>
                  )}
                  
                  {currentJob.result.dag && (
                    <div>
                      <h4 className="text-small font-medium text-text-primary mb-2">Dependency Graph</h4>
                      <div className="bg-bg-base p-4 rounded-card">
                        <p className="text-small text-text-secondary">
                          Nodes: {currentJob.result.dag.node_count}, Edges: {currentJob.result.dag.edge_count}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <Button variant="secondary" size="sm" className="w-full">
                    <Download size={16} className="mr-2" />
                    Download MCP Server
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-text-muted">
                  <Package size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-small">No MCP server generated yet</p>
                  <p className="text-small mt-2">Upload a HAR file and start the agent to generate an MCP server</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'jobs' && (
            <div className="p-6">
              {allJobsQuery.data?.success ? (
                <div className="space-y-3">
                  {allJobsQuery.data.jobs.jobs?.map((job: AgentJob) => (
                    <Card key={job.job_id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-code-sm font-mono text-text-secondary">
                          {job.job_id.slice(0, 8)}...
                        </span>
                        <div className="flex items-center space-x-2">
                          {job.status === 'running' && (
                            <>
                              <Clock size={14} className="text-info animate-spin" />
                              <span className="text-small text-info">Running</span>
                            </>
                          )}
                          {job.status === 'completed' && (
                            <>
                              <CheckCircle size={14} className="text-success" />
                              <span className="text-small text-success">Completed</span>
                            </>
                          )}
                          {job.status === 'failed' && (
                            <>
                              <AlertCircle size={14} className="text-danger" />
                              <span className="text-small text-danger">Failed</span>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-small text-text-secondary">
                        {new Date(job.created_at).toLocaleString()}
                      </p>
                      {job.progress && (
                        <p className="text-code-sm text-text-muted mt-1">
                          {job.progress}
                        </p>
                      )}
                    </Card>
                  )) || <p className="text-center text-text-muted">No jobs found</p>}
                </div>
              ) : (
                <div className="text-center py-8 text-text-muted">
                  <FileText size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-small">Loading jobs...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Start Agent Modal */}
      <StartAgentModal 
        isOpen={showAgentModal}
        onClose={() => setShowAgentModal(false)}
        harFilePath={harFilePath}
        onAgentStarted={(job) => {
          setCurrentJob(job);
          setActiveTab('jobs');
        }}
      />
    </div>
  );
}

// Start Agent Modal Component
function StartAgentModal({ 
  isOpen, 
  onClose, 
  harFilePath,
  onAgentStarted
}: { 
  isOpen: boolean; 
  onClose: () => void;
  harFilePath: string;
  onAgentStarted: (job: AgentJob) => void;
}) {
  const [prompt, setPrompt] = useState('Generate an MCP server for user authentication and profile management');
  const [model, setModel] = useState('gpt-4o-mini');
  
  const trpc = useTRPC();
  const startAgentMutation = useMutation(trpc.startReversorAgent.mutationOptions());

  const handleStartAgent = async () => {
    if (!prompt.trim()) {
      reversorToast.error("Please enter a prompt describing what you want the agent to do");
      return;
    }

    try {
      const result = await startAgentMutation.mutateAsync({
        prompt: prompt.trim(),
        harFilePath,
        model,
        generateCode: true,
      });
      
      if (result.success) {
        const job: AgentJob = {
          job_id: result.jobId!,
          status: 'running',
          progress: 'Starting agent...',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        onAgentStarted(job);
        reversorToast.success("Agent started successfully!");
        onClose();
      } else {
        reversorToast.error("Failed to start agent", result.message);
      }
    } catch (error) {
      reversorToast.error("Failed to start agent", error instanceof Error ? error.message : undefined);
    }
  };

  const handleClose = () => {
    setPrompt('Generate an MCP server for user authentication and profile management');
    setModel('gpt-4o-mini');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Start Reversor Agent" size="lg">
      <div className="space-y-6">
        <div>
          <Input
            label="Agent Prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want the agent to analyze and generate..."
            helperText="Be specific about what functionality you want the MCP server to provide"
            rows={3}
          />
        </div>
        
        <div>
          <label className="block text-small font-medium text-text-primary mb-2">
            Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-3 py-2 bg-bg-base border border-border-subtle rounded-card text-text-primary"
          >
            <option value="gpt-4o-mini">GPT-4o Mini (Fast)</option>
            <option value="gpt-4o">GPT-4o (Powerful)</option>
            <option value="gpt-4">GPT-4 (Legacy)</option>
          </select>
        </div>
        
        <div className="bg-bg-elevated p-4 rounded-card">
          <h4 className="text-small font-medium text-text-primary mb-2">What the agent will do:</h4>
          <ul className="text-small text-text-secondary space-y-1">
            <li>• Analyze the uploaded HAR file</li>
            <li>• Identify API endpoints and dependencies</li>
            <li>• Reverse engineer the API structure</li>
            <li>• Generate a complete MCP server with tools</li>
            <li>• Create documentation and examples</li>
          </ul>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            onClick={handleStartAgent} 
            disabled={!prompt.trim() || startAgentMutation.isPending}
          >
            <Zap size={16} className="mr-2" />
            {startAgentMutation.isPending ? 'Starting...' : 'Start Agent'}
          </Button>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
