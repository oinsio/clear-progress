import { useHasTouchPointer } from "./useHasTouchPointer";
import { useIsDesktop } from "./useIsDesktop";

/**
 * Определяет, нужно ли отображать чекбокс завершения задачи.
 *
 * Логика:
 * - На десктопе (≥1024px) — показывать всегда
 * - На устройствах с touch pointer (pointer: coarse) — скрывать
 * - На устройствах с мышью/трекпадом (pointer: fine) — показывать
 *
 * @returns true, если чекбокс должен быть виден
 */
export function useShowCheckbox(): boolean {
  const isDesktop = useIsDesktop();
  const hasTouchPointer = useHasTouchPointer();

  return isDesktop || !hasTouchPointer;
}
