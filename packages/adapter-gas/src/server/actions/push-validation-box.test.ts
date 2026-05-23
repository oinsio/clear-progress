import { describe, expect, it, vi } from "vitest";
import { PUSH_STATUSES } from "../helpers/constants";
import { upsertTasks } from "../sheets/tasks.sheet";
import type { Task } from "../types";
import { push } from "./push";
import {
  describeCommonRejectionTests,
  getResults,
  makeTask,
  setupPushTests,
} from "./push-test-utils";

vi.mock("../sheets/tasks.sheet");
vi.mock("../sheets/goals.sheet");
vi.mock("../sheets/contexts.sheet");
vi.mock("../sheets/categories.sheet");
vi.mock("../sheets/checklists.sheet");
vi.mock("../sheets/settings.sheet");
vi.mock("../sheets/meta.sheet");

describe("push", () => {
  setupPushTests();

  describe("rejected record (invalid box)", () => {
    it.each([
      "",
      "INBOX",
      "tomorrow",
      "someday",
      "bad-box",
    ])('should return status: rejected for task with box="%s"', (invalidBox) => {
      const task = makeTask({ box: invalidBox as Task["box"] });

      push({ tasks: [task] });

      const results = getResults();
      expect(results.tasks![0]).toMatchObject({
        status: PUSH_STATUSES.REJECTED,
      });
    });

    it("should not upsert any task when task has invalid box", () => {
      const task = makeTask({ box: "invalid" as Task["box"] });

      push({ tasks: [task] });

      expect(upsertTasks).toHaveBeenCalledWith([]);
    });

    it.each([
      "inbox",
      "today",
      "week",
      "later",
    ] as Task["box"][])('should NOT reject task with valid box="%s"', (validBox) => {
      const task = makeTask({ box: validBox });

      push({ tasks: [task] });

      const results = getResults();
      expect(results.tasks![0]).toMatchObject({
        status: PUSH_STATUSES.CREATED,
      });
    });

    describeCommonRejectionTests(
      () => makeTask({ box: "invalid" as Task["box"] }),
      () =>
        makeTask({
          id: "a7b8c9d0-e1f2-4345-89ab-cdef01234567",
          box: "today",
        }),
    );
  });
});
