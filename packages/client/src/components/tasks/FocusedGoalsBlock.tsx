import { useNavigate } from "react-router-dom";
import { useFocusedGoals } from "@/hooks/useFocusedGoals";
import { useGoals } from "@/hooks/useGoals";
import type { Goal } from "@/types/entities";
import { FocusedGoalNavItem } from "./FocusedGoalNavItem";

interface FocusedGoalsBlockProps {
  isExpanded: boolean;
}

export function FocusedGoalsBlock({ isExpanded }: FocusedGoalsBlockProps) {
  const { focusedGoalIds } = useFocusedGoals();
  const { goals } = useGoals();
  const navigate = useNavigate();

  const focusedGoals = focusedGoalIds
    .map((id) => goals.find((g) => g.id === id))
    .filter((g): g is Goal => g !== undefined);

  if (focusedGoals.length === 0) {
    return null;
  }

  return (
    <div data-testid="focus-panel" data-collapsed={!isExpanded}>
      {focusedGoals.map((goal) => (
        <FocusedGoalNavItem
          key={goal.id}
          goal={goal}
          isExpanded={isExpanded}
          onClick={(goalId) => navigate(`/goals/${goalId}`)}
        />
      ))}
    </div>
  );
}
