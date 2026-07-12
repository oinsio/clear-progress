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
      "fx.cancel": "Cancel",
      "fx.goalCancel": "Cancel",
    });
    const ruLocale = makeLocale("ru", {
      "fx.cancel": "Отмена",
      "fx.goalCancel": "Отмена",
    });

    const groups = findDuplicateGroups(enLocale, ruLocale);

    expect(groups.get("cancel")).toEqual(["fx.cancel", "fx.goalCancel"]);
  });

  it("should not group month/monthGenitive with same en but different ru", () => {
    const enLocale = makeLocale("en", {
      "fx.month4": "April",
      "fx.monthGenitive4": "April",
    });
    const ruLocale = makeLocale("ru", {
      "fx.month4": "апрель",
      "fx.monthGenitive4": "апреля",
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
      "fx.cancel": "Cancel",
      "fx.save": "Save",
    });
    const ruLocale = makeLocale("ru", {
      "fx.cancel": "Отмена",
      "fx.save": "Сохранить",
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
