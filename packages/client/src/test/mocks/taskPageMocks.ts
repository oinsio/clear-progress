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
vi.mock("@/hooks/useTasks");
vi.mock("@/hooks/useGoals");
vi.mock("@/hooks/useContexts");
vi.mock("@/hooks/useCategories");
vi.mock("@/hooks/useCompletedTasks");
vi.mock("@/hooks/useFocusMode", () => ({
  useFocusMode: () => ({
    isFocusMode: false,
    setFocusMode: vi.fn(),
    focusOpacity: 30,
    setFocusOpacity: vi.fn(),
  }),
}));
import "./settingsMocks";
