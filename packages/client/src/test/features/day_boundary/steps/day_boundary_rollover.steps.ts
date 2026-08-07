// implements FR2, FR3 of fix-completed-today-stale-on-day-rollover
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type MockInstance, type TestContext, vi } from "vitest";
import { groupCompletedTasks } from "@/shared/lib/utils";
import {
  _resetForTesting,
  getSnapshot,
  subscribe,
} from "@/stores/logicalTodayStore";
import { buildTask } from "@/test/factories/taskFactory";
import {
  captureScheduledCallback,
  createMutableClock,
} from "@/test/helpers/mutableClock";
import type { Task } from "@/types/entities";

const feature = await loadFeature("../day_boundary_rollover.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let dayBoundary: string;
  let clock: ReturnType<typeof createMutableClock>;
  let task: Task | null;
  let unsubscribe: () => void;
  let setTimeoutSpy: MockInstance<typeof setTimeout>;
  let changeListener: ReturnType<typeof vi.fn>;

  function isTaskInCompletedToday(): boolean {
    if (!task) return false;
    const completedTasks = [task];
    return groupCompletedTasks(
      completedTasks,
      clock,
      dayBoundary,
    ).todayTasks.includes(task);
  }

  f.BeforeEachScenario(() => {
    dayBoundary = "";
    task = null;
    setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    changeListener = vi.fn();
  });

  f.AfterEachScenario(() => {
    unsubscribe?.();
    vi.restoreAllMocks();
  });

  function givenDayBoundary(boundary: string) {
    return (_ctx: TestContext) => {
      dayBoundary = boundary;
    };
  }

  function givenTaskCompletedAt(time: string, date: string) {
    return (_ctx: TestContext) => {
      task = buildTask({
        is_completed: true,
        completed_at: `${date}T${time}:00.000Z`,
      });
    };
  }

  function givenSubscribed(_ctx: TestContext) {
    // Clock is finalized by the following "current local time" step;
    // subscribe with a temporary instant, corrected once the real one lands.
    clock = createMutableClock("2026-06-01T00:00:00Z", "UTC");
    _resetForTesting(clock);
    unsubscribe = subscribe(changeListener);
  }

  function givenCurrentLocalTime(time: string, date: string) {
    return (_ctx: TestContext) => {
      clock.setInstant(`${date}T${time}:00Z`);
      _resetForTesting(clock);
      unsubscribe = subscribe(changeListener);
    };
  }

  function thenTaskAppearsToday(_ctx: TestContext) {
    expect(isTaskInCompletedToday()).toBe(true);
  }

  function thenTaskDoesNotAppearToday(_ctx: TestContext) {
    expect(isTaskInCompletedToday()).toBe(false);
  }

  function whenClockAdvancesAndTimerFires(time: string, date: string) {
    return (_ctx: TestContext) => {
      const scheduledCallback = captureScheduledCallback(setTimeoutSpy);
      clock.setInstant(`${date}T${time}:00Z`);
      scheduledCallback();
    };
  }

  // @fix-completed-today-stale-on-day-rollover @FR3
  f.Scenario(
    "Completed-today section clears yesterday's task at the boundary",
    ({ Given, And, When, Then }) => {
      Given('day boundary is "00:00"', givenDayBoundary("00:00"));
      And(
        'a task was completed at "20:00" on "2026-06-04"',
        givenTaskCompletedAt("20:00", "2026-06-04"),
      );
      And("the app is subscribed to the current logical date", givenSubscribed);
      And(
        'current local time is "20:30" on "2026-06-04"',
        givenCurrentLocalTime("20:30", "2026-06-04"),
      );
      Then(
        'the task appears in the "completed today" section',
        thenTaskAppearsToday,
      );
      When(
        'the clock advances to "00:30" on "2026-06-05" and the boundary timer fires',
        whenClockAdvancesAndTimerFires("00:30", "2026-06-05"),
      );
      Then(
        'the task no longer appears in the "completed today" section',
        thenTaskDoesNotAppearToday,
      );
    },
  );

  // @fix-completed-today-stale-on-day-rollover @FR3
  f.Scenario(
    "Custom day boundary respected for rollover",
    ({ Given, And, When, Then }) => {
      Given('day boundary is "04:00"', givenDayBoundary("04:00"));
      And(
        'a task was completed at "10:00" on "2026-06-04"',
        givenTaskCompletedAt("10:00", "2026-06-04"),
      );
      And("the app is subscribed to the current logical date", givenSubscribed);
      And(
        'current local time is "10:30" on "2026-06-04"',
        givenCurrentLocalTime("10:30", "2026-06-04"),
      );
      Then(
        'the task appears in the "completed today" section',
        thenTaskAppearsToday,
      );
      When(
        'the clock advances to "04:00" on "2026-06-05" and the boundary timer fires',
        whenClockAdvancesAndTimerFires("04:00", "2026-06-05"),
      );
      Then(
        'the task no longer appears in the "completed today" section',
        thenTaskDoesNotAppearToday,
      );
    },
  );

  // @fix-completed-today-stale-on-day-rollover @FR2
  f.Scenario(
    "No emit when re-armed but the logical date is unchanged",
    ({ Given, And, When, Then }) => {
      Given('day boundary is "00:00"', givenDayBoundary("00:00"));
      And("the app is subscribed to the current logical date", givenSubscribed);
      And(
        'current local time is "10:00" on "2026-06-04"',
        givenCurrentLocalTime("10:00", "2026-06-04"),
      );

      When(
        "the boundary timer fires without the date changing",
        (_ctx: TestContext) => {
          const scheduledCallback = captureScheduledCallback(setTimeoutSpy);
          scheduledCallback();
        },
      );

      Then("no change is emitted to subscribers", (_ctx: TestContext) => {
        expect(changeListener).not.toHaveBeenCalled();
        expect(getSnapshot()).toBe("2026-06-04");
      });
    },
  );
});
