import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { PageShell } from "@/components/layout/PageShell";
import { RouteErrorFallback } from "@/components/RouteErrorFallback";
import { ROUTES } from "@/constants";
import CategoriesPage from "@/pages/CategoriesPage";
import CategoryDetailPage from "@/pages/CategoryDetailPage";
import ContextDetailPage from "@/pages/ContextDetailPage";
import ContextsPage from "@/pages/ContextsPage";
import DeletedPage from "@/pages/DeletedPage";
import GoalDetailPage from "@/pages/GoalDetailPage";
import GoalsPage from "@/pages/GoalsPage";
import IdeasPage from "@/pages/IdeasPage";
import InboxPage from "@/pages/InboxPage";
import LaterPage from "@/pages/LaterPage";
import SearchPage from "@/pages/SearchPage";
import SettingsPage from "@/pages/SettingsPage";
import TodayPage from "@/pages/TodayPage";
import WeekPage from "@/pages/WeekPage";

/** All routes share AppShell (provides SideNav on tablet/desktop) */
function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

/** Today / Week / Later also wrap content in PageShell (adds BottomNav on mobile) */
function PageLayout() {
  return (
    <PageShell>
      <Outlet />
    </PageShell>
  );
}

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Navigate to={ROUTES.INBOX} replace />,
    },
    {
      element: <AppLayout />,
      errorElement: <RouteErrorFallback />,
      children: [
        { path: ROUTES.INBOX, element: <InboxPage /> },
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
        {
          element: <PageLayout />,
          children: [
            { path: ROUTES.TODAY, element: <TodayPage /> },
            { path: ROUTES.WEEK, element: <WeekPage /> },
            { path: ROUTES.LATER, element: <LaterPage /> },
          ],
        },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
);
