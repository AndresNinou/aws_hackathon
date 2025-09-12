import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { AlertTriangle, Upload, ArrowLeft, RefreshCw } from 'lucide-react';

export const Route = createFileRoute("/app/error/")({
  component: ErrorPage,
});

function ErrorPage() {
  const router = useRouter();

  const handleGoBack = () => {
    router.history.back();
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-gutter-mobile md:p-gutter-tablet lg:p-gutter-desktop">
      <div className="max-w-2xl w-full">
        <Card className="p-8 text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 bg-danger/20 rounded-card flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} className="text-danger" />
          </div>
          
          {/* Error Title */}
          <h1 className="text-h2 font-bold text-text-primary mb-4">
            Couldn't parse this HAR
          </h1>
          
          {/* Error Description */}
          <p className="text-body text-text-secondary mb-6 max-w-lg mx-auto">
            Check domain whitelist or try again. The HAR file might be corrupted, 
            empty, or contain no recognizable API endpoints.
          </p>
          
          {/* Error Code */}
          <div className="bg-bg-base border border-border-subtle rounded-card p-4 mb-8">
            <code className="text-code font-mono text-danger block">
              Error: Invalid HAR format or no API endpoints found
            </code>
            <p className="text-small text-text-muted mt-2">
              Make sure your HAR file contains HTTP requests to API endpoints 
              (typically with /api/ in the URL or JSON content-type headers).
            </p>
          </div>
          
          {/* Troubleshooting Steps */}
          <div className="text-left mb-8">
            <h3 className="text-h3 font-semibold text-text-primary mb-4">
              Troubleshooting Steps
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-accent-brand/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-accent-brand text-small font-bold">1</span>
                </div>
                <div>
                  <p className="text-small text-text-primary font-medium">
                    Verify HAR file format
                  </p>
                  <p className="text-small text-text-muted">
                    Ensure the file was exported correctly from your browser's 
                    developer tools (Network tab → Export HAR).
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-accent-brand/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-accent-brand text-small font-bold">2</span>
                </div>
                <div>
                  <p className="text-small text-text-primary font-medium">
                    Check for API requests
                  </p>
                  <p className="text-small text-text-muted">
                    The HAR should contain requests to API endpoints, not just 
                    static assets (images, CSS, JS files).
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-accent-brand/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-accent-brand text-small font-bold">3</span>
                </div>
                <div>
                  <p className="text-small text-text-primary font-medium">
                    Domain whitelist
                  </p>
                  <p className="text-small text-text-muted">
                    Set a domain filter to focus on specific API endpoints 
                    and reduce noise from third-party requests.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleRetry}>
              <RefreshCw size={16} className="mr-2" />
              Try Again
            </Button>
            
            <Button variant="secondary" onClick={handleGoBack}>
              <ArrowLeft size={16} className="mr-2" />
              Go Back
            </Button>
            
            <Button variant="ghost">
              <Upload size={16} className="mr-2" />
              Upload Different HAR
            </Button>
          </div>
        </Card>
        
        {/* Additional Help */}
        <div className="mt-8 text-center">
          <p className="text-small text-text-muted">
            Need help? Check our{" "}
            <a href="#" className="text-accent-brand hover:text-accent-brand-hover transition-colors">
              documentation
            </a>{" "}
            or{" "}
            <a href="#" className="text-accent-brand hover:text-accent-brand-hover transition-colors">
              view examples
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
