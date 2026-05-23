import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseResponse } from "../../../tests/server/helpers";
import { setupCoverMocks } from "../../../tests/server/helpers/cover-mocks";
import { MAX_COVER_BATCH_SIZE } from "../helpers/constants";
import { uploadCovers } from "./upload-covers";

const validCover = {
  local_id: "local-uuid-1",
  goal_id: "goal-uuid-1",
  filename: "cover.jpg",
  mime_type: "image/jpeg",
  data: "base64_encoded_data",
};

function parseResults(): Array<Record<string, unknown>> {
  return parseResponse().results as Array<Record<string, unknown>>;
}

describe("uploadCovers", () => {
  beforeEach(() => {
    setupCoverMocks();
  });

  describe("per-item error isolation", () => {
    it.each([
      [
        "invalid mime_type",
        { ...validCover, local_id: "local-1", mime_type: "application/pdf" },
      ],
      ["missing data", { ...validCover, local_id: "local-1", data: "" }],
    ])("should return per-item error for %s without failing the whole batch", (_, invalidCover) => {
      const covers = [
        invalidCover,
        { ...validCover, local_id: "local-2", goal_id: "goal-2" },
      ];

      uploadCovers({ covers });

      expect(parseResponse().ok).toBe(true);
      const results = parseResults();
      expect(results[0].error).toBeDefined();
      expect(results[1].data_hash).toBeDefined();
    });

    it("should return per-item error for oversized file without failing the whole batch", () => {
      vi.mocked(Utilities.base64Decode).mockImplementation(() => {
        const callIndex =
          (Utilities.base64Decode as ReturnType<typeof vi.fn>).mock.calls
            .length - 1;
        if (callIndex === 0)
          return new Array(MAX_COVER_BATCH_SIZE * 1024 * 1024 + 1).fill(0);
        return [];
      });

      const covers = [
        { ...validCover, local_id: "local-big" },
        { ...validCover, local_id: "local-ok", goal_id: "goal-2" },
      ];

      uploadCovers({ covers });

      const response = parseResponse();
      expect(response.ok).toBe(true);
    });

    it("should return ok: true even when all items fail validation", () => {
      const covers = [
        { ...validCover, local_id: "local-1", mime_type: "application/pdf" },
        { ...validCover, local_id: "local-2", mime_type: "text/plain" },
      ];

      uploadCovers({ covers });

      expect(parseResponse().ok).toBe(true);
      const results = parseResults();
      expect(results[0].error).toBeDefined();
      expect(results[1].error).toBeDefined();
    });

    it("should not include error field in successful result", () => {
      uploadCovers({ covers: [validCover] });

      const results = parseResults();
      expect(results[0].error).toBeUndefined();
    });
  });
});
