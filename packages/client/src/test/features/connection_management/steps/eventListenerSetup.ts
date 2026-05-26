import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import {
  BACKEND_CONNECTION_EVENT,
  GOOGLE_CLIENT_ID_CHANGED_EVENT,
} from "@/constants";

export interface EventDispatchState {
  backendEventDispatched: boolean;
  googleClientIdEventDispatched: boolean;
}

export function setupEventListeners<T>(
  f: FeatureDescriibeCallbackParams<T>,
  state: EventDispatchState,
): void {
  let backendHandler: () => void;
  let googleHandler: () => void;

  f.BeforeEachScenario(() => {
    state.backendEventDispatched = false;
    state.googleClientIdEventDispatched = false;

    backendHandler = () => {
      state.backendEventDispatched = true;
    };
    googleHandler = () => {
      state.googleClientIdEventDispatched = true;
    };
    window.addEventListener(BACKEND_CONNECTION_EVENT, backendHandler);
    window.addEventListener(GOOGLE_CLIENT_ID_CHANGED_EVENT, googleHandler);
  });

  f.AfterEachScenario(() => {
    window.removeEventListener(BACKEND_CONNECTION_EVENT, backendHandler);
    window.removeEventListener(GOOGLE_CLIENT_ID_CHANGED_EVENT, googleHandler);
  });
}
