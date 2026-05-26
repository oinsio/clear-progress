// implements FR6 of adapter-inmemory-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { InMemorySyncAdapter } from "@clear-progress/adapter-inmemory";
import type {
  PullResponse,
  PushResponse,
  PushSettingResult,
} from "@clear-progress/contract";
import { expect, type TestContext } from "vitest";

const feature = await loadFeature("../adapter_inmemory_settings.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let adapter: InMemorySyncAdapter;
    let pushResponse: PushResponse;
    let pullResponse: PullResponse;
    let settingResult: PushSettingResult;

    function firstSettingResult(response: PushResponse): PushSettingResult {
      return response.results.settings?.[0] as PushSettingResult;
    }

    f.BeforeEachScenario(async () => {
      adapter = new InMemorySyncAdapter();
    });

    // @adapter-inmemory-spec @FR6
    f.Scenario("New setting is created", ({ Given, When, Then, And }) => {
      Given("an initialized adapter", async (_ctx: TestContext) => {
        await adapter.init();
      });

      When(
        'a setting with key "accent_color" and value "blue" is pushed',
        async (_ctx: TestContext) => {
          pushResponse = await adapter.push({
            settings: [
              {
                key: "accent_color",
                value: "blue",
                updated_at: "2026-01-01T00:00:00.000Z",
              },
            ],
          });
          settingResult = firstSettingResult(pushResponse);
        },
      );

      Then(
        'the setting result has status "created"',
        async (_ctx: TestContext) => {
          expect(settingResult.status).toBe("created");
        },
      );

      And("the setting is returned in pull", async (_ctx: TestContext) => {
        pullResponse = await adapter.pull({ since_revision: 0 });
        expect(pullResponse.settings).toHaveLength(1);
        expect(pullResponse.settings[0]?.key).toBe("accent_color");
        expect(pullResponse.settings[0]?.value).toBe("blue");
      });
    });

    // @adapter-inmemory-spec @FR6
    f.Scenario(
      "Setting conflict when server is newer",
      ({ Given, And, When, Then }) => {
        Given("an initialized adapter", async (_ctx: TestContext) => {
          await adapter.init();
        });

        And(
          'a setting "theme" exists with updated_at "2026-01-02T00:00:00.000Z"',
          async (_ctx: TestContext) => {
            await adapter.push({
              settings: [
                {
                  key: "theme",
                  value: "dark",
                  updated_at: "2026-01-02T00:00:00.000Z",
                },
              ],
            });
          },
        );

        When(
          'the setting "theme" is updated with updated_at "2026-01-01T00:00:00.000Z"',
          async (_ctx: TestContext) => {
            pushResponse = await adapter.push({
              settings: [
                {
                  key: "theme",
                  value: "light",
                  updated_at: "2026-01-01T00:00:00.000Z",
                },
              ],
            });
            settingResult = firstSettingResult(pushResponse);
          },
        );

        Then(
          'the setting result has status "conflict" with server_record',
          async (_ctx: TestContext) => {
            expect(settingResult.status).toBe("conflict");
            expect(settingResult.server_record).toBeDefined();
          },
        );
      },
    );

    // @adapter-inmemory-spec @FR6
    f.Scenario(
      "Settings filtered by updated_at",
      ({ Given, And, When, Then }) => {
        Given("an initialized adapter", async (_ctx: TestContext) => {
          await adapter.init();
        });

        And(
          'a setting "key1" exists with updated_at "2026-01-01T00:00:00.000Z"',
          async (_ctx: TestContext) => {
            await adapter.push({
              settings: [
                {
                  key: "key1",
                  value: "value1",
                  updated_at: "2026-01-01T00:00:00.000Z",
                },
              ],
            });
          },
        );

        And(
          'a setting "key2" exists with updated_at "2026-01-02T00:00:00.000Z"',
          async (_ctx: TestContext) => {
            await adapter.push({
              settings: [
                {
                  key: "key2",
                  value: "value2",
                  updated_at: "2026-01-02T00:00:00.000Z",
                },
              ],
            });
          },
        );

        When(
          'pull is called with settings_updated_at "2026-01-01T12:00:00.000Z"',
          async (_ctx: TestContext) => {
            pullResponse = await adapter.pull({
              since_revision: 0,
              settings_updated_at: "2026-01-01T12:00:00.000Z",
            });
          },
        );

        Then(
          'only the setting "key2" is returned',
          async (_ctx: TestContext) => {
            expect(pullResponse.settings).toHaveLength(1);
            expect(pullResponse.settings[0]?.key).toBe("key2");
          },
        );
      },
    );
  },
);
