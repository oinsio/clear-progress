import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

import { useShare } from "./useShare";

const TEST_ORIGIN = "https://clear-progress.app";
const SHARE_ACTION_TIMEOUT_MS = 100;

describe("useShare", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("location", { origin: TEST_ORIGIN });
  });

  describe("when Web Share API is available", () => {
    beforeEach(() => {
      vi.stubGlobal("navigator", {
        share: vi.fn().mockResolvedValue(undefined),
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });
    });

    // FR3: calls navigator.share with correct data
    it("should call navigator.share with app title, invite message, and origin URL", async () => {
      const { result } = renderHook(() => useShare());

      await act(() => result.current.shareApp());

      expect(navigator.share).toHaveBeenCalledWith({
        title: "Clear Progress",
        text: "share.inviteMessage",
        url: TEST_ORIGIN,
      });
    });

    // FR3: stays idle after successful native share
    it("should keep shareResult as idle after successful share", async () => {
      const { result } = renderHook(() => useShare());

      await act(() => result.current.shareApp());

      expect(result.current.shareResult).toBe("idle");
    });
  });

  describe("when user cancels native share (AbortError)", () => {
    beforeEach(() => {
      const abortError = new DOMException("Share cancelled", "AbortError");
      vi.stubGlobal("navigator", {
        share: vi.fn().mockRejectedValue(abortError),
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });
    });

    // FR3: AbortError is silently ignored
    it("should stay idle when user cancels the share sheet", async () => {
      const { result } = renderHook(() => useShare());

      await act(() => result.current.shareApp());

      expect(result.current.shareResult).toBe("idle");
    });

    it("should not fall back to clipboard on AbortError", async () => {
      const { result } = renderHook(() => useShare());

      await act(() => result.current.shareApp());

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });
  });

  describe("when Web Share API throws DOMException with non-AbortError name", () => {
    beforeEach(() => {
      const notAllowedError = new DOMException(
        "Not allowed",
        "NotAllowedError",
      );
      vi.stubGlobal("navigator", {
        share: vi.fn().mockRejectedValue(notAllowedError),
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });
    });

    // FR4: non-AbortError DOMException should fall back to clipboard
    it("should fall back to clipboard when DOMException is not AbortError", async () => {
      const { result } = renderHook(() => useShare());

      await act(() => result.current.shareApp());

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(TEST_ORIGIN);
    });

    it("should set shareResult to copied", async () => {
      const { result } = renderHook(() => useShare());

      await act(() => result.current.shareApp());

      expect(result.current.shareResult).toBe("copied");
    });
  });

  describe("when Web Share API throws non-DOMException with AbortError name", () => {
    beforeEach(() => {
      const fakeAbortError = new Error("Fake abort");
      fakeAbortError.name = "AbortError";
      vi.stubGlobal("navigator", {
        share: vi.fn().mockRejectedValue(fakeAbortError),
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });
    });

    // FR4: non-DOMException errors should always fall back to clipboard
    it("should fall back to clipboard even if error name is AbortError", async () => {
      const { result } = renderHook(() => useShare());

      await act(() => result.current.shareApp());

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(TEST_ORIGIN);
    });

    it("should set shareResult to copied", async () => {
      const { result } = renderHook(() => useShare());

      await act(() => result.current.shareApp());

      expect(result.current.shareResult).toBe("copied");
    });
  });

  describe("when Web Share API throws non-AbortError", () => {
    beforeEach(() => {
      const shareError = new Error("Share failed");
      vi.stubGlobal("navigator", {
        share: vi.fn().mockRejectedValue(shareError),
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });
    });

    // FR4: falls back to clipboard on non-AbortError
    it("should fall back to clipboard copy", async () => {
      const { result } = renderHook(() => useShare());

      await act(() => result.current.shareApp());

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(TEST_ORIGIN);
    });

    // FR5: sets copied state after clipboard fallback
    it("should set shareResult to copied", async () => {
      const { result } = renderHook(() => useShare());

      await act(() => result.current.shareApp());

      expect(result.current.shareResult).toBe("copied");
    });
  });

  describe("when Web Share API is NOT available", () => {
    beforeEach(() => {
      vi.stubGlobal("navigator", {
        share: undefined,
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });
    });

    // FR4: copies origin URL to clipboard
    it("should copy origin URL to clipboard", async () => {
      const { result } = renderHook(() => useShare());

      await act(() => result.current.shareApp());

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(TEST_ORIGIN);
    });

    // FR5: sets copied state
    it("should set shareResult to copied", async () => {
      const { result } = renderHook(() => useShare());

      await act(() => result.current.shareApp());

      expect(result.current.shareResult).toBe("copied");
    });
  });

  describe("when clipboard fails", () => {
    beforeEach(() => {
      vi.stubGlobal("navigator", {
        share: undefined,
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error("Clipboard denied")),
        },
      });
    });

    // FR4: sets error state when clipboard fails
    it("should set shareResult to error", async () => {
      const { result } = renderHook(() => useShare());

      await act(() => result.current.shareApp());

      expect(result.current.shareResult).toBe("error");
    });
  });

  describe("resetShareResult", () => {
    // FR5: reset to idle for dialog dismiss
    it("should reset shareResult back to idle", async () => {
      vi.stubGlobal("navigator", {
        share: undefined,
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      const { result } = renderHook(() => useShare());

      await act(() => result.current.shareApp());
      expect(result.current.shareResult).toBe("copied");

      act(() => result.current.resetShareResult());
      expect(result.current.shareResult).toBe("idle");
    });
  });

  describe("initial state", () => {
    it("should return idle as initial shareResult", () => {
      vi.stubGlobal("navigator", {
        share: vi.fn(),
        clipboard: { writeText: vi.fn() },
      });

      const { result } = renderHook(() => useShare());

      expect(result.current.shareResult).toBe("idle");
    });
  });

  // NFR-P1: share action performance
  describe("performance (NFR-P1)", () => {
    it("should complete Web Share API call within 100ms", async () => {
      vi.stubGlobal("navigator", {
        share: vi.fn().mockResolvedValue(undefined),
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      const { result } = renderHook(() => useShare());

      const startTime = performance.now();
      await act(() => result.current.shareApp());
      const elapsedTime = performance.now() - startTime;

      expect(elapsedTime).toBeLessThan(SHARE_ACTION_TIMEOUT_MS);
    });

    it("should complete clipboard copy path within 100ms", async () => {
      vi.stubGlobal("navigator", {
        share: undefined,
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      const { result } = renderHook(() => useShare());

      const startTime = performance.now();
      await act(() => result.current.shareApp());
      const elapsedTime = performance.now() - startTime;

      expect(elapsedTime).toBeLessThan(SHARE_ACTION_TIMEOUT_MS);
    });
  });
});
