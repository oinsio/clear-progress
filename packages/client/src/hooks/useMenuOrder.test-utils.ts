import { beforeEach, vi } from "vitest";
import { _resetForTesting } from "@/stores/menuOrderStore";

export function setupMenuOrderTests(): void {
  beforeEach(() => {
    localStorage.clear();
    _resetForTesting();
    vi.clearAllMocks();
  });
}
