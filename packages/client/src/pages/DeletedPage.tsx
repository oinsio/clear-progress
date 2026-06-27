import {
  AlertTriangle,
  ArchiveRestore,
  ChevronDown,
  Lightbulb,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SidebarShell } from "@/components/layout/SidebarShell";
import { SwipeableItem } from "@/components/shared/SwipeableItem";
import { useDeletedEntities } from "@/hooks/useDeletedEntities";
import { usePurge } from "@/hooks/usePurge";
import { useRestoreEntity } from "@/hooks/useRestoreEntity";
import { useSectionCollapse } from "@/hooks/useSectionCollapse";
import { cn } from "@/shared/lib/cn";

const SECTION_KEY_TASKS = "deleted-tasks";
const SECTION_KEY_GOALS = "deleted-goals";
const SECTION_KEY_IDEAS = "deleted-ideas";
const SECTION_KEY_CONTEXTS = "deleted-contexts";
const SECTION_KEY_CATEGORIES = "deleted-categories";
const SECTION_KEY_CHECKLISTS = "deleted-checklists";

interface CollapsibleSectionProps {
  sectionKey: string;
  name: string;
  count: number;
  children: React.ReactNode;
}

function CollapsibleSection({
  sectionKey,
  name,
  count,
  children,
}: CollapsibleSectionProps) {
  const { isCollapsed, toggleCollapse } = useSectionCollapse(sectionKey);

  return (
    <section>
      <button
        type="button"
        onClick={toggleCollapse}
        aria-expanded={!isCollapsed}
        className="w-full flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100 sticky top-0 z-10"
      >
        <h2 className="text-sm font-semibold text-accent">
          {name}
          {count > 0 && <span className="ml-2 text-accent/50">({count})</span>}
        </h2>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-gray-300 transition-transform duration-200",
            isCollapsed && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      {!isCollapsed && children}
    </section>
  );
}

