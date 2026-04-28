import { useRouteError } from "react-router-dom";
import { ErrorFallback } from "./ErrorFallback";

export function RouteErrorFallback() {
  const error = useRouteError();
  console.error("[RouteErrorFallback]", error);

  return <ErrorFallback />;
}
