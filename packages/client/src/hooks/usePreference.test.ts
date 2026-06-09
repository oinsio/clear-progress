// implements FR6, FR7 of localstorage-refactor
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type {
  BooleanConfig,
  EnumConfig,
  JsonConfig,
  NumberConfig,
} from "@/services/localPreferencesService";
import { usePreference } from "./usePreference";

describe("usePreference", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // FR6: returns [value, setter] tuple
  describe("enum type", () => {
    const enumConfig: EnumConfig<"left" | "right"> = {
      type: "enum",
      key: "test_panel_side",
      values: ["left", "right"] as const,
      defaultValue: "right",
    };

    it("should return default value when localStorage is empty", () => {
      const { result } = renderHook(() => usePreference(enumConfig));

      expect(result.current[0]).toBe("right");
    });

    it("should return stored value from localStorage", () => {
      localStorage.setItem("test_panel_side", "left");

      const { result } = renderHook(() => usePreference(enumConfig));

      expect(result.current[0]).toBe("left");
    });

    it("should update state and localStorage when setter is called", () => {
      const { result } = renderHook(() => usePreference(enumConfig));

      act(() => {
        result.current[1]("left");
      });

      expect(result.current[0]).toBe("left");
      expect(localStorage.getItem("test_panel_side")).toBe("left");
    });
  });

  // FR7: supports boolean type
  describe("boolean type", () => {
    const booleanConfig: BooleanConfig = {
      type: "boolean",
      key: "test_panel_open",
      defaultValue: false,
    };

    it("should return default value when localStorage is empty", () => {
      const { result } = renderHook(() => usePreference(booleanConfig));

      expect(result.current[0]).toBe(false);
    });

    it("should return stored boolean from localStorage", () => {
      localStorage.setItem("test_panel_open", "true");

      const { result } = renderHook(() => usePreference(booleanConfig));

      expect(result.current[0]).toBe(true);
    });

    it("should update state and localStorage when setter is called", () => {
      const { result } = renderHook(() => usePreference(booleanConfig));

      act(() => {
        result.current[1](true);
      });

      expect(result.current[0]).toBe(true);
      expect(localStorage.getItem("test_panel_open")).toBe("true");
    });
  });

  // FR7: supports number type
  describe("number type", () => {
    const numberConfig: NumberConfig = {
      type: "number",
      key: "test_font_size",
      defaultValue: 16,
    };

    it("should return default value when localStorage is empty", () => {
      const { result } = renderHook(() => usePreference(numberConfig));

      expect(result.current[0]).toBe(16);
    });

    it("should return stored number from localStorage", () => {
      localStorage.setItem("test_font_size", "24");

      const { result } = renderHook(() => usePreference(numberConfig));

      expect(result.current[0]).toBe(24);
    });

    it("should update state and localStorage when setter is called", () => {
      const { result } = renderHook(() => usePreference(numberConfig));

      act(() => {
        result.current[1](24);
      });

      expect(result.current[0]).toBe(24);
      expect(localStorage.getItem("test_font_size")).toBe("24");
    });
  });

  // FR7: supports JSON type
  describe("json type", () => {
    const jsonSchema = z.object({
      theme: z.string(),
      fontSize: z.number(),
    });

    type Settings = z.infer<typeof jsonSchema>;

    const jsonConfig: JsonConfig<Settings> = {
      type: "json",
      key: "test_settings",
      schema: jsonSchema,
      defaultValue: { theme: "light", fontSize: 14 },
    };

    it("should return default value when localStorage is empty", () => {
      const { result } = renderHook(() => usePreference(jsonConfig));

      expect(result.current[0]).toEqual({ theme: "light", fontSize: 14 });
    });

    it("should return stored JSON from localStorage", () => {
      localStorage.setItem(
        "test_settings",
        JSON.stringify({ theme: "dark", fontSize: 18 }),
      );

      const { result } = renderHook(() => usePreference(jsonConfig));

      expect(result.current[0]).toEqual({ theme: "dark", fontSize: 18 });
    });

    it("should update state and localStorage when setter is called", () => {
      const { result } = renderHook(() => usePreference(jsonConfig));

      const newSettings: Settings = { theme: "dark", fontSize: 20 };
      act(() => {
        result.current[1](newSettings);
      });

      expect(result.current[0]).toEqual(newSettings);
      expect(localStorage.getItem("test_settings")).toBe(
        JSON.stringify(newSettings),
      );
    });
  });

  // FR6: setter is stable (useCallback)
  describe("setter stability", () => {
    const config: BooleanConfig = {
      type: "boolean",
      key: "test_stable",
      defaultValue: false,
    };

    it("should return the same setter reference across re-renders", () => {
      const { result, rerender } = renderHook(() => usePreference(config));

      const firstSetter = result.current[1];
      rerender();
      const secondSetter = result.current[1];

      expect(firstSetter).toBe(secondSetter);
    });
  });

  // FR6: setter updates when config key changes
  describe("setter updates on config change", () => {
    it("should use updated config key when config changes between renders", () => {
      const configA: EnumConfig<"left" | "right"> = {
        type: "enum",
        key: "test_key_a",
        values: ["left", "right"] as const,
        defaultValue: "right",
      };
      const configB: EnumConfig<"left" | "right"> = {
        type: "enum",
        key: "test_key_b",
        values: ["left", "right"] as const,
        defaultValue: "right",
      };

      const { result, rerender } = renderHook(
        ({ config }) => usePreference(config),
        { initialProps: { config: configA } },
      );

      rerender({ config: configB });

      act(() => {
        result.current[1]("left");
      });

      expect(localStorage.getItem("test_key_b")).toBe("left");
      expect(localStorage.getItem("test_key_a")).toBeNull();
    });
  });
});
