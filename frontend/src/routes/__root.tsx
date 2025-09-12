import {
  Outlet,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import { TRPCReactProvider } from "~/trpc/react";
import { ReversorToaster } from "~/components/ui/Toast";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const isFetching = useRouterState({ select: (s) => s.isLoading });

  if (isFetching) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-accent-brand rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-accent-brand rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-accent-brand rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    );
  }

  return (
    <TRPCReactProvider>
      <Outlet />
      <ReversorToaster />
    </TRPCReactProvider>
  );
}
