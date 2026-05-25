import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiAuthError,
  ApiValidationError,
  GasSyncAdapter,
} from "../../src/client";

const GAS_URL = "https://script.google.com/macros/s/test/exec";
const VALID_TOKEN = "valid-test-token";

let adapter: GasSyncAdapter;
let mockFetch: ReturnType<typeof vi.fn>;

function jsonResponse(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  adapter = new GasSyncAdapter(GAS_URL, () => VALID_TOKEN);
  mockFetch = vi.fn();
  vi.stubGlobal("fetch", mockFetch);
});

describe("ping", () => {
  const pingData = {
    ok: true,
    app: "clear-progress",
    version: "1.0",
    initialized: true,
  };

  it("should return parsed ping response", async () => {
    mockFetch.mockResolvedValue(jsonResponse(pingData));
    const result = await adapter.ping();
    expect(result).toEqual(pingData);
  });

  // Kills StringLiteral L99: `${this.url}?action=ping` → ""
  it("should send GET request with action=ping query param", async () => {
    mockFetch.mockResolvedValue(jsonResponse(pingData));
    await adapter.ping();
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toBe(`${GAS_URL}?action=ping`);
  });

  it("should throw on HTTP error", async () => {
    mockFetch.mockResolvedValue(jsonResponse({}, 500));
    await expect(adapter.ping()).rejects.toThrow("HTTP error: 500");
  });

  it("should throw on non-JSON response", async () => {
    mockFetch.mockResolvedValue(new Response("not json", { status: 200 }));
    await expect(adapter.ping()).rejects.toThrow(
      "Invalid response: expected JSON",
    );
  });

  it("should throw ApiValidationError on invalid shape", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
    await expect(adapter.ping()).rejects.toThrow(ApiValidationError);
  });
});

describe("init", () => {
  it("should return parsed init response", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
    const result = await adapter.init();
    expect(result).toEqual({ ok: true });
  });

  // Kills StringLiteral L119: action: "init" → ""
  it("should send action=init in request body", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
    await adapter.init();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.action).toBe("init");
  });

  it("should throw on HTTP error", async () => {
    mockFetch.mockResolvedValue(jsonResponse({}, 500));
    await expect(adapter.init()).rejects.toThrow("HTTP error: 500");
  });

  it("should throw ApiAuthError on UNAUTHORIZED response", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ error: "UNAUTHORIZED" }));
    await expect(adapter.init()).rejects.toThrow(ApiAuthError);
  });

  it("should throw ApiValidationError on invalid shape", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ not_ok: true }));
    await expect(adapter.init()).rejects.toThrow(ApiValidationError);
  });
});

describe("pull", () => {
  const pullData = {
    ok: true,
    tasks: [],
    goals: [],
    contexts: [],
    categories: [],
    ideas: [],
    checklist_items: [],
    settings: [],
    current_revision: 0,
    purge_revision: 0,
    server_time: "2025-01-15T10:30:00.000Z",
  };

  it("should return parsed pull response", async () => {
    mockFetch.mockResolvedValue(jsonResponse(pullData));
    const result = await adapter.pull({ since_revision: 0 });
    expect(result).toEqual(pullData);
  });

  it("should include since_revision in request body", async () => {
    mockFetch.mockResolvedValue(jsonResponse(pullData));
    await adapter.pull({ since_revision: 5 });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.since_revision).toBe(5);
  });

  // Kills StringLiteral L123: action: "pull" → ""
  it("should send action=pull in request body", async () => {
    mockFetch.mockResolvedValue(jsonResponse(pullData));
    await adapter.pull({ since_revision: 0 });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.action).toBe("pull");
  });

  // Kills ObjectLiteral L123: { action: "pull", ...request } → {}
  it("should spread request params into body", async () => {
    mockFetch.mockResolvedValue(jsonResponse(pullData));
    await adapter.pull({ since_revision: 42 });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toMatchObject({ action: "pull", since_revision: 42 });
  });
});

describe("push", () => {
  const pushData = {
    ok: true,
    results: {},
    server_time: "2025-01-15T10:30:00.000Z",
  };

  it("should return parsed push response", async () => {
    mockFetch.mockResolvedValue(jsonResponse(pushData));
    const result = await adapter.push({});
    expect(result).toEqual(pushData);
  });

  // Kills StringLiteral L127: action: "push" → ""
  // Kills ObjectLiteral L127: { action: "push", ...request } → {}
  it("should send action=push with request data in body", async () => {
    mockFetch.mockResolvedValue(jsonResponse(pushData));
    await adapter.push({ tasks: [] } as never);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.action).toBe("push");
    expect(body.tasks).toEqual([]);
  });
});

