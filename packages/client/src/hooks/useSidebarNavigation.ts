import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { SidebarMode } from "@/components/tasks/Sidebar";
import { FILTER_ITEMS } from "@/components/tasks/Sidebar";
import { ROUTES } from "@/constants";

export function useSidebarNavigation(): (newMode: SidebarMode) => void {
  const navigate = useNavigate();

  return useCallback(
    (newMode: SidebarMode) => {
      if (newMode === null) return;
      if (newMode === "search") {
        navigate(ROUTES.SEARCH);
        return;
      }
      const filterItem = FILTER_ITEMS.find((item) => item.mode === newMode);
      if (filterItem?.route) {
        navigate(filterItem.route);
      } else {
        navigate(ROUTES.INBOX, { state: { filterMode: newMode } });
      }
    },
    [navigate],
  );
}
