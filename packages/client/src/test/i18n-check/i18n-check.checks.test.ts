import { describe, expect, it } from "vitest";
import { checkUndefined, checkUnused } from "../../../scripts/i18n-check";
import { makeLocale, makeScan } from "./checks-helpers";

describe("checkUndefined", () => {
  it("should report error with correct detail when key is missing from en.json", () => {
    const enLocale = makeLocale("en", []);
    const scan = makeScan({ literalKeys: new Set(["task.cancel"]) });
    const errors = checkUndefined(enLocale, scan);
    expect(errors).toEqual([
      {
        kind: "undefined",
        key: "task.cancel",
        detail: "used in production code but missing from en.json",
      },
    ]);
  });

  it("should not report error for whitelisted key missing from en.json", () => {
    const enLocale = makeLocale("en", []);
    const scan = makeScan({ literalKeys: new Set(["repeat.daily"]) });
    expect(checkUndefined(enLocale, scan)).toEqual([]);
  });

  it("should not report error for key only in tests and missing from en.json", () => {
    const enLocale = makeLocale("en", []);
    const scan = makeScan({
      literalKeys: new Set(["task.missing"]),
      literalKeysTestOnly: new Set(["task.missing"]),
    });
    expect(checkUndefined(enLocale, scan)).toEqual([]);
  });

  it("should not report error when key is present in en.json", () => {
    const enLocale = makeLocale("en", ["task.cancel"]);
    const scan = makeScan({ literalKeys: new Set(["task.cancel"]) });
    expect(checkUndefined(enLocale, scan)).toEqual([]);
  });

  it("should match by base key via toBaseKey normalization", () => {
    const enLocale = makeLocale("en", ["items.count"]);
    const scan = makeScan({ literalKeys: new Set(["items.count_few"]) });
    expect(checkUndefined(enLocale, scan)).toEqual([]);
  });

  it("should match by exact key when base key differs", () => {
    const enLocale = makeLocale("en", ["items.count_few"]);
    const scan = makeScan({ literalKeys: new Set(["items.count_few"]) });
    expect(checkUndefined(enLocale, scan)).toEqual([]);
  });
});

describe("checkUnused", () => {
  it("should report error with correct detail when key is unreferenced", () => {
    const enLocale = makeLocale("en", ["task.orphan"]);
    const scan = makeScan();
    const errors = checkUnused(enLocale, scan);
    expect(errors).toEqual([
      {
        kind: "unused",
        key: "task.orphan",
        detail: "not found by literal or dynamic patterns",
      },
    ]);
  });

  it("should not report error when key is matched by literal key", () => {
    const enLocale = makeLocale("en", ["task.cancel"]);
    const scan = makeScan({ literalKeys: new Set(["task.cancel"]) });
    expect(checkUnused(enLocale, scan)).toEqual([]);
  });

  it("should not report error when key is matched by dynamic prefix ending with dot", () => {
    const enLocale = makeLocale("en", ["goal.status.in_progress"]);
    const scan = makeScan({ dynamicPrefixes: new Set(["goal.status."]) });
    expect(checkUnused(enLocale, scan)).toEqual([]);
  });

  it("should report key when dynamic prefix with dot matches but rest contains dot", () => {
    const enLocale = makeLocale("en", ["goal.status.sub.deep"]);
    const scan = makeScan({ dynamicPrefixes: new Set(["goal.status."]) });
    const errors = checkUnused(enLocale, scan);
    expect(errors).toHaveLength(1);
    expect(errors[0].key).toBe("goal.status.sub.deep");
  });

  it("should not report key when prefix without dot has digits-only rest", () => {
    const enLocale = makeLocale("en", ["goal.item99"]);
    const scan = makeScan({ dynamicPrefixes: new Set(["goal.item"]) });
    expect(checkUnused(enLocale, scan)).toEqual([]);
  });

  it("should not match prefix against key that does not start with it", () => {
    const enLocale = makeLocale("en", ["task.name"]);
    const scan = makeScan({ dynamicPrefixes: new Set(["goal.status."]) });
    const errors = checkUnused(enLocale, scan);
    expect(errors).toHaveLength(1);
    expect(errors[0].key).toBe("task.name");
  });

  it("should report key when dynamic prefix with dot has empty rest", () => {
    const enLocale = makeLocale("en", ["goal.status."]);
    const scan = makeScan({ dynamicPrefixes: new Set(["goal.status."]) });
    expect(checkUnused(enLocale, scan)).toHaveLength(1);
  });

  it("should not report error for whitelisted key", () => {
    const enLocale = makeLocale("en", ["repeat.daily"]);
    expect(checkUnused(enLocale, makeScan())).toEqual([]);
  });

  it("should report repeat.monthAndDay as unused — rest 'AndDay' is not digits-only", () => {
    const enLocale = makeLocale("en", ["repeat.monthAndDay"]);
    const scan = makeScan({ dynamicPrefixes: new Set(["repeat.month"]) });
    expect(checkUnused(enLocale, scan)).toEqual([
      expect.objectContaining({ kind: "unused", key: "repeat.monthAndDay" }),
    ]);
  });

  it("should report key when rest starts with digit but has letters", () => {
    const enLocale = makeLocale("en", ["repeat.month1abc"]);
    const scan = makeScan({ dynamicPrefixes: new Set(["repeat.month"]) });
    expect(checkUnused(enLocale, scan)).toHaveLength(1);
  });

  it("should report key when rest ends with digits but starts with letters", () => {
    const enLocale = makeLocale("en", ["goal.itemGen4"]);
    const scan = makeScan({ dynamicPrefixes: new Set(["goal.item"]) });
    expect(checkUnused(enLocale, scan)).toHaveLength(1);
  });

  it("should skip non-matching prefixes and still match correct one", () => {
    const enLocale = makeLocale("en", ["goal.status.active"]);
    const scan = makeScan({
      dynamicPrefixes: new Set(["task.type.", "goal.status."]),
    });
    expect(checkUnused(enLocale, scan)).toEqual([]);
  });

  it("should report test-only key as unused with test-only detail", () => {
    const enLocale = makeLocale("en", ["task.testKey"]);
    const scan = makeScan({ literalKeysTestOnly: new Set(["task.testKey"]) });
    const errors = checkUnused(enLocale, scan);
    expect(errors).toEqual([
      {
        kind: "unused",
        key: "task.testKey",
        detail: "found ONLY in tests — likely a dead key",
      },
    ]);
  });

  it("should only match prefix that actually starts the key", () => {
    const enLocale = makeLocale("en", ["other.goal.status.active"]);
    const scan = makeScan({ dynamicPrefixes: new Set(["goal.status."]) });
    expect(checkUnused(enLocale, scan)).toHaveLength(1);
  });
});
