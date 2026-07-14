import { describe, expect, it } from "vitest";
import { checkOverrideOrphans, checkParity } from "../../../scripts/i18n-check";
import { makeLocale } from "./checks-helpers";

describe("checkParity", () => {
  it("should report key present in en but missing in ru with correct detail", () => {
    const enLocale = makeLocale("en", ["fx.cancel", "task.save"]);
    const ruLocale = makeLocale("ru", ["task.save"]);
    const errors = checkParity(enLocale, ruLocale);
    expect(errors).toEqual([
      {
        kind: "parity",
        key: "fx.cancel",
        detail: "present in en, missing in ru",
      },
    ]);
  });

  it("should report key present in ru but missing in en with correct detail", () => {
    const enLocale = makeLocale("en", ["task.save"]);
    const ruLocale = makeLocale("ru", ["task.save", "task.extra"]);
    const errors = checkParity(enLocale, ruLocale);
    expect(errors).toEqual([
      {
        kind: "parity",
        key: "task.extra",
        detail: "present in ru, missing in en",
      },
    ]);
  });

  it("should report no errors when both locales have the same keys", () => {
    const enLocale = makeLocale("en", ["task.save", "fx.cancel"]);
    const ruLocale = makeLocale("ru", ["task.save", "fx.cancel"]);
    expect(checkParity(enLocale, ruLocale)).toEqual([]);
  });
});

describe("checkOverrideOrphans", () => {
  it("should report orphan key with correct detail mentioning locale codes", () => {
    const override = makeLocale("house", ["task.orphan"]);
    const base = makeLocale("ru", ["task.save"]);
    const errors = checkOverrideOrphans(override, base);
    expect(errors).toEqual([
      {
        kind: "override-orphans",
        key: "task.orphan",
        detail: "house.json overrides a key missing from ru.json",
      },
    ]);
  });

  it("should exclude _meta keys from orphan check", () => {
    const override = makeLocale("house", ["_meta.name", "_meta.baseLanguage"]);
    const base = makeLocale("en", ["task.save"]);
    expect(checkOverrideOrphans(override, base)).toEqual([]);
  });

  it("should not report error when override key exists in base", () => {
    const override = makeLocale("house", ["task.save"]);
    const base = makeLocale("en", ["task.save"]);
    expect(checkOverrideOrphans(override, base)).toEqual([]);
  });
});
