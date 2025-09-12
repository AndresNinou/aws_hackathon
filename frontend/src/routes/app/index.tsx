import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";
import { Input } from "~/components/ui/Input";
import { Modal } from "~/components/ui/Modal";
import { reversorToast } from "~/components/ui/Toast";
import { useTRPC } from "~/trpc/react";
import HarViewer from "~/components/ui/HarViewer";
import { 
  Upload, 
  Play, 
  Square, 
  Download, 
  Code, 
  Zap,
  Package
} from 'lucide-react';

type McpFromHarResponse = {
  success: boolean;
  final_message?: string;
  mcp_server_path?: string;
  run_command?: string;
  logs?: string[];
  error?: string | null;
};

export const Route = createFileRoute("/app/")({
  component: AppPage,
});

function AppPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'mcp' | 'har'>('har');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [endpoints, setEndpoints] = useState<Array<{
    id: string;
    method: string;
    path: string;
    status: number;
  }>>([]);
  const [harContent, setHarContent] = useState<string | null>(null);
  const [harFilePath, setHarFilePath] = useState<string | null>(null);
  const [mcpInfo, setMcpInfo] = useState<McpFromHarResponse | null>(null);

  function toBadgeVariant(method: string): 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'AUTH' | 'default' {
    const m = method.toUpperCase();
    if (m === 'GET' || m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE') return m;
    return 'default';
  }
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const trpc = useTRPC();
  const parseHarMutation = useMutation(trpc.parseHarFile.mutationOptions());
  const reverseMutation = useMutation(trpc.runReverseEngineering.mutationOptions());
  // Removed spec generation/query

  const handleReverse = async () => {
    setIsRecording(true);
    reversorToast.success("Starting browser automation to reverse engineer APIs...");
    
    try {
      type ReverseRunResult = {
        success: boolean;
        message?: string;
        harFileCreated?: boolean;
        harFilePath?: string | null;
        harFileSize?: number | null;
      };
      const result = await reverseMutation.mutateAsync() as ReverseRunResult;
      
      if (result.success) {
        reversorToast.success(result.message || "Reverse engineering completed!");
        
        if (result.harFileCreated && result.harFilePath) {
          reversorToast.info(`HAR file created: ${Math.round((result.harFileSize || 0) / 1024)} KB`);
          
          // Automatically load and process the generated HAR file
          try {
            // Get HAR file content from backend
            const harPath = String(result.harFilePath ?? "");
            setHarFilePath(harPath);
            const filename = (harPath.split('/').pop() || harPath);
            const harResponse = await fetch(`http://localhost:8000/files/har/${filename}`);
            
            if (!harResponse.ok) {
              throw new Error("Could not fetch HAR file from backend");
            }
            
            const harData: { har_content: string } = await harResponse.json();
            setHarContent(harData.har_content);
            const parseResult = await parseHarMutation.mutateAsync({ harContent: harData.har_content });
            
            if (parseResult.success) {
              setEndpoints(parseResult.endpoints);
              reversorToast.success(`🎉 HAR Analysis Complete! Found ${parseResult.endpoints.length} API endpoints.`);
              setActiveTab('har');
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
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      const res = e.target?.result;
      const harText = typeof res === 'string' ? res : res ? new TextDecoder().decode(res as ArrayBuffer) : "";
      
      try {
        setHarContent(harText);
        setHarFilePath('Uploaded HAR');
        const result = await parseHarMutation.mutateAsync({ harContent: harText });
        
        if (result.success) {
          // Try to extract the backend-saved HAR path from uploadResult
          const uploadRes: any = (result as any).uploadResult;
          const uploadedPath = uploadRes?.har_file_path || uploadRes?.har_path || uploadRes?.path || uploadRes?.file_path || null;
          if (uploadedPath) setHarFilePath(String(uploadedPath));
          setEndpoints(result.endpoints);
          setActiveTab('har');
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

  // Removed spec state handling

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
                onClick={() => void handleReverse()}
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
              onClick={() => handleUploadHAR()}
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
                  <Badge variant={toBadgeVariant(endpoint.method)}>
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
        </div>
        
        {/* Generate CTA */}
        <div className="p-6 border-t border-border-subtle">
          <Button 
            onClick={handleGenerateMCP}
            className="w-full"
            disabled={!harFilePath}
          >
            <Zap size={16} className="mr-2" />
            Generate MCP
          </Button>
        </div>
      </div>
      
      {/* Center Pane - Flow Graph or HAR Viewer */}
      <div className="flex-1 bg-bg-surface relative">
        {endpoints.length === 0 ? (
          // Show HAR Viewer directly without graph background and without transparency
          <div className="absolute inset-0 overflow-y-auto p-6">
            <HarViewer har={harContent ?? '{"log":{"entries":[]}}'} sourcePath={harFilePath ?? undefined} />
          </div>
        ) : (
          // Graph Visualization with Real Data
          <div className="absolute inset-0 graph-canvas">
            <div className="relative p-8 h-full">
              {/* Render nodes based on actual endpoints */}
              <div className="absolute top-20 left-20">
                <div className="flex flex-wrap items-center gap-8">
                  {endpoints.slice(0, 5).map((endpoint, index) => (
                    <div key={endpoint.id} className="relative">
                      <button
                        type="button"
                        tabIndex={0}
                        onClick={() => setSelectedNode(endpoint.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') setSelectedNode(endpoint.id);
                        }}
                        className={`w-20 h-12 bg-slate border-t-2 rounded-card flex items-center justify-center shadow-level-1 cursor-pointer transition-all duration-micro ${
                          selectedNode === endpoint.id ? 'ring-2 ring-accent-brand' : ''
                        } ${
                          endpoint.method === 'GET' ? 'border-t-info' :
                          endpoint.method === 'POST' ? 'border-t-accent-brand' :
                          endpoint.method === 'PUT' ? 'border-t-purple-500' :
                          endpoint.method === 'PATCH' ? 'border-t-warning' :
                          endpoint.method === 'DELETE' ? 'border-t-danger' :
                          'border-t-steel'
                        }`}
                      >
                        <Badge variant={toBadgeVariant(endpoint.method)} className="scale-75">
                          {endpoint.method}
                        </Badge>
                      </button>
                      <div className="absolute -bottom-6 left-0 text-code-sm text-text-muted truncate w-20">
                        {endpoint.path.split('/').pop() || 'api'}
                      </div>
                      {index < endpoints.length - 1 && index < 4 && (
                        <div className="absolute top-6 -right-8 w-16 h-px bg-steel"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {endpoints.length > 0 && (
                <div className="absolute top-32 left-20 w-64 h-px bg-gradient-to-r from-accent-brand to-transparent animate-trace-backwards"></div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Right Pane - HAR/MCP */}
      <div className="w-spec-min lg:w-spec-max bg-bg-surface border-l border-border-subtle flex flex-col">
        {/* Tabs */}
        <div className="border-b border-border-subtle">
          <div className="flex space-x-6 px-6 pt-6">
            {(['har', 'mcp'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                type="button"
                className={`pb-4 text-small font-medium border-b-2 transition-colors duration-micro ${
                  activeTab === tab
                    ? 'text-text-primary border-accent-brand'
                    : 'text-text-secondary border-transparent hover:text-text-primary hover:border-text-muted'
                }`}
              >
                {tab === 'har' && 'HAR Viewer'}
                {tab === 'mcp' && 'MCP Files'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'mcp' && (
            <div className="p-6">
              {mcpInfo ? (
                mcpInfo.success ? (
                  <div className="space-y-4">
                    <Card className="p-4">
                      <div className="text-small text-text-muted mb-1">MCP Server Path</div>
                      <div className="text-code-sm font-mono break-all text-text-primary">{mcpInfo.mcp_server_path}</div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-small text-text-muted">Run Command</div>
                        {mcpInfo.run_command && (
                          <Button size="sm" variant="ghost" onClick={() => { if (mcpInfo.run_command) { navigator.clipboard?.writeText(mcpInfo.run_command); reversorToast.success('Run command copied'); } }}>
                            Copy
                          </Button>
                        )}
                      </div>
                      <pre className="bg-bg-base p-3 rounded-card text-code-sm overflow-auto whitespace-pre-wrap">{mcpInfo.run_command}</pre>
                    </Card>
                    {mcpInfo.logs && mcpInfo.logs.length > 0 && (
                      <Card className="p-4">
                        <div className="text-small text-text-muted mb-2">Generation Logs</div>
                        <div className="bg-bg-base rounded-card p-2 text-code-sm max-h-60 overflow-auto space-y-1">
                          {mcpInfo.logs.map((l) => (
                            <div key={l} className="text-text-secondary">• {l}</div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-muted">
                    <Package size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-small">MCP generation failed{mcpInfo.error ? `: ${mcpInfo.error}` : ''}</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-text-muted">
                  <Package size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-small">No MCP generated yet</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'har' && (
            <div className="p-6">
              {harContent ? (
                <HarViewer har={harContent} sourcePath={harFilePath ?? undefined} />
              ) : (
                <div className="text-center py-8 text-text-muted">
                  <Code size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-small">No HAR loaded yet. Use "Reverse" or "Upload HAR" to load data.</p>
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
        harFilePath={harFilePath}
        onGenerated={(res) => {
          setMcpInfo(res);
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
  harFilePath,
  onGenerated
}: { 
  isOpen: boolean; 
  onClose: () => void;
  harFilePath: string | null;
  onGenerated: (res: McpFromHarResponse) => void;
}) {
  const [step, setStep] = useState<'config' | 'generating' | 'success' | 'error'>('config');
  const [serverName, setServerName] = useState('test');
  const [port, setPort] = useState<number>(8111);
  const [outputDir, setOutputDir] = useState('mcp');
  const [logs, setLogs] = useState<string[]>([]);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    setStep('generating');
    setLogs(['Analyzing HAR...', 'Reverse engineering...', 'Creating FastMCP server...', 'Testing server...']);
    setErrMsg(null);
    try {
      if (!harFilePath) throw new Error('No HAR file path available');
      const body = {
        har_paths: [harFilePath],
        server_name: serverName || 'test',
        port,
        output_dir: outputDir || 'mcp',
      };
      const res = await fetch('http://localhost:8000/api/v1/claude/mcp/from-har', {
        method: 'POST',
        headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as unknown as McpFromHarResponse;
      if (Array.isArray(data.logs) && data.logs.length) setLogs((prev) => [...prev, ...data.logs]);
      if (data.success) {
        setStep('success');
        onGenerated(data);
        reversorToast.success('MCP generated. UI in. MCP out.');
      } else {
        setErrMsg(data.error || 'Unknown error');
        setStep('error');
      }
    } catch (error) {
      setErrMsg(error instanceof Error ? error.message : String(error));
      setStep('error');
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
            <div className="text-small text-text-muted mb-1">HAR Path</div>
            <div className="text-code-sm text-text-secondary break-all bg-bg-base rounded-card p-2">
              {harFilePath || 'No HAR file available. Run Reverse or Upload HAR first.'}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              label="Server Name"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="my-api-server"
              helperText="This will be used as the package name"
            />
            <Input
              label="Port"
              type="number"
              value={String(port)}
              onChange={(e) => setPort(Number(e.target.value) || 0)}
              placeholder="8111"
              helperText="HTTP transport port"
            />
            <Input
              label="Output Directory"
              value={outputDir}
              onChange={(e) => setOutputDir(e.target.value)}
              placeholder="mcp"
              helperText="Target directory for generated server"
            />
          </div>
          
          <div className="flex space-x-3">
            <Button 
              onClick={() => void handleGenerate()} 
              disabled={!serverName || !harFilePath}
            >
              <Zap size={16} className="mr-2" />
              Generate MCP
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
            The agent is analyzing reverse-engineering traces, creating the MCP server, and testing it. This may take up to a minute.
          </p>
          <div className="flex items-center justify-center space-x-1 mb-4">
            <div className="w-2 h-2 bg-accent-brand rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-accent-brand rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-accent-brand rounded-full animate-pulse delay-150"></div>
          </div>
          <div className="max-w-xl mx-auto text-left space-y-2">
            {logs.map((l) => (
              <div key={l} className="text-code-sm text-text-secondary">• {l}</div>
            ))}
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
            Your server is ready. Check the MCP tab for server path and run command.
          </p>
          <div className="flex space-x-3 justify-center">
            <Button onClick={() => handleClose()}>
              <Download size={16} className="mr-2" />
              Close
            </Button>
          </div>
        </div>
      )}

      {step === 'error' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-danger/20 rounded-card flex items-center justify-center mx-auto mb-4">
            <Zap size={24} className="text-danger" />
          </div>
          <h3 className="text-h3 font-semibold text-text-primary mb-2">MCP Generation Failed</h3>
          <p className="text-small text-text-secondary mb-4">{errMsg || 'Unknown error'}</p>
          <div className="flex space-x-3 justify-center">
            <Button onClick={() => setStep('config')}>Back</Button>
            <Button variant="ghost" onClick={handleClose}>Close</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
