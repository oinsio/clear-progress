import { BOX_FILTER_ALL } from "@/constants";
import { useSettings } from "@/hooks/useSettings";
import type { Box, BoxFilter } from "@/types/common";

/**
 * Resolves a BoxFilter to a concrete Box.
 * If activeBox is a specific box, returns it directly.
 * If activeBox is "all", returns the user's default box from settings.
 *
 * Implements FR19 of command-bar.
 */
export function useTargetBox(activeBox: BoxFilter): Box {
  const { defaultBox } = useSettings();

  if (activeBox === BOX_FILTER_ALL) {
    return defaultBox;
  }

  return activeBox;
}
