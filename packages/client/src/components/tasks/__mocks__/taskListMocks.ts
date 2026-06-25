import { vi } from "vitest";

export const mockUseChecklist = vi.fn().mockReturnValue({
  items: [],
  progress: { completed: 0, total: 0 },
  hasUnsyncedItems: false,
  isLoading: false,
  reload: vi.fn(),
  createItem: vi.fn(),
  toggleItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  reorderItems: vi.fn(),
});

export const mockUseIsDesktop = vi.fn().mockReturnValue(false);

export const mockUseHasTouchPointer = vi.fn().mockReturnValue(false);

vi.mock("@/hooks/useChecklist", () => ({
  useChecklist: mockUseChecklist,
}));

vi.mock("@/hooks/useIsDesktop", () => ({
  useIsDesktop: mockUseIsDesktop,
}));

vi.mock("@/hooks/useHasTouchPointer", () => ({
  useHasTouchPointer: mockUseHasTouchPointer,
}));

vi.mock("@/hooks/useAttachmentCount", () => ({
  useAttachmentCount: vi.fn().mockReturnValue({
    attachmentCount: 0,
    hasUnsyncedAttachments: false,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useSwipeGesture", () => ({
  useSwipeGesture: vi.fn().mockReturnValue({
    translateX: 0,
    isThresholdReached: false,
    isSwiping: false,
  }),
}));
