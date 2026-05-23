import i18next from "i18next";
import { beforeEach, describe, expect, it } from "vitest";
import { fakeClock } from "@/lib/temporal";
import { formatCompletedAt } from "./utils";
import {
  buildISOForDaysAgoAt,
  buildISOForTodayAt,
  buildISOForYesterdayAt,
} from "./utils.test-helpers";

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
