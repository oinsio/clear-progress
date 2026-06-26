// implements FR5, NFR-A1 of fix-project-paused
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

const SUPABASE_DASHBOARD_URL = "https://supabase.com/dashboard/projects";

interface ProjectPausedDialogProps {
  onClose: () => void;
}

/**
 * Dialog shown when the Supabase project is paused (HTTP 540).
 * Uses ConfirmDialog which provides role="alertdialog", aria-modal,
 * aria-labelledby, aria-describedby, focus trap, and Escape handling.
 *
 * Implements FR5, NFR-A1 of fix-project-paused.
 */
export function ProjectPausedDialog({ onClose }: ProjectPausedDialogProps) {
  const { t } = useTranslation();

  const handleOpenDashboard = () => {
    window.open(SUPABASE_DASHBOARD_URL, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <ConfirmDialog
      title={t("projectPausedDialog.title")}
      message={t("projectPausedDialog.message")}
      confirmLabel={t("projectPausedDialog.openDashboard")}
      cancelLabel={t("projectPausedDialog.close")}
      onConfirm={handleOpenDashboard}
      onCancel={onClose}
    />
  );
}
