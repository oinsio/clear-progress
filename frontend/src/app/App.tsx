import { useState, useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "./providers/ThemeProvider";
import { SyncProvider } from "./providers/SyncProvider";
import { LanguageProvider } from "./providers/LanguageProvider";
import { AuthProvider } from "./providers/AuthProvider";
import { PanelSettingsProvider } from "./providers/PanelSettingsProvider";
import { router } from "./router";
import { STORAGE_KEYS, GOOGLE_CLIENT_ID_CHANGED_EVENT } from "@/constants";

function AppProviders() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <SyncProvider>
          <ThemeProvider>
            <PanelSettingsProvider>
              <RouterProvider router={router} />
            </PanelSettingsProvider>
          </ThemeProvider>
        </SyncProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default function App() {
  const [googleClientId, setGoogleClientId] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEYS.GOOGLE_CLIENT_ID),
  );

  useEffect(() => {
    const handleChange = () => {
      setGoogleClientId(localStorage.getItem(STORAGE_KEYS.GOOGLE_CLIENT_ID));
    };
    window.addEventListener(GOOGLE_CLIENT_ID_CHANGED_EVENT, handleChange);
    return () => window.removeEventListener(GOOGLE_CLIENT_ID_CHANGED_EVENT, handleChange);
  }, []);

  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        <AppProviders />
      </GoogleOAuthProvider>
    );
  }
  return <AppProviders />;
}
