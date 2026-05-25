// implements FR5, FR6, FR7 of pwa-specs-and-tests
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react/pure";
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

const feature = await loadFeature("../update_notification.feature");
type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let mockUpdateServiceWorker: ReturnType<typeof vi.fn>;

    f.BeforeEachScenario(() => {
      cleanup();
      mockUpdateServiceWorker = vi.fn();
      mockUseRegisterSW.mockReturnValue({
        needRefresh: [false],
        updateServiceWorker: mockUpdateServiceWorker,
      });
    });

    // @pwa-specs-and-tests @FR5
    f.Scenario(
      "Notification appears when new version is available",
      ({ Given, When, Then }) => {
        Given(
          "a new service worker version is waiting",
          (_ctx: TestContext) => {
            mockUseRegisterSW.mockReturnValue({
              needRefresh: [true],
              updateServiceWorker: mockUpdateServiceWorker,
            });
          },
        );
        When(
          "the update notification state is evaluated",
          (_ctx: TestContext) => {
            render(createElement(UpdateNotification));
          },
        );
        Then("the update notification modal is shown", (_ctx: TestContext) => {
          expect(screen.queryByTestId("update-notification")).not.toBeNull();
        });
      },
    );

    // @pwa-specs-and-tests @FR5
    f.Scenario(
      "Notification is not shown when no update is available",
      ({ Given, When, Then }) => {
        Given(
          "no new service worker version is waiting",
          (_ctx: TestContext) => {
            mockUseRegisterSW.mockReturnValue({
              needRefresh: [false],
              updateServiceWorker: mockUpdateServiceWorker,
            });
          },
        );
        When(
          "the update notification state is evaluated",
          (_ctx: TestContext) => {
            render(createElement(UpdateNotification));
          },
        );
        Then(
          "the update notification modal is not shown",
          (_ctx: TestContext) => {
            expect(screen.queryByTestId("update-notification")).toBeNull();
          },
        );
      },
    );

    // @pwa-specs-and-tests @FR6
    f.Scenario(
      "Notification displays localized message and update button",
      ({ Given, When, Then, And }) => {
        Given(
          "a new service worker version is waiting",
          (_ctx: TestContext) => {
            mockUseRegisterSW.mockReturnValue({
              needRefresh: [true],
              updateServiceWorker: mockUpdateServiceWorker,
            });
          },
        );
        When("the update notification modal is shown", (_ctx: TestContext) => {
          render(createElement(UpdateNotification));
        });
        Then(
          "the notification displays a localized new-version message",
          (_ctx: TestContext) => {
            const messageElement = screen.getByTestId(
              "update-notification-message",
            );
            expect(messageElement.textContent).toBe("pwa.newVersionAvailable");
          },
        );
        And(
          "the notification displays an update button",
          (_ctx: TestContext) => {
            const updateButton = screen.getByTestId(
              "update-notification-update-btn",
            );
            expect(updateButton.textContent).toBe("pwa.update");
          },
        );
      },
    );

    // @pwa-specs-and-tests @FR7
    f.Scenario("User triggers the update", ({ Given, When, Then }) => {
      Given("the update notification modal is shown", (_ctx: TestContext) => {
        mockUseRegisterSW.mockReturnValue({
          needRefresh: [true],
          updateServiceWorker: mockUpdateServiceWorker,
        });
        render(createElement(UpdateNotification));
      });
      When("the user confirms the update", (_ctx: TestContext) => {
        const updateButton = screen.getByTestId(
          "update-notification-update-btn",
        );
        fireEvent.click(updateButton);
      });
      Then(
        "the waiting service worker is activated with reload",
        (_ctx: TestContext) => {
          expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true);
        },
      );
    });
  },
);
