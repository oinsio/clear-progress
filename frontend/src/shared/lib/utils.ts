import type { Task } from "@/types/entities";
import i18next from "i18next";

export interface GroupedCompletedTasks {
  todayTasks: Task[];
  yesterdayTasks: Task[];
  weekTasks: Task[];
  monthTasks: Task[];
  earlierTasks: Task[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_IN_WEEK = 7;
const DAYS_IN_MONTH = 30;

export function groupCompletedTasks(tasks: Task[]): GroupedCompletedTasks {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday.getTime() - MS_PER_DAY);
  const startOf7DaysAgo = new Date(
    startOfToday.getTime() - DAYS_IN_WEEK * MS_PER_DAY,
  );
  const startOf30DaysAgo = new Date(
    startOfToday.getTime() - DAYS_IN_MONTH * MS_PER_DAY,
  );

  const todayTasks: Task[] = [];
  const yesterdayTasks: Task[] = [];
  const weekTasks: Task[] = [];
  const monthTasks: Task[] = [];
  const earlierTasks: Task[] = [];

  for (const task of tasks) {
    const completedDate = task.completed_at
      ? new Date(task.completed_at)
      : null;
    if (completedDate && completedDate >= startOfToday) {
      todayTasks.push(task);
    } else if (completedDate && completedDate >= startOfYesterday) {
      yesterdayTasks.push(task);
    } else if (completedDate && completedDate >= startOf7DaysAgo) {
      weekTasks.push(task);
    } else if (completedDate && completedDate >= startOf30DaysAgo) {
      monthTasks.push(task);
    } else {
      earlierTasks.push(task);
    }
  }

  return { todayTasks, yesterdayTasks, weekTasks, monthTasks, earlierTasks };
}

interface DayBoundaries {
  startOfToday: Date;
  startOfYesterday: Date;
}

function getDayBoundaries(now: Date = new Date()): DayBoundaries {
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfYesterday = new Date(
    startOfToday.getTime() - 24 * 60 * 60 * 1000,
  );
  return { startOfToday, startOfYesterday };
}

export function formatCompletedAt(isoString: string): string {
  if (!isoString) return "";
  const completedDate = new Date(isoString);
  const { startOfToday, startOfYesterday } = getDayBoundaries();

  const locale = i18next.language || "en";
  const timeString = completedDate.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (completedDate >= startOfToday) {
    return i18next.t("task.completedToday", { time: timeString });
  }
  if (completedDate >= startOfYesterday) {
    return i18next.t("task.completedYesterday", { time: timeString });
  }

  const dateString = completedDate.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });
  return i18next.t("task.completedDate", { date: dateString, time: timeString });
}

export function formatShortDateTime(isoString: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const { startOfToday, startOfYesterday } = getDayBoundaries();

  const locale = i18next.language || "en";
  const timeString = date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (date >= startOfToday) {
    return `${i18next.t("task.today")} ${timeString}`;
  }
  if (date >= startOfYesterday) {
    return `${i18next.t("task.yesterday")} ${timeString}`;
  }

  const dateString = date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });
  return `${dateString} ${timeString}`;
}

export function formatAppearDate(isoString: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);

  const day = date.getDate();
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();

  const monthName = i18next.t(`repeat.monthGenitive${month}`);

  return i18next.t("repeat.appearDateFormatted", {
    count: day,
    month: monthName,
    year: year,
    ordinal: true,
  });
}
