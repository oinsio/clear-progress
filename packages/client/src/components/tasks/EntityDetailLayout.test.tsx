import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MapPin } from "lucide-react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UseSettingsReturn } from "@/hooks/useSettings";
import type { Task } from "@/types/entities";
import {
  EntityDetailLayout,
  type EntityDetailLayoutProps,
} from "./EntityDetailLayout";

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
vi.mock("@/hooks/usePanelOpen");
vi.mock("@/hooks/useIsUnsynced");
vi.mock("@/hooks/useIsDesktop");
vi.mock("@/hooks/usePanelSplit");
vi.mock("@/hooks/useSettings");

import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useIsUnsynced } from "@/hooks/useIsUnsynced";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelSplit } from "@/hooks/usePanelSplit";
import { useSettings } from "@/hooks/useSettings";

const mockUsePanelSide = vi.mocked(usePanelSide);
const mockUsePanelOpen = vi.mocked(usePanelOpen);
const mockUseIsUnsynced = vi.mocked(useIsUnsynced);
const mockUseIsDesktop = vi.mocked(useIsDesktop);
const mockUsePanelSplit = vi.mocked(usePanelSplit);
const mockUseSettings = vi.mocked(useSettings);

function buildSettingsHook(
  overrides: Partial<UseSettingsReturn> = {},
): UseSettingsReturn {
  return {
    defaultBox: "inbox",
    accentColor: "green",
    isLoading: false,
    setDefaultBox: vi.fn().mockResolvedValue(undefined),
    setAccentColor: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function buildProps(
  overrides: Partial<EntityDetailLayoutProps> = {},
): EntityDetailLayoutProps {
  return {
    entity: {
      name: "Работа",
      updated_at: "2025-01-01T00:00:00.000Z",
      needsSync: false,
    },
    isLoading: false,
    tasks: [],
    goals: [],
    contexts: [],
    categories: [],
    icon: MapPin,
    panelMode: null,
    backRoute: "/contexts",
    testIdPrefix: "context",
    i18nKeys: {
      back: "context.back",
      name: "context.name",
      notFound: "context.notFound",
      deleteLabel: "context.deleteLabel",
      editName: "context.editName",
      saveName: "context.saveName",
    },
    onSaveEntity: vi.fn().mockResolvedValue(undefined),
    onDeleteEntity: vi.fn().mockResolvedValue(undefined),
    onCreateTask: vi.fn().mockResolvedValue(undefined),
    onCompleteTask: vi.fn(),
    onUpdateTask: vi.fn().mockResolvedValue(undefined),
    onMoveTask: vi.fn().mockResolvedValue(undefined),
    onDeleteTask: vi.fn(),
    onDuplicateTask: vi.fn().mockResolvedValue({} as Task),
    onModeChange: vi.fn(),
    ...overrides,
  };
}

function renderLayout(overrides: Partial<EntityDetailLayoutProps> = {}) {
  const props = buildProps(overrides);
  render(
    <MemoryRouter>
      <EntityDetailLayout {...props} />
    </MemoryRouter>,
  );
  return props;
}

beforeEach(() => {
  mockUsePanelSide.mockReturnValue({
    panelSide: "right",
    setPanelSide: vi.fn(),
  });
  mockUsePanelOpen.mockReturnValue({
    isPanelOpen: false,
    togglePanelOpen: vi.fn(),
  });
  mockUseIsUnsynced.mockReturnValue(false);
  mockUseIsDesktop.mockReturnValue(false);
  mockUsePanelSplit.mockReturnValue({
    ratio: 0.5,
    setRatio: vi.fn(),
    containerRef: { current: null },
    handleResizeMouseDown: vi.fn(),
  });
  mockUseSettings.mockReturnValue(buildSettingsHook());
});

describe("EntityDetailLayout — inline task creation", () => {
  it("should render the FAB add-task button", () => {
    renderLayout();
    expect(screen.getByTestId("add-task-button")).toBeInTheDocument();
  });

  it("should show inline input when FAB is clicked", () => {
    renderLayout();
    fireEvent.click(screen.getByTestId("add-task-button"));
    expect(screen.getByTestId("add-task-input")).toBeInTheDocument();
  });

  it("should hide inline input after Escape", () => {
    renderLayout();
    fireEvent.click(screen.getByTestId("add-task-button"));
    const input = screen.getByTestId("add-task-input");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByTestId("add-task-input")).not.toBeInTheDocument();
  });

  it("should call onCreateTask with name and defaultBox when Enter is pressed", async () => {
    const onCreateTask = vi.fn().mockResolvedValue(undefined);
    renderLayout({ onCreateTask });
    fireEvent.click(screen.getByTestId("add-task-button"));
    const input = screen.getByTestId("add-task-input");
    fireEvent.change(input, { target: { value: "Новая задача" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(onCreateTask).toHaveBeenCalledWith("Новая задача", "inbox", "");
    });
  });

  it("should hide inline input after successful task creation", async () => {
    const onCreateTask = vi.fn().mockResolvedValue(undefined);
    renderLayout({ onCreateTask });
    fireEvent.click(screen.getByTestId("add-task-button"));
    const input = screen.getByTestId("add-task-input");
    fireEvent.change(input, { target: { value: "Задача" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(screen.queryByTestId("add-task-input")).not.toBeInTheDocument();
    });
  });
});

describe("EntityDetailLayout — entity name editing", () => {
  it("should save entity name when input loses focus with non-empty value", async () => {
    const onSaveEntity = vi.fn().mockResolvedValue(undefined);
    renderLayout({ onSaveEntity });
    fireEvent.click(screen.getByTestId("context-edit-btn"));
    const input = screen.getByTestId("context-name-input");
    fireEvent.change(input, { target: { value: "Новое имя" } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(onSaveEntity).toHaveBeenCalledWith("Новое имя");
    });
  });

  it("should not save entity name when input loses focus with empty value", async () => {
    const onSaveEntity = vi.fn().mockResolvedValue(undefined);
    renderLayout({ onSaveEntity });
    fireEvent.click(screen.getByTestId("context-edit-btn"));
    const input = screen.getByTestId("context-name-input");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(onSaveEntity).not.toHaveBeenCalled();
  });
});
