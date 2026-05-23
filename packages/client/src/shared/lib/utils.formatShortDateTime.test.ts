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
});
