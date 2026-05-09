import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import defaultCoverSvg from "@/assets/default-goal-cover.svg";
import { useCoverUrl } from "@/hooks/useCoverUrl";
import type { Goal } from "@/types/entities";

interface FocusGoalReplacementDialogProps {
  isOpen: boolean;
  goalToAdd: Goal;
  focusedGoals: Goal[];
  onReplace: (oldGoalId: string) => Promise<void>;
  onClose: () => void;
}

interface ReplaceGoalButtonProps {
  goal: Goal;
  onReplace: (goalId: string) => Promise<void>;
}

function ReplaceGoalButton({ goal, onReplace }: ReplaceGoalButtonProps) {
  const { t } = useTranslation();
  const { url: coverUrl } = useCoverUrl(goal.cover_file_id);

  return (
    <button
      type="button"
      data-testid={`replace-goal-button-${goal.id}`}
      onClick={() => void onReplace(goal.id)}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
        <img
          src={coverUrl ?? defaultCoverSvg}
          alt={coverUrl ? goal.name : ""}
          aria-hidden={!coverUrl}
          className="w-full h-full object-cover"
        />
      </div>
      <span className="flex-1 text-sm text-gray-800">
        {t("focusGoalReplacementDialog.replaceGoal", { goalName: goal.name })}
      </span>
    </button>
  );
}

export function FocusGoalReplacementDialog({
  isOpen,
  focusedGoals,
  onReplace,
  onClose,
}: FocusGoalReplacementDialogProps) {
  const { t } = useTranslation();
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "Tab" && dialogContentRef.current) {
        const focusableButtons =
          dialogContentRef.current.querySelectorAll<HTMLElement>("button");
        if (!focusableButtons.length) return;
        const firstElement = focusableButtons[0];
        const lastElement = focusableButtons[focusableButtons.length - 1];
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElementRef.current =
        document.activeElement as HTMLElement | null;
      document.addEventListener("keydown", handleKeyDown);
      const firstButton =
        dialogContentRef.current?.querySelector<HTMLElement>("button");
      firstButton?.focus();
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        previouslyFocusedElementRef.current?.focus();
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="focus-goal-replacement-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        data-testid="focus-goal-replacement-backdrop"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        ref={dialogContentRef}
        className="relative w-full max-w-sm mx-4 rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2
          data-testid="focus-goal-replacement-dialog-title"
          className="text-base font-semibold text-gray-900 mb-2"
        >
          {t("focusGoalReplacementDialog.title")}
        </h2>

        <p
          data-testid="focus-goal-replacement-dialog-message"
          className="text-sm text-gray-500 mb-4"
        >
          {t("focusGoalReplacementDialog.message")}
        </p>

        <div className="space-y-2 mb-4">
          {focusedGoals.map((goal) => (
            <ReplaceGoalButton
              key={goal.id}
              goal={goal}
              onReplace={onReplace}
            />
          ))}
        </div>

        <button
          type="button"
          data-testid="focus-goal-replacement-cancel-btn"
          onClick={onClose}
          className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
        >
          {t("focusGoalReplacementDialog.cancel")}
        </button>
      </div>
    </div>
  );
}
