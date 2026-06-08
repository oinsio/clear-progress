// implements FR5 of gas-adapter-specs-and-bdd
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext, vi } from "vitest";
import { resetScriptProperties } from "../../../../../tests/server/setup/gas-mocks";
import {
  callDoGet,
  callDoPost,
  makeAuthenticatedPostEvent,
  makeGetEvent,
  OWNER_EMAIL,
  parseResponse,
} from "../../../../server/main-test-utils";

vi.mock("../../../../server/actions/ping", () => ({ ping: vi.fn() }));
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
vi.mock("../../../../server/actions/get-file", () => ({
  getFile: vi.fn(),
}));
vi.mock("../../../../server/helpers/auth", () => ({
  verifyToken: vi.fn(),
}));

import { init } from "../../../../server/actions/init";
import { ping } from "../../../../server/actions/ping";
import { pull } from "../../../../server/actions/pull";
import { push } from "../../../../server/actions/push";
import { verifyToken } from "../../../../server/helpers/auth";

import "../../../../server/main";

function assertInvalidActionResponse(): void {
  const response = parseResponse();
  expect(response.ok).toBe(false);
  expect(response.error).toBe("INVALID_ACTION");
}

function assertUnknownActionMessage(): void {
  const response = parseResponse();
  expect(response.message).toContain("Unknown action");
}

const feature = await loadFeature("../gas_server_routing.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      vi.clearAllMocks();
      resetScriptProperties();
      vi.mocked(verifyToken).mockReturnValue({
        ok: true,
        email: OWNER_EMAIL,
      } as never);
    });

    // @gas-adapter-specs-and-bdd @FR5
    f.Scenario("Ping via GET dispatches ping action", ({ When, Then }) => {
      When('GET request arrives with action "ping"', (_ctx: TestContext) => {
        callDoGet(makeGetEvent({ action: "ping" }));
      });

      Then("ping action is invoked", (_ctx: TestContext) => {
        expect(ping).toHaveBeenCalledTimes(1);
      });
    });

    // @gas-adapter-specs-and-bdd @FR5
    f.Scenario(
      "GET with unknown action returns error",
      ({ When, Then, And }) => {
        When(
          'GET request arrives with action "unknown"',
          (_ctx: TestContext) => {
            callDoGet(makeGetEvent({ action: "unknown" }));
          },
        );

        Then(
          'response is an error with code "INVALID_ACTION"',
          (_ctx: TestContext) => {
            assertInvalidActionResponse();
          },
        );

        And('error message contains "Unknown action"', (_ctx: TestContext) => {
          assertUnknownActionMessage();
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR5
    f.Scenario(
      "GET with missing action returns error",
      ({ When, Then, And }) => {
        When("GET request arrives without action", (_ctx: TestContext) => {
          callDoGet(makeGetEvent({}));
        });

        Then(
          'response is an error with code "INVALID_ACTION"',
          (_ctx: TestContext) => {
            assertInvalidActionResponse();
          },
        );

        And('error message contains "Unknown action"', (_ctx: TestContext) => {
          assertUnknownActionMessage();
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR5
    f.Scenario("POST dispatches init action", ({ Given, When, Then }) => {
      Given("user is authenticated", (_ctx: TestContext) => {
        // Already set up in BeforeEachScenario
      });

      When('POST request arrives with action "init"', (_ctx: TestContext) => {
        callDoPost(makeAuthenticatedPostEvent({ action: "init" }));
      });

      Then("init action is invoked", (_ctx: TestContext) => {
        expect(init).toHaveBeenCalledTimes(1);
      });
    });

    // @gas-adapter-specs-and-bdd @FR5
    f.Scenario("POST dispatches pull action", ({ Given, When, Then }) => {
      Given("user is authenticated", (_ctx: TestContext) => {
        // Already set up in BeforeEachScenario
      });

      When('POST request arrives with action "pull"', (_ctx: TestContext) => {
        callDoPost(
          makeAuthenticatedPostEvent({ action: "pull", since_revision: 0 }),
        );
      });

      Then("pull action is invoked", (_ctx: TestContext) => {
        expect(pull).toHaveBeenCalledTimes(1);
      });
    });

    // @gas-adapter-specs-and-bdd @FR5
    f.Scenario("POST dispatches push action", ({ Given, When, Then }) => {
      Given("user is authenticated", (_ctx: TestContext) => {
        // Already set up in BeforeEachScenario
      });

      When('POST request arrives with action "push"', (_ctx: TestContext) => {
        callDoPost(makeAuthenticatedPostEvent({ action: "push", changes: {} }));
      });

      Then("push action is invoked", (_ctx: TestContext) => {
        expect(push).toHaveBeenCalledTimes(1);
      });
    });

    // @gas-adapter-specs-and-bdd @FR5
    f.Scenario(
      "POST with unknown action returns error",
      ({ Given, When, Then, And }) => {
        Given("user is authenticated", (_ctx: TestContext) => {
          // Already set up in BeforeEachScenario
        });

        When(
          'POST request arrives with action "bogus"',
          (_ctx: TestContext) => {
            callDoPost(makeAuthenticatedPostEvent({ action: "bogus" }));
          },
        );

        Then(
          'response is an error with code "INVALID_ACTION"',
          (_ctx: TestContext) => {
            assertInvalidActionResponse();
          },
        );

        And('error message contains "Unknown action"', (_ctx: TestContext) => {
          assertUnknownActionMessage();
        });
      },
    );
  },
);
