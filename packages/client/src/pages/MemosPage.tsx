/**
 * MemosPage — displays all available memos for the current language.
 * Implements FR3, FR4, UX1 of add-memos.
 * Implements FR8, FR14-FR17 of improve-sidebar-ux.
 */
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { MemoCard } from "@/components/memos/MemoCard";
import { Sidebar } from "@/components/tasks/Sidebar";
import { ROUTES } from "@/constants";
import { getMemos } from "@/content/memos";
import { useLanguage } from "@/hooks/useLanguage";
import { usePanelSide } from "@/hooks/usePanelSide";
import { useSidebarNavigation } from "@/hooks/useSidebarNavigation";
import { useSidebarState } from "@/hooks/useSidebarState";

export default function MemosPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { panelSide } = usePanelSide();
  const { effectiveState, isNarrow, hasHover } = useSidebarState();
  const handleModeChange = useSidebarNavigation();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const handleAutoCollapse = isDrawerOpen ? closeDrawer : undefined;

  // FR17: Close drawer when transitioning from narrow to wide
  useEffect(() => {
    if (!isNarrow) {
      setIsDrawerOpen(false);
    }
  }, [isNarrow]);

  const memos = getMemos(language);

  return (
    <div
      data-testid="memos-page"
      className="relative flex flex-1 overflow-hidden bg-white"
    >
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="px-4 py-3 border-b border-gray-100">
          <h1 className="text-lg font-semibold text-accent">
            {t("memo.pageName")}
          </h1>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="xl:max-w-3xl xl:mx-auto">
            {memos.length === 0 ? (
              <div
                className="w-full flex flex-col items-center justify-center text-gray-400 py-3"
                data-testid="empty-memos-message"
              >
                <p className="text-sm">{t("memo.empty")}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 p-4">
                {memos.map((memo) => (
                  <MemoCard
                    key={memo.slug}
                    title={memo.title}
                    description={memo.description}
                    icon={memo.icon}
                    onClick={() => navigate(`${ROUTES.MEMOS}/${memo.slug}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* FR8: Backdrop for drawer mode */}
      {isNarrow && !hasHover && isDrawerOpen && (
        <div
          data-testid="sidebar-backdrop"
          className="fixed inset-0 bg-black/40 z-10"
          aria-label={t("filter.closeSidebar")}
          role="button"
          tabIndex={-1}
          onClick={closeDrawer}
        />
      )}

      <Sidebar
        mode="memos"
        effectiveState={effectiveState}
        isDrawerOpen={isDrawerOpen}
        side={panelSide}
        onAutoCollapse={handleAutoCollapse}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
