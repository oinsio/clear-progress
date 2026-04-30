import defaultCoverSvg from "@/assets/default-goal-cover.svg";
import { useCoverUrl } from "@/hooks/useCoverUrl";
import type { Goal } from "@/types/entities";

interface FocusedGoalNavItemProps {
  goal: Goal;
  isExpanded: boolean;
  onClick: (goalId: string) => void;
}

export function FocusedGoalNavItem({
  goal,
  isExpanded,
  onClick,
}: FocusedGoalNavItemProps) {
  const { url: coverUrl } = useCoverUrl(goal.cover_file_id ?? "");

  if (isExpanded) {
    return (
      <button
        type="button"
        aria-label={goal.name}
        data-testid="focused-goal-nav-item"
        onClick={(e) => {
          e.stopPropagation();
          onClick(goal.id);
        }}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors text-left text-white/80 hover:bg-white/10 hover:text-white"
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
          <img
            src={coverUrl ?? defaultCoverSvg}
            alt={coverUrl ? goal.name : ""}
            aria-hidden={!coverUrl}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="truncate">{goal.name}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={goal.name}
      data-testid="focused-goal-nav-item"
      onClick={(e) => {
        e.stopPropagation();
        onClick(goal.id);
      }}
      className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors text-white/70 hover:bg-white/10 hover:text-white flex-shrink-0"
    >
      <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
        <img
          src={coverUrl ?? defaultCoverSvg}
          alt={coverUrl ? goal.name : ""}
          aria-hidden={!coverUrl}
          className="w-full h-full object-cover"
        />
      </div>
    </button>
  );
}
