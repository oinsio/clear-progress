import { useEffect, useState } from "react";

const TOUCH_POINTER_QUERY = "(pointer: coarse)";

function getHasTouchPointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(TOUCH_POINTER_QUERY).matches;
}

export function useHasTouchPointer(): boolean {
  const [hasTouchPointer, setHasTouchPointer] =
    useState<boolean>(getHasTouchPointer);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia(TOUCH_POINTER_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setHasTouchPointer(event.matches);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return hasTouchPointer;
}
