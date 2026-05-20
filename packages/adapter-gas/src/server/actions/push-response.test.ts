import { describe, expect, it, vi } from "vitest";
import { readNextRevision } from "../sheets/meta.sheet";
import { getAllTasks } from "../sheets/tasks.sheet";
import { push } from "./push";
import {
  expectValidServerTime,
  makeTask,
  parseResponse,
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

  describe("general response", () => {
    it("should return ok: true when changes is empty", () => {
      push({});
      expect(parseResponse().ok).toBe(true);
    });

    it("should return results object in response", () => {
      push({});
      expect(parseResponse()).toHaveProperty("results");
    });

    it("should return server_time as ISO string", () => {
      push({});
      expectValidServerTime();
    });

    it("should not include entity key in results when array is not provided", () => {
      push({});
      const results = parseResponse().results as Record<string, unknown>;
      expect(results).not.toHaveProperty("tasks");
      expect(results).not.toHaveProperty("goals");
    });

    it("should not call getAllTasks when tasks array is not provided", () => {
      push({});
      expect(getAllTasks).not.toHaveBeenCalled();
    });

    it("should not call getAllTasks when tasks array is empty", () => {
      push({ tasks: [] });
      expect(getAllTasks).not.toHaveBeenCalled();
    });
  });

  describe("response structure matches PushResponse contract", () => {
    it("should return complete response with created task matching PushResponse shape", () => {
      vi.mocked(readNextRevision).mockReturnValue(5);
      const task = makeTask({ id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa" });

      push({ tasks: [task] });

      const response = parseResponse();
      expect(response).toStrictEqual({
        ok: true,
        revision: 5,
        results: {
          tasks: [
            {
              id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
              status: "created",
            },
          ],
        },
        server_time: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
      });
    });

    it("should return complete empty response matching PushResponse shape", () => {
      push({});

      const response = parseResponse();
      expect(response).toStrictEqual({
        ok: true,
        results: {},
        server_time: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
      });
    });

    it("should return settings result with key field matching PushSettingResult shape", () => {
      const setting = {
        key: "accent_color",
        value: "purple",
        updated_at: "2025-01-01T00:00:00.000Z",
      };

      push({ settings: [setting] });

      const response = parseResponse();
      expect(response).toStrictEqual({
        ok: true,
        results: {
          settings: [{ key: "accent_color", status: "accepted" }],
        },
        server_time: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
      });
    });

    it("should return complete conflict response matching PushResponse shape", () => {
      const serverTask = makeTask({
        id: "11111111-1111-4111-a111-111111111111",
        updated_at: "2025-01-02T00:00:00.000Z",
      });
      const clientTask = makeTask({
        id: "11111111-1111-4111-a111-111111111111",
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      vi.mocked(getAllTasks).mockReturnValue([serverTask]);

      push({ tasks: [clientTask] });

      const response = parseResponse();
      expect(response).toStrictEqual({
        ok: true,
        results: {
          tasks: [
            {
              id: "11111111-1111-4111-a111-111111111111",
              status: "conflict",
              server_record: serverTask,
            },
          ],
        },
        server_time: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
      });
    });
  });
});
