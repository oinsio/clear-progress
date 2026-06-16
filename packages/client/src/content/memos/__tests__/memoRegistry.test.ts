import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_LANGUAGE } from "@/constants";

const VALID_MEMO_RU_REVIEW = `---
title: Обзор задач
description: Ежедневный обзор
icon: refresh-cw
order: 2
---
# Обзор`;

const VALID_MEMO_RU_PLANNING = `---
title: Планирование
description: Модель планирования
icon: map
order: 1
---
# Планирование`;

const VALID_MEMO_EN_REVIEW = `---
title: Task Review
description: Daily review
icon: refresh-cw
order: 2
---
# Review`;

const VALID_MEMO_EN_PLANNING = `---
title: Natural Planning
description: Planning model
icon: map
order: 1
---
# Planning`;

const INVALID_MEMO_NO_FRONTMATTER = `# Just markdown
No frontmatter here`;

const INVALID_MEMO_BAD_ORDER = `---
title: Bad
description: Bad memo
icon: x
order: first
---
# Bad`;

function createGlobResult(
  files: Record<string, string>,
): Record<string, string> {
  return files;
}

let getMemos: (baseLanguage: string) => import("../index").MemoEntry[];
let getMemo: (
  baseLanguage: string,
  slug: string,
) => import("../index").MemoEntry | undefined;

