import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { setupInlineAdd } from "./useInlineAdd.test-utils";

describe("useInlineAdd", () => {
  let setup: ReturnType<typeof setupInlineAdd>;

  beforeEach(() => {
    setup = setupInlineAdd();
  });

  it("should have isAdding false on initial render", () => {
    expect(setup.result.current.isAdding).toBe(false);
  });

  it("should have empty value on initial render", () => {
    expect(setup.result.current.value).toBe("");
  });

  it("should set isAdding to true when setIsAdding(true) is called", () => {
    act(() => {
      setup.result.current.setIsAdding(true);
    });

    expect(setup.result.current.isAdding).toBe(true);
  });

  it("should update value when setValue is called", () => {
    act(() => {
      setup.result.current.setValue("New task");
    });

    expect(setup.result.current.value).toBe("New task");
  });
});
