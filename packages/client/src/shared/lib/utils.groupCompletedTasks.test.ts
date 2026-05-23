import { describe, expect, it } from "vitest";
import { fakeClock, Temporal } from "@/lib/temporal";
import { buildTask } from "@/test/factories/taskFactory";
import type { ISOTimestamp } from "@/types/entities";
import { groupCompletedTasks } from "./utils";

describe("groupCompletedTasks", () => {
  // Use current date for tests (2026-04-16)
  const REFERENCE_DATE = "2026-04-16";
  const clock = fakeClock("2026-04-16T12:00:00Z");

  it("should return all empty arrays when no tasks are provided", () => {
    const result = groupCompletedTasks([], clock);
    expect(result.todayTasks).toEqual([]);
    expect(result.yesterdayTasks).toEqual([]);
    expect(result.weekTasks).toEqual([]);
    expect(result.monthTasks).toEqual([]);
    expect(result.earlierTasks).toEqual([]);
  });

  it("should place task completed today into todayTasks", () => {
    const task = buildTask({
      is_completed: true,
      completed_at: Temporal.PlainDate.from(REFERENCE_DATE)
        .toZonedDateTime({
          timeZone: "UTC",
          plainTime: { hour: 10, minute: 0 },
        })
        .toInstant()
        .toString() as ISOTimestamp,
    });
    const result = groupCompletedTasks([task], clock);
    expect(result.todayTasks).toContain(task);
    expect(result.yesterdayTasks).toHaveLength(0);
    expect(result.weekTasks).toHaveLength(0);
    expect(result.monthTasks).toHaveLength(0);
    expect(result.earlierTasks).toHaveLength(0);
  });

  it("should place task completed at midnight today into todayTasks", () => {
    const task = buildTask({
      is_completed: true,
      completed_at: Temporal.PlainDate.from(REFERENCE_DATE)
        .toZonedDateTime({ timeZone: "UTC", plainTime: "00:00" })
        .toInstant()
        .toString() as ISOTimestamp,
    });
    const result = groupCompletedTasks([task], clock);
    expect(result.todayTasks).toContain(task);
  });

  it("should place task completed yesterday into yesterdayTasks", () => {
    const task = buildTask({
      is_completed: true,
      completed_at: Temporal.PlainDate.from(REFERENCE_DATE)
        .subtract({ days: 1 })
        .toZonedDateTime({
          timeZone: "UTC",
          plainTime: { hour: 14, minute: 0 },
        })
        .toInstant()
        .toString() as ISOTimestamp,
    });
    const result = groupCompletedTasks([task], clock);
    expect(result.yesterdayTasks).toContain(task);
    expect(result.todayTasks).toHaveLength(0);
    expect(result.weekTasks).toHaveLength(0);
    expect(result.monthTasks).toHaveLength(0);
    expect(result.earlierTasks).toHaveLength(0);
  });

  it("should place task completed at midnight yesterday into yesterdayTasks", () => {
    const task = buildTask({
      is_completed: true,
      completed_at: Temporal.PlainDate.from(REFERENCE_DATE)
        .subtract({ days: 1 })
        .toZonedDateTime({ timeZone: "UTC", plainTime: "00:00" })
        .toInstant()
        .toString() as ISOTimestamp,
    });
    const result = groupCompletedTasks([task], clock);
    expect(result.yesterdayTasks).toContain(task);
  });

  it("should place task completed 2 days ago into weekTasks", () => {
    const task = buildTask({
      is_completed: true,
      completed_at: Temporal.PlainDate.from(REFERENCE_DATE)
        .subtract({ days: 2 })
        .toZonedDateTime({
          timeZone: "UTC",
          plainTime: { hour: 10, minute: 0 },
        })
        .toInstant()
        .toString() as ISOTimestamp,
    });
    const result = groupCompletedTasks([task], clock);
    expect(result.weekTasks).toContain(task);
    expect(result.todayTasks).toHaveLength(0);
    expect(result.yesterdayTasks).toHaveLength(0);
    expect(result.monthTasks).toHaveLength(0);
    expect(result.earlierTasks).toHaveLength(0);
  });

  it("should place task completed exactly 7 days ago (at midnight) into weekTasks", () => {
    const task = buildTask({
      is_completed: true,
      completed_at: Temporal.PlainDate.from(REFERENCE_DATE)
        .subtract({ days: 7 })
        .toZonedDateTime({ timeZone: "UTC", plainTime: "00:00" })
        .toInstant()
        .toString() as ISOTimestamp,
    });
    const result = groupCompletedTasks([task], clock);
    expect(result.weekTasks).toContain(task);
  });

  it("should place task completed 8 days ago into monthTasks", () => {
    const task = buildTask({
      is_completed: true,
      completed_at: Temporal.PlainDate.from(REFERENCE_DATE)
        .subtract({ days: 8 })
        .toZonedDateTime({
          timeZone: "UTC",
          plainTime: { hour: 23, minute: 59 },
        })
        .toInstant()
        .toString() as ISOTimestamp,
    });
    const result = groupCompletedTasks([task], clock);
    expect(result.monthTasks).toContain(task);
    expect(result.todayTasks).toHaveLength(0);
    expect(result.yesterdayTasks).toHaveLength(0);
    expect(result.weekTasks).toHaveLength(0);
    expect(result.earlierTasks).toHaveLength(0);
  });

  it("should place task completed exactly 30 days ago (at midnight) into monthTasks", () => {
    const task = buildTask({
      is_completed: true,
      completed_at: Temporal.PlainDate.from(REFERENCE_DATE)
        .subtract({ days: 30 })
        .toZonedDateTime({ timeZone: "UTC", plainTime: "00:00" })
        .toInstant()
        .toString() as ISOTimestamp,
    });
    const result = groupCompletedTasks([task], clock);
    expect(result.monthTasks).toContain(task);
    expect(result.earlierTasks).toHaveLength(0);
  });

  it("should place task completed more than 30 days ago into earlierTasks", () => {
    const task = buildTask({
      is_completed: true,
      completed_at: Temporal.PlainDate.from(REFERENCE_DATE)
        .subtract({ days: 31 })
        .toZonedDateTime({
          timeZone: "UTC",
          plainTime: { hour: 23, minute: 59 },
        })
        .toInstant()
        .toString() as ISOTimestamp,
    });
    const result = groupCompletedTasks([task], clock);
    expect(result.earlierTasks).toContain(task);
    expect(result.todayTasks).toHaveLength(0);
    expect(result.yesterdayTasks).toHaveLength(0);
    expect(result.weekTasks).toHaveLength(0);
    expect(result.monthTasks).toHaveLength(0);
  });

  it("should place task with empty completed_at into earlierTasks", () => {
    const task = buildTask({ is_completed: true, completed_at: "" });
    const result = groupCompletedTasks([task], clock);
    expect(result.earlierTasks).toContain(task);
  });

  it("should distribute tasks correctly across all five groups", () => {
    const todayTask = buildTask({
      is_completed: true,
      completed_at: Temporal.PlainDate.from(REFERENCE_DATE)
        .toZonedDateTime({ timeZone: "UTC", plainTime: { hour: 8, minute: 0 } })
        .toInstant()
        .toString() as ISOTimestamp,
    });
    const yesterdayTask = buildTask({
      is_completed: true,
      completed_at: Temporal.PlainDate.from(REFERENCE_DATE)
        .subtract({ days: 1 })
        .toZonedDateTime({ timeZone: "UTC", plainTime: { hour: 8, minute: 0 } })
        .toInstant()
        .toString() as ISOTimestamp,
    });
    const weekTask = buildTask({
      is_completed: true,
      completed_at: Temporal.PlainDate.from(REFERENCE_DATE)
        .subtract({ days: 4 })
        .toZonedDateTime({ timeZone: "UTC", plainTime: { hour: 8, minute: 0 } })
        .toInstant()
        .toString() as ISOTimestamp,
    });
    const monthTask = buildTask({
      is_completed: true,
      completed_at: Temporal.PlainDate.from(REFERENCE_DATE)
        .subtract({ days: 9 })
        .toZonedDateTime({ timeZone: "UTC", plainTime: { hour: 8, minute: 0 } })
        .toInstant()
        .toString() as ISOTimestamp,
    });
    const earlierTask = buildTask({
      is_completed: true,
      completed_at: Temporal.PlainDate.from(REFERENCE_DATE)
        .subtract({ days: 37 })
        .toZonedDateTime({ timeZone: "UTC", plainTime: { hour: 8, minute: 0 } })
        .toInstant()
        .toString() as ISOTimestamp,
    });
    const result = groupCompletedTasks(
      [todayTask, yesterdayTask, weekTask, monthTask, earlierTask],
      clock,
    );
    expect(result.todayTasks).toEqual([todayTask]);
    expect(result.yesterdayTasks).toEqual([yesterdayTask]);
    expect(result.weekTasks).toEqual([weekTask]);
    expect(result.monthTasks).toEqual([monthTask]);
    expect(result.earlierTasks).toEqual([earlierTask]);
  });

  it("should not include yesterday task in weekTasks", () => {
    const yesterdayTask = buildTask({
      is_completed: true,
      completed_at: Temporal.PlainDate.from(REFERENCE_DATE)
        .subtract({ days: 1 })
        .toZonedDateTime({
          timeZone: "UTC",
          plainTime: { hour: 20, minute: 0 },
        })
        .toInstant()
        .toString() as ISOTimestamp,
    });
    const result = groupCompletedTasks([yesterdayTask], clock);
    expect(result.weekTasks).toHaveLength(0);
    expect(result.yesterdayTasks).toContain(yesterdayTask);
  });
});
