import i18next from "i18next";
import { beforeEach, describe, expect, it } from "vitest";
import { fakeClock, Temporal } from "@/lib/temporal";
import { buildTask } from "@/test/factories/taskFactory";
import type { ISOTimestamp } from "@/types/entities";
import {
  formatAppearDate,
  formatCompletedAt,
  formatShortDateTime,
  groupCompletedTasks,
} from "./utils";

function buildISOForTodayAt(
  hours: number,
  minutes: number,
  referenceDate: string,
): string {
  const date = Temporal.PlainDate.from(referenceDate);
  return date
    .toZonedDateTime({
      timeZone: "UTC",
      plainTime: { hour: hours, minute: minutes },
    })
    .toInstant()
    .toString();
}

function buildISOForYesterdayAt(
  hours: number,
  minutes: number,
  referenceDate: string,
): string {
  const date = Temporal.PlainDate.from(referenceDate).subtract({ days: 1 });
  return date
    .toZonedDateTime({
      timeZone: "UTC",
      plainTime: { hour: hours, minute: minutes },
    })
    .toInstant()
    .toString();
}

function buildISOForDaysAgoAt(
  daysAgo: number,
  hours: number,
  minutes: number,
  referenceDate: string,
): string {
  const date = Temporal.PlainDate.from(referenceDate).subtract({
    days: daysAgo,
  });
  return date
    .toZonedDateTime({
      timeZone: "UTC",
      plainTime: { hour: hours, minute: minutes },
    })
    .toInstant()
    .toString();
}

describe("formatCompletedAt", () => {
  const REFERENCE_DATE = "2026-04-16";
  const clock = fakeClock("2026-04-16T12:00:00Z");

  beforeEach(() => {
    i18next.changeLanguage("ru");
  });

  it("should return empty string for empty input", () => {
    expect(formatCompletedAt("", clock)).toBe("");
  });

  it("should show 'Завершено: Сегодня' with time for today's completion", () => {
    const todayISO = buildISOForTodayAt(21, 58, REFERENCE_DATE);
    const result = formatCompletedAt(todayISO, clock);
    expect(result).toMatch(/^Завершено: Сегодня \d{2}:\d{2}$/);
  });

  it("should show 'Завершено: Вчера' with time for yesterday's completion", () => {
    const yesterdayISO = buildISOForYesterdayAt(14, 30, REFERENCE_DATE);
    const result = formatCompletedAt(yesterdayISO, clock);
    expect(result).toMatch(/^Завершено: Вчера \d{2}:\d{2}$/);
  });

  it("should show date and time for older completions", () => {
    const olderISO = buildISOForDaysAgoAt(5, 9, 0, REFERENCE_DATE);
    const result = formatCompletedAt(olderISO, clock);
    expect(result).toMatch(/^Завершено: .+ \d{2}:\d{2}$/);
    expect(result).not.toContain("Сегодня");
    expect(result).not.toContain("Вчера");
  });

  it("should show English text when language is set to English", () => {
    i18next.changeLanguage("en");
    const todayISO = buildISOForTodayAt(21, 58, REFERENCE_DATE);
    const result = formatCompletedAt(todayISO, clock);
    expect(result).toMatch(/^Completed: Today \d{1,2}:\d{2}(\s?[AP]M)?$/);
  });

  it("should use clock timezone for day boundary calculation", () => {
    const tokyoClock = fakeClock("2026-04-17T01:00:00Z", "Asia/Tokyo");
    const timestampLateUtc = "2026-04-16T20:00:00Z";
    const result = formatCompletedAt(timestampLateUtc, tokyoClock);
    expect(result).toMatch(/^Завершено: Сегодня \d{2}:\d{2}$/);
  });
});

