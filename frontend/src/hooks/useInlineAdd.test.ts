import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useInlineAdd } from "./useInlineAdd";
import * as React from "react";

describe("useInlineAdd", () => {
  let onCreate = vi.fn().mockResolvedValue(undefined);
  let result = renderHook(() => useInlineAdd(onCreate)).result;

  beforeEach(() => {
    onCreate = vi.fn().mockResolvedValue(undefined);
    result = renderHook(() => useInlineAdd(onCreate)).result;
  });

  it("should have isAdding false on initial render", () => {
    expect(result.current.isAdding).toBe(false);
  });

  it("should have empty value on initial render", () => {
    expect(result.current.value).toBe("");
  });

  it("should set isAdding to true when setIsAdding(true) is called", () => {
    act(() => {
      result.current.setIsAdding(true);
    });

    expect(result.current.isAdding).toBe(true);
  });

  it("should update value when setValue is called", () => {
    act(() => {
      result.current.setValue("New task");
    });

    expect(result.current.value).toBe("New task");
  });

  describe("handleKeyDown", () => {
    it("should call onCreate and reset state when Enter is pressed with non-empty value", async () => {
      act(() => {
        result.current.setValue("My new task");
        result.current.setIsAdding(true);
      });

      await act(async () => {
        result.current.handleKeyDown({ key: "Enter" } as React.KeyboardEvent);
        await Promise.resolve();
      });

      expect(onCreate).toHaveBeenCalledWith("My new task");
      expect(result.current.value).toBe("");
      expect(result.current.isAdding).toBe(false);
    });

    it.each(["", "   ", "  \t  "])(
      "should not call onCreate when Enter is pressed with blank value %j",
      async (blankValue) => {
        act(() => {
          result.current.setValue(blankValue);
        });

        await act(async () => {
          result.current.handleKeyDown({ key: "Enter" } as React.KeyboardEvent);
          await Promise.resolve();
        });

        expect(onCreate).not.toHaveBeenCalled();
      },
    );

    it("should set isAdding to false and clear value when Escape is pressed", () => {
      act(() => {
        result.current.setIsAdding(true);
        result.current.setValue("Some text");
      });

      act(() => {
        result.current.handleKeyDown({ key: "Escape" } as React.KeyboardEvent);
      });

      expect(result.current.isAdding).toBe(false);
      expect(result.current.value).toBe("");
    });

    it("should not call onCreate when Escape is pressed", () => {
      act(() => {
        result.current.setValue("Some text");
      });

      act(() => {
        result.current.handleKeyDown({ key: "Escape" } as React.KeyboardEvent);
      });

      expect(onCreate).not.toHaveBeenCalled();
    });

    it("should not react to other keys", () => {
      act(() => {
        result.current.setValue("Some text");
        result.current.setIsAdding(true);
      });

      act(() => {
        result.current.handleKeyDown({ key: "Tab" } as React.KeyboardEvent);
      });

      expect(onCreate).not.toHaveBeenCalled();
      expect(result.current.isAdding).toBe(true);
      expect(result.current.value).toBe("Some text");
    });

    it("should trim value before calling onCreate", async () => {
      act(() => {
        result.current.setValue("  My task  ");
      });

      await act(async () => {
        result.current.handleKeyDown({ key: "Enter" } as React.KeyboardEvent);
        await Promise.resolve();
      });

      expect(onCreate).toHaveBeenCalledWith("My task");
    });
  });

  describe("handleBlur", () => {
    it("should set isAdding to false when value is empty", () => {
      act(() => {
        result.current.setIsAdding(true);
        result.current.setValue("");
      });

      act(() => {
        result.current.handleBlur();
      });

      expect(result.current.isAdding).toBe(false);
    });

    it("should call onCreate and reset state when blur fires with non-empty value", async () => {
      act(() => {
        result.current.setIsAdding(true);
        result.current.setValue("Some text");
      });

      await act(async () => {
        result.current.handleBlur();
        await Promise.resolve();
      });

      expect(onCreate).toHaveBeenCalledWith("Some text");
      expect(result.current.isAdding).toBe(false);
      expect(result.current.value).toBe("");
    });

    it("should call onCreate with trimmed value when blur fires with non-empty value", async () => {
      act(() => {
        result.current.setValue("  trimmed  ");
      });

      await act(async () => {
        result.current.handleBlur();
        await Promise.resolve();
      });

      expect(onCreate).toHaveBeenCalledWith("trimmed");
    });

    it("should not call onCreate when blur fires with empty value", () => {
      act(() => {
        result.current.setIsAdding(true);
        result.current.setValue("");
      });

      act(() => {
        result.current.handleBlur();
      });

      expect(onCreate).not.toHaveBeenCalled();
    });

    it("should not call onCreate when blur fires with whitespace-only value", () => {
      act(() => {
        result.current.setIsAdding(true);
        result.current.setValue("   ");
      });

      act(() => {
        result.current.handleBlur();
      });

      expect(onCreate).not.toHaveBeenCalled();
    });

    it("should set isAdding to false when value is only whitespace", () => {
      act(() => {
        result.current.setIsAdding(true);
        result.current.setValue("   ");
      });

      act(() => {
        result.current.handleBlur();
      });

      expect(result.current.isAdding).toBe(false);
    });
  });
});
