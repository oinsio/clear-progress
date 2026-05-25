// implements FR2, FR8 of pwa-specs-and-tests
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { render } from "@testing-library/react";
import { createElement } from "react";
import { expect, type TestContext, vi } from "vitest";

const { mockUseRegisterSW } = vi.hoisted(() => ({
  mockUseRegisterSW: vi.fn(),
}));

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: mockUseRegisterSW,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { UpdateNotification } from "@/components/pwa/UpdateNotification";

const feature = await loadFeature("../service_worker_registration.feature");
type FeatureContext = Record<string, never>;

type OnRegisteredSW = (
  swUrl: string,
  registration: ServiceWorkerRegistration | undefined,
) => void;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let capturedOnRegisteredSW: OnRegisteredSW | undefined;

    f.BeforeEachScenario(() => {
      capturedOnRegisteredSW = undefined;
      mockUseRegisterSW.mockImplementation(
        (options?: { onRegisteredSW?: OnRegisteredSW }) => {
          capturedOnRegisteredSW = options?.onRegisteredSW;
          return {
            needRefresh: [false],
            updateServiceWorker: vi.fn(),
          };
        },
      );
    });

    // @pwa-specs-and-tests @FR2
    f.Scenario(
      "Service worker is registered on app load",
      ({ Given, When, Then }) => {
        Given(
          "the app uses useRegisterSW with prompt registration strategy",
          (_ctx: TestContext) => {
            // mock is already configured in BeforeEachScenario
          },
        );
        When("the app loads", (_ctx: TestContext) => {
          render(createElement(UpdateNotification));
        });
        Then(
          "a service worker is registered via useRegisterSW",
          (_ctx: TestContext) => {
            expect(mockUseRegisterSW).toHaveBeenCalledWith(
              expect.objectContaining({
                onRegisteredSW: expect.any(Function),
              }),
            );
          },
        );
      },
    );

    // @pwa-specs-and-tests @FR8
    f.Scenario(
      "Periodic update check is set when registration succeeds",
      ({ Given, When, Then, And }) => {
        let mockRegistration: ServiceWorkerRegistration;

        Given(
          "a service worker registration completed successfully",
          (_ctx: TestContext) => {
            vi.useFakeTimers();
            mockRegistration = {
              update: vi.fn(),
            } as unknown as ServiceWorkerRegistration;
            render(createElement(UpdateNotification));
          },
        );
        When(
          "the onRegisteredSW callback is invoked with a valid registration",
          (_ctx: TestContext) => {
            expect(capturedOnRegisteredSW).toBeDefined();
            capturedOnRegisteredSW?.("sw.js", mockRegistration);
          },
        );
        Then(
          "a periodic update check is scheduled at the configured interval",
          (_ctx: TestContext) => {
            const UPDATE_CHECK_INTERVAL_MS = 60000;
            vi.advanceTimersByTime(UPDATE_CHECK_INTERVAL_MS);
            expect(mockRegistration.update).toHaveBeenCalled();
          },
        );
        And(
          "each interval tick calls registration update",
          (_ctx: TestContext) => {
            const UPDATE_CHECK_INTERVAL_MS = 60000;
            vi.advanceTimersByTime(UPDATE_CHECK_INTERVAL_MS);
            expect(mockRegistration.update).toHaveBeenCalledTimes(2);
            vi.useRealTimers();
          },
        );
      },
    );

    // @pwa-specs-and-tests @FR8
    f.Scenario(
      "No periodic update check when registration is undefined",
      ({ Given, When, Then }) => {
        let setIntervalSpy: ReturnType<typeof vi.fn>;

        Given(
          "a service worker registration did not produce a registration object",
          (_ctx: TestContext) => {
            render(createElement(UpdateNotification));
            setIntervalSpy = vi.spyOn(
              globalThis,
              "setInterval",
            ) as unknown as ReturnType<typeof vi.fn>;
          },
        );
        When(
          "the onRegisteredSW callback is invoked without a registration",
          (_ctx: TestContext) => {
            expect(capturedOnRegisteredSW).toBeDefined();
            capturedOnRegisteredSW?.("sw.js", undefined);
          },
        );
        Then("no periodic update check is scheduled", (_ctx: TestContext) => {
          expect(setIntervalSpy).not.toHaveBeenCalled();
          setIntervalSpy.mockRestore();
        });
      },
    );
  },
);
