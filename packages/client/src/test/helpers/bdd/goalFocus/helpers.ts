import type { SettingsRepository } from "@/db/repositories/SettingsRepository.ts";
import type { Goal } from "@/types/entities.ts";

/**
 * Checks if a string looks like a UUID (basic format check).
 */
export function looksLikeUUID(value: string): boolean {
  return (
    value.length === 36 &&
    value[8] === "-" &&
    value[13] === "-" &&
    value[18] === "-" &&
    value[23] === "-"
  );
}

/**
 * Validates a goal ID for focus slots.
 * Returns the ID if valid, null if invalid/deleted/completed/cancelled.
 */
export function validateGoalIdForFocus(
  id: string | undefined,
  goalMap: Map<string, Goal>,
): string | null {
  if (!id || id === "") return null;
  if (!looksLikeUUID(id)) return null;

  const goal = goalMap.get(id);
  if (!goal) return null;
  if (goal.is_deleted) return null;
  if (goal.status === "completed" || goal.status === "cancelled") return null;

  return id;
}

/**
 * Runs self-healing logic for focused goals.
 * Returns true if healing was needed and performed.
 */
export async function runSelfHealing(
  settingsRepository: SettingsRepository,
  goals: Goal[],
): Promise<boolean> {
  const [value1, value2] = await Promise.all([
    settingsRepository.getValue("focused_goal_1"),
    settingsRepository.getValue("focused_goal_2"),
  ]);

  const goalMap = new Map(goals.map((goal) => [goal.id, goal]));

  const validId1 = validateGoalIdForFocus(value1, goalMap);
  const validId2 = validateGoalIdForFocus(value2, goalMap);

  const validIds: string[] = [];
  if (validId1) validIds.push(validId1);
  if (validId2) validIds.push(validId2);

  const needsHealing =
    (value1 || "") !== (validIds[0] || "") ||
    (value2 || "") !== (validIds[1] || "");

  if (needsHealing) {
    await settingsRepository.set("focused_goal_1", validIds[0] || "");
    await settingsRepository.set("focused_goal_2", validIds[1] || "");
  }

  return needsHealing;
}

/**
 * Gets both focused goal IDs from settings.
 */
export async function getFocusedGoals(
  settingsRepository: SettingsRepository,
): Promise<{ focused1: string | undefined; focused2: string | undefined }> {
  const focused1 = await settingsRepository.getValue("focused_goal_1");
  const focused2 = await settingsRepository.getValue("focused_goal_2");
  return { focused1, focused2 };
}

/**
 * Checks if a goal is in focus.
 */
export function isGoalInFocus(
  goalId: string,
  focused1: string | undefined,
  focused2: string | undefined,
): boolean {
  return focused1 === goalId || focused2 === goalId;
}

/**
 * Simulates clicking the focus icon for a goal.
 * Toggles focus state: adds to focus if not focused, removes if already focused.
 */
export async function clickFocusIcon(
  goalId: string,
  settingsRepository: SettingsRepository,
): Promise<void> {
  const focused1 = await settingsRepository.getValue("focused_goal_1");
  const focused2 = await settingsRepository.getValue("focused_goal_2");

  const isFocused = focused1 === goalId || focused2 === goalId;

  if (isFocused) {
    const remaining: string[] = [];
    if (focused1 !== goalId && focused1) remaining.push(focused1);
    if (focused2 !== goalId && focused2) remaining.push(focused2);

    await settingsRepository.set("focused_goal_1", remaining[0] || "");
    await settingsRepository.set("focused_goal_2", remaining[1] || "");
  } else {
    if (!focused1) {
      await settingsRepository.set("focused_goal_1", goalId);
    } else if (!focused2) {
      await settingsRepository.set("focused_goal_2", goalId);
    }
  }
}

/**
 * Removes a goal from focus and compacts slots.
 */
export async function removeGoalFromFocus(
  goalId: string,
  settingsRepository: SettingsRepository,
): Promise<void> {
  const focused1 = await settingsRepository.getValue("focused_goal_1");
  const focused2 = await settingsRepository.getValue("focused_goal_2");

  const remaining: string[] = [];
  if (focused1 && focused1 !== goalId) remaining.push(focused1);
  if (focused2 && focused2 !== goalId) remaining.push(focused2);

  await settingsRepository.set("focused_goal_1", remaining[0] || "");
  await settingsRepository.set("focused_goal_2", remaining[1] || "");
}

/**
 * Gets a goal from context by name, throws if not found.
 */
export function getGoalFromContext(
  testGoals: Map<string, Goal>,
  goalName: string,
): Goal {
  const goal = testGoals.get(goalName);
  if (!goal) {
    throw new Error(`Goal "${goalName}" not found in test context`);
  }
  return goal;
}
