import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isTestFile, scanSources } from "../../../scripts/i18n-check";

describe("isTestFile", () => {
  it("should return true for .test.ts files", () => {
    expect(isTestFile("src/services/sync.test.ts")).toBe(true);
  });

  it("should return true for .spec.tsx files", () => {
    expect(isTestFile("src/components/Task.spec.tsx")).toBe(true);
  });

  it("should return true for paths containing /test/", () => {
    expect(isTestFile("src/test/helpers/factory.ts")).toBe(true);
  });

  it("should return true for paths containing /__mocks__/", () => {
    expect(isTestFile("src/__mocks__/dexie.ts")).toBe(true);
  });

  it("should return false for regular source files", () => {
    expect(isTestFile("src/components/Task.tsx")).toBe(false);
  });
});

describe("scanSources", () => {
  const topLevelNamespaces = new Set([
    "fx",
    "goal",
    "nav",
    "repeat",
    "sync",
    "task",
  ]);
  let tempDirectory: string;

  beforeEach(() => {
    tempDirectory = mkdtempSync(join(tmpdir(), "i18n-scan-"));
  });

  afterEach(() => {
    rmSync(tempDirectory, { recursive: true, force: true });
  });

  function writeTempFile(name: string, content: string): string {
    const filePath = join(tempDirectory, name);
    const directory = filePath.substring(0, filePath.lastIndexOf("/"));
    mkdirSync(directory, { recursive: true });
    writeFileSync(filePath, content, "utf-8");
    return filePath;
  }

  it("should detect literal key in double quotes", () => {
    const file = writeTempFile("src/app.ts", 't("fx.cancel")');
    const scanResult = scanSources([file], topLevelNamespaces);
    expect(scanResult.literalKeys).toContain("fx.cancel");
  });

  it("should detect literal key in backticks", () => {
    const file = writeTempFile("src/app.ts", "t(`fx.cancel`)");
    const scanResult = scanSources([file], topLevelNamespaces);
    expect(scanResult.literalKeys).toContain("fx.cancel");
  });

  it("should detect key from labelKey pattern", () => {
    const file = writeTempFile("src/app.ts", 'labelKey: "fx.focused_goals"');
    const scanResult = scanSources([file], topLevelNamespaces);
    expect(scanResult.literalKeys).toContain("fx.focused_goals");
  });

  it("should detect dynamic prefix from template literal", () => {
    const file = writeTempFile(
      "src/app.ts",
      // biome-ignore lint/suspicious/noTemplateCurlyInString: test string simulating a template literal in source code
      "const label = t(`goal.status.${status}`)",
    );
    const scanResult = scanSources([file], topLevelNamespaces);
    expect(scanResult.dynamicPrefixes).toContain("goal.status.");
  });

  it("should filter out dotted strings not matching a namespace", () => {
    const file = writeTempFile("src/app.ts", '"package.json"');
    const scanResult = scanSources([file], topLevelNamespaces);
    expect(scanResult.literalKeys).not.toContain("package.json");
  });

  it("should classify key only in test file as test-only", () => {
    const testFile = writeTempFile(
      "src/test/helpers.test.ts",
      't("sync.error")',
    );
    const scanResult = scanSources([testFile], topLevelNamespaces);
    expect(scanResult.literalKeysTestOnly).toContain("sync.error");
  });

  it("should not classify key as test-only when present in prod file too", () => {
    const prodFile = writeTempFile("src/services/sync.ts", 't("sync.error")');
    const testFile = writeTempFile("src/test/sync.test.ts", 't("sync.error")');
    const scanResult = scanSources([prodFile, testFile], topLevelNamespaces);
    expect(scanResult.literalKeys).toContain("sync.error");
    expect(scanResult.literalKeysTestOnly).not.toContain("sync.error");
  });

  it("should filter dynamic prefixes by namespace", () => {
    const file = writeTempFile(
      "src/app.ts",
      // biome-ignore lint/suspicious/noTemplateCurlyInString: test string simulating a template literal in source code
      "const url = `unknown.prefix.${id}`",
    );
    const scanResult = scanSources([file], topLevelNamespaces);
    expect(scanResult.dynamicPrefixes.size).toBe(0);
  });

  it("should detect key with three or more segments", () => {
    const file = writeTempFile("src/app.ts", 't("task.attachments.empty")');
    const scanResult = scanSources([file], topLevelNamespaces);
    expect(scanResult.literalKeys).toContain("task.attachments.empty");
  });
});
