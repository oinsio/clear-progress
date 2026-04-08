import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./providers/ThemeProvider";
import { SyncProvider } from "./providers/SyncProvider";
import { LanguageProvider } from "./providers/LanguageProvider";
import { AuthProvider } from "./providers/AuthProvider";
import { PanelSettingsProvider } from "./providers/PanelSettingsProvider";
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
            <PanelSettingsProvider>
              <UpdateNotification />
              <RouterProvider router={router} />
            </PanelSettingsProvider>
          </ThemeProvider>
        </SyncProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
