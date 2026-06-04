import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COMMAND_BAR_STACKED_CLASS } from "@/constants";
import { useTextareaAutoGrow } from "../useTextareaAutoGrow";

// implements FR10, FR12, NFR-P1 of command-bar

const SINGLE_LINE_HEIGHT = 24;
const WRAPPED_SCROLL_HEIGHT = 60;
const MAX_HEIGHT = 160;
const EXCEEDS_MAX_SCROLL_HEIGHT = 200;

interface MockTextarea {
  element: HTMLTextAreaElement;
  setScrollHeight: (height: number) => void;
}

function createMockTextarea(initialScrollHeight: number): MockTextarea {
  const element = document.createElement("textarea");
  let currentScrollHeight = initialScrollHeight;

  Object.defineProperty(element, "scrollHeight", {
    get: () => currentScrollHeight,
    configurable: true,
  });

  const originalGetComputedStyle = window.getComputedStyle;
  vi.stubGlobal("getComputedStyle", (target: Element) => {
    if (target === element) {
      return { maxHeight: `${MAX_HEIGHT}px` } as CSSStyleDeclaration;
    }
    return originalGetComputedStyle(target);
  });

  return {
    element,
    setScrollHeight(height: number) {
      currentScrollHeight = height;
    },
  };
}

function createMockActionsContainer(): HTMLDivElement {
  return document.createElement("div");
}

interface HookSetup {
  mockTextarea: MockTextarea;
  actionsContainer: HTMLDivElement;
  result: { current: ReturnType<typeof useTextareaAutoGrow> };
}

function setupHook(): HookSetup {
  const mockTextarea = createMockTextarea(SINGLE_LINE_HEIGHT);
  const actionsContainer = createMockActionsContainer();

  const { result } = renderHook(() => useTextareaAutoGrow());

  Object.defineProperty(result.current.textareaRef, "current", {
    value: mockTextarea.element,
    writable: true,
  });
  Object.defineProperty(result.current.actionsRef, "current", {
    value: actionsContainer,
    writable: true,
  });

  return { mockTextarea, actionsContainer, result };
}

function setupWrapped(): HookSetup {
  const setup = setupHook();

  act(() => {
    setup.result.current.handleInput();
  });

  setup.mockTextarea.setScrollHeight(WRAPPED_SCROLL_HEIGHT);

  act(() => {
    setup.result.current.handleInput();
  });

  return setup;
}

function setupCleared(): HookSetup {
  const setup = setupWrapped();

  setup.mockTextarea.setScrollHeight(SINGLE_LINE_HEIGHT);

  act(() => {
    setup.result.current.handleInput();
  });

  return setup;
}

