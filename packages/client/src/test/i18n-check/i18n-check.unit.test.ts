import { describe, expect, it } from "vitest";
import {
  flatten,
  isWhitelisted,
  toBaseKey,
  toBaseKeySet,
} from "../../../scripts/i18n-check";

describe("flatten", () => {
  it("should flatten nested objects to dot-separated keys", () => {
    const input = {
      task: {
        status: {
          active: "Active",
          completed: "Done",
        },
      },
    };

    const result = flatten(input);

    expect(result).toEqual({
      "task.status.active": "Active",
      "task.status.completed": "Done",
    });
  });

  it("should stringify empty and null values", () => {
    const input = {
      emptyString: "",
      nullValue: null,
    };

    const result = flatten(input);

    expect(result).toEqual({
      emptyString: "",
      nullValue: "null",
    });
  });

  it("should keep single-level objects as-is", () => {
    const input = {
      greeting: "Hello",
      farewell: "Goodbye",
    };

    const result = flatten(input);

    expect(result).toEqual({
      greeting: "Hello",
      farewell: "Goodbye",
    });
  });
});

describe("toBaseKey", () => {
  it("should strip plural suffix _few", () => {
    expect(toBaseKey("fx.everyNDays_few")).toBe("fx.everyNDays");
  });

  it("should strip ordinal suffix _ordinal_two", () => {
    expect(toBaseKey("fx.yearlyDate_ordinal_two")).toBe("fx.yearlyDate");
  });

  it("should preserve underscore in non-plural word", () => {
    expect(toBaseKey("fx.focused_goals")).toBe("fx.focused_goals");
  });

  it("should only strip suffix at end — not in middle of key", () => {
    expect(toBaseKey("items.count_one.label")).toBe("items.count_one.label");
  });

  it("should only strip ordinal suffix at end — not in middle of key", () => {
    expect(toBaseKey("items.position_ordinal_one.label")).toBe(
      "items.position_ordinal_one.label",
    );
  });

  it.each([
    "_one",
    "_two",
    "_few",
    "_many",
    "_other",
    "_zero",
  ])("should strip CLDR plural suffix %s", (suffix) => {
    const key = `items.count${suffix}`;
    const expectedBaseKey = "items.count";

    expect(toBaseKey(key)).toBe(expectedBaseKey);
  });

  it.each([
    "_one",
    "_two",
    "_few",
    "_many",
    "_other",
    "_zero",
  ])("should strip CLDR ordinal suffix _ordinal%s", (suffix) => {
    const key = `items.position_ordinal${suffix}`;
    const expectedBaseKey = "items.position";

    expect(toBaseKey(key)).toBe(expectedBaseKey);
  });
});

describe("toBaseKeySet", () => {
  it("should create a Set of base keys from a FlatMap", () => {
    const flatMap = {
      "items.count_one": "{{count}} item",
      "items.count_other": "{{count}} items",
      "items.count_few": "{{count}} items",
      "task.title": "Title",
    };

    const result = toBaseKeySet(flatMap);

    expect(result).toEqual(new Set(["items.count", "task.title"]));
  });
});

describe("isWhitelisted", () => {
  it.each([
    [true, "repeat.daily"],
    [true, "repeat.weekday3"],
    [true, "repeat.month12"],
    [true, "repeat.monthGenitive1"],
    [false, "_meta.name"],
    [true, "sync.alert.some_key"],
    [false, "fx.cancel"],
    [false, "repeat.monthAndDay"],
    [false, "repeat.weekday8"],
    [false, "repeat.month0"],
    [false, "repeat.month13"],
  ])("should return %s for '%s'", (expectedResult: boolean, key: string) => {
    expect(isWhitelisted(key)).toBe(expectedResult);
  });
});
