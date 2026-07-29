// implements UX1, UX2, UX3, UX4, UX5 of configurable-sync-timing
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react/pure";
import React from "react";
import { expect, type TestContext, vi } from "vitest";

// Real (English) copy for the keys under test, so "never milliseconds" and
// help-text assertions check actual rendered strings rather than i18n keys.
const TRANSLATIONS: Record<string, string> = {
  "settings.syncInterval": "Sync interval",
  "settings.syncIntervalUnit": "min",
  "settings.syncIntervalDescription": "How often background sync runs.",
  "settings.syncIntervalDisabledHint":
    "Empty: periodic background sync is off.",
  "settings.autoSyncDelay": "Auto-sync delay",
  "settings.autoSyncDelayUnit": "sec",
  "settings.autoSyncDelayDescription":
    "How long to wait after an edit before pushing it.",
  "settings.autoSyncDelayImmediateHint": "0 or empty: edits sync immediately.",
  "settings.syncTimingWriteError":
    "Failed to save. Reverted to the last saved value.",
  "settings.syncIndicator": "Synced setting",
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => TRANSLATIONS[key] ?? key,
  }),
}));

const feature = await loadFeature("../sync_timing_settings.feature");

// Import AFTER mocks
const { SyncTimingSection } = await import(
  "@/components/settings/SyncTimingSection"
);

type FeatureContext = Record<string, never>;

let currentSyncInterval: number | null;
let currentAutoSyncDelay: number;
let onSyncIntervalChange: ReturnType<typeof vi.fn>;
let onAutoSyncDelayChange: ReturnType<typeof vi.fn>;

function renderSection(): void {
  render(
    React.createElement(SyncTimingSection, {
      syncInterval: currentSyncInterval,
      autoSyncDelay: currentAutoSyncDelay,
      onSyncIntervalChange,
      onAutoSyncDelayChange,
    }),
  );
}

function getSyncIntervalInput(): HTMLInputElement {
  return screen.getByTestId("sync-interval-input") as HTMLInputElement;
}

function getAutoSyncDelayInput(): HTMLInputElement {
  return screen.getByTestId("auto-sync-delay-input") as HTMLInputElement;
}

function setSyncInterval(_ctx: TestContext, value: number): void {
  currentSyncInterval = value;
}

function changeSyncIntervalInputAndBlur(
  _ctx: TestContext,
  rawValue: string,
): void {
  renderSection();
  const intervalInput = getSyncIntervalInput();
  fireEvent.change(intervalInput, { target: { value: rawValue } });
  fireEvent.blur(intervalInput);
}

