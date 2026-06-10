// implements FR6, NFR-A1, NFR-R1 of pin-task-detail-panel
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react/pure";
import React from "react";
import { expect, type TestContext, vi } from "vitest";

// Mock useIsDesktop
let mockIsDesktop = true;
vi.mock("@/hooks/useIsDesktop", () => ({
  useIsDesktop: () => mockIsDesktop,
}));

// Mock useDetailPanelPinned
let mockIsDetailPanelPinned = false;
const mockSetDetailPanelPinned = vi.fn();
vi.mock("@/hooks/useDetailPanelPinned", () => ({
  useDetailPanelPinned: () => ({
    isDetailPanelPinned: mockIsDetailPanelPinned,
    setDetailPanelPinned: mockSetDetailPanelPinned,
  }),
}));

// Mock hooks that TaskDetailPanel depends on
vi.mock("@/hooks/useChecklist", () => ({
  useChecklist: () => ({
    items: [],
    progress: { total: 0, done: 0 },
    createItem: vi.fn(),
    toggleItem: vi.fn(),
    deleteItem: vi.fn(),
    updateItem: vi.fn(),
    reorderItems: vi.fn(),
  }),
}));

vi.mock("@/hooks/useAttachments", () => ({
  useAttachments: () => ({
    attachments: [],
  }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock child tab components to avoid transitive dependency on adapters
vi.mock("@/components/tasks/TaskDetailsTab", () => ({
  TaskDetailsTab: () => null,
}));

vi.mock("@/components/tasks/TaskChecklistTab", () => ({
  TaskChecklistTab: () => null,
}));

vi.mock("@/components/tasks/TaskAttachmentsTab", () => ({
  TaskAttachmentsTab: () => null,
}));

const feature = await loadFeature("../pin_detail_panel_button.feature");

// Import AFTER mocks
const { TaskDetailPanel } = await import("@/components/tasks/TaskDetailPanel");

type FeatureContext = Record<string, never>;

const defaultTaskProps = {
  task: {
    id: "test-id",
    name: "Test Task",
    description: "",
    box: "inbox" as const,
    goal_id: "",
    context_id: "",
    category_id: "",
    is_completed: false,
    completed_at: "",
    repeat_rule: "",
    is_hidden: false,
    next_date: "",
    appear_date: "",
    original_task_id: "",
    sort_order: "1000",
    is_deleted: false,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    revision: 0,
    needsSync: false,
  },
  goals: [],
  contexts: [],
  categories: [],
  onUpdate: vi.fn().mockResolvedValue(undefined),
  onMove: vi.fn().mockResolvedValue(undefined),
  onDelete: vi.fn(),
  onDuplicate: vi.fn().mockResolvedValue(undefined),
  onClose: vi.fn(),
};

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      cleanup();
      mockIsDesktop = true;
      mockIsDetailPanelPinned = false;
      mockSetDetailPanelPinned.mockClear();
    });

    // @pin-task-detail-panel @FR6 @NFR-A1
    f.Scenario("Pin button visible on desktop", ({ Given, When, Then }) => {
      Given("the viewport is desktop", (_ctx: TestContext) => {
        mockIsDesktop = true;
      });

      When("TaskDetailPanel is rendered", (_ctx: TestContext) => {
        render(React.createElement(TaskDetailPanel, defaultTaskProps));
      });

      Then("a pin button is visible in the header", (_ctx: TestContext) => {
        const pinButton = screen.getByTestId("pin-detail-panel-button");
        expect(pinButton).toBeDefined();
      });
    });

    // @pin-task-detail-panel @FR6 @NFR-R1
    f.Scenario("Pin button hidden on mobile", ({ Given, When, Then }) => {
      Given("the viewport is mobile", (_ctx: TestContext) => {
        mockIsDesktop = false;
      });

      When("TaskDetailPanel is rendered", (_ctx: TestContext) => {
        render(React.createElement(TaskDetailPanel, defaultTaskProps));
      });

      Then("the pin button is not rendered", (_ctx: TestContext) => {
        const pinButton = screen.queryByTestId("pin-detail-panel-button");
        expect(pinButton).toBeNull();
      });
    });

    // @pin-task-detail-panel @FR6
    f.Scenario(
      "Pin button toggles preference",
      ({ Given, And, When, Then }) => {
        Given("the viewport is desktop", (_ctx: TestContext) => {
          mockIsDesktop = true;
        });

        And("detail panel is not pinned", (_ctx: TestContext) => {
          mockIsDetailPanelPinned = false;
        });

        When("user clicks the pin button", (_ctx: TestContext) => {
          render(React.createElement(TaskDetailPanel, defaultTaskProps));
          const pinButton = screen.getByTestId("pin-detail-panel-button");
          fireEvent.click(pinButton);
        });

        Then("detail panel pinned preference is true", (_ctx: TestContext) => {
          expect(mockSetDetailPanelPinned).toHaveBeenCalledWith(true);
        });
      },
    );

    // @pin-task-detail-panel @FR6 @NFR-A1
    f.Scenario(
      "Pin button shows correct icon when unpinned",
      ({ Given, And, When, Then }) => {
        Given("the viewport is desktop", (_ctx: TestContext) => {
          mockIsDesktop = true;
        });

        And("detail panel is not pinned", (_ctx: TestContext) => {
          mockIsDetailPanelPinned = false;
        });

        When("TaskDetailPanel is rendered", (_ctx: TestContext) => {
          render(React.createElement(TaskDetailPanel, defaultTaskProps));
        });

        Then("pin button has aria-label for pinning", (_ctx: TestContext) => {
          const pinButton = screen.getByTestId("pin-detail-panel-button");
          expect(pinButton.getAttribute("aria-label")).toBe("taskDetail.pin");
        });
      },
    );

    // @pin-task-detail-panel @FR6 @NFR-A1
    f.Scenario(
      "Pin button shows correct icon when pinned",
      ({ Given, And, When, Then }) => {
        Given("the viewport is desktop", (_ctx: TestContext) => {
          mockIsDesktop = true;
        });

        And("detail panel is pinned", (_ctx: TestContext) => {
          mockIsDetailPanelPinned = true;
        });

        When("TaskDetailPanel is rendered", (_ctx: TestContext) => {
          render(React.createElement(TaskDetailPanel, defaultTaskProps));
        });

        Then("pin button has aria-label for unpinning", (_ctx: TestContext) => {
          const pinButton = screen.getByTestId("pin-detail-panel-button");
          expect(pinButton.getAttribute("aria-label")).toBe("taskDetail.unpin");
        });
      },
    );
  },
);
