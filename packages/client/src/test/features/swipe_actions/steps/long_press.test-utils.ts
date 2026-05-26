import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { vi } from "vitest";

export const TOUCH_START_X = 100;
export const TOUCH_START_Y = 100;

export type LongPressFeatureContext = Record<string, never>;

export interface LongPressMocks {
  onLongPress: ReturnType<typeof vi.fn>;
  onClick: ReturnType<typeof vi.fn>;
}

export const setupLongPressLifecycle = (
  f: FeatureDescriibeCallbackParams<LongPressFeatureContext>,
): LongPressMocks => {
  const mocks: LongPressMocks = {
    onLongPress: vi.fn(),
    onClick: vi.fn(),
  };

  f.BeforeEachScenario(async () => {
    vi.useFakeTimers();
    mocks.onLongPress = vi.fn();
    mocks.onClick = vi.fn();
  });

  f.AfterEachScenario(async () => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  return mocks;
};
