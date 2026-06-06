import { beforeEach, vi } from "vitest";
import {
  createMockEntityWithRevision,
  expectErrorResponse,
  expectPullResponseStructure,
  expectSuccessResponse,
  expectValidServerTime,
  makeGoal,
  makeTask,
  parseResponse,
} from "../../../tests/server/helpers";
import { getAttachmentsByRevision } from "../sheets/attachments.sheet";
import { getCategoriesByRevision } from "../sheets/categories.sheet";
import { getChecklistItemsByRevision } from "../sheets/checklists.sheet";
import { getContextsByRevision } from "../sheets/contexts.sheet";
import { getGoalsByRevision } from "../sheets/goals.sheet";
import { getIdeasByRevision } from "../sheets/ideas.sheet";
import { readNextRevision, readPurgeRevision } from "../sheets/meta.sheet";
import {
  getAllSettings,
  getSettingsChangedSince,
} from "../sheets/settings.sheet";
import { getTasksByRevision } from "../sheets/tasks.sheet";

export {
  createMockEntityWithRevision,
  expectErrorResponse,
  expectPullResponseStructure,
  expectSuccessResponse,
  expectValidServerTime,
  getAllSettings,
  getAttachmentsByRevision,
  getCategoriesByRevision,
  getChecklistItemsByRevision,
  getContextsByRevision,
  getGoalsByRevision,
  getIdeasByRevision,
  getSettingsChangedSince,
  getTasksByRevision,
  makeGoal,
  makeTask,
  parseResponse,
  readNextRevision,
  readPurgeRevision,
};

export function setupPullTests(): void {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTasksByRevision).mockReturnValue([]);
    vi.mocked(getGoalsByRevision).mockReturnValue([]);
    vi.mocked(getContextsByRevision).mockReturnValue([]);
    vi.mocked(getCategoriesByRevision).mockReturnValue([]);
    vi.mocked(getChecklistItemsByRevision).mockReturnValue([]);
    vi.mocked(getIdeasByRevision).mockReturnValue([]);
    vi.mocked(getAttachmentsByRevision).mockReturnValue([]);
    vi.mocked(getAllSettings).mockReturnValue([]);
    vi.mocked(getSettingsChangedSince).mockReturnValue([]);
    vi.mocked(readNextRevision).mockReturnValue(1);
    vi.mocked(readPurgeRevision).mockReturnValue(0);
  });
}
