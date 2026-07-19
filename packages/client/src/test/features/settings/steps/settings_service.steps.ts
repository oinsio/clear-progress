// implements FR7 of settings-specs-and-bdd
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext, vi } from "vitest";
import type { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { SettingsService } from "@/services/SettingsService";

const feature = await loadFeature("../settings_service.feature");

type FeatureContext = Record<string, never>;

function createMockRepository(): SettingsRepository {
  return {
    getAll: vi.fn(),
    getByKey: vi.fn(),
    getValue: vi.fn(),
    set: vi.fn(),
    getNeedingSync: vi.fn(),
    clearNeedsSyncByKey: vi.fn(),
    bulkUpsert: vi.fn(),
  } as unknown as SettingsRepository;
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let mockRepository: SettingsRepository;
    let service: SettingsService;

    f.BeforeEachScenario(() => {
      mockRepository = createMockRepository();
      service = new SettingsService(mockRepository);
    });

    // @settings-specs-and-bdd @FR7
    f.Scenario(
      "Default box returns inbox when unset",
      ({ Given, When, Then }) => {
        let result: string;

        Given(
          'no setting with key "default_box" exists',
          async (_ctx: TestContext) => {
            (
              mockRepository.getValue as ReturnType<typeof vi.fn>
            ).mockResolvedValue(undefined);
          },
        );

        When("getDefaultBox is called", async (_ctx: TestContext) => {
          result = await service.getDefaultBox();
        });

        Then('the result is "inbox"', async (_ctx: TestContext) => {
          expect(result).toBe("inbox");
        });
      },
    );

    // @settings-specs-and-bdd @FR7
    f.Scenario("Default box returns stored value", ({ Given, When, Then }) => {
      let result: string;

      Given(
        'a setting with key "default_box" and value "today" exists',
        async (_ctx: TestContext) => {
          (
            mockRepository.getValue as ReturnType<typeof vi.fn>
          ).mockResolvedValue("today");
        },
      );

      When("getDefaultBox is called", async (_ctx: TestContext) => {
        result = await service.getDefaultBox();
      });

      Then('the result is "today"', async (_ctx: TestContext) => {
        expect(result).toBe("today");
      });
    });

    // @settings-specs-and-bdd @FR7
    f.Scenario(
      "Accent color returns green when unset",
      ({ Given, When, Then }) => {
        let result: string;

        Given(
          'no setting with key "accent_color" exists',
          async (_ctx: TestContext) => {
            (
              mockRepository.getValue as ReturnType<typeof vi.fn>
            ).mockResolvedValue(undefined);
          },
        );

        When("getAccentColor is called", async (_ctx: TestContext) => {
          result = await service.getAccentColor();
        });

        Then('the result is "green"', async (_ctx: TestContext) => {
          expect(result).toBe("green");
        });
      },
    );

    // @settings-specs-and-bdd @FR7
    f.Scenario("Accent color returns stored value", ({ Given, When, Then }) => {
      let result: string;

      Given(
        'a setting with key "accent_color" and value "purple" exists',
        async (_ctx: TestContext) => {
          (
            mockRepository.getValue as ReturnType<typeof vi.fn>
          ).mockResolvedValue("purple");
        },
      );

      When("getAccentColor is called", async (_ctx: TestContext) => {
        result = await service.getAccentColor();
      });

      Then('the result is "purple"', async (_ctx: TestContext) => {
        expect(result).toBe("purple");
      });
    });

    // @settings-specs-and-bdd @FR7
    f.Scenario("Service delegates set to repository", ({ When, Then }) => {
      When(
        'the service sets "accent_color" to "blue"',
        async (_ctx: TestContext) => {
          await service.set("accent_color", "blue");
        },
      );

      Then(
        'the repository set is invoked with key "accent_color" and value "blue"',
        async (_ctx: TestContext) => {
          expect(mockRepository.set).toHaveBeenCalledWith(
            "accent_color",
            "blue",
          );
        },
      );
    });
  },
);
