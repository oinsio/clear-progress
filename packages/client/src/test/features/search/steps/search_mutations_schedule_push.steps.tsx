// implements FR1, FR2 of fix-search-page-sync-push
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react/pure";
import type React from "react";
import { MemoryRouter } from "react-router-dom";
import { expect, type TestContext, vi } from "vitest";
import { mockSchedulePush } from "@/app/providers/__mocks__/SyncProvider";
import { buildIdea } from "@/test/factories/ideaFactory";
import { buildTask } from "@/test/factories/taskFactory";
import { createMockGoalService } from "@/test/mocks/goalServiceMock";
import { createMockIdeaService } from "@/test/mocks/ideaServiceMock";
import { createMockTaskService } from "@/test/mocks/taskServiceMock";
import type { Box } from "@/types/common";
import type { Idea, Task } from "@/types/entities";

const feature = await loadFeature("../search_mutations_schedule_push.feature");

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock(
  "@/app/providers/SyncProvider",
  async () => import("@/app/providers/__mocks__/SyncProvider"),
);

vi.mock("@/hooks/useGoals", () => ({
  useGoals: () => ({ goals: [], isLoading: false }),
}));
vi.mock("@/hooks/useContexts", () => ({
  useContexts: () => ({ contexts: [], isLoading: false }),
}));
vi.mock("@/hooks/useCategories", () => ({
  useCategories: () => ({ categories: [], isLoading: false }),
}));
vi.mock("@/hooks/useFocusMode", () => ({
  useFocusMode: () => ({ isFocusMode: false, focusOpacity: 1 }),
}));

vi.mock("@/components/layout/SidebarShell", () => ({
  SidebarShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-shell">{children}</div>
  ),
}));

vi.mock("@/components/tasks/TaskList", () => ({
  TaskList: ({
    tasks,
    onComplete,
    onUpdate,
    onMove,
    onDelete,
    onSelect,
  }: {
    tasks: Task[];
    onComplete: (id: string) => void;
    onUpdate: (id: string, changes: Partial<Task>) => void;
    onMove: (id: string, box: Box) => void;
    onDelete: (id: string) => void;
    onSelect: (id: string) => void;
  }) => (
    <div data-testid="task-list">
      {tasks.map((task) => (
        <div key={task.id} data-testid="task-item" data-task-id={task.id}>
          {task.name}
          <button
            data-testid={`complete-${task.id}`}
            onClick={() => onComplete(task.id)}
          />
          <button
            data-testid={`update-${task.id}`}
            onClick={() => onUpdate(task.id, { name: "Updated name" })}
          />
          <button
            data-testid={`move-${task.id}`}
            onClick={() => onMove(task.id, "next" as Box)}
          />
          <button
            data-testid={`delete-${task.id}`}
            onClick={() => onDelete(task.id)}
          />
          <button
            data-testid={`select-${task.id}`}
            onClick={() => onSelect(task.id)}
          />
        </div>
      ))}
    </div>
  ),
}));

vi.mock("@/components/tasks/TaskDetailPanel", () => ({
  TaskDetailPanel: ({
    task,
    onDuplicate,
  }: {
    task: Task;
    onDuplicate: (id: string) => void;
  }) => (
    <div data-testid="task-detail-panel">
      <button
        data-testid={`duplicate-${task.id}`}
        onClick={() => onDuplicate(task.id)}
      />
    </div>
  ),
}));

vi.mock("@/components/ideas/IdeaItem", () => ({
  IdeaItem: ({ idea }: { idea: Idea }) => (
    <button type="button" data-testid={`idea-item-${idea.id}`}>
      <span>{idea.name}</span>
    </button>
  ),
}));

vi.mock("@/components/ideas/IdeaDetailPanel", () => ({
  IdeaDetailPanel: ({
    idea,
    onUpdate,
    onDelete,
  }: {
    idea: Idea;
    onUpdate: (id: string, changes: Partial<Idea>) => void;
    onDelete: (id: string) => void;
  }) => (
    <div data-testid="idea-detail-panel">
      <button
        data-testid={`update-idea-${idea.id}`}
        onClick={() => onUpdate(idea.id, { name: "Updated idea name" })}
      />
      <button
        data-testid={`delete-idea-${idea.id}`}
        onClick={() => onDelete(idea.id)}
      />
    </div>
  ),
}));

