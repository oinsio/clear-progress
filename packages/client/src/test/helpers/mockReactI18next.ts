/**
 * Shared vi.mock factory for react-i18next.
 * Returns the translation key by default; handles alert interpolation keys.
 *
 * Usage:
 *   const { mockReactI18next } = await vi.hoisted(() => import("@/test/helpers/mockReactI18next"));
 *   vi.mock("react-i18next", () => mockReactI18next());
 */
export function mockReactI18next() {
  return {
    useTranslation: () => ({
      t: (key: string, params?: Record<string, unknown>) => {
        if (key === "alert.counter" && params) {
          return `${params.current}/${params.total}`;
        }
        if (key === "alert.positionNext" && params) {
          return `Alert ${params.current} of ${params.total}, go to next`;
        }
        if (key === "alert.positionBack" && params) {
          return `Alert ${params.current} of ${params.total}, go to previous`;
        }
        if (key === "alert.positionUnderstood" && params) {
          return `Alert ${params.current} of ${params.total}, dismiss all`;
        }
        return key;
      },
    }),
  };
}
