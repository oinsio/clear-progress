/**
 * MemoDetailPage — displays a single memo by slug from URL params.
 * Implements FR5, FR6, FR7, NFR-A3 of add-memos.
 */
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { MemoMarkdown } from "@/components/memos/MemoMarkdown";
import { Sidebar } from "@/components/tasks/Sidebar";
import { ROUTES } from "@/constants";
import { getMemo } from "@/content/memos";
import { useLanguage } from "@/hooks/useLanguage";
import { usePanelSide } from "@/hooks/usePanelSide";
import { useSidebarNavigation } from "@/hooks/useSidebarNavigation";
import { useSidebarState } from "@/hooks/useSidebarState";

export default function MemoDetailPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const { panelSide } = usePanelSide();
  const { effectiveState } = useSidebarState();
  const handleModeChange = useSidebarNavigation();

  const memo = slug ? getMemo(language, slug) : undefined;

  return (
    <div
      data-testid="memo-detail-page"
      className="relative flex flex-1 overflow-hidden bg-white"
    >
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header with back button */}
        <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <button
            type="button"
            onClick={() => navigate(ROUTES.MEMOS)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label={t("memo.back")}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-accent">
            {t("memo.pageName")}
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="xl:max-w-3xl xl:mx-auto p-4">
            {memo ? (
              <MemoMarkdown content={memo.body} />
            ) : (
              <div
                className="w-full flex flex-col items-center justify-center text-gray-400 py-3"
                data-testid="memo-not-found"
              >
                <p className="text-sm">{t("memo.notFound")}</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <Sidebar
        mode="memos"
        effectiveState={effectiveState}
        isDrawerOpen={false}
        side={panelSide}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
