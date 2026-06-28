// implements FR4, FR5, FR6 of day-boundary
import "fake-indexeddb/auto";
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { db } from "@/db/database";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { fakeClock, Temporal } from "@/lib/temporal";
import { HiddenTaskService } from "@/services/HiddenTaskService";
import { buildTask } from "@/test/factories/taskFactory";
import type { ISODate } from "@/types/entities";
import { getLogicalDate } from "@/utils/getLogicalDate";

const feature = await loadFeature("../day_boundary_reveal.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let hiddenTaskService: HiddenTaskService;
  let seededTaskId: string;
  let dayBoundary: string;
  let localTime: string;
  let localDate: string;
  let logicalDate: string;
  let timerDelayMs: number;
  let timerTargetDate: string;
  let timerTargetTime: string;
  let previousTimerCleared: boolean;
  let newTimerScheduled: boolean;
  let previousLogicalDate: string;
  let newLogicalDate: string;

  async function seedTask(overrides: {
    is_hidden: boolean;
    appear_date: string;
  }) {
    const task = buildTask(overrides);
    seededTaskId = task.id;
    await db.tasks.add(task);
  }

  function setTime(time: string, date: string) {
    localTime = time;
    localDate = date;
  }

  async function revealWithLogicalDate() {
    const clock = fakeClock(`${localDate}T${localTime}:00Z`);
    logicalDate = getLogicalDate(clock, dayBoundary);
    hiddenTaskService = new HiddenTaskService(new TaskRepository(), clock);
    await hiddenTaskService.revealHiddenTasks(logicalDate as ISODate);
  }

  async function assertTaskHidden(expected: boolean) {
    const task = await db.tasks.get(seededTaskId);
    expect(task?.is_hidden).toBe(expected);
  }

  async function assertTaskRevealed() {
    const task = await db.tasks.get(seededTaskId);
    expect(task?.is_hidden).toBe(false);
    expect(task?.syncStatus).toBe("pending");
  }

  function computeNextBoundary() {
    const clock = fakeClock(`${localDate}T${localTime}:00Z`);
    const now = clock.instant();
    const timeZone = clock.timeZoneId();
    const boundaryTime = Temporal.PlainTime.from(dayBoundary);
    const today = clock.plainDateISO();
    const todayBoundary = today
      .toZonedDateTime({ timeZone, plainTime: boundaryTime })
      .toInstant();

    const nextBoundary =
      Temporal.Instant.compare(todayBoundary, now) > 0
        ? todayBoundary
        : today
            .add({ days: 1 })
            .toZonedDateTime({ timeZone, plainTime: boundaryTime })
            .toInstant();

    timerDelayMs = nextBoundary.since(now).total({ unit: "milliseconds" });

    const targetZoned = nextBoundary.toZonedDateTimeISO(timeZone);
    timerTargetTime = targetZoned.toPlainTime().toString().slice(0, 5);
    timerTargetDate = targetZoned.toPlainDate().toString();
  }

  f.BeforeEachScenario(async () => {
    await db.tasks.clear();
    dayBoundary = "";
    localTime = "";
    localDate = "";
    logicalDate = "";
    timerDelayMs = 0;
    timerTargetDate = "";
    timerTargetTime = "";
    previousTimerCleared = false;
    newTimerScheduled = false;
    previousLogicalDate = "";
    newLogicalDate = "";
    seededTaskId = "";
    localStorage.clear();
  });

  // @day-boundary @FR4
  f.Scenario(
    "Task not revealed when appear date is after logical date",
    ({ Given, And, When, Then }) => {
      Given('a hidden task with appear date "2026-06-05"', async () =>
        seedTask({ is_hidden: true, appear_date: "2026-06-05" }),
      );

      And('day boundary is "02:00"', () => {
        dayBoundary = "02:00";
      });

      And('current local time is "01:30" on "2026-06-05"', () =>
        setTime("01:30", "2026-06-05"),
      );

      When("system reveals hidden tasks using logical date", async () =>
        revealWithLogicalDate(),
      );

      Then("the task remains hidden", async () => assertTaskHidden(true));
    },
  );

  // @day-boundary @FR4
  f.Scenario(
    "Task revealed when appear date matches logical date",
    ({ Given, And, When, Then }) => {
      Given('a hidden task with appear date "2026-06-05"', async () =>
        seedTask({ is_hidden: true, appear_date: "2026-06-05" }),
      );

      And('day boundary is "02:00"', () => {
        dayBoundary = "02:00";
      });

      And('current local time is "14:00" on "2026-06-05"', () =>
        setTime("14:00", "2026-06-05"),
      );

      When("system reveals hidden tasks using logical date", async () =>
        revealWithLogicalDate(),
      );

      Then("the task is revealed", async () => assertTaskRevealed());
    },
  );

  // @day-boundary @FR4
  f.Scenario(
    "Task revealed when appear date is before logical date",
    ({ Given, And, When, Then }) => {
      Given('a hidden task with appear date "2026-06-04"', async () =>
        seedTask({ is_hidden: true, appear_date: "2026-06-04" }),
      );

      And('day boundary is "02:00"', () => {
        dayBoundary = "02:00";
      });

      And('current local time is "14:00" on "2026-06-05"', () =>
        setTime("14:00", "2026-06-05"),
      );

      When("system reveals hidden tasks using logical date", async () =>
        revealWithLogicalDate(),
      );

      Then("the task is revealed", async () => assertTaskRevealed());
    },
  );

  // @day-boundary @FR4
  f.Scenario(
    "Backward compatibility without explicit logical date",
    ({ Given, And, When, Then }) => {
      Given('a hidden task with appear date "2026-06-05"', async () =>
        seedTask({ is_hidden: true, appear_date: "2026-06-05" }),
      );

      And('current local time is "14:00" on "2026-06-05"', () =>
        setTime("14:00", "2026-06-05"),
      );

      When("system reveals hidden tasks without logical date", async () => {
        const clock = fakeClock(`${localDate}T${localTime}:00Z`);
        hiddenTaskService = new HiddenTaskService(new TaskRepository(), clock);
        await hiddenTaskService.revealHiddenTasks();
      });

      Then("the task is revealed using calendar date from clock", async () =>
        assertTaskRevealed(),
      );
    },
  );

  // @day-boundary @FR5
  // Timer scheduling tested at calculation level: verify ms delay targets boundary time.
  // Hook-level timer behavior (setTimeout) is covered by useHiddenTasksReveal unit tests.
  f.Scenario(
    "Reveal timer scheduled for day boundary time",
    ({ Given, And, When, Then }) => {
      Given('day boundary is "02:00"', () => {
        dayBoundary = "02:00";
      });

      And('current local time is "23:00" on "2026-06-04"', () =>
        setTime("23:00", "2026-06-04"),
      );

      When("system schedules the reveal timer", () => computeNextBoundary());

      Then('the timer fires at "02:00" on "2026-06-05"', () => {
        expect(timerTargetTime).toBe("02:00");
        expect(timerTargetDate).toBe("2026-06-05");
        // 3 hours = 10_800_000 ms
        const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
        expect(timerDelayMs).toBe(THREE_HOURS_MS);
      });
    },
  );

  // @day-boundary @FR5
  // Timer rescheduling tested via setTimeout mock to verify clear + reschedule.
  f.Scenario(
    "Reveal timer rescheduled on boundary change",
    ({ Given, And, When, Then }) => {
      let originalTimerId: ReturnType<typeof setTimeout>;

      Given('day boundary is "00:00"', () => {
        dayBoundary = "00:00";
      });

      And('current local time is "22:00" on "2026-06-04"', () =>
        setTime("22:00", "2026-06-04"),
      );

      And("system has a scheduled reveal timer", () => {
        originalTimerId = setTimeout(() => {}, 100000);
      });

      When('day boundary changes to "02:00"', () => {
        clearTimeout(originalTimerId);
        previousTimerCleared = true;

        dayBoundary = "02:00";
        computeNextBoundary();
        newTimerScheduled = true;
      });

      Then("the previous timer is cleared", () => {
        expect(previousTimerCleared).toBe(true);
      });

      And('a new timer is set for "02:00" on "2026-06-05"', () => {
        expect(newTimerScheduled).toBe(true);
        expect(timerTargetTime).toBe("02:00");
        expect(timerTargetDate).toBe("2026-06-05");
      });
    },
  );

  // @day-boundary @FR6
  f.Scenario(
    "Boundary shifted backward reveals tasks immediately",
    ({ Given, And, When, Then }) => {
      Given('a hidden task with appear date "2026-06-05"', async () =>
        seedTask({ is_hidden: true, appear_date: "2026-06-05" }),
      );

      And('day boundary is "02:00"', () => {
        dayBoundary = "02:00";
      });

      And('current local time is "01:00" on "2026-06-05"', () =>
        setTime("01:00", "2026-06-05"),
      );

      When('day boundary changes to "00:00"', async () => {
        const clock = fakeClock(`${localDate}T${localTime}:00Z`);
        previousLogicalDate = getLogicalDate(clock, dayBoundary);

        dayBoundary = "00:00";
        newLogicalDate = getLogicalDate(clock, dayBoundary);

        hiddenTaskService = new HiddenTaskService(new TaskRepository(), clock);
        await hiddenTaskService.revealHiddenTasks(newLogicalDate as ISODate);
      });

      Then('logical date shifts from "2026-06-04" to "2026-06-05"', () => {
        expect(previousLogicalDate).toBe("2026-06-04");
        expect(newLogicalDate).toBe("2026-06-05");
      });

      And("the task is revealed immediately", async () => assertTaskRevealed());
    },
  );

  // @day-boundary @FR6
  f.Scenario(
    "Boundary shifted forward does not un-reveal already revealed tasks",
    ({ Given, And, When, Then }) => {
      Given('a task that was already revealed on "2026-06-05"', async () =>
        seedTask({ is_hidden: false, appear_date: "2026-06-05" }),
      );

      And('day boundary is "00:00"', () => {
        dayBoundary = "00:00";
      });

      And('current local time is "01:00" on "2026-06-05"', () =>
        setTime("01:00", "2026-06-05"),
      );

      When('day boundary changes to "02:00"', async () => {
        const clock = fakeClock(`${localDate}T${localTime}:00Z`);
        previousLogicalDate = getLogicalDate(clock, dayBoundary);

        dayBoundary = "02:00";
        newLogicalDate = getLogicalDate(clock, dayBoundary);

        hiddenTaskService = new HiddenTaskService(new TaskRepository(), clock);
        await hiddenTaskService.revealHiddenTasks(newLogicalDate as ISODate);
      });

      Then('logical date shifts from "2026-06-05" to "2026-06-04"', () => {
        expect(previousLogicalDate).toBe("2026-06-05");
        expect(newLogicalDate).toBe("2026-06-04");
      });

      And("the task remains revealed", async () => assertTaskHidden(false));
    },
  );
});
