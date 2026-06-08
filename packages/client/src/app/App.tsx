import { RouterProvider } from "react-router-dom";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { UpdateNotification } from "@/components/pwa/UpdateNotification";
import { useHiddenTasksReveal } from "@/hooks/useHiddenTasksReveal";
import { AuthProvider } from "./providers/AuthProvider";
import { InterfaceScaleProvider } from "./providers/InterfaceScaleProvider";
import { LanguageProvider } from "./providers/LanguageProvider";
import { PanelSettingsProvider } from "./providers/PanelSettingsProvider";
import { ShowHiddenProvider } from "./providers/ShowHiddenProvider";
import { SyncProvider } from "./providers/SyncProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { router } from "./router";

// GoogleOAuthProvider is now managed inside AuthProvider (see AuthProvider.tsx).
// App.tsx no longer needs to conditionally wrap children — they never remount.
export default function App() {
  useHiddenTasksReveal();

  return (
    <AuthProvider>
      <LanguageProvider>
        <SyncProvider>
          <ShowHiddenProvider>
            <ThemeProvider>
              <InterfaceScaleProvider>
                <PanelSettingsProvider>
                  <UpdateNotification />
                  <OnboardingGate />
                  <RouterProvider router={router} />
                </PanelSettingsProvider>
              </InterfaceScaleProvider>
            </ThemeProvider>
          </ShowHiddenProvider>
        </SyncProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
