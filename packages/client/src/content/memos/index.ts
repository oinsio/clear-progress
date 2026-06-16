/**
 * Implements FR4, FR8, FR9, FR13 of add-memos.
 * Memo registry with auto-discovery via import.meta.glob (D3).
 */
import { DEFAULT_LANGUAGE } from "@/constants";
import { memoGlobImport } from "./memoGlobImport";
import { parseFrontmatter } from "./parseFrontmatter";

export interface MemoEntry {
  slug: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  body: string;
}

const PATH_LANG_SLUG_PATTERN = /^\.\/([^/]+)\/([^/]+)\.md$/;

interface MemosByLanguage {
  [language: string]: MemoEntry[];
}

function buildRegistry(globResult: Record<string, string>): MemosByLanguage {
  const registry: MemosByLanguage = {};

  for (const [filePath, rawContent] of Object.entries(globResult)) {
    const pathMatch = PATH_LANG_SLUG_PATTERN.exec(filePath);
    if (!pathMatch) {
      console.warn(
        `Memo file path does not match expected pattern: ${filePath}`,
      );
      continue;
    }

    const language = pathMatch[1];
    const slug = pathMatch[2];

    const parsed = parseFrontmatter(rawContent);
    if (!parsed) {
      console.warn(`Memo file has invalid frontmatter, skipping: ${filePath}`);
      continue;
    }

    const entry: MemoEntry = {
      slug,
      title: parsed.attributes.title,
      description: parsed.attributes.description,
      icon: parsed.attributes.icon,
      order: Number(parsed.attributes.order),
      body: parsed.body,
    };

    if (!registry[language]) {
      registry[language] = [];
    }
    registry[language].push(entry);
  }

  for (const language of Object.keys(registry)) {
    registry[language].sort(
      (firstMemo, secondMemo) => firstMemo.order - secondMemo.order,
    );
  }

  return registry;
}

const memosByLanguage = buildRegistry(memoGlobImport);

/** Implements FR4, FR9, FR13 of add-memos */
export function getMemos(baseLanguage: string): MemoEntry[] {
  return (
    memosByLanguage[baseLanguage] ?? memosByLanguage[DEFAULT_LANGUAGE] ?? []
  );
}

/** Implements FR8 of add-memos */
export function getMemo(
  baseLanguage: string,
  slug: string,
): MemoEntry | undefined {
  const memos = getMemos(baseLanguage);
  return memos.find((memo) => memo.slug === slug);
}
