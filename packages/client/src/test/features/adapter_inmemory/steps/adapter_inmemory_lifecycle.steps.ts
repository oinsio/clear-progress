// implements FR1 of adapter-inmemory-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { InMemorySyncAdapter } from "@clear-progress/adapter-inmemory";
import type { InitResponse, PingResponse } from "@clear-progress/contract";
import { expect, type TestContext } from "vitest";

const feature = await loadFeature("../adapter_inmemory_lifecycle.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let adapter: InMemorySyncAdapter;
    let pingResponse: PingResponse;
    let initResponse: InitResponse;
    let secondInitResponse: InitResponse;

    f.BeforeEachScenario(async () => {
      adapter = new InMemorySyncAdapter();
    });

    // @adapter-inmemory-spec @FR1
    f.Scenario(
      "Ping before init returns uninitialized",
      ({ Given, When, Then }) => {
        Given("a fresh adapter instance", async (_ctx: TestContext) => {
          // adapter created in BeforeEachScenario
        });

        When("ping is called", async (_ctx: TestContext) => {
          pingResponse = await adapter.ping();
        });

        Then(
          'the response has ok true, app "inmemory", version "0.1.0", and initialized false',
          async (_ctx: TestContext) => {
            expect(pingResponse.ok).toBe(true);
            expect(pingResponse.app).toBe("inmemory");
            expect(pingResponse.version).toBe("0.1.0");
            expect(pingResponse.initialized).toBe(false);
          },
        );
      },
    );

    // @adapter-inmemory-spec @FR1
    f.Scenario(
      "Ping after init returns initialized",
      ({ Given, When, And, Then }) => {
        Given("a fresh adapter instance", async (_ctx: TestContext) => {
          // adapter created in BeforeEachScenario
        });

        When("init is called", async (_ctx: TestContext) => {
          await adapter.init();
        });

        And("ping is called", async (_ctx: TestContext) => {
          pingResponse = await adapter.ping();
        });

        Then(
          "the ping response has initialized true",
          async (_ctx: TestContext) => {
            expect(pingResponse.initialized).toBe(true);
          },
        );
      },
    );

    // @adapter-inmemory-spec @FR1
    f.Scenario("Init returns ok", ({ Given, When, Then }) => {
      Given("a fresh adapter instance", async (_ctx: TestContext) => {
        // adapter created in BeforeEachScenario
      });

      When("init is called", async (_ctx: TestContext) => {
        initResponse = await adapter.init();
      });

      Then("the init response has ok true", async (_ctx: TestContext) => {
        expect(initResponse.ok).toBe(true);
      });
    });

    // @adapter-inmemory-spec @FR1
    f.Scenario("Init is idempotent", ({ Given, When, Then }) => {
      Given("a fresh adapter instance", async (_ctx: TestContext) => {
        // adapter created in BeforeEachScenario
      });

      When("init is called twice", async (_ctx: TestContext) => {
        initResponse = await adapter.init();
        secondInitResponse = await adapter.init();
      });

      Then("both init responses have ok true", async (_ctx: TestContext) => {
        expect(initResponse.ok).toBe(true);
        expect(secondInitResponse.ok).toBe(true);
      });
    });
  },
);
