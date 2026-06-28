/**
 * Tests for error mapping in useGoalEditForm.handleSave.
 * Implements FR6, NFR-A1 of fix-file-mime-detection.
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockUploadFile = vi.fn();
const mockDeleteFile = vi.fn();

vi.mock("@/services/defaultServices", () => ({
  defaultFileService: {
    uploadFile: mockUploadFile,
    deleteFile: mockDeleteFile,
  },
}));

vi.mock("@/hooks/useFilePreview", () => ({
  useFilePreview: () => null,
}));

const { useGoalEditForm } = await import("./useGoalEditForm");

const DEFAULT_GOAL = {
  id: "goal-1",
  name: "Test Goal",
  description: "desc",
  status: "planning" as const,
  cover_hash: "",
  sort_order: "0",
  is_deleted: false,
  revision: 1,
  syncStatus: "synced" as const,
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z",
};

function createTestParams(overrides = {}) {
  return {
    goalId: "goal-1",
    goal: DEFAULT_GOAL,
    existingCoverUrl: null,
    updateGoal: vi.fn().mockResolvedValue(undefined),
    deleteGoal: vi.fn().mockResolvedValue(undefined),
    reloadGoal: vi.fn().mockResolvedValue(undefined),
    navigate: vi.fn(),
    ...overrides,
  };
}

describe("useGoalEditForm error mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function saveWithCoverUploadError(
    rejection: unknown,
    fileName = "test.jpg",
    fileType = "image/jpeg",
  ) {
    const params = createTestParams();
    mockUploadFile.mockRejectedValueOnce(rejection);
    const { result } = renderHook(() => useGoalEditForm(params));

    act(() => {
      result.current.handleStartEdit();
    });
    act(() => {
      result.current.setEditName("My Goal");
    });

    const testFile = new File(["content"], fileName, { type: fileType });
    act(() => {
      result.current.handleCoverSelect(testFile);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    return result;
  }

  // FR6: upload error codes map to corresponding i18n keys
  it.each([
    ["INVALID_TYPE", "goal.cover.errorType"],
    ["UNRECOGNIZED_FORMAT", "goal.cover.errorUnrecognized"],
    ["FILE_TOO_LARGE", "goal.cover.errorSize"],
  ])("should map %s error to %s", async (errorCode, expectedKey) => {
    const result = await saveWithCoverUploadError(new Error(errorCode));
    expect(result.current.saveError).toBe(expectedKey);
  });

  // FR6: Network/unknown errors map to goal.cover.errorNetwork
  it("should map unknown error to goal.cover.errorNetwork", async () => {
    const result = await saveWithCoverUploadError(new Error("NetworkError"));
    expect(result.current.saveError).toBe("goal.cover.errorNetwork");
  });

  // FR6: Non-Error thrown objects default to errorNetwork
  it("should map non-Error thrown value to goal.cover.errorNetwork", async () => {
    const result = await saveWithCoverUploadError("some string error");
    expect(result.current.saveError).toBe("goal.cover.errorNetwork");
  });
});
