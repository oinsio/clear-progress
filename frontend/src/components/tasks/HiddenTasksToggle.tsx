import { useState, useCallback } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { STORAGE_KEYS } from "@/constants";
import { cn } from "@/shared/lib/cn";

export function HiddenTasksToggle() {
  const { t } = useTranslation();
  const [showHidden, setShowHidden] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.SHOW_HIDDEN_TASKS) === "true";
  });

  const handleToggle = useCallback(() => {
    const newValue = !showHidden;
    setShowHidden(newValue);
    localStorage.setItem(STORAGE_KEYS.SHOW_HIDDEN_TASKS, String(newValue));
    window.dispatchEvent(
      new CustomEvent("hidden_tasks_toggle", { detail: newValue }),
    );
  }, [showHidden]);

  return (
    <button
      type="button"
      onClick={handleToggle}
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
