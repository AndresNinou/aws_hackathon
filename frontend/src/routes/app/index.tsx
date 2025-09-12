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
  Package
} from 'lucide-react';

export const Route = createFileRoute("/app/")({
  component: AppPage,
});

function AppPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'spec' | 'mcp' | 'examples'>('spec');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [endpoints, setEndpoints] = useState<Array<{
    id: string;
    method: string;
    path: string;
    status: number;
  }>>([]);
  const [generatedFiles, setGeneratedFiles] = useState<Record<string, string>>({});
  const [apiSpec, setApiSpec] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const trpc = useTRPC();
  const parseHarMutation = useMutation(trpc.parseHarFile.mutationOptions());
  const generateMCPMutation = useMutation(trpc.generateMCP.mutationOptions());
  const reverseMutation = useMutation(trpc.runReverseEngineering.mutationOptions());
  const getApiSpecQuery = useQuery(trpc.getApiSpec.queryOptions(
    { endpoints },
    { enabled: endpoints.length > 0 }
  ));

  const handleReverse = async () => {
    setIsRecording(true);
    reversorToast.success("Starting browser automation to reverse engineer APIs...");
    
    try {
      const result = await reverseMutation.mutateAsync();
      
      if (result.success) {
        reversorToast.success(result.message || "Reverse engineering completed!");
        
        if (result.harFileCreated && result.harFilePath) {
          reversorToast.info(`HAR file created: ${Math.round((result.harFileSize || 0) / 1024)} KB`);
          
          // Automatically load and process the generated HAR file
          try {
            // Get HAR file content from backend
            const filename = result.harFilePath.split('/').pop();
            const harResponse = await fetch(`http://localhost:8000/files/har/${filename}`);
            
            if (!harResponse.ok) {
              throw new Error("Could not fetch HAR file from backend");
            }
            
            const harData = await harResponse.json();
            const parseResult = await parseHarMutation.mutateAsync({ harContent: harData.har_content });
            
            if (parseResult.success) {
              setEndpoints(parseResult.endpoints);
              reversorToast.success(`🎉 HAR Analysis Complete! Found ${parseResult.endpoints.length} API endpoints.`);
            } else {
              reversorToast.warning("HAR file created but could not extract endpoints. Upload manually to analyze.");
            }
          } catch (_parseError) {
            reversorToast.info("HAR file created successfully! Upload it manually to analyze the captured APIs.");
          }
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

  const handleGenerateMCP = () => {
    setShowGenerateModal(true);
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
        const result = await parseHarMutation.mutateAsync({ harContent });
        
        if (result.success) {
          setEndpoints(result.endpoints);
          reversorToast.success(result.message);
        } else {
          reversorToast.error("Couldn't parse this HAR. Check domain whitelist or try again.", result.message);
        }
      } catch (error) {
        reversorToast.error("Failed to process HAR file", error instanceof Error ? error.message : undefined);
      }
    };
    
    reader.readAsText(file);
  };

  // Update apiSpec when query data changes
  useEffect(() => {
    if (getApiSpecQuery.data?.success) {
      setApiSpec(getApiSpecQuery.data.spec);
    }
  }, [getApiSpecQuery.data]);

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
          <h2 className="text-h3 font-semibold text-text-primary mb-4">Capture</h2>
          
          {/* Recording Controls */}
          <div className="space-y-3">
            {!isRecording ? (
              <Button 
                onClick={handleReverse}
                disabled={reverseMutation.isPending}
                className="w-full"
                size="sm"
              >
                <Play size={16} className="mr-2" />
                Reverse
              </Button>
            ) : (
              <Button 
                disabled={true}
                className="w-full opacity-50 cursor-not-allowed"
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
              disabled={parseHarMutation.isPending}
            >
              <Upload size={16} className="mr-2" />
              {parseHarMutation.isPending ? 'Processing...' : 'Upload HAR'}
            </Button>
          </div>
        </div>
        
        {/* Domain Filter */}
        <div className="p-6 border-b border-border-subtle">
          <Input 
            label="Domain Filter"
            placeholder="api.example.com"
            helperText="Only capture requests from this domain"
          />
        </div>
        
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
        
        {/* Generate CTA */}
        <div className="p-6 border-t border-border-subtle">
          <Button 
            onClick={handleGenerateMCP}
            className="w-full"
            disabled={endpoints.length === 0}
          >
            <Zap size={16} className="mr-2" />
            Generate MCP
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
                  Record or upload a HAR to see the real API behind the UI.
                </h3>
                <p className="text-small text-text-muted">
                  Start by recording a flow or uploading an existing HAR file to visualize API relationships.
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
      
      {/* Right Pane - Spec/MCP/Examples */}
      <div className="w-spec-min lg:w-spec-max bg-bg-surface border-l border-border-subtle flex flex-col">
        {/* Tabs */}
        <div className="border-b border-border-subtle">
          <div className="flex space-x-6 px-6 pt-6">
            {(['spec', 'mcp', 'examples'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-small font-medium border-b-2 transition-colors duration-micro ${
                  activeTab === tab
                    ? 'text-text-primary border-accent-brand'
                    : 'text-text-secondary border-transparent hover:text-text-primary hover:border-text-muted'
                }`}
              >
                {tab === 'spec' && 'Spec JSON'}
                {tab === 'mcp' && 'MCP Files'}
                {tab === 'examples' && 'Examples'}
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
              {Object.keys(generatedFiles).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(generatedFiles).map(([filename, content]) => (
                    <div
                      key={filename}
                      className="flex items-center space-x-3 p-3 rounded-card hover:bg-bg-elevated transition-colors duration-micro cursor-pointer"
                    >
                      {filename.endsWith('.ts') && <FileText size={16} className="text-info" />}
                      {filename.endsWith('.json') && <Code size={16} className="text-warning" />}
                      {filename.endsWith('.md') && <File size={16} className="text-text-muted" />}
                      
                      <span className="text-small text-text-primary">{filename}</span>
                      
                      {filename === 'server.ts' && (
                        <div className="ml-auto">
                          <div className="w-2 h-2 bg-accent-brand rounded-full"></div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div className="mt-6 pt-6 border-t border-border-subtle">
                    <Button variant="secondary" size="sm" className="w-full">
                      <Download size={16} className="mr-2" />
                      Download Server
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-text-muted">
                  <Package size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-small">No MCP files generated yet</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'examples' && (
            <div className="p-6">
              {endpoints.length > 0 ? (
                <div className="space-y-4">
                  {endpoints.slice(0, 3).map((endpoint) => (
                    <Card key={endpoint.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant={endpoint.method as any}>{endpoint.method}</Badge>
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
                      <p className="text-code-sm font-mono text-text-secondary mb-2">{endpoint.path}</p>
                      <div className="text-code-sm">
                        <div className="text-text-muted mb-1">Response:</div>
                        <div className="bg-bg-base p-2 rounded text-accent-brand">
                          {endpoint.method === 'GET' 
                            ? '{"data": "example response"}' 
                            : '{"success": true, "id": "123"}'}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-text-muted">
                  <FileText size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-small">No examples available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Generate MCP Modal */}
      <GenerateMCPModal 
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        endpoints={endpoints}
        onGenerated={(files) => {
          setGeneratedFiles(files);
          setActiveTab('mcp');
        }}
      />
    </div>
  );
}

// Generate MCP Modal Component with real backend integration
function GenerateMCPModal({ 
  isOpen, 
  onClose, 
  endpoints,
  onGenerated
}: { 
  isOpen: boolean; 
  onClose: () => void;
  endpoints: Array<{ id: string; method: string; path: string; status: number; }>;
  onGenerated: (files: Record<string, string>) => void;
}) {
  const [step, setStep] = useState<'config' | 'generating' | 'success'>('config');
  const [serverName, setServerName] = useState('');
  
  const trpc = useTRPC();
  const generateMCPMutation = useMutation(trpc.generateMCP.mutationOptions());

  const handleGenerate = async () => {
    setStep('generating');
    
    try {
      const result = await generateMCPMutation.mutateAsync({
        serverName,
        endpoints,
      });
      
      if (result.success) {
        onGenerated(result.files);
        setStep('success');
        
        setTimeout(() => {
          reversorToast.success("MCP generated. UI in. MCP out.");
        }, 500);
      } else {
        reversorToast.error("Failed to generate MCP server", result.message);
        setStep('config');
      }
    } catch (error) {
      reversorToast.error("Failed to generate MCP server", error instanceof Error ? error.message : undefined);
      setStep('config');
    }
  };

  const handleClose = () => {
    setStep('config');
    setServerName('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generate MCP Server" size="lg">
      {step === 'config' && (
        <div className="space-y-6">
          <div>
            <Input
              label="Server Name"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="my-api-server"
              helperText="This will be used as the package name"
            />
          </div>
          
          <div className="flex space-x-3">
            <Button 
              onClick={handleGenerate} 
              disabled={!serverName || generateMCPMutation.isPending}
            >
              <Zap size={16} className="mr-2" />
              {generateMCPMutation.isPending ? 'Generating...' : 'Generate MCP'}
            </Button>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      {step === 'generating' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-accent-brand/20 rounded-card flex items-center justify-center mx-auto mb-4">
            <Zap size={24} className="text-accent-brand animate-pulse" />
          </div>
          <h3 className="text-h3 font-semibold text-text-primary mb-2">
            Generating MCP Server...
          </h3>
          <p className="text-small text-text-secondary mb-4">
            Analyzing captured requests and generating server code
          </p>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-accent-brand rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-accent-brand rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-accent-brand rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
      )}
      
      {step === 'success' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-success/20 rounded-card flex items-center justify-center mx-auto mb-4">
            <Zap size={24} className="text-success" />
          </div>
          <h3 className="text-h3 font-semibold text-text-primary mb-2">
            MCP Server Generated!
          </h3>
          <p className="text-small text-text-secondary mb-6">
            Your server is ready. Check the MCP Files tab to download.
          </p>
          <div className="flex space-x-3 justify-center">
            <Button onClick={handleClose}>
              <Download size={16} className="mr-2" />
              Download Server
            </Button>
            <Button variant="ghost" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
