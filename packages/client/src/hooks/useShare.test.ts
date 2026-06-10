import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock react-i18next — each call returns a new `t` reference so useCallback [t] dep works
let currentTranslate: (key: string) => string = (key) => key;
const makeTranslate = () => {
  const impl = currentTranslate;
  return (key: string) => impl(key);
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: makeTranslate(),
    i18n: { language: "en" },
  }),
}));

import { useShare } from "./useShare";

const TEST_ORIGIN = "https://clear-progress.app";
const TEST_BASE_URL = "/clear-progress/";
const COPY_ACTION_TIMEOUT_MS = 100;

describe("useShare", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("location", { origin: TEST_ORIGIN });
    import.meta.env.BASE_URL = TEST_BASE_URL;
    currentTranslate = (key: string) => key;
  });

  describe("initial state", () => {
    it("should return idle as initial copyResult", () => {
      vi.stubGlobal("navigator", {
        clipboard: { writeText: vi.fn() },
      });

      const { result } = renderHook(() => useShare());

      expect(result.current.copyResult).toBe("idle");
    });
  });

  describe("copyLink", () => {
    // FR4: copies invite message + origin URL to clipboard
    it("should copy invite message and origin URL to clipboard", async () => {
      vi.stubGlobal("navigator", {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      const { result } = renderHook(() => useShare());

      await act(() => result.current.copyLink());

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `share.inviteMessage\n${TEST_ORIGIN}${TEST_BASE_URL}`,
      );
    });

    // FR5: sets copied state after successful copy
    it("should set copyResult to copied on success", async () => {
      vi.stubGlobal("navigator", {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      const { result } = renderHook(() => useShare());

      await act(() => result.current.copyLink());

      expect(result.current.copyResult).toBe("copied");
    });

    // FR4: sets error state when clipboard fails
    it("should set copyResult to error on clipboard failure", async () => {
      vi.stubGlobal("navigator", {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error("Clipboard denied")),
        },
      });

      const { result } = renderHook(() => useShare());

      await act(() => result.current.copyLink());

      expect(result.current.copyResult).toBe("error");
    });

    // FR2: no double slash when BASE_URL = "/"
    it("should produce correct URL when BASE_URL is root slash", async () => {
      import.meta.env.BASE_URL = "/";
      vi.stubGlobal("navigator", {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      const { result } = renderHook(() => useShare());

      await act(() => result.current.copyLink());

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `share.inviteMessage\n${TEST_ORIGIN}/`,
      );
    });

    it("should use updated translation when t function changes", async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("navigator", {
        clipboard: { writeText: writeTextMock },
      });

      const { result, rerender } = renderHook(() => useShare());

      await act(() => result.current.copyLink());
      expect(writeTextMock).toHaveBeenCalledWith(
        `share.inviteMessage\n${TEST_ORIGIN}${TEST_BASE_URL}`,
      );

      currentTranslate = (key: string) => `translated:${key}`;
      rerender();

      await act(() => result.current.copyLink());
      expect(writeTextMock).toHaveBeenLastCalledWith(
        `translated:share.inviteMessage\n${TEST_ORIGIN}${TEST_BASE_URL}`,
      );
    });
  });

  describe("resetCopyResult", () => {
    // FR5: reset to idle for dialog dismiss
    it("should reset copyResult back to idle", async () => {
      vi.stubGlobal("navigator", {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      const { result } = renderHook(() => useShare());

      await act(() => result.current.copyLink());
      expect(result.current.copyResult).toBe("copied");

      act(() => result.current.resetCopyResult());
      expect(result.current.copyResult).toBe("idle");
    });
  });

  // NFR-P1: copy action performance
  describe("performance (NFR-P1)", () => {
    it("should complete clipboard copy within 100ms", async () => {
      vi.stubGlobal("navigator", {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      const { result } = renderHook(() => useShare());

      const startTime = performance.now();
      await act(() => result.current.copyLink());
      const elapsedTime = performance.now() - startTime;

      expect(elapsedTime).toBeLessThan(COPY_ACTION_TIMEOUT_MS);
    });
  });
});
