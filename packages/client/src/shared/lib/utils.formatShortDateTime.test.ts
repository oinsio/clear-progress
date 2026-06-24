import i18next from "i18next";
import { beforeEach, describe, expect, it } from "vitest";
import { fakeClock } from "@/lib/temporal";
import { formatShortDateTime } from "./utils";
import {
  buildISOForDaysAgoAt,
  buildISOForTodayAt,
  buildISOForYesterdayAt,
} from "./utils.test-helpers";

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

  it("should show 'Сегодня' for timestamp exactly at day boundary", () => {
    const atBoundary = buildISOForTodayAt(0, 0, REFERENCE_DATE);
    const result = formatShortDateTime(atBoundary, clock);
    expect(result).toMatch(/^Сегодня \d{2}:\d{2}$/);
  });

  it("should show 'Вчера' for timestamp exactly at yesterday boundary", () => {
    const atBoundary = buildISOForYesterdayAt(0, 0, REFERENCE_DATE);
    const result = formatShortDateTime(atBoundary, clock);
    expect(result).toMatch(/^Вчера \d{2}:\d{2}$/);
  });

  it("should include abbreviated month in older timestamp formatting", () => {
    // 5 days ago from 2026-04-16 = 2026-04-11
    const olderISO = buildISOForDaysAgoAt(5, 9, 0, REFERENCE_DATE);
    const result = formatShortDateTime(olderISO, clock);
    // Must contain day number and abbreviated month name
    expect(result).toContain("11");
    expect(result).toMatch(/апр/i);
  });

  it("should use i18next.language for locale formatting", () => {
    i18next.changeLanguage("en");
    const olderISO = buildISOForDaysAgoAt(5, 9, 0, REFERENCE_DATE);
    const result = formatShortDateTime(olderISO, clock);
    expect(result).toMatch(/Apr/);
  });

  // @day-boundary @FR8 @FR9
  describe("with dayBoundary parameter", () => {
    it("should show 'Сегодня' for task after boundary in same logical day", () => {
      // Clock: 2026-06-05T10:00:00Z, dayBoundary: "02:00"
      // Task at 2026-06-05T03:00:00Z (after 02:00 boundary) => "today"
      const boundaryClock = fakeClock("2026-06-05T10:00:00Z");
      const taskTimestamp = "2026-06-05T03:00:00.000Z";

      const result = formatShortDateTime(taskTimestamp, boundaryClock, "02:00");

      expect(result).toMatch(/^Сегодня \d{2}:\d{2}$/);
    });

    it("should show 'Вчера' for task before boundary as previous logical day", () => {
      // Clock: 2026-06-05T10:00:00Z, dayBoundary: "02:00"
      // Task at 2026-06-05T01:30:00Z (before 02:00 boundary) => "yesterday"
      const boundaryClock = fakeClock("2026-06-05T10:00:00Z");
      const taskTimestamp = "2026-06-05T01:30:00.000Z";

      const result = formatShortDateTime(taskTimestamp, boundaryClock, "02:00");

      expect(result).toMatch(/^Вчера \d{2}:\d{2}$/);
    });

    it("should preserve current behavior when dayBoundary is default 00:00", () => {
      const todayISO = buildISOForTodayAt(10, 30, REFERENCE_DATE);

      const resultWithBoundary = formatShortDateTime(todayISO, clock, "00:00");
      const resultWithoutBoundary = formatShortDateTime(todayISO, clock);

      expect(resultWithBoundary).toBe(resultWithoutBoundary);
    });
  });
});
