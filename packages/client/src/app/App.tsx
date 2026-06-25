import { RouterProvider } from "react-router-dom";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { UpdateNotification } from "@/components/pwa/UpdateNotification";
import { useHiddenTasksReveal } from "@/hooks/useHiddenTasksReveal";
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
        <SyncProvider>
          <ShowHiddenProvider>
            <ThemeProvider>
              <InterfaceScaleProvider>
                <UpdateNotification />
                <OnboardingGate />
                <RouterProvider router={router} />
              </InterfaceScaleProvider>
            </ThemeProvider>
          </ShowHiddenProvider>
        </SyncProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
