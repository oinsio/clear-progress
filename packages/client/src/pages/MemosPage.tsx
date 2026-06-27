/**
 * MemosPage — displays all available memos for the current language.
 * Implements FR3, FR4, UX1 of add-memos.
 * Implements FR8, FR14-FR17 of improve-sidebar-ux.
 */
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { SidebarShell } from "@/components/layout/SidebarShell";
import { MemoCard } from "@/components/memos/MemoCard";
import { ROUTES } from "@/constants";
import { getMemos } from "@/content/memos";
import { useLanguage } from "@/hooks/useLanguage";

export default function MemosPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const memos = getMemos(language);

  return (
    <SidebarShell mode="memos">
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
    </SidebarShell>
  );
}
