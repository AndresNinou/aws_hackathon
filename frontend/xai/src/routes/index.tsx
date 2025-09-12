import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";
import { ArrowRight, Upload, GitBranch, Package, Zap, Shield, Target } from 'lucide-react';

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 graph-canvas opacity-30"></div>
        
        {/* Hero Content */}
        <div className="relative px-gutter-mobile md:px-gutter-tablet lg:px-gutter-desktop py-16 lg:py-24">
          <div className="max-w-6xl mx-auto">
            {/* Main Hero */}
            <div className="text-center mb-16">
              {/* Brand Mark */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-brand rounded-card mb-8 shadow-accent-glow">
                <div className="text-ink-black font-bold text-h3">R</div>
                <div className="text-ink-black text-lg">‹</div>
              </div>
              
              <h1 className="text-h1 font-bold text-text-primary mb-6 tracking-tight">
                UI in. MCP out.
                <br />
                <span className="text-accent-brand">Reverse engineer APIs</span> with surgical precision.
              </h1>
              
              <p className="text-body text-text-secondary max-w-2xl mx-auto mb-8">
                Record user flows, upload HAR files, and automatically generate Model Context Protocol servers. 
                Extract the real API behind any UI with black-ops level precision.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/app">
                  <Button size="lg" className="group">
                    Generate MCP
                    <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform duration-micro" />
                  </Button>
                </Link>
                
                <Button variant="ghost" size="lg">
                  <Upload size={20} className="mr-2" />
                  Upload HAR
                </Button>
              </div>
            </div>
            
            {/* Process Flow - "Peel" Card Motif */}
            <div className="relative">
              <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
                {/* Step 1: HAR */}
                <Card hover className="relative p-8 w-full max-w-sm transform hover:-rotate-1 transition-transform duration-default">
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-accent-brand rounded-full animate-pulse"></div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-info/20 rounded-card flex items-center justify-center mb-4 mx-auto">
                      <Upload className="text-info" size={24} />
                    </div>
                    <h3 className="text-h3 font-semibold text-text-primary mb-2">Record Flow</h3>
                    <p className="text-small text-text-secondary">
                      Capture user interactions and network requests in real-time
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      <Badge variant="GET">GET</Badge>
                      <Badge variant="POST">POST</Badge>
                      <Badge variant="AUTH">AUTH</Badge>
                    </div>
                  </div>
                </Card>
                
                {/* Arrow */}
                <div className="hidden lg:block text-accent-brand animate-trace-backwards">
                  <ArrowRight size={32} />
                </div>
                
                {/* Step 2: Graph */}
                <Card hover className="relative p-8 w-full max-w-sm transform hover:rotate-1 transition-transform duration-default">
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-electric-teal rounded-full animate-pulse delay-300"></div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-success/20 rounded-card flex items-center justify-center mb-4 mx-auto">
                      <GitBranch className="text-success" size={24} />
                    </div>
                    <h3 className="text-h3 font-semibold text-text-primary mb-2">Flow Graph</h3>
                    <p className="text-small text-text-secondary">
                      Visualize API relationships and trace request dependencies
                    </p>
                    <div className="mt-4 h-8 bg-bg-surface rounded flex items-center justify-center">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-accent-brand rounded-full"></div>
                        <div className="w-4 h-px bg-steel"></div>
                        <div className="w-2 h-2 bg-info rounded-full"></div>
                        <div className="w-4 h-px bg-steel"></div>
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </Card>
                
                {/* Arrow */}
                <div className="hidden lg:block text-accent-brand animate-trace-backwards delay-150">
                  <ArrowRight size={32} />
                </div>
                
                {/* Step 3: MCP */}
                <Card hover className="relative p-8 w-full max-w-sm transform hover:-rotate-1 transition-transform duration-default">
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-warning rounded-full animate-pulse delay-500"></div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-warning/20 rounded-card flex items-center justify-center mb-4 mx-auto">
                      <Package className="text-warning" size={24} />
                    </div>
                    <h3 className="text-h3 font-semibold text-text-primary mb-2">MCP Server</h3>
                    <p className="text-small text-text-secondary">
                      Generate production-ready Model Context Protocol servers
                    </p>
                    <div className="mt-4">
                      <code className="text-code-sm font-mono text-accent-brand bg-bg-base px-2 py-1 rounded">
                        npm install @mcp/server
                      </code>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-16 px-gutter-mobile md:px-gutter-tablet lg:px-gutter-desktop">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-h2 font-bold text-text-primary mb-4">
              Black-ops level API reconnaissance
            </h2>
            <p className="text-body text-text-secondary max-w-2xl mx-auto">
              Extract signal from noise with surgical precision. Every request mapped, every dependency traced.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="w-10 h-10 bg-accent-brand/20 rounded-card flex items-center justify-center mb-4">
                <Target className="text-accent-brand" size={20} />
              </div>
              <h3 className="text-h3 font-semibold text-text-primary mb-2">Surgical Precision</h3>
              <p className="text-small text-text-secondary">
                Zero false positives. Extract only the API calls that matter for your workflow.
              </p>
            </Card>
            
            <Card className="p-6">
              <div className="w-10 h-10 bg-success/20 rounded-card flex items-center justify-center mb-4">
                <Zap className="text-success" size={20} />
              </div>
              <h3 className="text-h3 font-semibold text-text-primary mb-2">Swift Reveals</h3>
              <p className="text-small text-text-secondary">
                Trace backwards through request chains. Reveal dependencies in milliseconds.
              </p>
            </Card>
            
            <Card className="p-6">
              <div className="w-10 h-10 bg-info/20 rounded-card flex items-center justify-center mb-4">
                <Shield className="text-info" size={20} />
              </div>
              <h3 className="text-h3 font-semibold text-text-primary mb-2">Signal from Noise</h3>
              <p className="text-small text-text-secondary">
                Filter out static assets and focus on the business logic APIs that power the UI.
              </p>
            </Card>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="py-16 px-gutter-mobile md:px-gutter-tablet lg:px-gutter-desktop bg-bg-surface">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-h2 font-bold text-text-primary mb-4">
            Ready to reverse engineer your next API?
          </h2>
          <p className="text-body text-text-secondary mb-8">
            Upload a HAR file or record a new flow to get started.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/app">
              <Button size="lg">
                Start Recording
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </Link>
            
            <Button variant="secondary" size="lg">
              View Examples
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