describe("uploadCover", () => {
  const uploadData = { ok: true, data_hash: "abc123", reused: false };

  it("should return parsed upload cover response", async () => {
    mockFetch.mockResolvedValue(jsonResponse(uploadData));
    const result = await adapter.uploadCover({
      goal_id: "test-id",
      data: "base64data",
      mime_type: "image/png",
      filename: "cover.png",
      data_hash: "abc123",
    });
    expect(result).toEqual(uploadData);
  });

  // Kills StringLiteral L132: action: "upload_cover" → ""
  // Kills ObjectLiteral L132: { action: "upload_cover", ...request } → {}
  it("should send action=upload_cover with request data", async () => {
    mockFetch.mockResolvedValue(jsonResponse(uploadData));
    await adapter.uploadCover({
      goal_id: "test-id",
      data: "base64data",
      mime_type: "image/png",
      filename: "cover.png",
      data_hash: "abc123",
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.action).toBe("upload_cover");
    expect(body.goal_id).toBe("test-id");
  });
});

describe("uploadCovers", () => {
  const uploadBatchData = { ok: true, results: [] };

  it("should return parsed upload covers response", async () => {
    mockFetch.mockResolvedValue(jsonResponse(uploadBatchData));
    const result = await adapter.uploadCovers({ covers: [] });
    expect(result).toEqual(uploadBatchData);
  });

  // Kills StringLiteral L141: action: "upload_covers" → ""
  // Kills ObjectLiteral L141: { action: "upload_covers", ...request } → {}
  it("should send action=upload_covers with request data", async () => {
    mockFetch.mockResolvedValue(jsonResponse(uploadBatchData));
    await adapter.uploadCovers({ covers: [] });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.action).toBe("upload_covers");
    expect(body.covers).toEqual([]);
  });
});

describe("getCover", () => {
  const getCoverData = { ok: true, covers: [] };

  it("should return parsed get cover response", async () => {
    mockFetch.mockResolvedValue(jsonResponse(getCoverData));
    const result = await adapter.getCover({ hashes: [] });
    expect(result).toEqual(getCoverData);
  });

  // Kills StringLiteral L148: action: "get_cover" → ""
  // Kills ObjectLiteral L148: { action: "get_cover", ...request } → {}
  it("should send action=get_cover with request data", async () => {
    mockFetch.mockResolvedValue(jsonResponse(getCoverData));
    await adapter.getCover({ hashes: ["hash1"] });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.action).toBe("get_cover");
    expect(body.hashes).toEqual(["hash1"]);
  });
});

describe("deleteCover", () => {
  const deleteData = { ok: true, deleted: true, ref_count: 0 };

  it("should return parsed delete cover response", async () => {
    mockFetch.mockResolvedValue(jsonResponse(deleteData));
    const result = await adapter.deleteCover({
      goal_id: "test-id",
      hash: "abc123",
    });
    expect(result).toEqual(deleteData);
  });

  // Kills StringLiteral L155: action: "delete_cover" → ""
  // Kills ObjectLiteral L155: { action: "delete_cover", ...request } → {}
  it("should send action=delete_cover with request data", async () => {
    mockFetch.mockResolvedValue(jsonResponse(deleteData));
    await adapter.deleteCover({ goal_id: "test-id", hash: "abc123" });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.action).toBe("delete_cover");
    expect(body.goal_id).toBe("test-id");
  });
});

describe("purge", () => {
  const purgeData = {
    ok: true,
    purged: {
      tasks: 0,
      goals: 0,
      contexts: 0,
      categories: 0,
      checklist_items: 0,
      ideas: 0,
    },
    purge_revision: 1,
  };

  it("should return parsed purge response", async () => {
    mockFetch.mockResolvedValue(jsonResponse(purgeData));
    const result = await adapter.purge();
    expect(result).toEqual(purgeData);
  });

  it("should send confirm true in body", async () => {
    mockFetch.mockResolvedValue(jsonResponse(purgeData));
    await adapter.purge();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.confirm).toBe(true);
  });

  // Kills StringLiteral L162: action: "purge" → ""
  it("should send action=purge in request body", async () => {
    mockFetch.mockResolvedValue(jsonResponse(purgeData));
    await adapter.purge();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.action).toBe("purge");
  });
});
