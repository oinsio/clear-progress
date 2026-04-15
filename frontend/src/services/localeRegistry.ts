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

// Автоматический сбор всех JSON-файлов из директории locales
const localeFiles = import.meta.glob("@/locales/*.json", {
  eager: true,
}) as Record<string, { default: LocaleFile }>;

// Валидация и извлечение метаданных
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
      content._meta
    );
    continue;
  }

  // Проверка совпадения code с именем файла
  const fileName = path.split("/").pop()?.replace(".json", "");
  if (fileName !== code) {
    console.error(
      `[localeRegistry] Code mismatch in ${path}: _meta.code="${code}" but filename="${fileName}"`
    );
    continue;
  }

  locales.push({ code, name, nativeName, baseLanguage, emoji });

  // Убираем _meta из resources для i18next
  const { _meta, ...translation } = content;
  localeResources[code] = { translation };
}

// Сортировка по английскому названию
locales.sort((a, b) => a.name.localeCompare(b.name));

// Утилиты
export function getLocaleByCode(code: string): LocaleMeta | undefined {
  return locales.find((locale) => locale.code === code);
}

export function isValidLocaleCode(code: string): boolean {
  return locales.some((locale) => locale.code === code);
}

export function getBaseLanguageCodes(): string[] {
  return Array.from(new Set(locales.map((locale) => locale.baseLanguage)));
}

export { locales, localeResources };
export type { LocaleMeta };
