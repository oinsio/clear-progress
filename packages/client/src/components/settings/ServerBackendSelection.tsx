import { useTranslation } from "react-i18next";

interface ServerBackendSelectionProps {
  onSelectSupabase: () => void;
  onSelectGas: () => void;
}

/**
 * Implements FR1, UX1 of simplify-backend-connection.
 * Two buttons for selecting backend type. Supabase is primary (accent bg).
 */
export function ServerBackendSelection({
  onSelectSupabase,
  onSelectGas,
}: ServerBackendSelectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <button
        data-testid="server-connect-supabase"
        onClick={onSelectSupabase}
        className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors"
      >
        {t("settings.server.connectSupabase")}
      </button>
      <button
        data-testid="server-connect-gas"
        onClick={onSelectGas}
        className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300"
      >
        {t("settings.server.connectGas")}
      </button>
    </div>
  );
}
