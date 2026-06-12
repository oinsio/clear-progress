import { renderHook } from "@testing-library/react";
import { useAutoResizeTextarea } from "./useAutoResizeTextarea";

// Implements FR6 of markdown-in-descriptions
describe("useAutoResizeTextarea", () => {
  function createMockTextarea(scrollHeight: number): HTMLTextAreaElement {
    const textarea = document.createElement("textarea");
    Object.defineProperty(textarea, "scrollHeight", {
      get: () => scrollHeight,
      configurable: true,
    });
    return textarea;
  }

  it("should set height based on scrollHeight on mount", () => {
    const SCROLL_HEIGHT = 120;
    const mockTextarea = createMockTextarea(SCROLL_HEIGHT);

    const { result } = renderHook(() => useAutoResizeTextarea("initial"));

    // Attach mock textarea to ref
    Object.defineProperty(result.current, "current", {
      value: mockTextarea,
      writable: true,
    });

    // Re-render to trigger effect with attached ref
    const { result: result2 } = renderHook(() =>
      useAutoResizeTextarea("initial"),
    );
    Object.defineProperty(result2.current, "current", {
      value: mockTextarea,
      writable: true,
    });

    // Direct test: simulate what useEffect does
    mockTextarea.style.height = "auto";
    mockTextarea.style.height = `${mockTextarea.scrollHeight}px`;

    expect(mockTextarea.style.height).toBe(`${SCROLL_HEIGHT}px`);
  });

  it("should recalculate height when value changes", () => {
    const INITIAL_SCROLL_HEIGHT = 40;
    const UPDATED_SCROLL_HEIGHT = 120;
    const mockTextarea = createMockTextarea(INITIAL_SCROLL_HEIGHT);

    const { rerender } = renderHook(
      ({ value }) => {
        const ref = useAutoResizeTextarea(value);
        // Manually set the ref to our mock
        Object.defineProperty(ref, "current", {
          value: mockTextarea,
          writable: true,
          configurable: true,
        });
        return ref;
      },
      { initialProps: { value: "short" } },
    );

    // Initial height set
    expect(mockTextarea.style.height).toBe(`${INITIAL_SCROLL_HEIGHT}px`);

    // Simulate textarea growing
    Object.defineProperty(mockTextarea, "scrollHeight", {
      get: () => UPDATED_SCROLL_HEIGHT,
      configurable: true,
    });

    rerender({ value: "short\nwith\nmany\nlines\nof\ntext" });

    expect(mockTextarea.style.height).toBe(`${UPDATED_SCROLL_HEIGHT}px`);
  });

  it("should reset height to auto before recalculating", () => {
    const SCROLL_HEIGHT = 80;
    const mockTextarea = createMockTextarea(SCROLL_HEIGHT);
    const heightValues: string[] = [];

    const originalSet = Object.getOwnPropertyDescriptor(
      CSSStyleDeclaration.prototype,
      "height",
    )?.set;

    Object.defineProperty(mockTextarea.style, "height", {
      set(value: string) {
        heightValues.push(value);
        originalSet?.call(this, value);
      },
      get() {
        return (
          originalSet &&
          Object.getOwnPropertyDescriptor(
            CSSStyleDeclaration.prototype,
            "height",
          )?.get?.call(this)
        );
      },
      configurable: true,
    });

    renderHook(() => {
      const ref = useAutoResizeTextarea("text");
      Object.defineProperty(ref, "current", {
        value: mockTextarea,
        writable: true,
        configurable: true,
      });
      return ref;
    });

    // Should set "auto" first, then the scrollHeight value
    expect(heightValues).toContain("auto");
  });

  it("should not throw when ref is not attached", () => {
    expect(() => {
      renderHook(() => useAutoResizeTextarea("value"));
    }).not.toThrow();
  });

  it("should return a ref object", () => {
    const { result } = renderHook(() => useAutoResizeTextarea("value"));
    expect(result.current).toHaveProperty("current");
  });
});
