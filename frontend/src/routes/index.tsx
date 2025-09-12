import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";
import {
  ArrowRight,
  Upload,
  GitBranch,
  Package,
  Zap,
  Shield,
  Target,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="graph-canvas absolute inset-0 opacity-30"></div>

        {/* Hero Content */}
        <div className="relative px-gutter-mobile py-16 md:px-gutter-tablet lg:px-gutter-desktop lg:py-24">
          <div className="mx-auto max-w-6xl">
            {/* Main Hero */}
            <div className="mb-16 text-center">
              {/* Brand Mark */}
              <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-card bg-accent-brand shadow-accent-glow">
                <div className="text-h3 font-bold text-ink-black">R</div>
                <div className="text-lg text-ink-black">‹</div>
              </div>

              <h1 className="mb-6 text-h1 font-bold tracking-tight text-text-primary">
                <br />
                <span className="text-accent-brand">
                  Reverse engineer APIs
                </span>{" "}
                with surgical precision.
              </h1>

              <p className="mx-auto mb-8 max-w-2xl text-body text-text-secondary">
                Record user flows, upload HAR files, and automatically generate
                Model Context Protocol servers. Extract the real API behind any
                UI with black-ops level precision.
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link to="/app">
                  <Button size="lg" className="group">
                    Generate MCP
                    <ArrowRight
                      size={20}
                      className="ml-2 transition-transform duration-micro group-hover:translate-x-1"
                    />
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
              <div className="flex flex-col items-center justify-center gap-8 lg:flex-row lg:gap-12">
                {/* Step 1: HAR */}
                <Card
                  hover
                  className="relative w-full max-w-sm transform p-8 transition-transform duration-default hover:-rotate-1"
                >
                  <div className="absolute -right-2 -top-2 h-4 w-4 animate-pulse rounded-full bg-accent-brand"></div>
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-card bg-info/20">
                      <Upload className="text-info" size={24} />
                    </div>
                    <h3 className="mb-2 text-h3 font-semibold text-text-primary">
                      Record Flow
                    </h3>
                    <p className="text-small text-text-secondary">
                      Capture user interactions and network requests in
                      real-time
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <Badge variant="GET">GET</Badge>
                      <Badge variant="POST">POST</Badge>
                      <Badge variant="AUTH">AUTH</Badge>
                    </div>
                  </div>
                </Card>

                {/* Arrow */}
                <div className="hidden animate-trace-backwards text-accent-brand lg:block">
                  <ArrowRight size={32} />
                </div>

                {/* Step 2: Graph */}
                <Card
                  hover
                  className="relative w-full max-w-sm transform p-8 transition-transform duration-default hover:rotate-1"
                >
                  <div className="absolute -left-2 -top-2 h-4 w-4 animate-pulse rounded-full bg-electric-teal delay-300"></div>
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-card bg-success/20">
                      <GitBranch className="text-success" size={24} />
                    </div>
                    <h3 className="mb-2 text-h3 font-semibold text-text-primary">
                      Flow Graph
                    </h3>
                    <p className="text-small text-text-secondary">
                      Visualize API relationships and trace request dependencies
                    </p>
                    <div className="mt-4 flex h-8 items-center justify-center rounded bg-bg-surface">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 rounded-full bg-accent-brand"></div>
                        <div className="h-px w-4 bg-steel"></div>
                        <div className="h-2 w-2 rounded-full bg-info"></div>
                        <div className="h-px w-4 bg-steel"></div>
                        <div className="h-2 w-2 rounded-full bg-success"></div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Arrow */}
                <div className="hidden animate-trace-backwards text-accent-brand delay-150 lg:block">
                  <ArrowRight size={32} />
                </div>

                {/* Step 3: MCP */}
                <Card
                  hover
                  className="relative w-full max-w-sm transform p-8 transition-transform duration-default hover:-rotate-1"
                >
                  <div className="absolute -right-2 -top-2 h-4 w-4 animate-pulse rounded-full bg-warning delay-500"></div>
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-card bg-warning/20">
                      <Package className="text-warning" size={24} />
                    </div>
                    <h3 className="mb-2 text-h3 font-semibold text-text-primary">
                      MCP Server
                    </h3>
                    <p className="text-small text-text-secondary">
                      Generate production-ready Model Context Protocol servers
                    </p>
                    <div className="mt-4">
                      <code className="rounded bg-bg-base px-2 py-1 font-mono text-code-sm text-accent-brand">
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
      <div className="px-gutter-mobile py-16 md:px-gutter-tablet lg:px-gutter-desktop">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-h2 font-bold text-text-primary">
              Black-ops level API reconnaissance
            </h2>
            <p className="mx-auto max-w-2xl text-body text-text-secondary">
              Extract signal from noise with surgical precision. Every request
              mapped, every dependency traced.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-card bg-accent-brand/20">
                <Target className="text-accent-brand" size={20} />
              </div>
              <h3 className="mb-2 text-h3 font-semibold text-text-primary">
                Surgical Precision
              </h3>
              <p className="text-small text-text-secondary">
                Zero false positives. Extract only the API calls that matter for
                your workflow.
              </p>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-card bg-success/20">
                <Zap className="text-success" size={20} />
              </div>
              <h3 className="mb-2 text-h3 font-semibold text-text-primary">
                Swift Reveals
              </h3>
              <p className="text-small text-text-secondary">
                Trace backwards through request chains. Reveal dependencies in
                milliseconds.
              </p>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-card bg-info/20">
                <Shield className="text-info" size={20} />
              </div>
              <h3 className="mb-2 text-h3 font-semibold text-text-primary">
                Signal from Noise
              </h3>
              <p className="text-small text-text-secondary">
                Filter out static assets and focus on the business logic APIs
                that power the UI.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-bg-surface px-gutter-mobile py-16 md:px-gutter-tablet lg:px-gutter-desktop">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-h2 font-bold text-text-primary">
            Ready to reverse engineer your next API?
          </h2>
          <p className="mb-8 text-body text-text-secondary">
            Upload a HAR file or record a new flow to get started.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
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
