// Mock pushPreValidator to pass records through unchanged.
// BDD sync protocol tests use non-UUID ids (e.g. "t1") which would fail
// Zod pre-validation. Import this file for side effects before SyncService usage.
import { vi } from "vitest";

vi.mock("@/services/pushPreValidator", () => ({
  preValidateRecords: vi
    .fn()
    .mockImplementation(
      async (
        tasks: unknown[],
        goals: unknown[],
        contexts: unknown[],
        categories: unknown[],
        checklistItems: unknown[],
        ideas: unknown[],
        attachments: unknown[],
        settings: unknown[],
      ) => ({
        tasks,
        goals,
        contexts,
        categories,
        checklistItems,
        ideas,
        attachments,
        settings,
        alerts: [],
      }),
    ),
}));
