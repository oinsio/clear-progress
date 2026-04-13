import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./providers/ThemeProvider";
import { SyncProvider } from "./providers/SyncProvider";
import { ShowHiddenProvider } from "./providers/ShowHiddenProvider";
import { LanguageProvider } from "./providers/LanguageProvider";
import { AuthProvider } from "./providers/AuthProvider";
import { PanelSettingsProvider } from "./providers/PanelSettingsProvider";
import { InterfaceScaleProvider } from "./providers/InterfaceScaleProvider";
import { UpdateNotification } from "@/components/pwa/UpdateNotification";
import { useHiddenTasksReveal } from "@/hooks/useHiddenTasksReveal";
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
