import { Search } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { GoalItem } from "@/components/goals/GoalItem";
import { IdeaDetailPanel } from "@/components/ideas/IdeaDetailPanel";
import { IdeaItem } from "@/components/ideas/IdeaItem";
import {
  RightFilterPanel,
  type RightPanelMode,
} from "@/components/tasks/RightFilterPanel";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { TaskList } from "@/components/tasks/TaskList";
import { ROUTES } from "@/constants";
import { useCategories } from "@/hooks/useCategories";
import { useContexts } from "@/hooks/useContexts";
import { useFocusMode } from "@/hooks/useFocusMode";
import { useGoals } from "@/hooks/useGoals";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { usePanelSide } from "@/hooks/usePanelSide";
import { useSearch } from "@/hooks/useSearch";
import {
  defaultIdeaService,
  defaultTaskService,
} from "@/services/defaultServices";
import { cn } from "@/shared/lib/cn";
import type { Box } from "@/types/common";
import type { Idea, Task } from "@/types/entities";

const SEARCH_DEBOUNCE_MS = 300;

export default function SearchPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const { tasks, goals, ideas, isSearching, search, clear } = useSearch();
  const { goals: allGoals } = useGoals();
  const { contexts } = useContexts();
  const { categories } = useCategories();
  const { panelSide } = usePanelSide();
  const { isPanelOpen, togglePanelOpen } = usePanelOpen();
  const { isFocusMode, focusOpacity } = useFocusMode();
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const query = event.target.value;
      setSearchQuery(query);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!query) {
        clear();
        return;
      }
      debounceRef.current = setTimeout(() => {
        void search(query);
      }, SEARCH_DEBOUNCE_MS);
    },
    [search, clear],
  );

  const handleCompleteTask = useCallback(
    async (id: string) => {
      const task = await defaultTaskService.getById(id);
      if (!task) return;
      if (task.is_completed) {
        await defaultTaskService.noncomplete(id);
      } else {
        await defaultTaskService.complete(id);
      }
      if (searchQuery) void search(searchQuery);
    },
    [searchQuery, search],
  );

  const handleUpdateTask = useCallback(
    async (id: string, changes: Partial<Task>) => {
      await defaultTaskService.update(id, changes);
      if (searchQuery) void search(searchQuery);
    },
    [searchQuery, search],
  );

  const handleMoveTask = useCallback(
    async (id: string, box: Box) => {
      await defaultTaskService.moveToBox(id, box);
      if (searchQuery) void search(searchQuery);
    },
    [searchQuery, search],
  );

  const handleNavigateToGoal = useCallback(
    (id: string) => {
      navigate(`/goals/${id}`);
    },
    [navigate],
  );

  const handleIdeaClick = useCallback((id: string) => {
    setSelectedIdeaId(id);
  }, []);

  const handleIdeaUpdate = useCallback(
    async (id: string, changes: Partial<Idea>) => {
      await defaultIdeaService.update(id, changes);
      if (searchQuery) void search(searchQuery);
    },
    [searchQuery, search],
  );

  const handleIdeaDelete = useCallback(
    async (id: string) => {
      setSelectedIdeaId(null);
      await defaultIdeaService.softDelete(id);
      if (searchQuery) void search(searchQuery);
    },
    [searchQuery, search],
  );

  const handleIdeaClose = useCallback(() => {
    setSelectedIdeaId(null);
  }, []);

  const handleTaskSelect = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
  }, []);

  const handleTaskDetailClose = useCallback(() => {
    setSelectedTaskId(null);
  }, []);

  const handleTaskDelete = useCallback(
    async (id: string) => {
      setSelectedTaskId(null);
      await defaultTaskService.softDelete(id);
      if (searchQuery) void search(searchQuery);
    },
    [searchQuery, search],
  );

  const handleTaskDuplicate = useCallback(
    async (id: string) => {
      await defaultTaskService.duplicate(id);
      if (searchQuery) void search(searchQuery);
    },
    [searchQuery, search],
  );

  const handleModeChange = useCallback(
    (newMode: RightPanelMode) => {
      if (
        newMode === "inbox" ||
        newMode === "tasks" ||
        newMode === "completed"
      ) {
        navigate(ROUTES.INBOX, { state: { filterMode: newMode } });
      } else if (newMode === "categories") {
        navigate(ROUTES.CATEGORIES);
      } else if (newMode === "contexts") {
        navigate(ROUTES.CONTEXTS);
      } else if (newMode === "goals") {
        navigate(ROUTES.GOALS);
      }
    },
    [navigate],
  );

  const hasResults = tasks.length > 0 || goals.length > 0 || ideas.length > 0;
  const hasQuery = searchQuery.length > 0;

  return (
    <div
      data-testid="search-page"
      className="relative flex flex-1 overflow-hidden bg-white"
    >
      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Search header */}
        <header className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-white">
          <Search
            size={16}
            className="text-gray-400 flex-shrink-0"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={t("search.placeholder")}
            aria-label={t("filter.search")}
            className={cn(
              "flex-1 text-sm outline-none placeholder:text-gray-400",
              isSearching && "opacity-60",
            )}
            data-testid="search-input"
          />
        </header>

        {/* Results */}
        <main className="flex-1 overflow-y-auto">
          <div className="xl:max-w-3xl xl:mx-auto">
            {!hasQuery && (
              <p className="text-sm text-gray-400 text-center py-16">
                {t("search.emptyQuery")}
              </p>
            )}

            {hasQuery && !isSearching && !hasResults && (
              <p className="text-sm text-gray-400 text-center py-16">
                {t("search.noResults")}
              </p>
            )}

            {tasks.length > 0 && (
              <section aria-label={t("search.tasks")}>
                <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-2 border-b border-gray-100">
                  {t("search.tasks")}
                </h2>
                <TaskList
                  tasks={tasks}
                  goals={allGoals}
                  contexts={contexts}
                  categories={categories}
                  onComplete={handleCompleteTask}
                  onUpdate={handleUpdateTask}
                  onMove={handleMoveTask}
                  onDelete={handleTaskDelete}
                  onSelect={handleTaskSelect}
                  selectedTaskId={selectedTaskId}
                  isFocusMode={isFocusMode}
                  focusDimmedOpacity={focusOpacity}
                />
              </section>
            )}

            {goals.length > 0 && (
              <section aria-label={t("search.goals")}>
                <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-2 border-b border-gray-100">
                  {t("search.goals")}
                </h2>
                <ul>
                  {goals.map((goal) => (
                    <GoalItem
                      key={goal.id}
                      goal={goal}
                      taskCount={0}
                      onNavigate={handleNavigateToGoal}
                    />
                  ))}
                </ul>
              </section>
            )}

            {ideas.length > 0 && (
              <section aria-label={t("search.ideas")}>
                <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-2 border-b border-gray-100">
                  {t("search.ideas")}
                </h2>
                <ul>
                  {ideas.map((idea) => (
                    <li key={idea.id}>
                      <button
                        type="button"
                        onClick={() => handleIdeaClick(idea.id)}
                        className="w-full text-left"
                      >
                        <IdeaItem idea={idea} />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </main>
      </div>

      {/* Task detail panel */}
      {selectedTaskId &&
        (() => {
          const selectedTask = tasks.find((t) => t.id === selectedTaskId);
          return selectedTask ? (
            <TaskDetailPanel
              task={selectedTask}
              goals={allGoals}
              contexts={contexts}
              categories={categories}
              onUpdate={handleUpdateTask}
              onDelete={handleTaskDelete}
              onDuplicate={handleTaskDuplicate}
              onClose={handleTaskDetailClose}
              className="absolute inset-0 z-10 md:relative md:w-96 md:border-l md:border-gray-100"
            />
          ) : null;
        })()}

      {/* Idea detail panel */}
      {selectedIdeaId &&
        (() => {
          const selectedIdea = ideas.find((idea) => idea.id === selectedIdeaId);
          return selectedIdea ? (
            <IdeaDetailPanel
              idea={selectedIdea}
              onUpdate={handleIdeaUpdate}
              onDelete={handleIdeaDelete}
              onClose={handleIdeaClose}
              className="absolute inset-0 z-10 md:relative md:w-96 md:border-l md:border-gray-100"
            />
          ) : null;
        })()}

      {/* Right filter panel */}
      <RightFilterPanel
        mode="search"
        isOpen={isPanelOpen}
        side={panelSide}
        onToggle={togglePanelOpen}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
