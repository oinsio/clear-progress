// implements FR1-FR5, FR7, FR18, FR19 of localstorage-refactor
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type {
  BooleanConfig,
  EnumConfig,
  JsonConfig,
  NumberConfig,
} from "./localPreferencesService";
import {
  getPreference,
  readCached,
  removePreference,
  setPreference,
  syncCache,
} from "./localPreferencesService";

const SELF_HEALING_LOG_PREFIX = "[LocalPreferences]";

function expectSelfHealing(
  config:
    | EnumConfig<string>
    | BooleanConfig
    | NumberConfig
    | JsonConfig<unknown>,
  invalidRaw: string,
  expectedDefault: unknown,
  assertWith: "toBe" | "toEqual" = "toBe",
) {
  localStorage.setItem(config.key, invalidRaw);
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  const result = getPreference(config);

  expect(result)[assertWith](expectedDefault);
  expect(localStorage.getItem(config.key)).toBeNull();
  expect(warnSpy).toHaveBeenCalledWith(
    expect.stringContaining(SELF_HEALING_LOG_PREFIX),
  );
}

describe("localPreferencesService", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // FR1: getPreference — enum type
  describe("getPreference — enum", () => {
    const enumConfig: EnumConfig<"left" | "right"> = {
      type: "enum",
      key: "panel_side",
      values: ["left", "right"] as const,
      defaultValue: "right",
    };

    it("should return stored enum value when valid", () => {
      localStorage.setItem("panel_side", "left");

      expect(getPreference(enumConfig)).toBe("left");
    });

    it("should return default when key is missing", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      expect(getPreference(enumConfig)).toBe("right");

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("should not remove key from localStorage when value is valid", () => {
      localStorage.setItem("panel_side", "left");
      const removeSpy = vi.spyOn(Storage.prototype, "removeItem");

      getPreference(enumConfig);

      expect(removeSpy).not.toHaveBeenCalled();
    });

    // FR4: self-healing for invalid enum
    it("should self-heal and return default for invalid enum value", () => {
      expectSelfHealing(enumConfig, "center", "right");
    });

    it("should include invalid value and valid options in self-heal warning", () => {
      localStorage.setItem("panel_side", "center");
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      getPreference(enumConfig);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('"center" is not in [left, right]'),
      );
    });
  });

  // FR1, FR7: getPreference — boolean type
  describe("getPreference — boolean", () => {
    const booleanConfig: BooleanConfig = {
      type: "boolean",
      key: "panel_open",
      defaultValue: false,
    };

    it("should return true when stored value is 'true'", () => {
      localStorage.setItem("panel_open", "true");

      expect(getPreference(booleanConfig)).toBe(true);
    });

    it("should return false when stored value is 'false'", () => {
      localStorage.setItem("panel_open", "false");

      expect(getPreference(booleanConfig)).toBe(false);
    });

    it("should not remove key when stored boolean value is valid", () => {
      localStorage.setItem("panel_open", "false");
      const removeSpy = vi.spyOn(Storage.prototype, "removeItem");

      getPreference(booleanConfig);

      expect(removeSpy).not.toHaveBeenCalled();
    });

    it("should return default when key is missing", () => {
      expect(getPreference(booleanConfig)).toBe(false);
    });

    // FR4: self-healing for invalid boolean
    it("should self-heal and return default for invalid boolean value", () => {
      expectSelfHealing(booleanConfig, "yes", false);
    });

    it("should include invalid value in self-heal warning for boolean", () => {
      localStorage.setItem("panel_open", "yes");
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      getPreference(booleanConfig);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('"yes" is not a valid boolean'),
      );
    });
  });

  // FR1, FR7: getPreference — number type
  describe("getPreference — number", () => {
    const numberConfig: NumberConfig = {
      type: "number",
      key: "focus_opacity",
      defaultValue: 30,
    };

    it("should return parsed number when stored value is valid", () => {
      localStorage.setItem("focus_opacity", "50");

      expect(getPreference(numberConfig)).toBe(50);
    });

    it("should return float number when stored value is a float", () => {
      localStorage.setItem("focus_opacity", "0.5");

      expect(getPreference(numberConfig)).toBe(0.5);
    });

    it("should return default when key is missing", () => {
      expect(getPreference(numberConfig)).toBe(30);
    });

    // FR4: self-healing for NaN
    it("should self-heal and return default when stored value is NaN", () => {
      expectSelfHealing(numberConfig, "not-a-number", 30);
    });

    it("should include invalid value in self-heal warning for number", () => {
      localStorage.setItem("focus_opacity", "abc");
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      getPreference(numberConfig);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('"abc" is not a valid number'),
      );
    });
  });

  // FR1, FR7: getPreference — json type
  describe("getPreference — json", () => {
    const menuOrderSchema = z.array(z.string());
    const jsonConfig: JsonConfig<string[]> = {
      type: "json",
      key: "menu_order",
      schema: menuOrderSchema,
      defaultValue: ["inbox", "tasks"],
    };

    it("should return parsed JSON when valid and passes Zod schema", () => {
      localStorage.setItem("menu_order", JSON.stringify(["goals", "ideas"]));

      expect(getPreference(jsonConfig)).toEqual(["goals", "ideas"]);
    });

    it("should return default when key is missing", () => {
      expect(getPreference(jsonConfig)).toEqual(["inbox", "tasks"]);
    });

    // FR4: self-healing for invalid JSON
    it("should self-heal and return default for invalid JSON", () => {
      expectSelfHealing(
        jsonConfig,
        "{broken json",
        ["inbox", "tasks"],
        "toEqual",
      );
    });

    it("should include 'invalid JSON' in self-heal warning for broken JSON", () => {
      localStorage.setItem("menu_order", "{broken json");
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      getPreference(jsonConfig);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("invalid JSON"),
      );
    });

    // FR4: self-healing for Zod validation failure
    it("should self-heal and return default when Zod validation fails", () => {
      expectSelfHealing(
        jsonConfig,
        JSON.stringify({ not: "an array" }),
        ["inbox", "tasks"],
        "toEqual",
      );
    });

    it("should include 'Zod validation failed' in self-heal warning for schema mismatch", () => {
      localStorage.setItem("menu_order", JSON.stringify({ not: "an array" }));
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      getPreference(jsonConfig);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Zod validation failed"),
      );
    });
  });

  // FR2: setPreference
  describe("setPreference", () => {
    it("should write string value to localStorage", () => {
      setPreference("panel_side", "left");

      expect(localStorage.getItem("panel_side")).toBe("left");
    });

    it("should serialize boolean value with String() by default", () => {
      setPreference("panel_open", true);

      expect(localStorage.getItem("panel_open")).toBe("true");
    });

    it("should serialize number value with String() by default", () => {
      setPreference("focus_opacity", 50);

      expect(localStorage.getItem("focus_opacity")).toBe("50");
    });

    it("should use custom serializer when provided", () => {
      const customSerializer = (value: unknown) => JSON.stringify(value);

      setPreference("menu_order", ["a", "b"], customSerializer);

      expect(localStorage.getItem("menu_order")).toBe('["a","b"]');
    });
  });

  // FR3: removePreference
  describe("removePreference", () => {
    it("should remove existing key from localStorage", () => {
      localStorage.setItem("panel_side", "left");

      removePreference("panel_side");

      expect(localStorage.getItem("panel_side")).toBeNull();
    });

    it("should not throw when removing non-existent key", () => {
      expect(() => removePreference("non_existent_key")).not.toThrow();
    });
  });

  // FR5: graceful handling when localStorage is unavailable
  describe("localStorage unavailable", () => {
    it("should return default when getItem throws", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("localStorage unavailable");
      });
      const enumConfig: EnumConfig<"left" | "right"> = {
        type: "enum",
        key: "panel_side",
        values: ["left", "right"] as const,
        defaultValue: "right",
      };

      expect(getPreference(enumConfig)).toBe("right");
    });

    it("should not trigger self-healing when getItem throws", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("localStorage unavailable");
      });
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const enumConfig: EnumConfig<"left" | "right"> = {
        type: "enum",
        key: "panel_side",
        values: ["left", "right"] as const,
        defaultValue: "right",
      };

      getPreference(enumConfig);

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("should no-op when setItem throws", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("localStorage unavailable");
      });

      expect(() => setPreference("panel_side", "left")).not.toThrow();
    });

    it("should no-op when removeItem throws", () => {
      vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
        throw new Error("localStorage unavailable");
      });

      expect(() => removePreference("panel_side")).not.toThrow();
    });
  });

  // FR18: readCached
  describe("readCached", () => {
    it("should return cached synced setting value", () => {
      localStorage.setItem("default_box", "today");
      const enumConfig: EnumConfig<"inbox" | "today" | "week" | "later"> = {
        type: "enum",
        key: "default_box",
        values: ["inbox", "today", "week", "later"] as const,
        defaultValue: "inbox",
      };

      expect(readCached(enumConfig)).toBe("today");
    });
  });

  // FR19: syncCache
  describe("syncCache", () => {
    it("should update localStorage cache for synced settings", () => {
      syncCache("default_box", "week");

      expect(localStorage.getItem("default_box")).toBe("week");
    });

    it("should use custom serializer when provided", () => {
      syncCache("menu_order", ["a"], (value) => JSON.stringify(value));

      expect(localStorage.getItem("menu_order")).toBe('["a"]');
    });
  });
});
