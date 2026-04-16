import type { Task } from "@/types/entities";
import i18next from "i18next";
import { Temporal, type Clock, systemClock } from "@/lib/temporal";

export interface GroupedCompletedTasks {
  todayTasks: Task[];
  yesterdayTasks: Task[];
  weekTasks: Task[];
  monthTasks: Task[];
  earlierTasks: Task[];
}

const DAYS_IN_WEEK = 7;
const DAYS_IN_MONTH = 30;

export function groupCompletedTasks(tasks: Task[], clock: Clock = systemClock): GroupedCompletedTasks {
  const userTimeZone = clock.timeZoneId();
  const today = clock.plainDateISO();
  const yesterday = today.subtract({ days: 1 });
  const sevenDaysAgo = today.subtract({ days: DAYS_IN_WEEK });
  const thirtyDaysAgo = today.subtract({ days: DAYS_IN_MONTH });

  const startOfToday = today.toZonedDateTime({ timeZone: userTimeZone, plainTime: "00:00" }).toInstant();
  const startOfYesterday = yesterday.toZonedDateTime({ timeZone: userTimeZone, plainTime: "00:00" }).toInstant();
  const startOf7DaysAgo = sevenDaysAgo.toZonedDateTime({ timeZone: userTimeZone, plainTime: "00:00" }).toInstant();
  const startOf30DaysAgo = thirtyDaysAgo.toZonedDateTime({ timeZone: userTimeZone, plainTime: "00:00" }).toInstant();

  const todayTasks: Task[] = [];
  const yesterdayTasks: Task[] = [];
  const weekTasks: Task[] = [];
  const monthTasks: Task[] = [];
  const earlierTasks: Task[] = [];

  for (const task of tasks) {
    const completedInstant = task.completed_at
      ? Temporal.Instant.from(task.completed_at)
      : null;
    if (completedInstant && Temporal.Instant.compare(completedInstant, startOfToday) >= 0) {
      todayTasks.push(task);
    } else if (completedInstant && Temporal.Instant.compare(completedInstant, startOfYesterday) >= 0) {
      yesterdayTasks.push(task);
    } else if (completedInstant && Temporal.Instant.compare(completedInstant, startOf7DaysAgo) >= 0) {
      weekTasks.push(task);
    } else if (completedInstant && Temporal.Instant.compare(completedInstant, startOf30DaysAgo) >= 0) {
      monthTasks.push(task);
    } else {
      earlierTasks.push(task);
    }
  }

  return { todayTasks, yesterdayTasks, weekTasks, monthTasks, earlierTasks };
}

interface DayBoundaries {
  startOfToday: Temporal.Instant;
  startOfYesterday: Temporal.Instant;
}

function getDayBoundaries(clock: Clock = systemClock): DayBoundaries {
  const timeZone = clock.timeZoneId();
  const today = clock.plainDateISO();
  const yesterday = today.subtract({ days: 1 });

  return {
    startOfToday: today.toZonedDateTime({ timeZone, plainTime: "00:00" }).toInstant(),
    startOfYesterday: yesterday.toZonedDateTime({ timeZone, plainTime: "00:00" }).toInstant(),
  };
}

export function formatCompletedAt(isoString: string, clock: Clock = systemClock): string {
  if (!isoString) return "";
  const completedInstant = Temporal.Instant.from(isoString);
  const { startOfToday, startOfYesterday } = getDayBoundaries(clock);

  const locale = i18next.language || "en";
  const timeZone = clock.timeZoneId();
  const formatter = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
  const timeString = formatter.format(completedInstant.epochMilliseconds);

  if (Temporal.Instant.compare(completedInstant, startOfToday) >= 0) {
    return i18next.t("task.completedToday", { time: timeString });
  }
  if (Temporal.Instant.compare(completedInstant, startOfYesterday) >= 0) {
    return i18next.t("task.completedYesterday", { time: timeString });
  }

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone,
  });
  const dateString = dateFormatter.format(completedInstant.epochMilliseconds);
  return i18next.t("task.completedDate", { date: dateString, time: timeString });
}

export function formatShortDateTime(isoString: string, clock: Clock = systemClock): string {
  if (!isoString) return "";
  const instant = Temporal.Instant.from(isoString);
  const { startOfToday, startOfYesterday } = getDayBoundaries(clock);

  const locale = i18next.language || "en";
  const timeZone = clock.timeZoneId();
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
  const timeString = timeFormatter.format(instant.epochMilliseconds);

  if (Temporal.Instant.compare(instant, startOfToday) >= 0) {
    return `${i18next.t("task.today")} ${timeString}`;
  }
  if (Temporal.Instant.compare(instant, startOfYesterday) >= 0) {
    return `${i18next.t("task.yesterday")} ${timeString}`;
  }

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone,
  });
  const dateString = dateFormatter.format(instant.epochMilliseconds);
  return `${dateString} ${timeString}`;
}

export function formatAppearDate(isoString: string): string {
  if (!isoString) return "";
  const date = Temporal.PlainDate.from(isoString);

  const monthName = i18next.t(`repeat.monthGenitive${date.month}`);

  return i18next.t("repeat.appearDateFormatted", {
    count: date.day,
    month: monthName,
    year: date.year,
    ordinal: true,
  });
}
