import { MapPin } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EntityDetailLayout } from "@/components/tasks/EntityDetailLayout";
import type { SidebarMode } from "@/components/tasks/Sidebar";
import { ROUTES } from "@/constants";
import { useCategories } from "@/hooks/useCategories";
import { useContexts } from "@/hooks/useContexts";
import { useContextTasks } from "@/hooks/useContextTasks";
import { useGoals } from "@/hooks/useGoals";

const CONTEXT_I18N_KEYS = {
  back: "context.back",
  name: "selector.context",
  notFound: "context.notFound",
  deleteLabel: "context.deleteLabel",
  editName: "context.editName",
  saveName: "context.saveName",
} as const;

export default function ContextDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { contexts, updateContext, deleteContext } = useContexts();
  const { goals } = useGoals();
  const { categories } = useCategories();
  const {
    tasks,
    isLoading,
    createTask,
    completeTask,
    updateTask,
    moveTask,
    deleteTask,
    duplicateTask,
  } = useContextTasks(id ?? "");

  const context = useMemo(
    () => contexts.find((c) => c.id === id && !c.is_deleted),
    [contexts, id],
  );

  const handleSaveEntity = useCallback(
    async (name: string) => {
      if (!id) return;
      await updateContext(id, name);
    },
    [id, updateContext],
  );

  const handleDeleteEntity = useCallback(async () => {
    if (!id) return;
    await deleteContext(id);
    navigate(ROUTES.CONTEXTS);
  }, [id, deleteContext, navigate]);

  const handleModeChange = useCallback(
    (newMode: SidebarMode) => {
      if (newMode === "categories") navigate(ROUTES.CATEGORIES);
      else if (
        newMode === "inbox" ||
        newMode === "tasks" ||
        newMode === "completed"
      )
        navigate(ROUTES.INBOX, { state: { filterMode: newMode } });
    },
    [navigate],
  );

  return (
    <EntityDetailLayout
      entity={context}
      isLoading={isLoading}
      tasks={tasks}
      goals={goals}
      contexts={contexts}
      categories={categories}
      icon={MapPin}
      panelMode="contexts"
      backRoute={ROUTES.CONTEXTS}
      testIdPrefix="context"
      i18nKeys={CONTEXT_I18N_KEYS}
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
