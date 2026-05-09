import { expect } from "vitest";
import type { SettingsRepository } from "@/db/repositories/SettingsRepository.ts";
import type { Goal } from "@/types/entities.ts";

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
  expect(goal).toBeDefined();
  return goal!;
}
