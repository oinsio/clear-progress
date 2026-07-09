import { vi } from "vitest";
import type { CommandBarEyeToggleConfig } from "@/components/command-bar";

export {
  createFilterConfig,
  DEFAULT_FILTER_ITEMS,
  PLACEHOLDER_TEXT,
  StubFilterIcon,
  StubIcon,
} from "@/test/mocks/commandBarMocks";

export const mockUseHandedness = vi.fn();
export const mockUseFilterBarPosition = vi.fn();

export function createEyeToggleConfig(
  overrides?: Partial<CommandBarEyeToggleConfig>,
): CommandBarEyeToggleConfig {
  return {
    isVisible: true,
    onToggle: vi.fn(),
    ...overrides,
  };
}
