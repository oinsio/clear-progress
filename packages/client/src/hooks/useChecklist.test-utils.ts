import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, vi } from "vitest";
import { db } from "@/db/database";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { ChecklistService } from "@/services/ChecklistService";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { useChecklist } from "./useChecklist";

export const mockSchedulePush = vi.fn();

export const checklistService = new ChecklistService(new ChecklistRepository());

export async function setupWithItem(
  overrides: Parameters<typeof buildChecklistItem>[0] = {},
) {
  const taskId = overrides.task_id ?? crypto.randomUUID();
  const item = buildChecklistItem({ task_id: taskId, ...overrides });
  await db.checklist_items.add(item);
  const { result } = renderHook(() => useChecklist(taskId, checklistService));
  await waitFor(() => expect(result.current.items).toHaveLength(1));
  return { item, taskId, result };
}

export function setupBeforeEach() {
  beforeEach(async () => {
    await db.checklist_items.clear();
    mockSchedulePush.mockClear();
  });
}
