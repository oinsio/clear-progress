// implements FR7 of gas-adapter-specs-and-bdd
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext, vi } from "vitest";
import { resetScriptProperties } from "../../../../../tests/server/setup/gas-mocks";
import { mockTokenInfoHttpError } from "../../../../server/helpers/auth-test-utils";
import {
  callDoGet,
  callDoPost,
  makeAuthenticatedPostEvent,
  makeGetEvent,
  makePostEventRaw,
  parseResponse,
} from "../../../../server/main-test-utils";

vi.mock("../../../../server/actions/init", () => ({ init: vi.fn() }));
vi.mock("../../../../server/actions/pull", () => ({ pull: vi.fn() }));
vi.mock("../../../../server/actions/push", () => ({ push: vi.fn() }));
vi.mock("../../../../server/actions/purge", () => ({ purge: vi.fn() }));
vi.mock("../../../../server/actions/upload-file", () => ({
  uploadFile: vi.fn(),
}));
vi.mock("../../../../server/actions/upload-files", () => ({
  uploadFiles: vi.fn(),
}));
vi.mock("../../../../server/actions/delete-file", () => ({
  deleteFile: vi.fn(),
}));
vi.mock("../../../../server/actions/get-file", () => ({ getFile: vi.fn() }));

import "../../../../server/main";

const feature = await loadFeature("../gas_server_errors.feature");
type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      vi.clearAllMocks();
      resetScriptProperties();
    });

    // @gas-adapter-specs-and-bdd @FR7
    f.Scenario("Error response has standard format", ({ When, Then, And }) => {
      When('GET request arrives with action "unknown"', (_ctx: TestContext) => {
        callDoGet(makeGetEvent({ action: "unknown" }));
      });

      Then("response contains ok false", (_ctx: TestContext) => {
        expect(parseResponse().ok).toBe(false);
      });

      And("response contains error code", (_ctx: TestContext) => {
        const response = parseResponse();
        expect(response.error).toBeDefined();
        expect(typeof response.error).toBe("string");
      });

      And("response contains message", (_ctx: TestContext) => {
        const response = parseResponse();
        expect(response.message).toBeDefined();
        expect(typeof response.message).toBe("string");
      });
    });

    // @gas-adapter-specs-and-bdd @FR7
    f.Scenario("Success response has ok true", ({ When, Then }) => {
      When('GET request arrives with action "ping"', (_ctx: TestContext) => {
        callDoGet(makeGetEvent({ action: "ping" }));
      });

      Then("response contains ok true", (_ctx: TestContext) => {
        expect(parseResponse().ok).toBe(true);
      });
    });

    // @gas-adapter-specs-and-bdd @FR7
    f.Scenario("Invalid JSON body returns error", ({ When, Then, And }) => {
      When(
        "POST request arrives with invalid JSON body",
        (_ctx: TestContext) => {
          callDoPost(makePostEventRaw("{not valid json}"));
        },
      );

      Then(
        'response is an error with code "INVALID_PAYLOAD"',
        (_ctx: TestContext) => {
          const response = parseResponse();
          expect(response.ok).toBe(false);
          expect(response.error).toBe("INVALID_PAYLOAD");
        },
      );

      And(
        'error message is "Request body must be valid JSON"',
        (_ctx: TestContext) => {
          expect(parseResponse().message).toBe(
            "Request body must be valid JSON",
          );
        },
      );
    });

    // @gas-adapter-specs-and-bdd @FR7
    f.Scenario(
      "Auth error includes details when available",
      ({ Given, When, Then }) => {
        Given(
          'token verification causes a network error with details "Connection refused"',
          (_ctx: TestContext) => {
            vi.mocked(UrlFetchApp.fetch).mockImplementation(() => {
              throw new Error("Connection refused");
            });
          },
        );

        When(
          'POST request with token arrives for action "init"',
          (_ctx: TestContext) => {
            callDoPost(makeAuthenticatedPostEvent({ action: "init" }));
          },
        );

        Then(
          'error message contains "Connection refused"',
          (_ctx: TestContext) => {
            expect(parseResponse().message as string).toContain(
              "Connection refused",
            );
          },
        );
      },
    );

    // @gas-adapter-specs-and-bdd @FR7
    f.Scenario(
      "Auth error omits details when unavailable",
      ({ Given, When, Then }) => {
        Given("token info returns HTTP 401", (_ctx: TestContext) => {
          mockTokenInfoHttpError(401);
        });

        When(
          'POST request with token arrives for action "init"',
          (_ctx: TestContext) => {
            callDoPost(makeAuthenticatedPostEvent({ action: "init" }));
          },
        );

        Then(
          'error message is "Token is invalid or expired"',
          (_ctx: TestContext) => {
            expect(parseResponse().message).toBe("Token is invalid or expired");
          },
        );
      },
    );
  },
);
