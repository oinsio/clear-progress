// implements FR7, FR8 of fix-push-poison-pill
import { useCallback, useState } from "react";
import type { SyncAlert } from "@/services/push-self-healing";
import { SyncAlertDialog } from "./SyncAlertDialog";

interface SyncAlertQueueProps {
  alerts: SyncAlert[];
  onAllDismissed: () => void;
}

/**
 * Shows SyncAlertDialog items one at a time from a queue.
 * When user dismisses one, shows the next.
 * When all dismissed, calls onAllDismissed.
 *
 * Implements FR7, FR8 of fix-push-poison-pill.
 */
export function SyncAlertQueue({
  alerts,
  onAllDismissed,
}: SyncAlertQueueProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleDismiss = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= alerts.length) {
      onAllDismissed();
    } else {
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex, alerts.length, onAllDismissed]);

  if (alerts.length === 0 || currentIndex >= alerts.length) {
    return null;
  }

  const currentAlert = alerts[currentIndex];

  return (
    <SyncAlertDialog
      messageKey={currentAlert.messageKey}
      params={currentAlert.params}
      onDismiss={handleDismiss}
    />
  );
}
