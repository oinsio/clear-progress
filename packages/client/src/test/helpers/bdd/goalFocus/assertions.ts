import { expect } from "vitest";
import type { SettingsRepository } from "@/db/repositories/SettingsRepository.ts";
import { getFocusedGoals, isGoalInFocus } from "./helpers.ts";

/**
 * Asserts the number of goals currently in focus.
 */
export async function expectFocusCount(
  settingsRepository: SettingsRepository,
  count: number,
): Promise<void> {
  const { focused1, focused2 } = await getFocusedGoals(settingsRepository);

  if (count === 0) {
    expect(focused1).toBeUndefined();
    expect(focused2).toBeUndefined();
  } else if (count === 1) {
    expect(focused1).toBeDefined();
    expect(focused2).toBeUndefined();
  } else if (count === 2) {
    expect(focused1).toBeDefined();
    expect(focused2).toBeDefined();
  }
}

/**
 * Asserts that a setting value matches expected (handles empty string as undefined).
 */
export function expectSettingValue(
  actualId: string | undefined,
  expectedId: string,
): void {
  if (expectedId === "") {
    expect(actualId === undefined || actualId === "").toBe(true);
  } else {
    expect(actualId).toBe(expectedId);
  }
}

/**
 * Asserts that a goal is in focus or not.
 */
export async function expectGoalInFocus(
  goalId: string,
  settingsRepository: SettingsRepository,
  shouldBeInFocus: boolean,
): Promise<void> {
  const { focused1, focused2 } = await getFocusedGoals(settingsRepository);
  expect(isGoalInFocus(goalId, focused1, focused2)).toBe(shouldBeInFocus);
}
