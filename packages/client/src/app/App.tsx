import { RouterProvider } from "react-router-dom";
import { AlertOverlay } from "@/components/alerts/AlertOverlay";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { UpdateNotification } from "@/components/pwa/UpdateNotification";
import { useHiddenTasksReveal } from "@/hooks/useHiddenTasksReveal";
import { AlertProvider } from "./providers/AlertProvider";
import { AuthProvider } from "./providers/AuthProvider";
import { InterfaceScaleProvider } from "./providers/InterfaceScaleProvider";
import { LanguageProvider } from "./providers/LanguageProvider";
import { ShowHiddenProvider } from "./providers/ShowHiddenProvider";
import { SyncProvider } from "./providers/SyncProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { router } from "./router";

export default function App() {
  useHiddenTasksReveal();

  return (
    <AuthProvider>
      <LanguageProvider>
        <AlertProvider>
          <SyncProvider>
            <ShowHiddenProvider>
              <ThemeProvider>
                <InterfaceScaleProvider>
                  <UpdateNotification />
                  <OnboardingGate />
                  <AlertOverlay />
                  <RouterProvider router={router} />
                </InterfaceScaleProvider>
              </ThemeProvider>
            </ShowHiddenProvider>
          </SyncProvider>
        </AlertProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
