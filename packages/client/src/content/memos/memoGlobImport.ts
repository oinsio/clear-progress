/**
 * Implements FR8 of add-memos.
 * Separated for testability — tests mock this module.
 */
export const memoGlobImport: Record<string, string> = import.meta.glob(
  "../../locales/memos/*/*.md",
  {
    query: "?raw",
    import: "default",
    eager: true,
  },
);
