import { Tag } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EntityDetailLayout } from "@/components/tasks/EntityDetailLayout";
import type { SidebarMode } from "@/components/tasks/Sidebar";
import { ROUTES } from "@/constants";
import { useCategories } from "@/hooks/useCategories";
import { useCategoryTasks } from "@/hooks/useCategoryTasks";
import { useContexts } from "@/hooks/useContexts";
import { useGoals } from "@/hooks/useGoals";

const CATEGORY_I18N_KEYS = {
  back: "category.back",
  name: "selector.category",
  notFound: "category.notFound",
  deleteLabel: "category.deleteLabel",
  editName: "category.editName",
  saveName: "category.saveName",
} as const;

export default function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { categories, updateCategory, deleteCategory } = useCategories();
  const { goals } = useGoals();
  const { contexts } = useContexts();
  const {
    tasks,
    isLoading,
    createTask,
    completeTask,
    updateTask,
    moveTask,
    deleteTask,
    duplicateTask,
  } = useCategoryTasks(id ?? "");

  const category = useMemo(
    () => categories.find((c) => c.id === id && !c.is_deleted),
    [categories, id],
  );

  const handleSaveEntity = useCallback(
    async (name: string) => {
      if (!id) return;
      await updateCategory(id, name);
    },
    [id, updateCategory],
  );

  const handleDeleteEntity = useCallback(async () => {
    if (!id) return;
    await deleteCategory(id);
    navigate(ROUTES.CATEGORIES);
  }, [id, deleteCategory, navigate]);

  const handleModeChange = useCallback(
    (newMode: SidebarMode) => {
      if (newMode === "inbox" || newMode === "tasks" || newMode === "completed")
        navigate(ROUTES.INBOX, { state: { filterMode: newMode } });
    },
    [navigate],
  );

  return (
    <EntityDetailLayout
      entity={category}
      isLoading={isLoading}
      tasks={tasks}
      goals={goals}
      contexts={contexts}
      categories={categories}
      icon={Tag}
      panelMode="categories"
      backRoute={ROUTES.CATEGORIES}
      testIdPrefix="category"
      i18nKeys={CATEGORY_I18N_KEYS}
      onSaveEntity={handleSaveEntity}
      onDeleteEntity={handleDeleteEntity}
      onCreateTask={createTask}
      onCompleteTask={completeTask}
      onUpdateTask={updateTask}
      onMoveTask={moveTask}
      onDeleteTask={deleteTask}
      onDuplicateTask={duplicateTask}
      onModeChange={handleModeChange}
    />
  );
}
