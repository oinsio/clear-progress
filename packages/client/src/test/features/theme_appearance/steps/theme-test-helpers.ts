// Shared helpers for theme_appearance BDD step definitions

/**
 * Creates and appends a meta theme-color tag to document.head.
 * Used in scenarios that verify meta tag updates.
 */
export function createMetaThemeColorTag(): void {
  const metaTag = document.createElement("meta");
  metaTag.setAttribute("name", "theme-color");
  metaTag.setAttribute("content", "");
  document.head.appendChild(metaTag);
}

/**
 * Removes existing meta theme-color tag if present.
 */
export function removeMetaThemeColorTag(): void {
  const existingMeta = document.querySelector('meta[name="theme-color"]');
  if (existingMeta) {
    existingMeta.remove();
  }
}
