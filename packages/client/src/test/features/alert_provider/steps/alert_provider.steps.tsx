// implements FR6, FR7 of detect-invalid-repeat-rule
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react/pure";
import { act } from "react";
import { expect, type TestContext, vi } from "vitest";
import { AlertProvider, useAlerts } from "@/app/providers/AlertProvider";
import { AlertOverlay } from "@/components/alerts/AlertOverlay";
import type { AppAlert } from "@/types/alerts";

const { mockReactI18next } = await vi.hoisted(
  () => import("@/test/helpers/mockReactI18next"),
);
vi.mock("react-i18next", () => mockReactI18next());

const feature = await loadFeature("../alert_provider.feature");

const SYNC_ALERT: AppAlert = {
  type: "sync",
  messageKey: "sync.error",
};

const REPEAT_ALERT: AppAlert = {
  type: "repeat_rule_invalid",
  taskNames: ["Task A"],
};

/**
 * Test harness that exposes alert state through the DOM
 * and captures addAlerts/dismissAlerts for imperative calls.
 */
let addAlertsFn: (alerts: AppAlert[]) => void;

function AlertStateReader() {
  const { addAlerts, alerts } = useAlerts();
  addAlertsFn = addAlerts;
  return (
    <div
      data-testid="alert-state"
      data-alert-count={alerts.length}
      data-alert-types={alerts.map((alert) => alert.type).join(",")}
    />
  );
}

function renderWithStateReader() {
  return render(
    <AlertProvider>
      <AlertStateReader />
      <AlertOverlay />
    </AlertProvider>,
  );
}

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(async () => {
      cleanup();
    });

    // @detect-invalid-repeat-rule @FR6
    f.Scenario("Adding alerts to empty queue", ({ Given, When, Then }) => {
      Given("the alert queue is empty", (_ctx: TestContext) => {
        renderWithStateReader();
        const stateElement = screen.getByTestId("alert-state");
        expect(stateElement.getAttribute("data-alert-count")).toBe("0");
      });

      When("2 alerts are added", (_ctx: TestContext) => {
        act(() => addAlertsFn([SYNC_ALERT, REPEAT_ALERT]));
      });

      Then("the queue contains 2 alerts", (_ctx: TestContext) => {
        const stateElement = screen.getByTestId("alert-state");
        expect(stateElement.getAttribute("data-alert-count")).toBe("2");
      });
    });

    // @detect-invalid-repeat-rule @FR7
    f.Scenario(
      "Single alert shows counter 1/1 and Understood button",
      ({ Given, Then, And }) => {
        Given("the queue has 1 alert", (_ctx: TestContext) => {
          renderWithStateReader();
          act(() => addAlertsFn([SYNC_ALERT]));
        });

        Then('the counter shows "1/1"', (_ctx: TestContext) => {
          expect(screen.getByTestId("alert-counter")).toHaveTextContent("1/1");
        });

        And('the "Understood" button is visible', (_ctx: TestContext) => {
          expect(screen.getByTestId("alert-understood")).toBeInTheDocument();
        });

        And('no "Back" or "Next" buttons are shown', (_ctx: TestContext) => {
          expect(screen.queryByTestId("alert-back")).not.toBeInTheDocument();
          expect(screen.queryByTestId("alert-next")).not.toBeInTheDocument();
        });
      },
    );

    // @detect-invalid-repeat-rule @FR7
    f.Scenario(
      "Pressing Understood dismisses all alerts",
      ({ Given, When, Then }) => {
        Given("the queue has 1 alert", (_ctx: TestContext) => {
          renderWithStateReader();
          act(() => addAlertsFn([SYNC_ALERT]));
        });

        When('the user presses "Understood"', (_ctx: TestContext) => {
          fireEvent.click(screen.getByTestId("alert-understood"));
        });

        Then("all alerts are dismissed", (_ctx: TestContext) => {
          expect(screen.queryByTestId("alert-overlay")).not.toBeInTheDocument();
        });
      },
    );

    // @detect-invalid-repeat-rule @FR7
    f.Scenario(
      "Sync alerts are shown before repeat rule alerts",
      ({ Given, Then, And }) => {
        Given(
          "the queue has a repeat_rule_invalid alert added first",
          (_ctx: TestContext) => {
            renderWithStateReader();
            act(() => addAlertsFn([REPEAT_ALERT]));
          },
        );

        And("then a sync alert is added", (_ctx: TestContext) => {
          act(() => addAlertsFn([SYNC_ALERT]));
        });

        Then("the sync alert is displayed first", (_ctx: TestContext) => {
          const stateElement = screen.getByTestId("alert-state");
          const alertTypes = stateElement.getAttribute("data-alert-types");
          expect(alertTypes).toBe("sync,repeat_rule_invalid");
        });
      },
    );
  },
);
