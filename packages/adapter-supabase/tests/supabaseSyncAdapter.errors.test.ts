// implements FR8 of add-supabase-ui
import { describe, expect, it } from "vitest";
import {
  ApiAuthError,
  ApiValidationError,
  ProjectPausedError,
  SupabaseSyncAdapter,
} from "../src";
import { createMockSupabaseClient } from "./supabaseSyncAdapter-test-utils";

describe("SupabaseSyncAdapter with SupabaseClient", () => {
  describe("response validation", () => {
    it("should throw ApiValidationError when response does not match schema", async () => {
      const client = createMockSupabaseClient({
        invokeResult: { data: { invalid: "response" }, error: null },
      });
      const adapter = new SupabaseSyncAdapter(client);

      await expect(adapter.ping()).rejects.toThrow(ApiValidationError);
    });
  });

  describe("auth error handling (4.2)", () => {
    it("should throw ApiAuthError when functions.invoke returns 401 error", async () => {
      const client = createMockSupabaseClient({
        invokeResult: {
          data: null,
          error: { message: "Unauthorized", status: 401 },
        },
      });
      const adapter = new SupabaseSyncAdapter(client);

      await expect(adapter.init()).rejects.toThrow(ApiAuthError);
    });

    it("should throw ApiAuthError when error context has status 401", async () => {
      const client = createMockSupabaseClient({
        invokeResult: {
          data: null,
          error: { message: "JWT expired", context: { status: 401 } },
        },
      });
      const adapter = new SupabaseSyncAdapter(client);

      await expect(adapter.pull({ since_revision: 0 })).rejects.toThrow(
        ApiAuthError,
      );
    });

    it("should throw generic error for non-401 errors", async () => {
      const client = createMockSupabaseClient({
        invokeResult: {
          data: null,
          error: { message: "Internal Server Error", status: 500 },
        },
      });
      const adapter = new SupabaseSyncAdapter(client);

      await expect(adapter.init()).rejects.toThrow("Internal Server Error");
      await expect(adapter.init()).rejects.not.toThrow(ApiAuthError);
    });
  });

  it("should use String(error) when error has no message property", async () => {
    const client = createMockSupabaseClient({
      invokeResult: {
        data: null,
        error: "raw string error",
      },
    });
    const adapter = new SupabaseSyncAdapter(client);

    const rejection = adapter.init();
    await expect(rejection).rejects.toBeInstanceOf(Error);
    await expect(adapter.init()).rejects.toMatchObject({
      message: "raw string error",
    });
  });

  it("should use String(error) when error is a number", async () => {
    const client = createMockSupabaseClient({
      invokeResult: {
        data: null,
        error: 42,
      },
    });
    const adapter = new SupabaseSyncAdapter(client);

    await expect(adapter.init()).rejects.toMatchObject({ message: "42" });
  });

  it("should use error.message when error is object with message property", async () => {
    const client = createMockSupabaseClient({
      invokeResult: {
        data: null,
        error: { message: "specific error text", status: 500 },
      },
    });
    const adapter = new SupabaseSyncAdapter(client);

    await expect(adapter.init()).rejects.toMatchObject({
      message: "specific error text",
    });
  });

  it("should use String(error) when error is object without message", async () => {
    const client = createMockSupabaseClient({
      invokeResult: {
        data: null,
        error: { status: 500 },
      },
    });
    const adapter = new SupabaseSyncAdapter(client);

    await expect(adapter.init()).rejects.toMatchObject({
      message: "[object Object]",
    });
  });

  it("should not treat null error context as auth error", async () => {
    const client = createMockSupabaseClient({
      invokeResult: {
        data: null,
        error: { message: "Some error", context: null },
      },
    });
    const adapter = new SupabaseSyncAdapter(client);

    await expect(adapter.init()).rejects.toThrow("Some error");
    await expect(adapter.init()).rejects.not.toThrow(ApiAuthError);
  });

  it("should not treat non-object error as auth error", async () => {
    const client = createMockSupabaseClient({
      invokeResult: {
        data: null,
        error: null,
      },
    });
    const adapter = new SupabaseSyncAdapter(client);

    // null error means no error — should proceed to validation
    await expect(adapter.init()).rejects.toThrow(ApiValidationError);
  });
});

describe("error message and name verification", () => {
  it("should set ApiAuthError name to 'ApiAuthError'", async () => {
    const client = createMockSupabaseClient({
      invokeResult: {
        data: null,
        error: { message: "Unauthorized", status: 401 },
      },
    });
    const adapter = new SupabaseSyncAdapter(client);

    await expect(adapter.init()).rejects.toMatchObject({
      name: "ApiAuthError",
      message: "Authentication required: token is missing, expired, or invalid",
    });
  });

  it("should set ApiValidationError name to 'ApiValidationError'", async () => {
    const client = createMockSupabaseClient({
      invokeResult: { data: { invalid: "data" }, error: null },
    });
    const adapter = new SupabaseSyncAdapter(client);

    await expect(adapter.ping()).rejects.toMatchObject({
      name: "ApiValidationError",
      message: 'Invalid API response for "ping"',
    });
  });
});

// implements FR1 of fix-project-paused
describe("project paused error handling (FR1 fix-project-paused)", () => {
  it("should throw ProjectPausedError when error context has status 540", async () => {
    const client = createMockSupabaseClient({
      invokeResult: {
        data: null,
        error: { message: "Project Paused", context: { status: 540 } },
      },
    });
    const adapter = new SupabaseSyncAdapter(client);

    await expect(adapter.init()).rejects.toThrow(ProjectPausedError);
  });

  it("should not throw ProjectPausedError for other status codes", async () => {
    const client = createMockSupabaseClient({
      invokeResult: {
        data: null,
        error: {
          message: "Internal Server Error",
          context: { status: 500 },
        },
      },
    });
    const adapter = new SupabaseSyncAdapter(client);

    await expect(adapter.init()).rejects.toThrow("Internal Server Error");
    await expect(adapter.init()).rejects.not.toThrow(ProjectPausedError);
  });

  it("should prioritize auth error over project paused", async () => {
    const client = createMockSupabaseClient({
      invokeResult: {
        data: null,
        error: { message: "Unauthorized", context: { status: 401 } },
      },
    });
    const adapter = new SupabaseSyncAdapter(client);

    await expect(adapter.init()).rejects.toThrow(ApiAuthError);
  });
});

describe("isAuthError edge cases", () => {
  it("should not treat error with context.status !== 401 as auth error", async () => {
    const client = createMockSupabaseClient({
      invokeResult: {
        data: null,
        error: { message: "Forbidden", context: { status: 403 } },
      },
    });
    const adapter = new SupabaseSyncAdapter(client);

    await expect(adapter.init()).rejects.toThrow("Forbidden");
    await expect(adapter.init()).rejects.not.toThrow(ApiAuthError);
  });

  it("should not treat error with non-object context as auth error", async () => {
    const client = createMockSupabaseClient({
      invokeResult: {
        data: null,
        error: { message: "Error with string context", context: "not-object" },
      },
    });
    const adapter = new SupabaseSyncAdapter(client);

    await expect(adapter.init()).rejects.toThrow("Error with string context");
    await expect(adapter.init()).rejects.not.toThrow(ApiAuthError);
  });
});
