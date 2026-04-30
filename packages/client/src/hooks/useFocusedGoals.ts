import { SETTINGS_KEYS } from "@clear-progress/contract";
import { useCallback, useEffect, useState } from "react";
import { useSync } from "@/app/providers/SyncProvider";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const defaultSettingsRepository = new SettingsRepository();
const defaultGoalRepository = new GoalRepository();

function isValidUUID(value: string): boolean {
  return UUID_V4_REGEX.test(value);
}

export interface UseFocusedGoalsReturn {
  focusedGoalIds: string[];
  isLoading: boolean;
  addGoalToFocus: (goalId: string) => Promise<"added" | "limit_reached">;
  removeGoalFromFocus: (goalId: string) => Promise<void>;
  isGoalFocused: (goalId: string) => boolean;
  replaceGoalInFocus: (oldGoalId: string, newGoalId: string) => Promise<void>;
}

export function useFocusedGoals(
  settingsRepository: SettingsRepository = defaultSettingsRepository,
  goalRepository: GoalRepository = defaultGoalRepository,
): UseFocusedGoalsReturn {
  const [focusedGoalIds, setFocusedGoalIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { schedulePush } = useSync();

  useEffect(() => {
    let isMounted = true;

    const loadFocusedGoals = async () => {
      const [value1, value2, allGoals] = await Promise.all([
        settingsRepository.getValue(SETTINGS_KEYS.FOCUSED_GOAL_1),
        settingsRepository.getValue(SETTINGS_KEYS.FOCUSED_GOAL_2),
        goalRepository.getAll(),
      ]);

      if (!isMounted) return;

      const goalMap = new Map(allGoals.map((g) => [g.id, g]));

      const validateGoalId = (id: string | undefined): string | null => {
        if (!id || id === "") return null;

        // Check if it looks like a UUID (36 chars with dashes in specific positions)
        const looksLikeUUID =
          id.length === 36 &&
          id[8] === "-" &&
          id[13] === "-" &&
          id[18] === "-" &&
          id[23] === "-";

        if (looksLikeUUID) {
          // Validate UUID v4 format
          if (!isValidUUID(id)) {
            // Invalid UUID format — corrupted data
            return null;
          }
        } else {
          // Doesn't look like UUID at all — corrupted data
          return null;
        }

        const goal = goalMap.get(id);
        if (!goal) {
          // Goal not found — clear it (FR11)
          return null;
        }

        // Goal exists — check its state
        if (goal.is_deleted) return null;
        if (goal.status === "completed" || goal.status === "cancelled")
          return null;

        return id;
      };

      const validId1 = validateGoalId(value1);
      const validId2 = validateGoalId(value2);

      // Compact slots: no gaps allowed
      const validIds: string[] = [];
      if (validId1) validIds.push(validId1);
      if (validId2) validIds.push(validId2);

      // Self-healing: if validation changed values, update settings
      const needsHealing =
        (value1 || "") !== (validIds[0] || "") ||
        (value2 || "") !== (validIds[1] || "");

      if (needsHealing) {
        await settingsRepository.set(
          SETTINGS_KEYS.FOCUSED_GOAL_1,
          validIds[0] || "",
        );
        await settingsRepository.set(
          SETTINGS_KEYS.FOCUSED_GOAL_2,
          validIds[1] || "",
        );
        schedulePush();
      }

      if (isMounted) {
        setFocusedGoalIds(validIds);
        setIsLoading(false);
      }
    };

    loadFocusedGoals().catch((error) => {
      console.error("Failed to load focused goals:", error);
    });

    // Set up polling interval to detect changes
    const intervalId = setInterval(() => {
      loadFocusedGoals().catch((error) => {
        console.error("Failed to load focused goals:", error);
      });
    }, 100);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [settingsRepository, goalRepository, schedulePush]);

  const addGoalToFocus = useCallback(
    async (goalId: string): Promise<"added" | "limit_reached"> => {
      const currentIds = await Promise.all([
        settingsRepository.getValue(SETTINGS_KEYS.FOCUSED_GOAL_1),
        settingsRepository.getValue(SETTINGS_KEYS.FOCUSED_GOAL_2),
      ]);

      const slot1 = currentIds[0] || "";
      const slot2 = currentIds[1] || "";

      // Already focused
      if (slot1 === goalId || slot2 === goalId) {
        return "added";
      }

      // Add to first empty slot
      if (slot1 === "") {
        await settingsRepository.set(SETTINGS_KEYS.FOCUSED_GOAL_1, goalId);
        schedulePush();
        return "added";
      }

      if (slot2 === "") {
        await settingsRepository.set(SETTINGS_KEYS.FOCUSED_GOAL_2, goalId);
        schedulePush();
        return "added";
      }

      // Both slots occupied
      return "limit_reached";
    },
    [settingsRepository, schedulePush],
  );

  const removeGoalFromFocus = useCallback(
    async (goalId: string): Promise<void> => {
      const currentIds = await Promise.all([
        settingsRepository.getValue(SETTINGS_KEYS.FOCUSED_GOAL_1),
        settingsRepository.getValue(SETTINGS_KEYS.FOCUSED_GOAL_2),
      ]);

      const slot1 = currentIds[0] || "";
      const slot2 = currentIds[1] || "";

      // Not focused
      if (slot1 !== goalId && slot2 !== goalId) {
        return;
      }

      // Remove and compact
      const remaining: string[] = [];
      if (slot1 !== goalId && slot1 !== "") remaining.push(slot1);
      if (slot2 !== goalId && slot2 !== "") remaining.push(slot2);

      await settingsRepository.set(
        SETTINGS_KEYS.FOCUSED_GOAL_1,
        remaining[0] || "",
      );
      await settingsRepository.set(
        SETTINGS_KEYS.FOCUSED_GOAL_2,
        remaining[1] || "",
      );
      schedulePush();
    },
    [settingsRepository, schedulePush],
  );

  const isGoalFocused = useCallback(
    (goalId: string): boolean => {
      return focusedGoalIds.includes(goalId);
    },
    [focusedGoalIds],
  );

  const replaceGoalInFocus = useCallback(
    async (oldGoalId: string, newGoalId: string): Promise<void> => {
      const currentIds = await Promise.all([
        settingsRepository.getValue(SETTINGS_KEYS.FOCUSED_GOAL_1),
        settingsRepository.getValue(SETTINGS_KEYS.FOCUSED_GOAL_2),
      ]);

      const slot1 = currentIds[0] || "";
      const slot2 = currentIds[1] || "";

      // Old goal not focused
      if (slot1 !== oldGoalId && slot2 !== oldGoalId) {
        return;
      }

      // Replace and compact
      const remaining: string[] = [];
      if (slot1 !== oldGoalId && slot1 !== "") remaining.push(slot1);
      if (slot2 !== oldGoalId && slot2 !== "") remaining.push(slot2);
      remaining.push(newGoalId);

      await settingsRepository.set(
        SETTINGS_KEYS.FOCUSED_GOAL_1,
        remaining[0] || "",
      );
      await settingsRepository.set(
        SETTINGS_KEYS.FOCUSED_GOAL_2,
        remaining[1] || "",
      );
      schedulePush();
    },
    [settingsRepository, schedulePush],
  );

  return {
    focusedGoalIds,
    isLoading,
    addGoalToFocus,
    removeGoalFromFocus,
    isGoalFocused,
    replaceGoalInFocus,
  };
}
