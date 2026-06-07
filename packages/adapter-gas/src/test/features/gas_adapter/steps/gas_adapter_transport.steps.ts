// implements FR1, FR2 of gas-adapter-specs-and-bdd
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext, vi } from "vitest";
import { GasSyncAdapter } from "../../../../client";

const feature = await loadFeature("../gas_adapter_transport.feature");

type FeatureContext = Record<string, never>;

const GAS_URL = "https://script.google.com/macros/s/test/exec";
const VALID_TOKEN = "valid-test-token";

function createValidInitResponse(): Response {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function createValidPingResponse(): Response {
  return new Response(
    JSON.stringify({
      ok: true,
      app: "clear-progress",
      version: "1.0",
      initialized: true,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function createValidPullResponse(): Response {
  return new Response(
    JSON.stringify({
      ok: true,
      tasks: [],
      goals: [],
      contexts: [],
      categories: [],
      ideas: [],
      checklist_items: [],
      attachments: [],
      settings: [],
      current_revision: 0,
      purge_revision: 0,
      server_time: "2025-01-15T10:30:00.000Z",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function createValidPushResponse(): Response {
  return new Response(
    JSON.stringify({
      ok: true,
      results: {},
      server_time: "2025-01-15T10:30:00.000Z",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function createValidUploadFileResponse(): Response {
  return new Response(
    JSON.stringify({ ok: true, data_hash: "abc123", reused: false }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function createValidUploadFilesResponse(): Response {
  return new Response(JSON.stringify({ ok: true, results: [] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function createValidGetFileResponse(): Response {
  return new Response(JSON.stringify({ ok: true, files: [] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function createValidDeleteFileResponse(): Response {
  return new Response(
    JSON.stringify({ ok: true, deleted: true, ref_count: 0 }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function createValidPurgeResponse(): Response {
  return new Response(
    JSON.stringify({
      ok: true,
      purged: {
        tasks: 0,
        goals: 0,
        contexts: 0,
        categories: 0,
        checklist_items: 0,
        ideas: 0,
        attachments: 0,
      },
      purge_revision: 1,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function extractFetchOptions(mockFetch: ReturnType<typeof vi.fn>): RequestInit {
  const [, fetchOptions] = mockFetch.mock.calls[0] as [string, RequestInit];
  return fetchOptions;
}

function extractFetchUrl(mockFetch: ReturnType<typeof vi.fn>): string {
  const [fetchUrl] = mockFetch.mock.calls[0] as [string, RequestInit];
  return fetchUrl;
}

function extractRequestBody(
  mockFetch: ReturnType<typeof vi.fn>,
): Record<string, unknown> {
  const fetchOptions = extractFetchOptions(mockFetch);
  return JSON.parse(fetchOptions.body as string) as Record<string, unknown>;
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let adapter: GasSyncAdapter;
    let mockFetch: ReturnType<typeof vi.fn>;

    f.BeforeEachScenario(() => {
      vi.restoreAllMocks();
      adapter = new GasSyncAdapter(GAS_URL, () => VALID_TOKEN);
      mockFetch = vi.fn();
      vi.stubGlobal("fetch", mockFetch);
    });

    // @gas-adapter-specs-and-bdd @FR1
    f.Scenario(
      "Ping sends GET with action=ping parameter",
      ({ When, Then, And }) => {
        When("adapter pings the server", async (_ctx: TestContext) => {
          mockFetch.mockResolvedValue(createValidPingResponse());
          await adapter.ping();
        });

        Then(
          "HTTP GET is sent to the GAS URL with action=ping",
          async (_ctx: TestContext) => {
            expect(extractFetchUrl(mockFetch)).toBe(`${GAS_URL}?action=ping`);
            expect(extractFetchOptions(mockFetch).method).toBeUndefined();
          },
        );

        And("redirect follow is enabled", async (_ctx: TestContext) => {
          expect(extractFetchOptions(mockFetch).redirect).toBe("follow");
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR2
    f.Scenario(
      "POST request includes Content-Type text/plain",
      ({ When, Then }) => {
        When("adapter calls init", async (_ctx: TestContext) => {
          mockFetch.mockResolvedValue(createValidInitResponse());
          await adapter.init();
        });

        Then(
          'the request Content-Type is "text/plain"',
          async (_ctx: TestContext) => {
            const headers = extractFetchOptions(mockFetch).headers as Record<
              string,
              string
            >;
            expect(headers["Content-Type"]).toBe("text/plain");
          },
        );
      },
    );

    // @gas-adapter-specs-and-bdd @FR2
    f.Scenario(
      "POST request includes access_token in body",
      ({ When, Then }) => {
        When("adapter calls init", async (_ctx: TestContext) => {
          mockFetch.mockResolvedValue(createValidInitResponse());
          await adapter.init();
        });

        Then(
          "the request body contains access_token",
          async (_ctx: TestContext) => {
            expect(extractRequestBody(mockFetch).access_token).toBe(
              VALID_TOKEN,
            );
          },
        );
      },
    );

    // @gas-adapter-specs-and-bdd @FR2
    f.Scenario('Init sends action "init"', ({ When, Then }) => {
      When("adapter calls init", async (_ctx: TestContext) => {
        mockFetch.mockResolvedValue(createValidInitResponse());
        await adapter.init();
      });

      Then('the request body action is "init"', async (_ctx: TestContext) => {
        expect(extractRequestBody(mockFetch).action).toBe("init");
      });
    });

    // @gas-adapter-specs-and-bdd @FR2
    f.Scenario('Pull sends action "pull"', ({ When, Then }) => {
      When("adapter calls pull", async (_ctx: TestContext) => {
        mockFetch.mockResolvedValue(createValidPullResponse());
        await adapter.pull({ since_revision: 0 });
      });

      Then('the request body action is "pull"', async (_ctx: TestContext) => {
        expect(extractRequestBody(mockFetch).action).toBe("pull");
      });
    });

    // @gas-adapter-specs-and-bdd @FR2
    f.Scenario('Push sends action "push"', ({ When, Then }) => {
      When("adapter calls push", async (_ctx: TestContext) => {
        mockFetch.mockResolvedValue(createValidPushResponse());
        await adapter.push({});
      });

      Then('the request body action is "push"', async (_ctx: TestContext) => {
        expect(extractRequestBody(mockFetch).action).toBe("push");
      });
    });

    // @gas-adapter-specs-and-bdd @FR2
    f.Scenario('Upload file sends action "upload_file"', ({ When, Then }) => {
      When("adapter calls uploadFile", async (_ctx: TestContext) => {
        mockFetch.mockResolvedValue(createValidUploadFileResponse());
        await adapter.uploadFile({
          goal_id: "test-id",
          data: "base64data",
          mime_type: "image/png",
          filename: "cover.png",
          data_hash: "abc123",
        });
      });

      Then(
        'the request body action is "upload_file"',
        async (_ctx: TestContext) => {
          expect(extractRequestBody(mockFetch).action).toBe("upload_file");
        },
      );
    });

    // @gas-adapter-specs-and-bdd @FR2
    f.Scenario('Upload files sends action "upload_files"', ({ When, Then }) => {
      When("adapter calls uploadFiles", async (_ctx: TestContext) => {
        mockFetch.mockResolvedValue(createValidUploadFilesResponse());
        await adapter.uploadFiles({ files: [] });
      });

      Then(
        'the request body action is "upload_files"',
        async (_ctx: TestContext) => {
          expect(extractRequestBody(mockFetch).action).toBe("upload_files");
        },
      );
    });

    // @gas-adapter-specs-and-bdd @FR2
    f.Scenario('Get file sends action "get_file"', ({ When, Then }) => {
      When("adapter calls getFile", async (_ctx: TestContext) => {
        mockFetch.mockResolvedValue(createValidGetFileResponse());
        await adapter.getFile({ hashes: [] });
      });

      Then(
        'the request body action is "get_file"',
        async (_ctx: TestContext) => {
          expect(extractRequestBody(mockFetch).action).toBe("get_file");
        },
      );
    });

    // @gas-adapter-specs-and-bdd @FR2
    f.Scenario('Delete file sends action "delete_file"', ({ When, Then }) => {
      When("adapter calls deleteFile", async (_ctx: TestContext) => {
        mockFetch.mockResolvedValue(createValidDeleteFileResponse());
        await adapter.deleteFile({ hash: "abc123" });
      });

      Then(
        'the request body action is "delete_file"',
        async (_ctx: TestContext) => {
          expect(extractRequestBody(mockFetch).action).toBe("delete_file");
        },
      );
    });

    // @gas-adapter-specs-and-bdd @FR2
    f.Scenario(
      'Purge sends action "purge" with confirm true',
      ({ When, Then, And }) => {
        When("adapter calls purge", async (_ctx: TestContext) => {
          mockFetch.mockResolvedValue(createValidPurgeResponse());
          await adapter.purge();
        });

        Then(
          'the request body action is "purge"',
          async (_ctx: TestContext) => {
            expect(extractRequestBody(mockFetch).action).toBe("purge");
          },
        );

        And(
          "the request body contains confirm true",
          async (_ctx: TestContext) => {
            expect(extractRequestBody(mockFetch).confirm).toBe(true);
          },
        );
      },
    );

    // @gas-adapter-specs-and-bdd @FR1
    f.Scenario("Ping does not include access_token", ({ When, Then }) => {
      When("adapter pings the server", async (_ctx: TestContext) => {
        mockFetch.mockResolvedValue(createValidPingResponse());
        await adapter.ping();
      });

      Then(
        "no access_token is included in the request",
        async (_ctx: TestContext) => {
          expect(extractFetchOptions(mockFetch).body).toBeUndefined();
        },
      );
    });
  },
);
