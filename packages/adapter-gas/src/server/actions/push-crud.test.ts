import { describe, expect, it, vi } from "vitest";
import { PUSH_STATUSES } from "../helpers/constants";
import { upsertCategories } from "../sheets/categories.sheet";
import { upsertChecklistItems } from "../sheets/checklists.sheet";
import { upsertContexts } from "../sheets/contexts.sheet";
import { upsertGoals } from "../sheets/goals.sheet";
import { getAllTasks, upsertTasks } from "../sheets/tasks.sheet";
import { push } from "./push";
import {
  getResults,
  makeCategory,
  makeChecklistItem,
  makeContext,
  makeGoal,
  makeTask,
  pushAcceptedTaskScenario,
  pushConflictTaskScenario,
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

  describe("new record (not on server)", () => {
    it("should return status: created for a new task", () => {
      const newTask = makeTask({
        id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
      });

      push({ tasks: [newTask] });

      const results = getResults();
      expect(results.tasks![0]).toMatchObject({
        id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
        status: PUSH_STATUSES.CREATED,
      });
    });

    it("should call upsertTask for a new task", () => {
      const newTask = makeTask({ id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa" });

      push({ tasks: [newTask] });

      expect(upsertTasks).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
          }),
        ]),
      );
    });

    it("should return created status for a new record", () => {
      const newTask = makeTask({
        id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
      });

      push({ tasks: [newTask] });

      const results = getResults();
      expect(results.tasks![0]).toMatchObject({
        id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
        status: PUSH_STATUSES.CREATED,
      });
    });
  });

  describe("accepted record (client newer than server)", () => {
    it("should return status: accepted when client updated_at is newer", () => {
      const serverTask = makeTask({
        id: "11111111-1111-4111-a111-111111111111",
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      const clientTask = makeTask({
        id: "11111111-1111-4111-a111-111111111111",
        updated_at: "2025-01-02T00:00:00.000Z",
      });
      vi.mocked(getAllTasks).mockReturnValue([serverTask]);

      push({ tasks: [clientTask] });

      const results = getResults();
      expect(results.tasks![0]).toMatchObject({
        id: "11111111-1111-4111-a111-111111111111",
        status: PUSH_STATUSES.ACCEPTED,
      });
    });

    it("should save accepted task to the sheet", () => {
      pushAcceptedTaskScenario();

      expect(upsertTasks).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: "11111111-1111-4111-a111-111111111111",
          }),
        ]),
      );
    });

    it("should return accepted status in result", () => {
      pushAcceptedTaskScenario();

      const results = getResults();
      expect(results.tasks![0]).toMatchObject({
        id: "11111111-1111-4111-a111-111111111111",
        status: PUSH_STATUSES.ACCEPTED,
      });
    });

    it("should treat equal updated_at as accepted (last-write-wins, client >= server)", () => {
      const sameTime = "2025-01-01T12:00:00.000Z";
      const serverTask = makeTask({
        id: "11111111-1111-4111-a111-111111111111",
        updated_at: sameTime,
      });
      const clientTask = makeTask({
        id: "11111111-1111-4111-a111-111111111111",
        updated_at: sameTime,
      });
      vi.mocked(getAllTasks).mockReturnValue([serverTask]);

      push({ tasks: [clientTask] });

      const results = getResults();
      expect(results.tasks![0]).toMatchObject({
        status: PUSH_STATUSES.ACCEPTED,
      });
    });
  });

  describe("conflict (server newer than client)", () => {
    it("should return status: conflict when server updated_at is newer", () => {
      pushConflictTaskScenario();

      const results = getResults();
      expect(results.tasks![0]).toMatchObject({
        id: "11111111-1111-4111-a111-111111111111",
        status: PUSH_STATUSES.CONFLICT,
      });
    });

    it("should not upsert any task on conflict", () => {
      pushConflictTaskScenario();

      expect(upsertTasks).toHaveBeenCalledWith([]);
    });

    it("should return server_record in conflict result", () => {
      const { serverTask } = pushConflictTaskScenario();

      const results = getResults();
      expect(results.tasks![0]).toMatchObject({ server_record: serverTask });
    });
  });

  describe("find correct server record by id", () => {
    it("should use the matching server record when multiple records exist", () => {
      const serverTask1 = makeTask({
        id: "11111111-1111-4111-a111-111111111111",
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      const serverTask2 = makeTask({
        id: "22222222-2222-4222-a222-222222222222",
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      vi.mocked(getAllTasks).mockReturnValue([serverTask1, serverTask2]);

      const clientTask = makeTask({
        id: "22222222-2222-4222-a222-222222222222",
        updated_at: "2025-06-01T00:00:00.000Z",
      });
      push({ tasks: [clientTask] });

      const results = getResults();
      expect(results.tasks![0]).toMatchObject({
        id: "22222222-2222-4222-a222-222222222222",
        status: PUSH_STATUSES.ACCEPTED,
      });
    });
  });

  describe("multiple records in one push", () => {
    it("should return multiple records in one push", () => {
      const newTask = makeTask({ id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa" });
      const serverTask = makeTask({
        id: "bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb",
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      const clientExisting = makeTask({
        id: "bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb",
        updated_at: "2025-01-02T00:00:00.000Z",
      });
      vi.mocked(getAllTasks).mockReturnValue([serverTask]);

      push({ tasks: [newTask, clientExisting] });

      const results = getResults();
      expect(results.tasks).toHaveLength(2);
    });
  });

  describe("other entity types", () => {
    it("should process goals and return results", () => {
      const newGoal = makeGoal({ id: "eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee" });

      push({ goals: [newGoal] });

      expect(upsertGoals).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: "eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee",
          }),
        ]),
      );

      const results = getResults();
      expect(results.goals![0]).toMatchObject({
        id: "eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee",
        status: PUSH_STATUSES.CREATED,
      });
    });

    it("should process contexts and return results", () => {
      const newContext = makeContext({
        id: "a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1",
      });

      push({ contexts: [newContext] });

      expect(upsertContexts).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: "a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1",
          }),
        ]),
      );

      const results = getResults();
      expect(results.contexts![0]).toMatchObject({
        status: PUSH_STATUSES.CREATED,
      });
    });

    it("should process categories and return results", () => {
      const newCategory = makeCategory({
        id: "c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3",
      });

      push({ categories: [newCategory] });

      expect(upsertCategories).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: "c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3",
          }),
        ]),
      );

      const results = getResults();
      expect(results.categories![0]).toMatchObject({
        status: PUSH_STATUSES.CREATED,
      });
    });

    it("should process checklist_items and return results", () => {
      const newItem = makeChecklistItem({
        id: "e5e5e5e5-e5e5-4e5e-8e5e-e5e5e5e5e5e5",
      });

      push({ checklist_items: [newItem] });

      expect(upsertChecklistItems).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: "e5e5e5e5-e5e5-4e5e-8e5e-e5e5e5e5e5e5",
          }),
        ]),
      );

      const results = getResults();
      expect(results.checklist_items![0]).toMatchObject({
        status: PUSH_STATUSES.CREATED,
      });
    });
  });
});
