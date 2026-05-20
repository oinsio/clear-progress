import { renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { useInlineAdd } from "./useInlineAdd";

export function setupInlineAdd() {
  const onCreate = vi.fn().mockResolvedValue(undefined);
  const { result } = renderHook(() => useInlineAdd(onCreate));
  return { onCreate, result };
}
