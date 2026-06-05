/// <reference types="vite/client" />

interface LocaleMeta {
  code: string;
  name: string;
  nativeName: string;
  baseLanguage: string;
  emoji: string;
}

interface LocaleFile {
  _meta: LocaleMeta;
  [key: string]: unknown;
}

// Automatically collect all JSON files from the locales directory
const localeFiles = import.meta.glob("@/locales/*.json", {
  eager: true,
}) as Record<string, { default: LocaleFile }>;

// Validate and extract metadata
const locales: LocaleMeta[] = [];
const localeResources: Record<string, { translation: object }> = {};

for (const [path, module] of Object.entries(localeFiles)) {
  const content = module.default as LocaleFile;

  if (!content._meta) {
    console.error(`[localeRegistry] Missing _meta in ${path}`);
    continue;
  }

  const { code, name, nativeName, baseLanguage, emoji } = content._meta;

  if (!code || !name || !nativeName || !baseLanguage || !emoji) {
    console.error(
      `[localeRegistry] Incomplete _meta in ${path}:`,
      content._meta,
    );
    continue;
  }

  // Verify that code matches the filename
  const fileName = path.split("/").pop()?.replace(".json", "");
  if (fileName !== code) {
    console.error(
      `[localeRegistry] Code mismatch in ${path}: _meta.code="${code}" but filename="${fileName}"`,
    );
    continue;
  }

  locales.push({ code, name, nativeName, baseLanguage, emoji });

  // Strip _meta from resources for i18next
  const { _meta, ...translation } = content;
  localeResources[code] = { translation };
}

// Sort by English name
locales.sort((a, b) => a.name.localeCompare(b.name));

// Utilities
export function getLocaleByCode(code: string): LocaleMeta | undefined {
  return locales.find((locale) => locale.code === code);
}

export function isValidLocaleCode(code: string): boolean {
  return locales.some((locale) => locale.code === code);
}

export function getBaseLanguageCodes(): string[] {
  return Array.from(new Set(locales.map((locale) => locale.baseLanguage)));
}

export type { LocaleMeta };
export { localeResources, locales };
