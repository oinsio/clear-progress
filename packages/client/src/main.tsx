import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/globals.css";
import "@/i18n";
import { ROUTES } from "@/constants";
import { migrateLegacyConnection } from "@/services/migrateLegacyConnection";
import App from "./app/App";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Run one-time migration from old connection keys to new ConnectionConfig
migrateLegacyConnection();

// If returning from OAuth with tokens in the hash, rewrite URL to /setup so that
// the root route's redirect to /inbox doesn't strip the hash before Supabase SDK
// can read it.
if (
  window.location.pathname === "/" &&
  window.location.hash.includes("access_token")
) {
  window.history.replaceState(
    null,
    "",
    `${ROUTES.SETUP}${window.location.hash}`,
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
