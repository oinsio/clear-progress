import { type RefObject, useEffect } from "react";
import { COMMAND_BAR_CSS_VAR } from "@/constants";

/**
 * Observes the command bar element height and sets a CSS variable on the document root.
 * Throttles updates to one per animation frame.
 * Resets the CSS variable to "0px" on unmount.
 *
 * Implements FR16, NFR-P2 of command-bar.
 */
export function useCommandBarResize(
  barRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const element = barRef.current;
    if (!element) return;

    let rafId: number | null = null;

    const observer = new ResizeObserver((entries) => {
      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        const entry = entries[0];
        if (entry) {
          const height = element.offsetHeight;
          document.documentElement.style.setProperty(
            COMMAND_BAR_CSS_VAR,
            `${height}px`,
          );
        }
        rafId = null;
      });
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
      document.documentElement.style.setProperty(COMMAND_BAR_CSS_VAR, "0px");
    };
  }, [barRef]);
}
