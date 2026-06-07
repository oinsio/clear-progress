// implements FR6 of gas-adapter-specs-and-bdd
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext, vi } from "vitest";
import {
  getScriptPropertiesStore,
  resetScriptProperties,
  setScriptProperty,
} from "../../../../../tests/server/setup/gas-mocks";
import {
  mockTokenInfoError,
  mockTokenInfoHttpError,
  mockTokenInfoPermissionError,
  mockTokenInfoResponse,
  OTHER_EMAIL,
  VALID_EMAIL,
  VALID_TOKEN_INFO,
} from "../../../../server/helpers/auth-test-utils";
import { PROPERTY_KEYS } from "../../../../server/helpers/constants";
import {
  callDoPost,
  makeAuthenticatedPostEvent,
  makePostEvent,
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
vi.mock("../../../../server/actions/get-file", () => ({ getFile: vi.fn() }));

import "../../../../server/main";

const feature = await loadFeature("../gas_server_auth.feature");
type FeatureContext = Record<string, never>;

function postInit(): void {
  callDoPost(makeAuthenticatedPostEvent({ action: "init" }));
}

function expectUnauthorized(expectedMessage: string): void {
  const response = parseResponse();
  expect(response.ok).toBe(false);
  expect(response.error).toBe("UNAUTHORIZED");
  expect(response.message).toBe(expectedMessage);
}

function expectUnauthorizedContaining(expectedSubstring: string): void {
  const response = parseResponse();
  expect(response.ok).toBe(false);
  expect(response.error).toBe("UNAUTHORIZED");
  expect(response.message as string).toContain(expectedSubstring);
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      vi.clearAllMocks();
      resetScriptProperties();
    });

    // @gas-adapter-specs-and-bdd @FR6
    f.Scenario("Valid token passes authentication", ({ Given, When, Then }) => {
      Given(
        "token info returns a valid verified email",
        (_ctx: TestContext) => {
          mockTokenInfoResponse(VALID_TOKEN_INFO);
        },
      );
      When(
        'POST request with token arrives for action "init"',
        (_ctx: TestContext) => {
          postInit();
        },
      );
      Then("response is not unauthorized", (_ctx: TestContext) => {
        expect(parseResponse().error).not.toBe("UNAUTHORIZED");
      });
    });

    // @gas-adapter-specs-and-bdd @FR6
    f.Scenario(
      "Invalid or expired token is rejected",
      ({ Given, When, Then }) => {
        Given("token info returns HTTP 401", (_ctx: TestContext) => {
          mockTokenInfoHttpError(401);
        });
        When(
          'POST request with token arrives for action "init"',
          (_ctx: TestContext) => {
            postInit();
          },
        );
        Then(
          'response is unauthorized with message "Token is invalid or expired"',
          (_ctx: TestContext) => {
            expectUnauthorized("Token is invalid or expired");
          },
        );
      },
    );

    // @gas-adapter-specs-and-bdd @FR6
    f.Scenario("Unverified email is rejected", ({ Given, When, Then }) => {
      Given("token info returns an unverified email", (_ctx: TestContext) => {
        mockTokenInfoResponse({
          email: VALID_EMAIL,
          email_verified: "false",
          sub: "12345",
        });
      });
      When(
        'POST request with token arrives for action "init"',
        (_ctx: TestContext) => {
          postInit();
        },
      );
      Then(
        'response is unauthorized with message "Google account email is not verified"',
        (_ctx: TestContext) => {
          expectUnauthorized("Google account email is not verified");
        },
      );
    });

    // @gas-adapter-specs-and-bdd @FR6
    f.Scenario(
      "First call registers owner email",
      ({ Given, And, When, Then }) => {
        Given("no owner email is registered", (_ctx: TestContext) => {
          /* cleared in BeforeEach */
        });
        And(
          "token info returns a valid verified email",
          (_ctx: TestContext) => {
            mockTokenInfoResponse(VALID_TOKEN_INFO);
          },
        );
        When(
          'POST request with token arrives for action "init"',
          (_ctx: TestContext) => {
            postInit();
          },
        );
        Then(
          "owner email is saved in script properties",
          (_ctx: TestContext) => {
            expect(getScriptPropertiesStore()[PROPERTY_KEYS.OWNER_EMAIL]).toBe(
              VALID_EMAIL,
            );
          },
        );
      },
    );

    // @gas-adapter-specs-and-bdd @FR6
    f.Scenario("Matching owner email passes", ({ Given, And, When, Then }) => {
      Given("owner email is already registered", (_ctx: TestContext) => {
        setScriptProperty(PROPERTY_KEYS.OWNER_EMAIL, VALID_EMAIL);
      });
      And("token info returns the same owner email", (_ctx: TestContext) => {
        mockTokenInfoResponse(VALID_TOKEN_INFO);
      });
      When(
        'POST request with token arrives for action "init"',
        (_ctx: TestContext) => {
          postInit();
        },
      );
      Then("response is not unauthorized", (_ctx: TestContext) => {
        expect(parseResponse().error).not.toBe("UNAUTHORIZED");
      });
    });

    // @gas-adapter-specs-and-bdd @FR6
    f.Scenario("Wrong account is rejected", ({ Given, And, When, Then }) => {
      Given("owner email is already registered", (_ctx: TestContext) => {
        setScriptProperty(PROPERTY_KEYS.OWNER_EMAIL, VALID_EMAIL);
      });
      And("token info returns a different email", (_ctx: TestContext) => {
        mockTokenInfoResponse({
          email: OTHER_EMAIL,
          email_verified: "true",
          sub: "99999",
        });
      });
      When(
        'POST request with token arrives for action "init"',
        (_ctx: TestContext) => {
          postInit();
        },
      );
      Then(
        'response is unauthorized with message "Token belongs to a different account"',
        (_ctx: TestContext) => {
          expectUnauthorized("Token belongs to a different account");
        },
      );
    });

    // @gas-adapter-specs-and-bdd @FR6
    f.Scenario(
      "Network error during token verification",
      ({ Given, When, Then }) => {
        Given(
          "token verification causes a network error",
          (_ctx: TestContext) => {
            mockTokenInfoError();
          },
        );
        When(
          'POST request with token arrives for action "init"',
          (_ctx: TestContext) => {
            postInit();
          },
        );
        Then(
          'response is unauthorized with message containing "network error"',
          (_ctx: TestContext) => {
            expectUnauthorizedContaining("network error");
          },
        );
      },
    );

    // @gas-adapter-specs-and-bdd @FR6
    f.Scenario(
      "GAS permission error during token verification",
      ({ Given, When, Then }) => {
        Given(
          "token verification causes a GAS permission error",
          (_ctx: TestContext) => {
            mockTokenInfoPermissionError();
          },
        );
        When(
          'POST request with token arrives for action "init"',
          (_ctx: TestContext) => {
            postInit();
          },
        );
        Then(
          'response is unauthorized with message containing "not authorized"',
          (_ctx: TestContext) => {
            expectUnauthorizedContaining("not authorized");
          },
        );
      },
    );

    // @gas-adapter-specs-and-bdd @FR6
    f.Scenario("Missing access_token is rejected", ({ When, Then }) => {
      When("POST request arrives without access_token", (_ctx: TestContext) => {
        callDoPost(makePostEvent({ action: "init" }));
      });
      Then(
        'response is unauthorized with message "access_token is required"',
        (_ctx: TestContext) => {
          expectUnauthorized("access_token is required");
        },
      );
    });

    // @gas-adapter-specs-and-bdd @FR6
    f.Scenario("Non-string access_token is rejected", ({ When, Then }) => {
      When(
        "POST request arrives with non-string access_token",
        (_ctx: TestContext) => {
          callDoPost(makePostEvent({ action: "init", access_token: 12345 }));
        },
      );
      Then(
        'response is unauthorized with message "access_token is required"',
        (_ctx: TestContext) => {
          expectUnauthorized("access_token is required");
        },
      );
    });
  },
);
