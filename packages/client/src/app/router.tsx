import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RouteErrorFallback } from "@/components/RouteErrorFallback";
import { ROUTES } from "@/constants";
import ActiveTasksPage from "@/pages/ActiveTasksPage";
import CategoriesPage from "@/pages/CategoriesPage";
import CategoryDetailPage from "@/pages/CategoryDetailPage";
import CompletedPage from "@/pages/CompletedPage";
import ContextDetailPage from "@/pages/ContextDetailPage";
import ContextsPage from "@/pages/ContextsPage";
import DeletedPage from "@/pages/DeletedPage";
import GoalDetailPage from "@/pages/GoalDetailPage";
import GoalsPage from "@/pages/GoalsPage";
import IdeasPage from "@/pages/IdeasPage";
import InboxPage from "@/pages/InboxPage";
import SearchPage from "@/pages/SearchPage";
import SettingsPage from "@/pages/SettingsPage";

/** All routes share AppShell (provides SideNav on tablet/desktop) */
function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Navigate to={ROUTES.TASKS} replace />,
    },
    {
      element: <AppLayout />,
      errorElement: <RouteErrorFallback />,
      children: [
        { path: ROUTES.INBOX, element: <InboxPage /> },
        { path: ROUTES.TASKS, element: <ActiveTasksPage /> },
        { path: ROUTES.COMPLETED, element: <CompletedPage /> },
        { path: ROUTES.CATEGORIES, element: <CategoriesPage /> },
        { path: ROUTES.CATEGORY, element: <CategoryDetailPage /> },
        { path: ROUTES.CONTEXTS, element: <ContextsPage /> },
        { path: ROUTES.CONTEXT, element: <ContextDetailPage /> },
        { path: ROUTES.SETTINGS, element: <SettingsPage /> },
        { path: ROUTES.GOALS, element: <GoalsPage /> },
        { path: ROUTES.GOAL, element: <GoalDetailPage /> },
        { path: ROUTES.IDEAS, element: <IdeasPage /> },
        { path: ROUTES.SEARCH, element: <SearchPage /> },
        { path: ROUTES.DELETED, element: <DeletedPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
);
