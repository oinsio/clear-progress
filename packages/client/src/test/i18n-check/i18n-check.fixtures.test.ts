import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadLocale, toBaseKey } from "../../../scripts/i18n-check";

/**
 * Keys intentionally coinciding with live en.json keys.
 * Each entry MUST have a comment justifying why the real key is needed.
 * Implements FR2 of fix-i18n-check-dynamic-prefix-gaps (fixture isolation).
 */
const ALLOWED_LIVE_FIXTURES = new Set<string>([
  // i18n-check.unit.test.ts: isWhitelisted() verifies real WHITELIST entries.
  // "repeat.daily" is also used in i18n-check.checks.test.ts to verify that
  // checkUndefined (line 21) and checkUnused (line 116) respect the real WHITELIST.
  "repeat.daily",
  "repeat.weekday3",
  "repeat.month12",
  "repeat.monthGenitive1",
]);

const FIXTURE_DIR = dirname(fileURLToPath(import.meta.url));
const KEY_RE = /['"`]([A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+)['"`]/g;

describe("i18n-check fixture isolation", () => {
  it("no tool-test fixture coincides with a live en.json key", () => {
    const enLocale = loadLocale("en");
    const offenders: string[] = [];

    for (const file of readdirSync(FIXTURE_DIR)) {
      if (!file.endsWith(".test.ts")) continue;
      if (file.includes("fixtures.test") || file.includes("project.test"))
        continue;

      const text = readFileSync(join(FIXTURE_DIR, file), "utf-8");
      for (const match of text.matchAll(KEY_RE)) {
        const key = match[1] ?? "";
        if (ALLOWED_LIVE_FIXTURES.has(key)) continue;
        const baseKey = toBaseKey(key);
        if (enLocale.baseKeys.has(baseKey) || enLocale.baseKeys.has(key)) {
          offenders.push(`${file}: "${key}"`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