describe("useTextareaAutoGrow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should measure singleLineHeight on init", () => {
      const { result } = setupHook();

      expect(result.current.isWrapped).toBe(false);
    });
  });

  describe("single-line text", () => {
    it("should report isWrapped as false when text fits in one line", () => {
      const { result } = setupHook();

      act(() => {
        result.current.handleInput();
      });

      expect(result.current.isWrapped).toBe(false);
    });

    it("should not set inline height when text is single-line", () => {
      const { mockTextarea, result } = setupHook();

      act(() => {
        result.current.handleInput();
      });

      expect(mockTextarea.element.style.height).toBe("");
    });

    it("should not add stacked class when text is single-line", () => {
      const { actionsContainer, result } = setupHook();

      act(() => {
        result.current.handleInput();
      });

      expect(
        actionsContainer.classList.contains(COMMAND_BAR_STACKED_CLASS),
      ).toBe(false);
    });
  });

  describe("wrapped text", () => {
    it("should report isWrapped as true when scrollHeight exceeds singleLineHeight", () => {
      const { result } = setupWrapped();

      expect(result.current.isWrapped).toBe(true);
    });

    it("should set inline height when text wraps", () => {
      const { mockTextarea } = setupWrapped();

      expect(mockTextarea.element.style.height).toBe(
        `${WRAPPED_SCROLL_HEIGHT}px`,
      );
    });

    it("should add stacked class to actions container when text wraps", () => {
      const { actionsContainer } = setupWrapped();

      expect(
        actionsContainer.classList.contains(COMMAND_BAR_STACKED_CLASS),
      ).toBe(true);
    });

    it("should set overflow-y to hidden when wrapped but within max-height", () => {
      const { mockTextarea } = setupWrapped();

      expect(mockTextarea.element.style.overflowY).toBe("hidden");
    });
  });

  describe("max-height exceeded", () => {
    it("should cap height at computed max-height", () => {
      const { mockTextarea, result } = setupHook();

      act(() => {
        result.current.handleInput();
      });

      mockTextarea.setScrollHeight(EXCEEDS_MAX_SCROLL_HEIGHT);

      act(() => {
        result.current.handleInput();
      });

      expect(mockTextarea.element.style.height).toBe(`${MAX_HEIGHT}px`);
    });

    it("should set overflow-y to auto when content exceeds max-height", () => {
      const { mockTextarea, result } = setupHook();

      act(() => {
        result.current.handleInput();
      });

      mockTextarea.setScrollHeight(EXCEEDS_MAX_SCROLL_HEIGHT);

      act(() => {
        result.current.handleInput();
      });

      expect(mockTextarea.element.style.overflowY).toBe("auto");
    });
  });

  describe("clearing text", () => {
    it("should reset isWrapped to false when text is cleared", () => {
      const { result } = setupCleared();

      expect(result.current.isWrapped).toBe(false);
    });

    it("should remove inline height when text is cleared", () => {
      const { mockTextarea } = setupCleared();

      expect(mockTextarea.element.style.height).toBe("");
    });

    it("should remove stacked class when text is cleared", () => {
      const { actionsContainer } = setupCleared();

      expect(
        actionsContainer.classList.contains(COMMAND_BAR_STACKED_CLASS),
      ).toBe(false);
    });
  });

  describe("anti-oscillation", () => {
    it("should remove stacked class before measuring to get row-mode scrollHeight", () => {
      const mockTextarea = createMockTextarea(SINGLE_LINE_HEIGHT);
      const actionsContainer = createMockActionsContainer();
      const classListOperations: string[] = [];

      // Track classList operations before attaching refs
      const originalRemove = actionsContainer.classList.remove.bind(
        actionsContainer.classList,
      );
      const originalAdd = actionsContainer.classList.add.bind(
        actionsContainer.classList,
      );
      actionsContainer.classList.remove = (...tokens: string[]) => {
        classListOperations.push(`remove:${tokens.join(",")}`);
        originalRemove(...tokens);
      };
      actionsContainer.classList.add = (...tokens: string[]) => {
        classListOperations.push(`add:${tokens.join(",")}`);
        originalAdd(...tokens);
      };

      const { result } = renderHook(() => useTextareaAutoGrow());

      Object.defineProperty(result.current.textareaRef, "current", {
        value: mockTextarea.element,
        writable: true,
      });
      Object.defineProperty(result.current.actionsRef, "current", {
        value: actionsContainer,
        writable: true,
      });

      act(() => {
        result.current.handleInput();
      });

      // Pre-add stacked class to simulate previous wrap state
      actionsContainer.classList.add(COMMAND_BAR_STACKED_CLASS);
      classListOperations.length = 0;

      mockTextarea.setScrollHeight(WRAPPED_SCROLL_HEIGHT);

      act(() => {
        result.current.handleInput();
      });

      // First operation should be removing stacked class (measure in row-mode)
      expect(classListOperations[0]).toBe(
        `remove:${COMMAND_BAR_STACKED_CLASS}`,
      );
    });
  });

  describe("boundary: scrollHeight equals maxHeight", () => {
    it("should set overflow-y to hidden when scrollHeight equals max-height exactly", () => {
      const { mockTextarea, result } = setupHook();

      act(() => {
        result.current.handleInput();
      });

      // scrollHeight === maxHeight (160 === 160)
      mockTextarea.setScrollHeight(MAX_HEIGHT);

      act(() => {
        result.current.handleInput();
      });

      expect(mockTextarea.element.style.overflowY).toBe("hidden");
      expect(mockTextarea.element.style.height).toBe(`${MAX_HEIGHT}px`);
    });

    it("should set overflow-y to auto only when scrollHeight strictly exceeds max-height", () => {
      const { mockTextarea, result } = setupHook();

      act(() => {
        result.current.handleInput();
      });

      mockTextarea.setScrollHeight(MAX_HEIGHT + 1);

      act(() => {
        result.current.handleInput();
      });

      expect(mockTextarea.element.style.overflowY).toBe("auto");
    });
  });

  describe("height reset to auto before measuring", () => {
    it("should set height to auto before measuring wrapped scrollHeight", () => {
      const { mockTextarea, result } = setupHook();
      const styleOperations: string[] = [];

      act(() => {
        result.current.handleInput();
      });

      // Track style.height assignments after init
      const originalDescriptor = Object.getOwnPropertyDescriptor(
        mockTextarea.element.style,
        "height",
      );
      let lastHeight = "";
      Object.defineProperty(mockTextarea.element.style, "height", {
        get: () => lastHeight,
        set: (value: string) => {
          styleOperations.push(value);
          lastHeight = value;
          if (originalDescriptor?.set) {
            originalDescriptor.set.call(mockTextarea.element.style, value);
          }
        },
        configurable: true,
      });

      mockTextarea.setScrollHeight(WRAPPED_SCROLL_HEIGHT);

      act(() => {
        result.current.handleInput();
      });

      // Should include "auto" as one of the height assignments
      expect(styleOperations).toContain("auto");
    });
  });

  describe("null refs", () => {
    it("should not throw when textarea ref is null", () => {
      const { result } = renderHook(() => useTextareaAutoGrow());

      expect(() => {
        act(() => {
          result.current.handleInput();
        });
      }).not.toThrow();
    });

    it("should not throw when actions ref is null", () => {
      const mockTextarea = createMockTextarea(SINGLE_LINE_HEIGHT);
      const { result } = renderHook(() => useTextareaAutoGrow());

      Object.defineProperty(result.current.textareaRef, "current", {
        value: mockTextarea.element,
        writable: true,
      });

      expect(() => {
        act(() => {
          result.current.handleInput();
        });
      }).not.toThrow();
    });
  });
});
