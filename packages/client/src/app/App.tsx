import { RouterProvider } from "react-router-dom";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { UpdateNotification } from "@/components/pwa/UpdateNotification";
import { SyncAlertQueue } from "@/components/sync/SyncAlertQueue";
import { useHiddenTasksReveal } from "@/hooks/useHiddenTasksReveal";
import { AuthProvider } from "./providers/AuthProvider";
import { InterfaceScaleProvider } from "./providers/InterfaceScaleProvider";
import { LanguageProvider } from "./providers/LanguageProvider";
import { ShowHiddenProvider } from "./providers/ShowHiddenProvider";
import { SyncProvider, useSync } from "./providers/SyncProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { router } from "./router";

/** Implements FR7, FR8 of fix-push-poison-pill */
function SyncAlertOverlay() {
  const { pendingSyncAlerts, clearSyncAlerts } = useSync();
  if (pendingSyncAlerts.length === 0) return null;
  return (
    <SyncAlertQueue
      alerts={pendingSyncAlerts}
      onAllDismissed={clearSyncAlerts}
    />
  );
}

export default function App() {
  useHiddenTasksReveal();

  return (
    <AuthProvider>
      <LanguageProvider>
        <SyncProvider>
          <ShowHiddenProvider>
            <ThemeProvider>
              <InterfaceScaleProvider>
                <UpdateNotification />
                <OnboardingGate />
                <SyncAlertOverlay />
                <RouterProvider router={router} />
              </InterfaceScaleProvider>
            </ThemeProvider>
          </ShowHiddenProvider>
        </SyncProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