function expectSyncIntervalInputShows(
  _ctx: TestContext,
  expectedValue: string,
): void {
  expect(getSyncIntervalInput().value).toBe(expectedValue);
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      cleanup();
      currentSyncInterval = 5;
      currentAutoSyncDelay = 15;
      onSyncIntervalChange = vi.fn().mockResolvedValue(undefined);
      onAutoSyncDelayChange = vi.fn().mockResolvedValue(undefined);
    });

    // @configurable-sync-timing @UX1
    f.Scenario(
      "Reverts to last valid value when an out-of-range sync_interval is entered",
      ({ Given, When, Then, And }) => {
        Given("sync_interval is set to {int}", setSyncInterval);

        When(
          "the sync interval input is changed to {string} and blurred",
          changeSyncIntervalInputAndBlur,
        );

        Then(
          "the sync interval input shows {string}",
          expectSyncIntervalInputShows,
        );

        And("onSyncIntervalChange was not called", () => {
          expect(onSyncIntervalChange).not.toHaveBeenCalled();
        });
      },
    );

    // @configurable-sync-timing @UX1
    f.Scenario(
      "Reverts to last valid value when a non-numeric auto_sync_delay is entered",
      ({ Given, When, Then, And }) => {
        Given(
          "auto_sync_delay is set to {int}",
          (_ctx: TestContext, value: number) => {
            currentAutoSyncDelay = value;
          },
        );

        When(
          "the auto sync delay input is changed to {string} and blurred",
          (_ctx: TestContext, rawValue: string) => {
            renderSection();
            const delayInput = getAutoSyncDelayInput();
            fireEvent.change(delayInput, { target: { value: rawValue } });
            fireEvent.blur(delayInput);
          },
        );

        Then(
          "the auto sync delay input shows {string}",
          (_ctx: TestContext, expectedValue: string) => {
            expect(getAutoSyncDelayInput().value).toBe(expectedValue);
          },
        );

        And("onAutoSyncDelayChange was not called", () => {
          expect(onAutoSyncDelayChange).not.toHaveBeenCalled();
        });
      },
    );

    // @configurable-sync-timing @UX1
    f.Scenario(
      "Preserves an intentionally cleared sync_interval as disabled",
      ({ Given, When, Then }) => {
        Given("sync_interval is set to {int}", setSyncInterval);

        When(
          "the sync interval input is changed to {string} and blurred",
          changeSyncIntervalInputAndBlur,
        );

        Then("onSyncIntervalChange was called with the value null", () => {
          expect(onSyncIntervalChange).toHaveBeenCalledWith(null);
        });
      },
    );

    // @configurable-sync-timing @UX2
    f.Scenario(
      "Displays sync_interval in minutes with a unit label, never milliseconds",
      ({ Given, When, Then, And }) => {
        Given(
          "sync_interval is set to {int}",
          (_ctx: TestContext, value: number) => {
            currentSyncInterval = value;
          },
        );

        When("the sync timing section is rendered", () => {
          renderSection();
        });

        Then("the sync interval unit label is shown", () => {
          expect(
            screen.getByText(TRANSLATIONS["settings.syncIntervalUnit"]),
          ).toBeInTheDocument();
        });

        And(
          "the sync interval unit label does not mention milliseconds",
          () => {
            const unitLabel = screen.getByText(
              TRANSLATIONS["settings.syncIntervalUnit"],
            );
            expect(unitLabel.textContent?.toLowerCase()).not.toContain("ms");
            expect(unitLabel.textContent?.toLowerCase()).not.toContain(
              "millisecond",
            );
          },
        );
      },
    );

    // @configurable-sync-timing @UX2
    f.Scenario(
      "Displays auto_sync_delay in seconds with a unit label, never milliseconds",
      ({ Given, When, Then, And }) => {
        Given(
          "auto_sync_delay is set to {int}",
          (_ctx: TestContext, value: number) => {
            currentAutoSyncDelay = value;
          },
        );

        When("the sync timing section is rendered", () => {
          renderSection();
        });

        Then("the auto sync delay unit label is shown", () => {
          expect(
            screen.getByText(TRANSLATIONS["settings.autoSyncDelayUnit"]),
          ).toBeInTheDocument();
        });

        And(
          "the auto sync delay unit label does not mention milliseconds",
          () => {
            const unitLabel = screen.getByText(
              TRANSLATIONS["settings.autoSyncDelayUnit"],
            );
            expect(unitLabel.textContent?.toLowerCase()).not.toContain("ms");
            expect(unitLabel.textContent?.toLowerCase()).not.toContain(
              "millisecond",
            );
          },
        );
      },
    );

    // @configurable-sync-timing @UX3
    f.Scenario(
      "Shows disabled help text when sync_interval is empty",
      ({ Given, When, Then }) => {
        Given("sync_interval is set to null", () => {
          currentSyncInterval = null;
        });

        When("the sync timing section is rendered", () => {
          renderSection();
        });

        Then("the sync interval disabled hint is shown", () => {
          expect(
            screen.getByText(TRANSLATIONS["settings.syncIntervalDisabledHint"]),
          ).toBeInTheDocument();
        });
      },
    );

    // @configurable-sync-timing @UX3
    f.Scenario(
      "Shows immediate help text when auto_sync_delay is zero",
      ({ Given, When, Then }) => {
        Given(
          "auto_sync_delay is set to {int}",
          (_ctx: TestContext, value: number) => {
            currentAutoSyncDelay = value;
          },
        );

        When("the sync timing section is rendered", () => {
          renderSection();
        });

        Then("the auto sync delay immediate hint is shown", () => {
          expect(
            screen.getByText(
              TRANSLATIONS["settings.autoSyncDelayImmediateHint"],
            ),
          ).toBeInTheDocument();
        });
      },
    );

    // @configurable-sync-timing @UX4
    f.Scenario(
      "Shows a sync indicator next to the sync_interval control",
      ({ When, Then }) => {
        When("the sync timing section is rendered", () => {
          renderSection();
        });

        Then("a sync indicator is shown near the sync interval label", () => {
          const intervalLabel = screen.getByText(
            TRANSLATIONS["settings.syncInterval"],
          );
          const indicator = intervalLabel.querySelector(
            '[data-testid="sync-indicator"]',
          );
          expect(indicator).not.toBeNull();
        });
      },
    );

    // @configurable-sync-timing @UX4
    f.Scenario(
      "Shows a sync indicator next to the auto_sync_delay control",
      ({ When, Then }) => {
        When("the sync timing section is rendered", () => {
          renderSection();
        });

        Then("a sync indicator is shown near the auto sync delay label", () => {
          const delayLabel = screen.getByText(
            TRANSLATIONS["settings.autoSyncDelay"],
          );
          const indicator = delayLabel.querySelector(
            '[data-testid="sync-indicator"]',
          );
          expect(indicator).not.toBeNull();
        });
      },
    );

    // @configurable-sync-timing @UX5
    f.Scenario(
      "Reverts and shows an error when persisting sync_interval fails",
      ({ Given, And, When, Then }) => {
        Given("sync_interval is set to {int}", setSyncInterval);

        And("onSyncIntervalChange will fail", () => {
          onSyncIntervalChange = vi
            .fn()
            .mockRejectedValue(new Error("network error"));
        });

        When(
          "the sync interval input is changed to {string} and blurred",
          changeSyncIntervalInputAndBlur,
        );

        Then(
          "the sync interval input shows {string}",
          async (_ctx: TestContext, expectedValue: string) => {
            await waitFor(() => {
              expect(getSyncIntervalInput().value).toBe(expectedValue);
            });
          },
        );

        And("a sync timing write error is shown", async () => {
          await waitFor(() => {
            expect(
              screen.getByText(TRANSLATIONS["settings.syncTimingWriteError"]),
            ).toBeInTheDocument();
          });
        });
      },
    );
  },
);
