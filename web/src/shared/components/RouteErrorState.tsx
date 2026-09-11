import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { ErrorState } from "@/shared/components/ErrorState";

export function RouteErrorState() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "The page could not be displayed.";

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center p-6">
      <ErrorState
        title="This page ran into a problem"
        message={message}
        onRetry={() => window.location.reload()}
        className="w-full max-w-lg"
      />
    </main>
  );
}
