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

function createValidUploadCoverResponse(): Response {
  return new Response(
    JSON.stringify({ ok: true, data_hash: "abc123", reused: false }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function createValidUploadCoversResponse(): Response {
  return new Response(JSON.stringify({ ok: true, results: [] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function createValidGetCoverResponse(): Response {
  return new Response(JSON.stringify({ ok: true, covers: [] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function createValidDeleteCoverResponse(): Response {
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
      },
      purge_revision: 1,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
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
            const [fetchUrl, fetchOptions] = mockFetch.mock.calls[0] as [
              string,
              RequestInit,
            ];
            expect(fetchUrl).toBe(`${GAS_URL}?action=ping`);
            expect(fetchOptions.method).toBeUndefined();
          },
        );

        And("redirect follow is enabled", async (_ctx: TestContext) => {
          const [, fetchOptions] = mockFetch.mock.calls[0] as [
            string,
            RequestInit,
          ];
          expect(fetchOptions.redirect).toBe("follow");
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
            const [, fetchOptions] = mockFetch.mock.calls[0] as [
              string,
              RequestInit,
            ];
            expect(
              (fetchOptions.headers as Record<string, string>)["Content-Type"],
            ).toBe("text/plain");
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
            const [, fetchOptions] = mockFetch.mock.calls[0] as [
              string,
              RequestInit,
            ];
            const parsedBody = JSON.parse(
              fetchOptions.body as string,
            ) as Record<string, unknown>;
            expect(parsedBody.access_token).toBe(VALID_TOKEN);
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
        const [, fetchOptions] = mockFetch.mock.calls[0] as [
          string,
          RequestInit,
        ];
        const parsedBody = JSON.parse(fetchOptions.body as string) as Record<
          string,
          unknown
        >;
        expect(parsedBody.action).toBe("init");
      });
    });

    // @gas-adapter-specs-and-bdd @FR2
    f.Scenario('Pull sends action "pull"', ({ When, Then }) => {
      When("adapter calls pull", async (_ctx: TestContext) => {
        mockFetch.mockResolvedValue(createValidPullResponse());
        await adapter.pull({ since_revision: 0 });
      });

      Then('the request body action is "pull"', async (_ctx: TestContext) => {
        const [, fetchOptions] = mockFetch.mock.calls[0] as [
          string,
          RequestInit,
        ];
        const parsedBody = JSON.parse(fetchOptions.body as string) as Record<
          string,
          unknown
        >;
        expect(parsedBody.action).toBe("pull");
      });
    });

    // @gas-adapter-specs-and-bdd @FR2
    f.Scenario('Push sends action "push"', ({ When, Then }) => {
      When("adapter calls push", async (_ctx: TestContext) => {
        mockFetch.mockResolvedValue(createValidPushResponse());
        await adapter.push({});
      });

      Then('the request body action is "push"', async (_ctx: TestContext) => {
        const [, fetchOptions] = mockFetch.mock.calls[0] as [
          string,
          RequestInit,
        ];
        const parsedBody = JSON.parse(fetchOptions.body as string) as Record<
          string,
          unknown
        >;
        expect(parsedBody.action).toBe("push");
      });
    });

    // @gas-adapter-specs-and-bdd @FR2
    f.Scenario('Upload cover sends action "upload_cover"', ({ When, Then }) => {
      When("adapter calls uploadCover", async (_ctx: TestContext) => {
        mockFetch.mockResolvedValue(createValidUploadCoverResponse());
        await adapter.uploadCover({
          goal_id: "test-id",
          data: "base64data",
          mime_type: "image/png",
          filename: "cover.png",
          data_hash: "abc123",
        });
      });

      Then(
        'the request body action is "upload_cover"',
        async (_ctx: TestContext) => {
          const [, fetchOptions] = mockFetch.mock.calls[0] as [
            string,
            RequestInit,
          ];
          const parsedBody = JSON.parse(fetchOptions.body as string) as Record<
            string,
            unknown
          >;
          expect(parsedBody.action).toBe("upload_cover");
        },
      );
    });

    // @gas-adapter-specs-and-bdd @FR2
    f.Scenario(
      'Upload covers sends action "upload_covers"',
      ({ When, Then }) => {
        When("adapter calls uploadCovers", async (_ctx: TestContext) => {
          mockFetch.mockResolvedValue(createValidUploadCoversResponse());
          await adapter.uploadCovers({ covers: [] });
        });

        Then(
          'the request body action is "upload_covers"',
          async (_ctx: TestContext) => {
            const [, fetchOptions] = mockFetch.mock.calls[0] as [
              string,
              RequestInit,
            ];
            const parsedBody = JSON.parse(
              fetchOptions.body as string,
            ) as Record<string, unknown>;
            expect(parsedBody.action).toBe("upload_covers");
          },
        );
      },
    );

    // @gas-adapter-specs-and-bdd @FR2
    f.Scenario('Get cover sends action "get_cover"', ({ When, Then }) => {
      When("adapter calls getCover", async (_ctx: TestContext) => {
        mockFetch.mockResolvedValue(createValidGetCoverResponse());
        await adapter.getCover({ hashes: [] });
      });

      Then(
        'the request body action is "get_cover"',
        async (_ctx: TestContext) => {
          const [, fetchOptions] = mockFetch.mock.calls[0] as [
            string,
            RequestInit,
          ];
          const parsedBody = JSON.parse(fetchOptions.body as string) as Record<
            string,
            unknown
          >;
          expect(parsedBody.action).toBe("get_cover");
        },
      );
    });

    // @gas-adapter-specs-and-bdd @FR2
    f.Scenario('Delete cover sends action "delete_cover"', ({ When, Then }) => {
      When("adapter calls deleteCover", async (_ctx: TestContext) => {
        mockFetch.mockResolvedValue(createValidDeleteCoverResponse());
        await adapter.deleteCover({ goal_id: "test-id", hash: "abc123" });
      });

      Then(
        'the request body action is "delete_cover"',
        async (_ctx: TestContext) => {
          const [, fetchOptions] = mockFetch.mock.calls[0] as [
            string,
            RequestInit,
          ];
          const parsedBody = JSON.parse(fetchOptions.body as string) as Record<
            string,
            unknown
          >;
          expect(parsedBody.action).toBe("delete_cover");
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
            const [, fetchOptions] = mockFetch.mock.calls[0] as [
              string,
              RequestInit,
            ];
            const parsedBody = JSON.parse(
              fetchOptions.body as string,
            ) as Record<string, unknown>;
            expect(parsedBody.action).toBe("purge");
          },
        );

        And(
          "the request body contains confirm true",
          async (_ctx: TestContext) => {
            const [, fetchOptions] = mockFetch.mock.calls[0] as [
              string,
              RequestInit,
            ];
            const parsedBody = JSON.parse(
              fetchOptions.body as string,
            ) as Record<string, unknown>;
            expect(parsedBody.confirm).toBe(true);
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
          const [, fetchOptions] = mockFetch.mock.calls[0] as [
            string,
            RequestInit,
          ];
          expect(fetchOptions.body).toBeUndefined();
        },
      );
    });
  },
);
