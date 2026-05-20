import { act } from "@testing-library/react";
import type * as React from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { setupInlineAdd } from "./useInlineAdd.test-utils";

describe("useInlineAdd — handleKeyDown", () => {
  let setup: ReturnType<typeof setupInlineAdd>;

  beforeEach(() => {
    setup = setupInlineAdd();
  });

  it("should call onCreate and reset state when Enter is pressed with non-empty value", async () => {
    act(() => {
      setup.result.current.setValue("My new task");
      setup.result.current.setIsAdding(true);
    });

    await act(async () => {
      setup.result.current.handleKeyDown({
        key: "Enter",
      } as React.KeyboardEvent);
      await Promise.resolve();
    });

    expect(setup.onCreate).toHaveBeenCalledWith("My new task");
    expect(setup.result.current.value).toBe("");
    expect(setup.result.current.isAdding).toBe(false);
  });

  it.each([
    "",
    "   ",
    "  \t  ",
  ])("should not call onCreate when Enter is pressed with blank value %j", async (blankValue) => {
    act(() => {
      setup.result.current.setValue(blankValue);
    });

    await act(async () => {
      setup.result.current.handleKeyDown({
        key: "Enter",
      } as React.KeyboardEvent);
      await Promise.resolve();
    });

    expect(setup.onCreate).not.toHaveBeenCalled();
  });

  it("should set isAdding to false and clear value when Escape is pressed", () => {
    act(() => {
      setup.result.current.setIsAdding(true);
      setup.result.current.setValue("Some text");
    });

    act(() => {
      setup.result.current.handleKeyDown({
        key: "Escape",
      } as React.KeyboardEvent);
    });

    expect(setup.result.current.isAdding).toBe(false);
    expect(setup.result.current.value).toBe("");
  });

  it("should not call onCreate when Escape is pressed", () => {
    act(() => {
      setup.result.current.setValue("Some text");
    });

    act(() => {
      setup.result.current.handleKeyDown({
        key: "Escape",
      } as React.KeyboardEvent);
    });

    expect(setup.onCreate).not.toHaveBeenCalled();
  });

  it("should not react to other keys", () => {
    act(() => {
      setup.result.current.setValue("Some text");
      setup.result.current.setIsAdding(true);
    });

    act(() => {
      setup.result.current.handleKeyDown({ key: "Tab" } as React.KeyboardEvent);
    });

    expect(setup.onCreate).not.toHaveBeenCalled();
    expect(setup.result.current.isAdding).toBe(true);
    expect(setup.result.current.value).toBe("Some text");
  });

  it("should trim value before calling onCreate", async () => {
    act(() => {
      setup.result.current.setValue("  My task  ");
    });

    await act(async () => {
      setup.result.current.handleKeyDown({
        key: "Enter",
      } as React.KeyboardEvent);
      await Promise.resolve();
    });

    expect(setup.onCreate).toHaveBeenCalledWith("My task");
  });
});
