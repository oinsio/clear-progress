import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { setupInlineAdd } from "./useInlineAdd.test-utils";

describe("useInlineAdd — handleBlur", () => {
  let setup: ReturnType<typeof setupInlineAdd>;

  beforeEach(() => {
    setup = setupInlineAdd();
  });

  it("should set isAdding to false when value is empty", () => {
    act(() => {
      setup.result.current.setIsAdding(true);
      setup.result.current.setValue("");
    });

    act(() => {
      setup.result.current.handleBlur();
    });

    expect(setup.result.current.isAdding).toBe(false);
  });

  it("should call onCreate and reset state when blur fires with non-empty value", async () => {
    act(() => {
      setup.result.current.setIsAdding(true);
      setup.result.current.setValue("Some text");
    });

    await act(async () => {
      setup.result.current.handleBlur();
      await Promise.resolve();
    });

    expect(setup.onCreate).toHaveBeenCalledWith("Some text");
    expect(setup.result.current.isAdding).toBe(false);
    expect(setup.result.current.value).toBe("");
  });

  it("should call onCreate with trimmed value when blur fires with non-empty value", async () => {
    act(() => {
      setup.result.current.setValue("  trimmed  ");
    });

    await act(async () => {
      setup.result.current.handleBlur();
      await Promise.resolve();
    });

    expect(setup.onCreate).toHaveBeenCalledWith("trimmed");
  });

  it("should not call onCreate when blur fires with empty value", () => {
    act(() => {
      setup.result.current.setIsAdding(true);
      setup.result.current.setValue("");
    });

    act(() => {
      setup.result.current.handleBlur();
    });

    expect(setup.onCreate).not.toHaveBeenCalled();
  });

  it("should not call onCreate when blur fires with whitespace-only value", () => {
    act(() => {
      setup.result.current.setIsAdding(true);
      setup.result.current.setValue("   ");
    });

    act(() => {
      setup.result.current.handleBlur();
    });

    expect(setup.onCreate).not.toHaveBeenCalled();
  });

  it("should set isAdding to false when value is only whitespace", () => {
    act(() => {
      setup.result.current.setIsAdding(true);
      setup.result.current.setValue("   ");
    });

    act(() => {
      setup.result.current.handleBlur();
    });

    expect(setup.result.current.isAdding).toBe(false);
  });
});
