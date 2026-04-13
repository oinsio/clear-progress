import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { useShowHidden } from "@/hooks/useShowHidden";

export function HiddenTasksToggle() {
  const { t } = useTranslation();
  const { showHidden, toggleShowHidden } = useShowHidden();

  return (
    <button
      type="button"
      onClick={toggleShowHidden}
      aria-label={t("filter.showHidden")}
      aria-pressed={showHidden}
      data-testid="hidden-tasks-toggle"
      className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
        showHidden
          ? "bg-accent/10 text-accent"
          : "text-gray-400 hover:bg-gray-100",
      )}
    >
      {showHidden ? <Eye size={20} /> : <EyeOff size={20} />}
    </button>
  );
}
