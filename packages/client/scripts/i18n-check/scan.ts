import { readFileSync } from "node:fs";
import type { ScanResult } from "./types";

/** Literal key: two or more dot-separated segments of letters/digits/underscore */
const LITERAL_KEY_RE =
  /['"`]([A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+)['"`]/g;

/**
 * Dynamic prefix: template literal like `goal.status.${s}`
 * Captures the static part before `${`. Requires at least one dot.
 */
const DYNAMIC_PREFIX_RE = /`([A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]*)+)\$\{/g;

const TEST_FILE_RE = /(\.test\.|\.spec\.|\/test\/|\/__mocks__\/)/;

export function isTestFile(filePath: string): boolean {
  return TEST_FILE_RE.test(filePath);
}

export function scanSources(
  files: string[],
  topLevelNamespaces: Set<string>,
): ScanResult {
  const productionKeys = new Set<string>();
  const testKeys = new Set<string>();
  const dynamicPrefixes = new Set<string>();

  for (const file of files) {
    const fileContent = readFileSync(file, "utf-8");
    const targetSet = isTestFile(file) ? testKeys : productionKeys;

    for (const match of fileContent.matchAll(LITERAL_KEY_RE)) {
      const key = match[1] ?? "";
      const topLevelSegment = key.split(".")[0] ?? "";
      if (topLevelNamespaces.has(topLevelSegment)) {
        targetSet.add(key);
      }
    }

    for (const match of fileContent.matchAll(DYNAMIC_PREFIX_RE)) {
      const prefix = match[1] ?? "";
      const topLevelSegment = prefix.split(".")[0] ?? "";
      if (topLevelNamespaces.has(topLevelSegment)) {
        dynamicPrefixes.add(prefix);
      }
    }
  }

  const literalKeysTestOnly = new Set(
    [...testKeys].filter((key) => !productionKeys.has(key)),
  );

  return {
    literalKeys: new Set([...productionKeys, ...testKeys]),
    dynamicPrefixes,
    literalKeysTestOnly,
  };
}
