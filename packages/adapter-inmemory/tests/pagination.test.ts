// implements FR7 of fix-pull-pagination

import type { PullResponse } from "@clear-progress/contract";
import {
  createWireGoal,
  createWireTask,
} from "@clear-progress/contract/contracts";
import { beforeEach, describe, expect, it } from "vitest";
import { InMemorySyncAdapter } from "../src";

describe("InMemorySyncAdapter pagination", () => {
  describe("no pagination when records fit within limit", () => {
    it("should return all records and has_more false when count is below limit", async () => {
      const adapter = new InMemorySyncAdapter({ maxRowsPerTable: 100 });
      const tasks = Array.from({ length: 50 }, (_, index) =>
        createWireTask({ revision: index + 1 }),
      );

      for (const task of tasks) {
        await adapter.push({ tasks: [task] });
      }

      const response = await adapter.pull({ since_revision: 0 });

      expect(response.tasks).toHaveLength(50);
      expect(response.has_more).toBe(false);
    });
  });

  describe("pagination triggered when records exceed limit", () => {
    let adapter: InMemorySyncAdapter;
    const TOTAL_TASKS = 25;
    const MAX_ROWS = 10;

    beforeEach(async () => {
      adapter = new InMemorySyncAdapter({ maxRowsPerTable: MAX_ROWS });
      for (let index = 0; index < TOTAL_TASKS; index++) {
        await adapter.push({
          tasks: [createWireTask()],
        });
      }
    });

    it("should return truncated batch with has_more true", async () => {
      const response = await adapter.pull({ since_revision: 0 });

      expect(response.tasks).toHaveLength(MAX_ROWS);
      expect(response.has_more).toBe(true);
    });

    it("should set current_revision to max revision of truncated batch", async () => {
      const response = await adapter.pull({ since_revision: 0 });

      const maxRevisionInBatch = Math.max(
        ...response.tasks.map((task) => task.revision),
      );
      expect(response.current_revision).toBe(maxRevisionInBatch);
    });
  });

  describe("multiple rounds return all records", () => {
    it("should return all records across 3 pulls (10+10+5) using composite cursors", async () => {
      const TOTAL_TASKS = 25;
      const MAX_ROWS = 10;
      const adapter = new InMemorySyncAdapter({ maxRowsPerTable: MAX_ROWS });

      for (let index = 0; index < TOTAL_TASKS; index++) {
        await adapter.push({ tasks: [createWireTask()] });
      }

      const allTasks: PullResponse["tasks"] = [];
      let sinceRevision = 0;
      let cursors: PullResponse["cursors"];
      let pullCount = 0;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const response = await adapter.pull({
          since_revision: sinceRevision,
          cursors,
        });
        allTasks.push(...response.tasks);
        pullCount++;
        sinceRevision = response.current_revision;
        cursors = response.cursors;

        if (!response.has_more) break;
      }

      expect(allTasks).toHaveLength(TOTAL_TASKS);
      expect(pullCount).toBe(3);
    });
  });

  describe("same revision records fetched via composite cursor", () => {
    it("should fetch all 15 records with same revision across 2 rounds", async () => {
      const TOTAL_TASKS = 15;
      const MAX_ROWS = 10;
      const adapter = new InMemorySyncAdapter({ maxRowsPerTable: MAX_ROWS });

      // Push all 15 tasks in a single push — they all get the same revision
      const tasks = Array.from({ length: TOTAL_TASKS }, () => createWireTask());
      await adapter.push({ tasks });

      const allTasks: PullResponse["tasks"] = [];
      let sinceRevision = 0;
      let cursors: PullResponse["cursors"];
      let pullCount = 0;
      let isFirstPull = true;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const response = await adapter.pull({
          since_revision: sinceRevision,
          cursors,
        });
        allTasks.push(...response.tasks);
        pullCount++;

        if (isFirstPull) {
          expect(response.has_more).toBe(true);
          expect(response.tasks).toHaveLength(MAX_ROWS);
          expect(response.cursors).toBeDefined();
          expect(response.cursors!.tasks).toBeDefined();
          isFirstPull = false;
        }

        sinceRevision = response.current_revision;
        cursors = response.cursors;

        if (!response.has_more) break;
      }

      expect(allTasks).toHaveLength(TOTAL_TASKS);
      expect(pullCount).toBe(2);

      // Verify no duplicates
      const uniqueIds = new Set(allTasks.map((task) => task.id));
      expect(uniqueIds.size).toBe(TOTAL_TASKS);
    });
  });

  describe("default adapter returns has_more false", () => {
    it("should return has_more false when no maxRowsPerTable configured", async () => {
      const adapter = new InMemorySyncAdapter();

      for (let index = 0; index < 50; index++) {
        await adapter.push({ tasks: [createWireTask()] });
      }

      const response = await adapter.pull({ since_revision: 0 });

      expect(response.tasks).toHaveLength(50);
      expect(response.has_more).toBe(false);
    });
  });

  describe("current_revision is MIN of max revisions across tables", () => {
    it("should use min of max revisions when has_more", async () => {
      const MAX_ROWS = 5;
      const adapter = new InMemorySyncAdapter({ maxRowsPerTable: MAX_ROWS });

      // Push goals first (revisions 1-3), fewer than limit
      for (let index = 0; index < 3; index++) {
        await adapter.push({ goals: [createWireGoal()] });
      }

      // Push tasks (revisions 4-13), more than limit — triggers pagination
      for (let index = 0; index < 10; index++) {
        await adapter.push({ tasks: [createWireTask()] });
      }

      const response = await adapter.pull({ since_revision: 0 });

      // Goals: 3 items, all returned, max revision among them
      // Tasks: 10 items, truncated to 5, max revision of truncated batch
      // Goals max rev = 3, Tasks truncated max rev = 8
      // current_revision = MIN(3, 8) = 3
      expect(response.has_more).toBe(true);
      expect(response.tasks).toHaveLength(MAX_ROWS);
      expect(response.goals).toHaveLength(3);

      const goalsMaxRevision = Math.max(
        ...response.goals.map((goal) => goal.revision),
      );
      const tasksMaxRevision = Math.max(
        ...response.tasks.map((task) => task.revision),
      );
      expect(response.current_revision).toBe(
        Math.min(goalsMaxRevision, tasksMaxRevision),
      );
    });
  });
});
