import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRegisterSW } from "virtual:pwa-register/react";

const UPDATE_CHECK_INTERVAL_MS = 60000;

export function UpdateNotification() {
  const { t } = useTranslation();
  const [showNotification, setShowNotification] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(
      _swUrl: string,
      registration: ServiceWorkerRegistration | undefined,
    ) {
      if (registration) {
        setInterval(() => {
          void registration.update();
        }, UPDATE_CHECK_INTERVAL_MS);
      }
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowNotification(true);
    }
  }, [needRefresh]);

  const handleUpdate = () => {
    void updateServiceWorker(true);
  };

  if (!showNotification) return null;

  return (
    <div
      data-testid="update-notification"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        data-testid="update-notification-backdrop"
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative w-full max-w-sm mx-4 rounded-2xl bg-white p-6 shadow-xl">
        <p
          data-testid="update-notification-message"
          className="text-base text-gray-900 text-center mb-6"
        >
          {t("pwa.newVersionAvailable")}
        </p>
        <div className="flex justify-center">
          <button
            data-testid="update-notification-update-btn"
            onClick={handleUpdate}
            className="rounded-lg bg-accent px-6 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            {t("pwa.update")}
          </button>
        </div>
      </div>
    </div>
  );
}
