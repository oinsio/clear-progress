import React from "react";
import { vi } from "vitest";
import type {
  CommandBarEyeToggleConfig,
  CommandBarFilterConfig,
} from "@/components/command-bar";

export const mockUseHandedness = vi.fn();
export const mockUseFilterBarPosition = vi.fn();

export const PLACEHOLDER_TEXT = "Add a task...";

export function StubIcon({ className }: { className?: string }) {
  return React.createElement("svg", {
    className,
    "data-testid": "stub-entity-icon",
  });
}

export function createFilterConfig(
  overrides?: Partial<CommandBarFilterConfig>,
): CommandBarFilterConfig {
  return {
    boxes: ["today", "week", "later", "all"],
    activeBox: "today",
    onBoxChange: vi.fn(),
    ...overrides,
  };
}

export function createEyeToggleConfig(
  overrides?: Partial<CommandBarEyeToggleConfig>,
): CommandBarEyeToggleConfig {
  return {
    isVisible: true,
    onToggle: vi.fn(),
    ...overrides,
  };
}
