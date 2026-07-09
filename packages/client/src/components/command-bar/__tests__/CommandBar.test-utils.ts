import React from "react";
import { vi } from "vitest";
import type {
  CommandBarEyeToggleConfig,
  CommandBarFilterConfig,
  CommandBarFilterItem,
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

function StubFilterIcon({ className }: { className?: string }) {
  return React.createElement("span", { className });
}

const DEFAULT_FILTER_ITEMS: CommandBarFilterItem[] = [
  { value: "today", icon: StubFilterIcon, label: "Today" },
  { value: "week", icon: StubFilterIcon, label: "Week" },
  { value: "later", icon: StubFilterIcon, label: "Later" },
  { value: "all", icon: StubFilterIcon, label: "All" },
];

export function createFilterConfig(
  overrides?: Partial<CommandBarFilterConfig>,
): CommandBarFilterConfig {
  return {
    items: DEFAULT_FILTER_ITEMS,
    activeValue: "today",
    onChange: vi.fn(),
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
