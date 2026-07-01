// implements FR3, FR4, FR7 of show-upcoming-recurrences

import { describe, expect, it, vi } from "vitest";

import { fakeClock } from "@/lib/temporal";

import { formatNextDate, formatUpcomingDate } from "./formatRecurrenceDate";

vi.mock("i18next", () => ({
  default: {
    t: (key: string) => {
      const translations: Record<string, string> = {
        "repeat.today": "today",
        "repeat.tomorrow": "tomorrow",
      };
      return translations[key] ?? key;
    },
    language: "en",
  },
}));

const CLOCK_TIMESTAMP = "2026-07-01T00:00:00Z";
const clock = fakeClock(CLOCK_TIMESTAMP);

describe("formatNextDate", () => {
  describe("FR3: relative dates", () => {
    it("should return 'today' when next_date equals today", () => {
      const result = formatNextDate("2026-07-01", "daily", clock);
      expect(result).toBe("today");
    });

    it("should return 'tomorrow' when next_date is the day after today", () => {
      const result = formatNextDate("2026-07-02", "daily", clock);
      expect(result).toBe("tomorrow");
    });
  });

  describe("FR3: current year with weekday (weekly)", () => {
    it("should include weekday for weekly frequency in current year", () => {
      const result = formatNextDate("2026-07-08", "weekly", clock);

      expect(result).toContain("Wed");
      expect(result).toContain("Jul");
      expect(result).toContain("8");
      // Should NOT contain year for same-year dates
      expect(result).not.toContain("2026");
    });
  });

  describe("FR4: daily without weekday", () => {
    it("should NOT include weekday for daily frequency", () => {
      const result = formatNextDate("2026-07-08", "daily", clock);

      expect(result).toContain("Jul");
      expect(result).toContain("8");
      // Common English short weekday abbreviations
      const weekdayAbbreviations = [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun",
      ];
      for (const abbreviation of weekdayAbbreviations) {
        expect(result).not.toContain(abbreviation);
      }
    });
  });

  describe("FR3: different year", () => {
    it("should include year when date is in a different year", () => {
      const result = formatNextDate("2027-01-15", "weekly", clock);
      expect(result).toContain("2027");
    });
  });
});

describe("formatUpcomingDate", () => {
  describe("FR7: absolute format with weekday", () => {
    it("should include weekday, month, and day for weekly frequency", () => {
      const result = formatUpcomingDate("2026-07-08", "weekly", clock);

      expect(result).toContain("Wed");
      expect(result).toContain("Jul");
      expect(result).toContain("8");
    });
  });

  describe("FR7: daily without weekday", () => {
    it("should NOT include weekday for daily frequency", () => {
      const result = formatUpcomingDate("2026-07-08", "daily", clock);

      const weekdayAbbreviations = [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun",
      ];
      for (const abbreviation of weekdayAbbreviations) {
        expect(result).not.toContain(abbreviation);
      }
    });
  });

  describe("FR7: different year", () => {
    it("should include year when date is in a different year", () => {
      const result = formatUpcomingDate("2027-01-15", "weekly", clock);
      expect(result).toContain("2027");
    });
  });

  describe("FR7: today should NOT show relative format", () => {
    it("should return absolute format even when date is today", () => {
      const result = formatUpcomingDate("2026-07-01", "weekly", clock);

      expect(result).not.toBe("today");
      expect(result).not.toBe("tomorrow");
      expect(result).toContain("Wed");
      expect(result).toContain("Jul");
      expect(result).toContain("1");
    });
  });
});

describe("locale fallback", () => {
  it("should fall back to default locale when i18next.language is empty", async () => {
    const i18next = await import("i18next");
    const originalLanguage = i18next.default.language;
    i18next.default.language = "";

    const result = formatUpcomingDate("2026-07-08", "weekly", clock);

    expect(result).toContain("Wed");
    expect(result).toContain("Jul");
    expect(result).toContain("8");

    i18next.default.language = originalLanguage;
  });
});
