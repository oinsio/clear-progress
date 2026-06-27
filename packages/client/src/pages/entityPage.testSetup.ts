/**
 * Shared test mocks for entity list pages (Categories, Contexts, Goals).
 * Implements FR20 of command-bar.
 */
import { vi } from "vitest";

vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: () => ({
    accessToken: null,
    userEmail: null,
    userPicture: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    silentRefresh: vi.fn(),
  }),
}));

vi.mock("@/hooks/usePanelSide");

vi.mock("@/hooks/useSidebarState", () => ({
  useSidebarState: () => ({
    effectiveState: "collapsed",
    sidebarMode: "expanded",
    setSidebarMode: vi.fn(),
    isNarrow: true,
    hasHover: false,
  }),
}));

vi.mock("@/db/repositories/TaskRepository", () => ({
  TaskRepository: vi.fn().mockImplementation(() => ({})),
}));

vi.mock("@/db/repositories/ChecklistRepository", () => ({
  ChecklistRepository: vi.fn().mockImplementation(() => ({})),
}));

vi.mock("@/hooks/useFilterBarPosition", () => ({
  useFilterBarPosition: () => ({
    filterBarPosition: "bottom",
    setFilterBarPosition: vi.fn(),
  }),
}));

vi.mock("@/hooks/useHandedness", () => ({
  useHandedness: () => ({
    handedness: "right",
    setHandedness: vi.fn(),
  }),
}));