const foundTask = buildTask({ name: "Search Result Task" });
const foundIdea = buildIdea({ name: "Search Result Idea" });

const mockGetById = vi.fn().mockResolvedValue(foundTask);
const mockComplete = vi.fn().mockResolvedValue({
  completed: foundTask,
  recurringResult: { status: "not_recurring" },
});
const mockNoncomplete = vi.fn().mockResolvedValue(undefined);
const mockUpdate = vi.fn().mockResolvedValue(undefined);
const mockMoveToBox = vi.fn().mockResolvedValue(undefined);
const mockSoftDelete = vi.fn().mockResolvedValue(undefined);
const mockDuplicate = vi.fn().mockResolvedValue(undefined);
const mockTaskSearchByName = vi.fn().mockResolvedValue([foundTask]);

const mockIdeaUpdate = vi.fn().mockResolvedValue(undefined);
const mockIdeaSoftDelete = vi.fn().mockResolvedValue(undefined);
const mockIdeaSearchByName = vi.fn().mockResolvedValue([foundIdea]);

vi.mock("@/services/defaultServices", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/services/defaultServices")>();
  return {
    ...actual,
    defaultTaskService: createMockTaskService({
      getById: (...args: unknown[]) => mockGetById(...args),
      complete: (...args: unknown[]) => mockComplete(...args),
      noncomplete: (...args: unknown[]) => mockNoncomplete(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      moveToBox: (...args: unknown[]) => mockMoveToBox(...args),
      softDelete: (...args: unknown[]) => mockSoftDelete(...args),
      duplicate: (...args: unknown[]) => mockDuplicate(...args),
      searchByName: (...args: unknown[]) => mockTaskSearchByName(...args),
    }),
    defaultGoalService: createMockGoalService({
      searchByName: vi.fn().mockResolvedValue([]),
    }),
    defaultIdeaService: createMockIdeaService({
      update: (...args: unknown[]) => mockIdeaUpdate(...args),
      softDelete: (...args: unknown[]) => mockIdeaSoftDelete(...args),
      searchByName: (...args: unknown[]) => mockIdeaSearchByName(...args),
    }),
  };
});

const { default: SearchPage } = await import("@/pages/SearchPage");

function renderSearchPage() {
  return render(
    <MemoryRouter>
      <SearchPage />
    </MemoryRouter>,
  );
}

async function typeSearchQueryAndFindTaskItem(query: string) {
  const searchInput = screen.getByTestId("search-input");
  fireEvent.change(searchInput, { target: { value: query } });
  const taskItem = await screen.findByTestId(`complete-${foundTask.id}`);
  await vi.waitFor(() => {
    expect(mockTaskSearchByName).toHaveBeenCalledWith(query);
  });
  return taskItem;
}

