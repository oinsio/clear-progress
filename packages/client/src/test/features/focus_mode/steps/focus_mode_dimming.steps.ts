// implements FR4, FR5, FR6 of miss-behavior-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";

const feature = await loadFeature("../focus_mode_dimming.feature");

type FeatureContext = Record<string, never>;

/**
 * Replicates the dimming logic from TaskList.tsx (lines 150-151, 240-244).
 * We test the pure logic derivation, not the component rendering.
 */
function evaluateDimming(
  taskIds: string[],
  isFocusMode: boolean,
  selectedTaskId: string | null,
  expandedTaskId: string | null,
): Map<string, boolean> {
  const hasFocusedTask =
    isFocusMode && (selectedTaskId != null || expandedTaskId != null);

  const dimmingMap = new Map<string, boolean>();
  for (const taskId of taskIds) {
    const isDimmed =
      hasFocusedTask && selectedTaskId !== taskId && expandedTaskId !== taskId;
    dimmingMap.set(taskId, isDimmed);
  }
  return dimmingMap;
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let isFocusMode: boolean;
    let selectedTaskId: string | null;
    let expandedTaskId: string | null;
    let dimmingResults: Map<string, boolean>;

    f.BeforeEachScenario(() => {
      isFocusMode = false;
      selectedTaskId = null;
      expandedTaskId = null;
      dimmingResults = new Map();
    });

    // @miss-behavior-specs @FR6
    f.Scenario(
      "No dimming when focus mode is off",
      ({ Given, And, When, Then }) => {
        Given("focus mode is disabled", (_ctx: TestContext) => {
          isFocusMode = false;
        });

        And('task "A" is selected', (_ctx: TestContext) => {
          selectedTaskId = "A";
        });

        When(
          'dimming is evaluated for tasks "A", "B", "C"',
          (_ctx: TestContext) => {
            dimmingResults = evaluateDimming(
              ["A", "B", "C"],
              isFocusMode,
              selectedTaskId,
              expandedTaskId,
            );
          },
        );

        Then("no tasks are dimmed", (_ctx: TestContext) => {
          for (const [, isDimmed] of dimmingResults) {
            expect(isDimmed).toBe(false);
          }
        });
      },
    );

    // @miss-behavior-specs @FR4
    f.Scenario(
      "No dimming when no task is selected or expanded",
      ({ Given, And, When, Then }) => {
        Given("focus mode is enabled", (_ctx: TestContext) => {
          isFocusMode = true;
        });

        And("no task is selected or expanded", (_ctx: TestContext) => {
          selectedTaskId = null;
          expandedTaskId = null;
        });

        When(
          'dimming is evaluated for tasks "A", "B", "C"',
          (_ctx: TestContext) => {
            dimmingResults = evaluateDimming(
              ["A", "B", "C"],
              isFocusMode,
              selectedTaskId,
              expandedTaskId,
            );
          },
        );

        Then("no tasks are dimmed", (_ctx: TestContext) => {
          for (const [, isDimmed] of dimmingResults) {
            expect(isDimmed).toBe(false);
          }
        });
      },
    );

    // @miss-behavior-specs @FR4 @FR5
    f.Scenario(
      "Non-selected tasks are dimmed when a task is selected",
      ({ Given, And, When, Then }) => {
        Given("focus mode is enabled", (_ctx: TestContext) => {
          isFocusMode = true;
        });

        And('task "A" is selected', (_ctx: TestContext) => {
          selectedTaskId = "A";
        });

        When(
          'dimming is evaluated for tasks "A", "B", "C"',
          (_ctx: TestContext) => {
            dimmingResults = evaluateDimming(
              ["A", "B", "C"],
              isFocusMode,
              selectedTaskId,
              expandedTaskId,
            );
          },
        );

        Then('task "A" is not dimmed', (_ctx: TestContext) => {
          expect(dimmingResults.get("A")).toBe(false);
        });

        And('task "B" is dimmed', (_ctx: TestContext) => {
          expect(dimmingResults.get("B")).toBe(true);
        });

        And('task "C" is dimmed', (_ctx: TestContext) => {
          expect(dimmingResults.get("C")).toBe(true);
        });
      },
    );

    // @miss-behavior-specs @FR4 @FR5
    f.Scenario("Expanded task is not dimmed", ({ Given, And, When, Then }) => {
      Given("focus mode is enabled", (_ctx: TestContext) => {
        isFocusMode = true;
      });

      And('task "B" is expanded', (_ctx: TestContext) => {
        expandedTaskId = "B";
      });

      When(
        'dimming is evaluated for tasks "A", "B", "C"',
        (_ctx: TestContext) => {
          dimmingResults = evaluateDimming(
            ["A", "B", "C"],
            isFocusMode,
            selectedTaskId,
            expandedTaskId,
          );
        },
      );

      Then('task "A" is dimmed', (_ctx: TestContext) => {
        expect(dimmingResults.get("A")).toBe(true);
      });

      And('task "B" is not dimmed', (_ctx: TestContext) => {
        expect(dimmingResults.get("B")).toBe(false);
      });

      And('task "C" is dimmed', (_ctx: TestContext) => {
        expect(dimmingResults.get("C")).toBe(true);
      });
    });

    // @miss-behavior-specs @FR5
    f.Scenario(
      "Both selected and expanded tasks are not dimmed",
      ({ Given, And, When, Then }) => {
        Given("focus mode is enabled", (_ctx: TestContext) => {
          isFocusMode = true;
        });

        And('task "A" is selected', (_ctx: TestContext) => {
          selectedTaskId = "A";
        });

        And('task "B" is expanded', (_ctx: TestContext) => {
          expandedTaskId = "B";
        });

        When(
          'dimming is evaluated for tasks "A", "B", "C"',
          (_ctx: TestContext) => {
            dimmingResults = evaluateDimming(
              ["A", "B", "C"],
              isFocusMode,
              selectedTaskId,
              expandedTaskId,
            );
          },
        );

        Then('task "A" is not dimmed', (_ctx: TestContext) => {
          expect(dimmingResults.get("A")).toBe(false);
        });

        And('task "B" is not dimmed', (_ctx: TestContext) => {
          expect(dimmingResults.get("B")).toBe(false);
        });

        And('task "C" is dimmed', (_ctx: TestContext) => {
          expect(dimmingResults.get("C")).toBe(true);
        });
      },
    );

    // @miss-behavior-specs @FR6
    f.Scenario(
      "Disabling focus mode removes all dimming",
      ({ Given, And, When, Then }) => {
        Given("focus mode is disabled", (_ctx: TestContext) => {
          isFocusMode = false;
        });

        And('task "A" is selected', (_ctx: TestContext) => {
          selectedTaskId = "A";
        });

        And('task "B" is expanded', (_ctx: TestContext) => {
          expandedTaskId = "B";
        });

        When(
          'dimming is evaluated for tasks "A", "B", "C"',
          (_ctx: TestContext) => {
            dimmingResults = evaluateDimming(
              ["A", "B", "C"],
              isFocusMode,
              selectedTaskId,
              expandedTaskId,
            );
          },
        );

        Then("no tasks are dimmed", (_ctx: TestContext) => {
          for (const [, isDimmed] of dimmingResults) {
            expect(isDimmed).toBe(false);
          }
        });
      },
    );
  },
);