interface DeletedSectionProps<T extends { id: string }> {
  sectionKey: string;
  name: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function DeletedSection<T extends { id: string }>({
  sectionKey,
  name,
  items,
  renderItem,
}: DeletedSectionProps<T>) {
  const { t } = useTranslation();

  return (
    <CollapsibleSection
      sectionKey={sectionKey}
      name={name}
      count={items.length}
    >
      {items.length === 0 ? (
        <p className="px-4 py-3 text-sm text-gray-300">
          {t("deleted.sectionEmpty")}
        </p>
      ) : (
        <ul>
          {items.map((item) => (
            <li
              key={item.id}
              className="px-4 py-3 border-b border-gray-50 last:border-0"
            >
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </CollapsibleSection>
  );
}

export default function DeletedPage() {
  const { t } = useTranslation();
  const {
    tasks,
    goals,
    ideas,
    contexts,
    categories,
    checklistItems,
    taskNameMap,
    isLoading,
  } = useDeletedEntities();
  const {
    restoreTask,
    restoreGoal,
    restoreIdea,
    restoreContext,
    restoreCategory,
    restoreChecklistItem,
  } = useRestoreEntity();

  const { purge, isPurging } = usePurge();
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [purgeError, setPurgeError] = useState<string | null>(null);

  const isEmpty =
    tasks.length === 0 &&
    goals.length === 0 &&
    ideas.length === 0 &&
    contexts.length === 0 &&
    categories.length === 0 &&
    checklistItems.length === 0;

  const handlePurgeClick = () => {
    setShowPurgeDialog(true);
  };

  const handlePurgeConfirm = async () => {
    try {
      setPurgeError(null);
      await purge();
      setShowPurgeDialog(false);
    } catch (error) {
      console.error("Purge failed:", error);
      setPurgeError(t("deleted.purgeError"));
    }
  };

  return (
    <SidebarShell mode={null}>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2 bg-white">
          <div className="flex items-center gap-2">
            <Trash2
              className="w-4 h-4 text-accent flex-shrink-0"
              aria-hidden="true"
            />
            <h1 className="text-lg font-semibold text-accent">
              {t("deleted.pageName")}
            </h1>
          </div>
          <button
            type="button"
            onClick={handlePurgeClick}
            disabled={isEmpty || isPurging}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
            {isPurging
              ? t("deleted.purgingInProgress")
              : t("deleted.purgeButton")}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="xl:max-w-3xl xl:mx-auto">
            {isLoading && (
              <p className="text-sm text-gray-400 text-center py-16">
                {t("deleted.loading")}
              </p>
            )}

            {!isLoading && isEmpty && (
              <p className="text-sm text-gray-400 text-center py-16">
                {t("deleted.empty")}
              </p>
            )}

            {!isLoading && !isEmpty && (
              <>
                <DeletedSection
                  sectionKey={SECTION_KEY_TASKS}
                  name={t("deleted.tasks")}
                  items={tasks}
                  renderItem={(task) => (
                    <SwipeableItem
                      swipeRight={{
                        onAction: () => void restoreTask(task.id),
                        color: "bg-blue-500",
                        icon: ArchiveRestore,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-gray-400 line-through">
                          {task.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => void restoreTask(task.id)}
                          aria-label={t("deleted.restoreAriaLabel", {
                            name: task.name,
                          })}
                          className="flex-shrink-0 p-1.5 text-gray-300 hover:text-gray-500 transition-colors"
                        >
                          <ArchiveRestore
                            className="w-4 h-4"
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    </SwipeableItem>
                  )}
                />

                <DeletedSection
                  sectionKey={SECTION_KEY_CHECKLISTS}
                  name={t("deleted.checklists")}
                  items={checklistItems}
                  renderItem={(item) => {
                    const parentTaskName = taskNameMap.get(item.task_id);
                    return (
                      <SwipeableItem
                        swipeRight={{
                          onAction: () => void restoreChecklistItem(item.id),
                          color: "bg-blue-500",
                          icon: ArchiveRestore,
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-sm text-gray-400 line-through">
                              {item.name}
                            </span>
                            {parentTaskName !== undefined && (
                              <p className="text-xs text-gray-300 mt-0.5">
                                {t("deleted.checklistParent", {
                                  task: parentTaskName,
                                })}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => void restoreChecklistItem(item.id)}
                            aria-label={t("deleted.restoreAriaLabel", {
                              name: item.name,
                            })}
                            className="flex-shrink-0 p-1.5 text-gray-300 hover:text-gray-500 transition-colors"
                          >
                            <ArchiveRestore
                              className="w-4 h-4"
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      </SwipeableItem>
                    );
                  }}
                />

                <DeletedSection
                  sectionKey={SECTION_KEY_GOALS}
                  name={t("deleted.goals")}
                  items={goals}
                  renderItem={(goal) => (
                    <SwipeableItem
                      swipeRight={{
                        onAction: () => void restoreGoal(goal.id),
                        color: "bg-blue-500",
                        icon: ArchiveRestore,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-gray-400 line-through">
                          {goal.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => void restoreGoal(goal.id)}
                          aria-label={t("deleted.restoreAriaLabel", {
                            name: goal.name,
                          })}
                          className="flex-shrink-0 p-1.5 text-gray-300 hover:text-gray-500 transition-colors"
                        >
                          <ArchiveRestore
                            className="w-4 h-4"
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    </SwipeableItem>
                  )}
                />

                <DeletedSection
                  sectionKey={SECTION_KEY_IDEAS}
                  name={t("deleted.ideas")}
                  items={ideas}
                  renderItem={(idea) => (
                    <SwipeableItem
                      swipeRight={{
                        onAction: () => void restoreIdea(idea.id),
                        color: "bg-blue-500",
                        icon: ArchiveRestore,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Lightbulb
                            className="w-4 h-4 text-gray-300 flex-shrink-0"
                            aria-hidden="true"
                          />
                          <span className="text-sm text-gray-400 line-through">
                            {idea.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => void restoreIdea(idea.id)}
                          aria-label={t("deleted.restoreAriaLabel", {
                            name: idea.name,
                          })}
                          className="flex-shrink-0 p-1.5 text-gray-300 hover:text-gray-500 transition-colors"
                        >
                          <ArchiveRestore
                            className="w-4 h-4"
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    </SwipeableItem>
                  )}
                />

                <DeletedSection
                  sectionKey={SECTION_KEY_CONTEXTS}
                  name={t("deleted.contexts")}
                  items={contexts}
                  renderItem={(context) => (
                    <SwipeableItem
                      swipeRight={{
                        onAction: () => void restoreContext(context.id),
                        color: "bg-blue-500",
                        icon: ArchiveRestore,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-gray-400 line-through">
                          {context.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => void restoreContext(context.id)}
                          aria-label={t("deleted.restoreAriaLabel", {
                            name: context.name,
                          })}
                          className="flex-shrink-0 p-1.5 text-gray-300 hover:text-gray-500 transition-colors"
                        >
                          <ArchiveRestore
                            className="w-4 h-4"
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    </SwipeableItem>
                  )}
                />

                <DeletedSection
                  sectionKey={SECTION_KEY_CATEGORIES}
                  name={t("deleted.categories")}
                  items={categories}
                  renderItem={(category) => (
                    <SwipeableItem
                      swipeRight={{
                        onAction: () => void restoreCategory(category.id),
                        color: "bg-blue-500",
                        icon: ArchiveRestore,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-gray-400 line-through">
                          {category.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => void restoreCategory(category.id)}
                          aria-label={t("deleted.restoreAriaLabel", {
                            name: category.name,
                          })}
                          className="flex-shrink-0 p-1.5 text-gray-300 hover:text-gray-500 transition-colors"
                        >
                          <ArchiveRestore
                            className="w-4 h-4"
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    </SwipeableItem>
                  )}
                />
              </>
            )}
          </div>
        </main>
      </div>

      {showPurgeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {t("deleted.purgeConfirmName")}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {t("deleted.purgeConfirmMessage")}
            </p>
            <div className="text-sm text-gray-600 mb-6">
              {t("deleted.purgeConfirmCount", {
                tasks: tasks.length,
                goals: goals.length,
                contexts: contexts.length,
                categories: categories.length,
                checklist_items: checklistItems.length,
                ideas: ideas.length,
              })}
            </div>
            {purgeError && (
              <p className="text-sm text-red-500 mb-4">{purgeError}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowPurgeDialog(false);
                  setPurgeError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t("deleted.purgeCancel")}
              </button>
              <button
                type="button"
                onClick={handlePurgeConfirm}
                disabled={isPurging}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPurging
                  ? t("deleted.purgingInProgress")
                  : t("deleted.purgeConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </SidebarShell>
  );
}
