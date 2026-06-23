import { useTranslation } from "react-i18next";
import { ProviderIcon } from "./ProviderIcon";

interface ServerBackendSelectionProps {
  onSelectSupabase: () => void;
}

/**
 * Implements FR1, UX1 of simplify-backend-connection.
 * Implements FR13 of supabase-provider-info.
 * Button for selecting Supabase backend.
 */
export function ServerBackendSelection({
  onSelectSupabase,
}: ServerBackendSelectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        {t("settings.server.chooseBackendHint")}
      </p>
      <button
        data-testid="server-connect-supabase"
        onClick={onSelectSupabase}
        className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 inline-flex items-center justify-center gap-2"
      >
        <ProviderIcon provider="supabase" className="h-4 w-4" />
        {t("settings.server.connectSupabase")}
      </button>
    </div>
  );
}
