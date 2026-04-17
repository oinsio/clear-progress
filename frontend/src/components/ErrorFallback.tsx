import { useTranslation } from "react-i18next";

export function ErrorFallback() {
  const { t } = useTranslation();

  const handleReload = (): void => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">{t("error.title")}</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        {t("error.description")}
      </p>
      <button
        type="button"
        onClick={handleReload}
        className="bg-primary text-primary-foreground rounded-lg px-6 py-3 text-sm font-medium"
      >
        {t("error.reload")}
      </button>
    </div>
  );
}
