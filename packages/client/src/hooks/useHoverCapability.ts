/**
 * Detects whether the current device supports hover interactions
 * via the CSS media query `(hover: hover)`.
 *
 * Implements FR8, NFR-R3 of improve-sidebar-ux.
 */
import { useEffect, useState } from "react";

const HOVER_MEDIA_QUERY = "(hover: hover)";

function getHasHover(): boolean {
  return window.matchMedia(HOVER_MEDIA_QUERY).matches;
}

export function useHoverCapability(): boolean {
  const [hasHover, setHasHover] = useState<boolean>(getHasHover);

  useEffect(() => {
    const mediaQuery = window.matchMedia(HOVER_MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setHasHover(event.matches);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return hasHover;
}