describe("formatShortDateTime", () => {
  const REFERENCE_DATE = "2026-04-16";
  const clock = fakeClock("2026-04-16T12:00:00Z");

  beforeEach(() => {
    i18next.changeLanguage("ru");
  });

  it("should return empty string for empty input", () => {
    expect(formatShortDateTime("", clock)).toBe("");
  });

  it("should show 'Сегодня' with time for today's timestamp", () => {
    const todayISO = buildISOForTodayAt(10, 30, REFERENCE_DATE);
    const result = formatShortDateTime(todayISO, clock);
    expect(result).toMatch(/^Сегодня \d{2}:\d{2}$/);
  });

  it("should show 'Вчера' with time for yesterday's timestamp", () => {
    const yesterdayISO = buildISOForYesterdayAt(14, 0, REFERENCE_DATE);
    const result = formatShortDateTime(yesterdayISO, clock);
    expect(result).toMatch(/^Вчера \d{2}:\d{2}$/);
  });

  it("should show date and time for older timestamps", () => {
    const olderISO = buildISOForDaysAgoAt(5, 9, 0, REFERENCE_DATE);
    const result = formatShortDateTime(olderISO, clock);
    expect(result).not.toContain("Сегодня");
    expect(result).not.toContain("Вчера");
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it("should use clock timezone for day boundary calculation", () => {
    const tokyoClock = fakeClock("2026-04-17T01:00:00Z", "Asia/Tokyo");
    const timestampLateUtc = "2026-04-16T20:00:00Z";
    const result = formatShortDateTime(timestampLateUtc, tokyoClock);
    expect(result).toMatch(/^Сегодня \d{2}:\d{2}$/);
  });
});

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

describe("formatAppearDate", () => {
  beforeEach(() => {
    i18next.changeLanguage("ru");
  });

  it("should return empty string for empty input", () => {
    expect(formatAppearDate("")).toBe("");
  });

  it("should format date with full month name in Russian", () => {
    const result = formatAppearDate("2026-04-15");
    expect(result).toBe("15 апреля 2026");
  });

  it("should format date with full month name in English with ordinal suffix", () => {
    i18next.changeLanguage("en");
    const result = formatAppearDate("2026-04-15");
    expect(result).toBe("April 15th, 2026");
  });

  it("should handle different dates correctly", () => {
    const result = formatAppearDate("2025-12-31");
    expect(result).toBe("31 декабря 2025");
  });

  it("should format date with single-digit day", () => {
    const result = formatAppearDate("2026-01-05");
    expect(result).toBe("5 января 2026");
  });

  it("should use ordinal suffix '1st' for day 1 in English", () => {
    i18next.changeLanguage("en");
    const result = formatAppearDate("2026-05-01");
    expect(result).toBe("May 1st, 2026");
  });

  it("should use ordinal suffix '2nd' for day 2 in English", () => {
    i18next.changeLanguage("en");
    const result = formatAppearDate("2026-05-02");
    expect(result).toBe("May 2nd, 2026");
  });

  it("should use ordinal suffix '3rd' for day 3 in English", () => {
    i18next.changeLanguage("en");
    const result = formatAppearDate("2026-05-03");
    expect(result).toBe("May 3rd, 2026");
  });

  it("should use ordinal suffix '21st' for day 21 in English", () => {
    i18next.changeLanguage("en");
    const result = formatAppearDate("2026-05-21");
    expect(result).toBe("May 21st, 2026");
  });

  it("should use ordinal suffix '22nd' for day 22 in English", () => {
    i18next.changeLanguage("en");
    const result = formatAppearDate("2026-05-22");
    expect(result).toBe("May 22nd, 2026");
  });

  it("should use ordinal suffix '23rd' for day 23 in English", () => {
    i18next.changeLanguage("en");
    const result = formatAppearDate("2026-05-23");
    expect(result).toBe("May 23rd, 2026");
  });

  it("should use ordinal suffix '31st' for day 31 in English", () => {
    i18next.changeLanguage("en");
    const result = formatAppearDate("2026-05-31");
    expect(result).toBe("May 31st, 2026");
  });
});
