import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./providers/ThemeProvider";
import { SyncProvider } from "./providers/SyncProvider";
import { LanguageProvider } from "./providers/LanguageProvider";
import { AuthProvider } from "./providers/AuthProvider";
import { PanelSettingsProvider } from "./providers/PanelSettingsProvider";
import { InterfaceScaleProvider } from "./providers/InterfaceScaleProvider";
import { UpdateNotification } from "@/components/pwa/UpdateNotification";
import { router } from "./router";

// GoogleOAuthProvider is now managed inside AuthProvider (see AuthProvider.tsx).
// App.tsx no longer needs to conditionally wrap children — they never remount.
export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <SyncProvider>
          <ThemeProvider>
            <InterfaceScaleProvider>
              <PanelSettingsProvider>
                <UpdateNotification />
                <RouterProvider router={router} />
              </PanelSettingsProvider>
            </InterfaceScaleProvider>
          </ThemeProvider>
        </SyncProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