async function typeSearchQueryAndOpenIdeaPanel(query: string) {
  const searchInput = screen.getByTestId("search-input");
  fireEvent.change(searchInput, { target: { value: query } });
  const ideaItem = await screen.findByTestId(`idea-item-${foundIdea.id}`);
  await vi.waitFor(() => {
    expect(mockIdeaSearchByName).toHaveBeenCalledWith(query);
  });
  fireEvent.click(ideaItem);
  return screen.findByTestId(`update-idea-${foundIdea.id}`);
}

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      cleanup();
      mockSchedulePush.mockClear();
      mockGetById.mockClear().mockResolvedValue(foundTask);
      mockComplete.mockClear();
      mockNoncomplete.mockClear();
      mockUpdate.mockClear();
      mockMoveToBox.mockClear();
      mockSoftDelete.mockClear();
      mockDuplicate.mockClear();
      mockTaskSearchByName.mockClear().mockResolvedValue([foundTask]);
      mockIdeaUpdate.mockClear();
      mockIdeaSoftDelete.mockClear();
      mockIdeaSearchByName.mockClear().mockResolvedValue([foundIdea]);
    });

    // @fix-search-page-sync-push @FR1
    f.Scenario(
      "Completing a task from search results schedules a push",
      ({ Given, When, Then, And }) => {
        Given('a task "Search Result Task" is found by search', async () => {
          mockGetById.mockResolvedValue(
            buildTask({ ...foundTask, is_completed: false }),
          );
          renderSearchPage();
        });

        When("the user completes the task from search results", async () => {
          const completeButton = await typeSearchQueryAndFindTaskItem("Search");
          fireEvent.click(completeButton);
        });

        Then("the task completion is written locally", async () => {
          await vi.waitFor(() => {
            expect(mockComplete).toHaveBeenCalledWith(
              foundTask.id,
              expect.any(String),
            );
          });
        });

        And("schedulePush is called exactly once", async () => {
          expect(mockSchedulePush).toHaveBeenCalledOnce();
        });
      },
    );

    // @fix-search-page-sync-push @FR1
    f.Scenario(
      "Uncompleting a task from search results schedules a push",
      ({ Given, When, Then, And }) => {
        Given(
          'a completed task "Search Result Task" is found by search',
          async () => {
            mockGetById.mockResolvedValue(
              buildTask({ ...foundTask, is_completed: true }),
            );
            renderSearchPage();
          },
        );

        When("the user uncompletes the task from search results", async () => {
          const completeButton = await typeSearchQueryAndFindTaskItem("Search");
          fireEvent.click(completeButton);
        });

        Then("the task uncompletion is written locally", async () => {
          await vi.waitFor(() => {
            expect(mockNoncomplete).toHaveBeenCalledWith(foundTask.id);
          });
        });

        And("schedulePush is called exactly once", async () => {
          expect(mockSchedulePush).toHaveBeenCalledOnce();
        });
      },
    );

    // @fix-search-page-sync-push @FR1
    f.Scenario(
      "Editing a task from search results schedules a push",
      ({ Given, When, Then, And }) => {
        Given('a task "Search Result Task" is found by search', async () => {
          renderSearchPage();
        });

        When("the user edits the task from search results", async () => {
          const searchInput = screen.getByTestId("search-input");
          fireEvent.change(searchInput, { target: { value: "Search" } });
          const updateButton = await screen.findByTestId(
            `update-${foundTask.id}`,
          );
          await vi.waitFor(() => {
            expect(mockTaskSearchByName).toHaveBeenCalledWith("Search");
          });
          fireEvent.click(updateButton);
        });

        Then("the task edit is written locally", async () => {
          await vi.waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith(foundTask.id, {
              name: "Updated name",
            });
          });
        });

        And("schedulePush is called exactly once", async () => {
          expect(mockSchedulePush).toHaveBeenCalledOnce();
        });
      },
    );

    // @fix-search-page-sync-push @FR1
    f.Scenario(
      "Moving a task from search results schedules a push",
      ({ Given, When, Then, And }) => {
        Given('a task "Search Result Task" is found by search', async () => {
          renderSearchPage();
        });

        When(
          "the user moves the task to a different box from search results",
          async () => {
            const searchInput = screen.getByTestId("search-input");
            fireEvent.change(searchInput, { target: { value: "Search" } });
            const moveButton = await screen.findByTestId(
              `move-${foundTask.id}`,
            );
            await vi.waitFor(() => {
              expect(mockTaskSearchByName).toHaveBeenCalledWith("Search");
            });
            fireEvent.click(moveButton);
          },
        );

        Then("the task move is written locally", async () => {
          await vi.waitFor(() => {
            expect(mockMoveToBox).toHaveBeenCalledWith(foundTask.id, "next");
          });
        });

        And("schedulePush is called exactly once", async () => {
          expect(mockSchedulePush).toHaveBeenCalledOnce();
        });
      },
    );

    // @fix-search-page-sync-push @FR1
    f.Scenario(
      "Deleting a task from search results schedules a push",
      ({ Given, When, Then, And }) => {
        Given('a task "Search Result Task" is found by search', async () => {
          renderSearchPage();
        });

        When("the user deletes the task from search results", async () => {
          const searchInput = screen.getByTestId("search-input");
          fireEvent.change(searchInput, { target: { value: "Search" } });
          const deleteButton = await screen.findByTestId(
            `delete-${foundTask.id}`,
          );
          await vi.waitFor(() => {
            expect(mockTaskSearchByName).toHaveBeenCalledWith("Search");
          });
          fireEvent.click(deleteButton);
        });

        Then("the task deletion is written locally", async () => {
          await vi.waitFor(() => {
            expect(mockSoftDelete).toHaveBeenCalledWith(foundTask.id);
          });
        });

        And("schedulePush is called exactly once", async () => {
          expect(mockSchedulePush).toHaveBeenCalledOnce();
        });
      },
    );

    // @fix-search-page-sync-push @FR1
    f.Scenario(
      "Duplicating a task from the task detail panel opened from search schedules a push",
      ({ Given, When, Then, And }) => {
        Given('a task "Search Result Task" is found by search', async () => {
          renderSearchPage();
        });

        When(
          "the user duplicates the task from the task detail panel opened from search",
          async () => {
            const searchInput = screen.getByTestId("search-input");
            fireEvent.change(searchInput, { target: { value: "Search" } });
            const selectButton = await screen.findByTestId(
              `select-${foundTask.id}`,
            );
            await vi.waitFor(() => {
              expect(mockTaskSearchByName).toHaveBeenCalledWith("Search");
            });
            fireEvent.click(selectButton);
            const duplicateButton = await screen.findByTestId(
              `duplicate-${foundTask.id}`,
            );
            fireEvent.click(duplicateButton);
          },
        );

        Then("the task duplication is written locally", async () => {
          await vi.waitFor(() => {
            expect(mockDuplicate).toHaveBeenCalledWith(foundTask.id);
          });
        });

        And("schedulePush is called exactly once", async () => {
          expect(mockSchedulePush).toHaveBeenCalledOnce();
        });
      },
    );

    // @fix-search-page-sync-push @FR2
    f.Scenario(
      "Editing an idea from the idea detail panel opened from search schedules a push",
      ({ Given, When, Then, And }) => {
        Given('an idea "Search Result Idea" is found by search', async () => {
          renderSearchPage();
        });

        When(
          "the user edits the idea from the idea detail panel opened from search",
          async () => {
            const updateButton =
              await typeSearchQueryAndOpenIdeaPanel("Search");
            fireEvent.click(updateButton);
          },
        );

        Then("the idea edit is written locally", async () => {
          await vi.waitFor(() => {
            expect(mockIdeaUpdate).toHaveBeenCalledWith(foundIdea.id, {
              name: "Updated idea name",
            });
          });
        });

        And("schedulePush is called exactly once", async () => {
          expect(mockSchedulePush).toHaveBeenCalledOnce();
        });
      },
    );

    // @fix-search-page-sync-push @FR2
    f.Scenario(
      "Deleting an idea from the idea detail panel opened from search schedules a push",
      ({ Given, When, Then, And }) => {
        Given('an idea "Search Result Idea" is found by search', async () => {
          renderSearchPage();
        });

        When(
          "the user deletes the idea from the idea detail panel opened from search",
          async () => {
            await typeSearchQueryAndOpenIdeaPanel("Search");
            const deleteButton = await screen.findByTestId(
              `delete-idea-${foundIdea.id}`,
            );
            fireEvent.click(deleteButton);
          },
        );

        Then("the idea deletion is written locally", async () => {
          await vi.waitFor(() => {
            expect(mockIdeaSoftDelete).toHaveBeenCalledWith(foundIdea.id);
          });
        });

        And("schedulePush is called exactly once", async () => {
          expect(mockSchedulePush).toHaveBeenCalledOnce();
        });
      },
    );

    // @fix-search-page-sync-push @FR1 @FR2
    f.Scenario(
      "Running a search without any mutation does not schedule a push",
      ({ Given, When, Then }) => {
        Given('a task "Search Result Task" is found by search', async () => {
          renderSearchPage();
        });

        When("the user types a search query and search executes", async () => {
          const searchInput = screen.getByTestId("search-input");
          fireEvent.change(searchInput, { target: { value: "Search" } });
          await vi.waitFor(() => {
            expect(mockTaskSearchByName).toHaveBeenCalledWith("Search");
          });
        });

        Then("schedulePush is not called", async (_ctx: TestContext) => {
          expect(mockSchedulePush).not.toHaveBeenCalled();
        });
      },
    );
  },
);
