import { fireEvent, screen } from "@testing-library/react";
import { expect } from "vitest";
import { buildTask } from "@/test/factories/taskFactory";
import type { Task } from "@/types/entities";

export const TODAY_TASK_NAME = "Купить продукты";
export const WEEK_TASK_NAME = "Спланировать отпуск";
export const INBOX_TASK_NAME = "Случайная мысль";

export const SECTION_HEADER_INBOX = "Входящие (1)";
export const SECTION_HEADER_TODAY = "Сегодня (1)";
export const SECTION_HEADER_WEEK = "Неделя (1)";

export function buildTasksInMultipleBoxes(): Task[] {
  const todayTask = buildTask({ box: "today", name: TODAY_TASK_NAME });
  const weekTask = buildTask({ box: "week", name: WEEK_TASK_NAME });
  const inboxTask = buildTask({ box: "inbox", name: INBOX_TASK_NAME });
  return [todayTask, weekTask, inboxTask];
}

export function openFilterBarAndSelectBox(boxTestId: string) {
  const filterToggle = screen.getByTestId("command-bar-filter-toggle");
  fireEvent.click(filterToggle);
  const boxButton = screen.getByTestId(boxTestId);
  fireEvent.click(boxButton);
}

export function expectOnlyFilteredBoxTasks() {
  openFilterBarAndSelectBox("box-filter-today");

  expect(screen.getByText(TODAY_TASK_NAME)).toBeInTheDocument();
  expect(screen.queryByText(WEEK_TASK_NAME)).not.toBeInTheDocument();
  expect(screen.queryByText(INBOX_TASK_NAME)).not.toBeInTheDocument();

  expect(screen.queryByText(SECTION_HEADER_INBOX)).not.toBeInTheDocument();
  expect(screen.queryByText(SECTION_HEADER_TODAY)).not.toBeInTheDocument();
  expect(screen.queryByText(SECTION_HEADER_WEEK)).not.toBeInTheDocument();
}

export function expectAllBoxesWithSectionHeaders() {
  expect(screen.getByText(SECTION_HEADER_INBOX)).toBeInTheDocument();
  expect(screen.getByText(SECTION_HEADER_TODAY)).toBeInTheDocument();
  expect(screen.getByText(SECTION_HEADER_WEEK)).toBeInTheDocument();

  expect(screen.getByText(TODAY_TASK_NAME)).toBeInTheDocument();
  expect(screen.getByText(WEEK_TASK_NAME)).toBeInTheDocument();
  expect(screen.getByText(INBOX_TASK_NAME)).toBeInTheDocument();
}
