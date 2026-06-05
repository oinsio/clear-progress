import { useHasTouchPointer } from "./useHasTouchPointer";
import { useIsDesktop } from "./useIsDesktop";

/**
 * Determines whether the task completion checkbox should be displayed.
 *
 * Logic:
 * - On desktop (≥1024px) — always show
 * - On devices with touch pointer (pointer: coarse) — hide
 * - On devices with mouse/trackpad (pointer: fine) — show
 *
 * @returns true if the checkbox should be visible
 */
export function useShowCheckbox(): boolean {
  const isDesktop = useIsDesktop();
  const hasTouchPointer = useHasTouchPointer();

  return isDesktop || !hasTouchPointer;
}
