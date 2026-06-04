import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_HANDEDNESS,
  HANDEDNESS_OPTIONS,
  STORAGE_KEYS,
} from "@/constants";
import { useHandedness } from "../useHandedness";

// implements FR13 of command-bar

describe("useHandedness", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should return default handedness when nothing is cached", () => {
    const { result } = renderHook(() => useHandedness());

    expect(result.current.handedness).toBe(DEFAULT_HANDEDNESS);
  });

  it("should read cached 'left' from localStorage on init", () => {
    localStorage.setItem(STORAGE_KEYS.HANDEDNESS, "left");

    const { result } = renderHook(() => useHandedness());

    expect(result.current.handedness).toBe("left");
  });

  it("should read cached 'right' from localStorage on init", () => {
    localStorage.setItem(STORAGE_KEYS.HANDEDNESS, "right");

    const { result } = renderHook(() => useHandedness());

    expect(result.current.handedness).toBe("right");
  });

  it("should fall back to default for invalid cached value", () => {
    localStorage.setItem(STORAGE_KEYS.HANDEDNESS, "center");

    const { result } = renderHook(() => useHandedness());

    expect(result.current.handedness).toBe(DEFAULT_HANDEDNESS);
  });

  it("should fall back to default for empty cached value", () => {
    localStorage.setItem(STORAGE_KEYS.HANDEDNESS, "");

    const { result } = renderHook(() => useHandedness());

    expect(result.current.handedness).toBe(DEFAULT_HANDEDNESS);
  });

  it("should update state when setHandedness is called", () => {
    const { result } = renderHook(() => useHandedness());

    act(() => {
      result.current.setHandedness("left");
    });

    expect(result.current.handedness).toBe("left");
  });

  it("should persist value to localStorage when setHandedness is called", () => {
    const { result } = renderHook(() => useHandedness());

    act(() => {
      result.current.setHandedness("left");
    });

    expect(localStorage.getItem(STORAGE_KEYS.HANDEDNESS)).toBe("left");
  });

  it("should persist and return updated value after toggling", () => {
    const { result } = renderHook(() => useHandedness());

    act(() => {
      result.current.setHandedness("left");
    });
    expect(result.current.handedness).toBe("left");
    expect(localStorage.getItem(STORAGE_KEYS.HANDEDNESS)).toBe("left");

    act(() => {
      result.current.setHandedness("right");
    });
    expect(result.current.handedness).toBe("right");
    expect(localStorage.getItem(STORAGE_KEYS.HANDEDNESS)).toBe("right");
  });

  it("should only accept values from HANDEDNESS_OPTIONS", () => {
    for (const validOption of HANDEDNESS_OPTIONS) {
      localStorage.setItem(STORAGE_KEYS.HANDEDNESS, validOption);
      const { result } = renderHook(() => useHandedness());
      expect(result.current.handedness).toBe(validOption);
    }
  });

  it("should validate cached value against HANDEDNESS_OPTIONS.includes", () => {
    localStorage.setItem(STORAGE_KEYS.HANDEDNESS, "left");
    const { result: validResult } = renderHook(() => useHandedness());
    expect(validResult.current.handedness).toBe("left");

    localStorage.setItem(STORAGE_KEYS.HANDEDNESS, "invalid");
    const { result: invalidResult } = renderHook(() => useHandedness());
    expect(invalidResult.current.handedness).toBe(DEFAULT_HANDEDNESS);
  });
});
