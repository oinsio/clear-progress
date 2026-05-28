import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/globals.css";
import "@/i18n";
import { migrateLegacyConnection } from "@/services/migrateLegacyConnection";
import App from "./app/App";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Run one-time migration from old connection keys to new ConnectionConfig
migrateLegacyConnection();

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