describe("memoRegistry", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function setupRegistry(
    globFiles: Record<string, string>,
  ): Promise<void> {
    vi.doMock("../memoGlobImport", () => ({
      memoGlobImport: globFiles,
    }));

    const registryModule = await import("../index");
    getMemos = registryModule.getMemos;
    getMemo = registryModule.getMemo;
  }

  // FR4: getMemos returns sorted entries by order ascending
  it("should return memos sorted by order ascending", async () => {
    await setupRegistry(
      createGlobResult({
        "./ru/task-review.md": VALID_MEMO_RU_REVIEW,
        "./ru/natural-planning.md": VALID_MEMO_RU_PLANNING,
      }),
    );

    const memos = getMemos("ru");

    expect(memos).toHaveLength(2);
    expect(memos[0].title).toBe("Планирование");
    expect(memos[0].order).toBe(1);
    expect(memos[1].title).toBe("Обзор задач");
    expect(memos[1].order).toBe(2);
  });

  // FR8: language selection — getMemos returns memos for requested language
  it("should return memos for the requested language", async () => {
    await setupRegistry(
      createGlobResult({
        "./ru/task-review.md": VALID_MEMO_RU_REVIEW,
        "./en/task-review.md": VALID_MEMO_EN_REVIEW,
      }),
    );

    const russianMemos = getMemos("ru");
    const englishMemos = getMemos(DEFAULT_LANGUAGE);

    expect(russianMemos).toHaveLength(1);
    expect(russianMemos[0].title).toBe("Обзор задач");
    expect(englishMemos).toHaveLength(1);
    expect(englishMemos[0].title).toBe("Task Review");
  });

  // FR13: fallback to default language when requested language missing
  it("should fall back to default language when requested language has no memos", async () => {
    await setupRegistry(
      createGlobResult({
        "./en/task-review.md": VALID_MEMO_EN_REVIEW,
        "./en/natural-planning.md": VALID_MEMO_EN_PLANNING,
      }),
    );

    const frenchMemos = getMemos("fr");

    expect(frenchMemos).toHaveLength(2);
    expect(frenchMemos[0].title).toBe("Natural Planning");
  });

  // FR9: empty array when no memos at all
  it("should return empty array when no memos exist", async () => {
    await setupRegistry(createGlobResult({}));

    const memos = getMemos("ru");

    expect(memos).toEqual([]);
  });

  // FR8: invalid files (bad frontmatter) skipped with console warning
  it("should skip files without frontmatter and log a warning", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      /* noop */
    });

    await setupRegistry(
      createGlobResult({
        "./ru/invalid.md": INVALID_MEMO_NO_FRONTMATTER,
        "./ru/task-review.md": VALID_MEMO_RU_REVIEW,
      }),
    );

    const memos = getMemos("ru");

    expect(memos).toHaveLength(1);
    expect(memos[0].title).toBe("Обзор задач");
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  // FR10: files with invalid order skipped
  it("should skip files with non-integer order and log a warning", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      /* noop */
    });

    await setupRegistry(
      createGlobResult({
        "./ru/bad-order.md": INVALID_MEMO_BAD_ORDER,
        "./ru/task-review.md": VALID_MEMO_RU_REVIEW,
      }),
    );

    const memos = getMemos("ru");

    expect(memos).toHaveLength(1);
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  // getMemo: returns specific memo by slug
  it("should return a specific memo by slug", async () => {
    await setupRegistry(
      createGlobResult({
        "./ru/task-review.md": VALID_MEMO_RU_REVIEW,
        "./ru/natural-planning.md": VALID_MEMO_RU_PLANNING,
      }),
    );

    const memo = getMemo("ru", "task-review");

    expect(memo).toBeDefined();
    expect(memo!.slug).toBe("task-review");
    expect(memo!.title).toBe("Обзор задач");
  });

  // getMemo: returns undefined for non-existent slug
  it("should return undefined for non-existent slug", async () => {
    await setupRegistry(
      createGlobResult({
        "./ru/task-review.md": VALID_MEMO_RU_REVIEW,
      }),
    );

    const memo = getMemo("ru", "nonexistent");

    expect(memo).toBeUndefined();
  });

  // getMemo: uses language fallback
  it("should fall back to default language in getMemo when language missing", async () => {
    await setupRegistry(
      createGlobResult({
        "./en/task-review.md": VALID_MEMO_EN_REVIEW,
      }),
    );

    const memo = getMemo("fr", "task-review");

    expect(memo).toBeDefined();
    expect(memo!.title).toBe("Task Review");
  });

  // Slug derived from filename
  it("should derive slug from filename without extension", async () => {
    await setupRegistry(
      createGlobResult({
        "./en/natural-planning.md": VALID_MEMO_EN_PLANNING,
      }),
    );

    const memos = getMemos(DEFAULT_LANGUAGE);

    expect(memos[0].slug).toBe("natural-planning");
  });

  // MemoEntry has all expected fields
  it("should populate all MemoEntry fields correctly", async () => {
    await setupRegistry(
      createGlobResult({
        "./en/task-review.md": VALID_MEMO_EN_REVIEW,
      }),
    );

    const memo = getMemos(DEFAULT_LANGUAGE)[0];

    expect(memo.slug).toBe("task-review");
    expect(memo.title).toBe("Task Review");
    expect(memo.description).toBe("Daily review");
    expect(memo.icon).toBe("refresh-cw");
    expect(memo.order).toBe(2);
    expect(memo.body).toBe("# Review");
  });

  // Files with invalid path pattern skipped with warning
  it("should skip files with invalid path pattern and log a warning", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      /* noop */
    });

    await setupRegistry(
      createGlobResult({
        "invalid-path.md": VALID_MEMO_EN_REVIEW,
        "./en/task-review.md": VALID_MEMO_EN_REVIEW,
      }),
    );

    const memos = getMemos(DEFAULT_LANGUAGE);

    expect(memos).toHaveLength(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("invalid-path.md"),
    );
  });

  // Verify warning message for invalid frontmatter contains file path
  it("should include file path in warning for invalid frontmatter", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      /* noop */
    });

    await setupRegistry(
      createGlobResult({
        "./ru/broken.md": INVALID_MEMO_NO_FRONTMATTER,
      }),
    );

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("./ru/broken.md"),
    );
  });

  // Verify that getMemos does NOT return memos from other languages
  it("should not return memos from other languages", async () => {
    await setupRegistry(
      createGlobResult({
        "./ru/task-review.md": VALID_MEMO_RU_REVIEW,
        "./en/task-review.md": VALID_MEMO_EN_REVIEW,
      }),
    );

    const russianMemos = getMemos("ru");

    expect(russianMemos).toHaveLength(1);
    expect(russianMemos[0].title).toBe("Обзор задач");
    expect(russianMemos.every((memo) => memo.title !== "Task Review")).toBe(
      true,
    );
  });

  // Kills mutant: regex $ anchor removal — path with suffix after .md should not match
  it("should skip files with extra suffix after .md extension", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      /* noop */
    });

    await setupRegistry(
      createGlobResult({
        "./en/task-review.md.bak": VALID_MEMO_EN_REVIEW,
      }),
    );

    const memos = getMemos(DEFAULT_LANGUAGE);

    expect(memos).toHaveLength(0);
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  // Kills mutant: regex ^ anchor removal — path with prefix before ./ should not match
  it("should skip files with prefix before the path", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      /* noop */
    });

    await setupRegistry(
      createGlobResult({
        "prefix./en/task-review.md": VALID_MEMO_EN_REVIEW,
      }),
    );

    const memos = getMemos(DEFAULT_LANGUAGE);

    expect(memos).toHaveLength(0);
    expect(consoleWarnSpy).toHaveBeenCalled();
  });
});
