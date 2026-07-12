import { describe, expect, it } from "vitest";
import type { LocaleData } from "../../../scripts/i18n-check";
import { findDuplicateGroups } from "../../../scripts/i18n-check";

function makeLocale(code: string, flat: Record<string, string>): LocaleData {
  const baseKeys = new Set(Object.keys(flat));
  return {
    code,
    baseLanguage: code,
    flat,
    baseKeys,
  };
}

describe("findDuplicateGroups", () => {
  it("should group keys with same value in both en and ru", () => {
    const enLocale = makeLocale("en", {
      "task.cancel": "Cancel",
      "goal.cancel": "Cancel",
    });
    const ruLocale = makeLocale("ru", {
      "task.cancel": "Отмена",
      "goal.cancel": "Отмена",
    });

    const groups = findDuplicateGroups(enLocale, ruLocale);

    expect(groups.get("cancel")).toEqual(["task.cancel", "goal.cancel"]);
  });

  it("should not group month/monthGenitive with same en but different ru", () => {
    const enLocale = makeLocale("en", {
      "repeat.month4": "April",
      "repeat.monthGenitive4": "April",
    });
    const ruLocale = makeLocale("ru", {
      "repeat.month4": "апрель",
      "repeat.monthGenitive4": "апреля",
    });

    const groups = findDuplicateGroups(enLocale, ruLocale);

    expect(groups.has("april")).toBe(false);
  });

  it("should not group keys with same en value but different ru values", () => {
    const enLocale = makeLocale("en", {
      "task.set": "Set",
      "goal.set": "Set",
    });
    const ruLocale = makeLocale("ru", {
      "task.set": "Установить",
      "goal.set": "Набор",
    });

    const groups = findDuplicateGroups(enLocale, ruLocale);

    expect(groups.has("set")).toBe(false);
  });

  it("should return empty map when no duplicates exist", () => {
    const enLocale = makeLocale("en", {
      "task.cancel": "Cancel",
      "goal.save": "Save",
    });
    const ruLocale = makeLocale("ru", {
      "task.cancel": "Отмена",
      "goal.save": "Сохранить",
    });

    const groups = findDuplicateGroups(enLocale, ruLocale);

    expect(groups.size).toBe(0);
  });

  it("should ignore empty string values", () => {
    const enLocale = makeLocale("en", {
      "task.empty1": "",
      "goal.empty2": "",
    });
    const ruLocale = makeLocale("ru", {
      "task.empty1": "",
      "goal.empty2": "",
    });

    const groups = findDuplicateGroups(enLocale, ruLocale);

    expect(groups.size).toBe(0);
  });
});
