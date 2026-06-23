import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { BACKEND_CONNECTION_EVENT } from "@/constants";

export interface EventDispatchState {
  backendEventDispatched: boolean;
}

export function setupEventListeners<T>(
  f: FeatureDescriibeCallbackParams<T>,
  state: EventDispatchState,
): void {
  let backendHandler: () => void;

  f.BeforeEachScenario(() => {
    state.backendEventDispatched = false;

    backendHandler = () => {
      state.backendEventDispatched = true;
    };
    window.addEventListener(BACKEND_CONNECTION_EVENT, backendHandler);
  });

  f.AfterEachScenario(() => {
    window.removeEventListener(BACKEND_CONNECTION_EVENT, backendHandler);
  });
}
