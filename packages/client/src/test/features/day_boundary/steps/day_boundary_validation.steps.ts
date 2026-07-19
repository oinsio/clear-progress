// implements FR11, FR12 of day-boundary
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext, vi } from "vitest";
import type { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { SettingsService } from "@/services/SettingsService";
import { isValidDayBoundary } from "@/utils/getLogicalDate";

const feature = await loadFeature("../day_boundary_validation.feature");

type Context = Record<string, never>;

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

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let validationResult: boolean;
  let mockRepository: SettingsRepository;
  let service: SettingsService;
  let returnedValue: string;

  f.BeforeEachScenario(() => {
    validationResult = false;
    mockRepository = createMockRepository();
    service = new SettingsService(mockRepository);
    returnedValue = "";
  });

  // @day-boundary @FR11
  f.ScenarioOutline(
    "Valid day boundary values are accepted",
    ({ When, Then }, variables) => {
      When('validating day boundary "<value>"', (_ctx: TestContext) => {
        validationResult = isValidDayBoundary(variables.value as string);
      });

      Then("the value is valid", (_ctx: TestContext) => {
        expect(validationResult).toBe(true);
      });
    },
  );

  // @day-boundary @FR11
  f.ScenarioOutline(
    "Invalid day boundary values are rejected",
    ({ When, Then }, variables) => {
      When('validating day boundary "<value>"', (_ctx: TestContext) => {
        validationResult = isValidDayBoundary(variables.value as string);
      });

      Then("the value is invalid", (_ctx: TestContext) => {
        expect(validationResult).toBe(false);
      });
    },
  );

  // @day-boundary @FR12
  f.Scenario(
    "Invalid value in storage returns default",
    ({ Given, When, Then }) => {
      Given('stored day boundary is "invalid"', (_ctx: TestContext) => {
        (mockRepository.getValue as ReturnType<typeof vi.fn>).mockResolvedValue(
          "invalid",
        );
      });

      When(
        "the system reads the day boundary setting",
        async (_ctx: TestContext) => {
          returnedValue = await service.getDayBoundary();
        },
      );

      Then('the returned value is "00:00"', (_ctx: TestContext) => {
        expect(returnedValue).toBe("00:00");
      });
    },
  );

  // @day-boundary @FR12
  f.Scenario(
    "Invalid value triggers self-healing write",
    ({ Given, When, Then }) => {
      Given('stored day boundary is "25:00"', (_ctx: TestContext) => {
        (mockRepository.getValue as ReturnType<typeof vi.fn>).mockResolvedValue(
          "25:00",
        );
      });

      When(
        "the system reads the day boundary setting",
        async (_ctx: TestContext) => {
          returnedValue = await service.getDayBoundary();
        },
      );

      Then(
        'the repository is updated with value "00:00" and syncStatus "pending"',
        async (_ctx: TestContext) => {
          expect(returnedValue).toBe("00:00");
          expect(mockRepository.set).toHaveBeenCalledWith(
            "day_boundary",
            "00:00",
          );
        },
      );
    },
  );

  // @day-boundary @FR12
  f.Scenario(
    "Valid value passes through unchanged",
    ({ Given, When, Then, And }) => {
      Given('stored day boundary is "02:00"', (_ctx: TestContext) => {
        (mockRepository.getValue as ReturnType<typeof vi.fn>).mockResolvedValue(
          "02:00",
        );
      });

      When(
        "the system reads the day boundary setting",
        async (_ctx: TestContext) => {
          returnedValue = await service.getDayBoundary();
        },
      );

      Then('the returned value is "02:00"', (_ctx: TestContext) => {
        expect(returnedValue).toBe("02:00");
      });

      And("no healing write occurs", (_ctx: TestContext) => {
        expect(mockRepository.set).not.toHaveBeenCalled();
      });
    },
  );

  // @day-boundary @FR12
  f.Scenario(
    "Missing value returns default without healing",
    ({ Given, When, Then, And }) => {
      Given("no day boundary setting exists", (_ctx: TestContext) => {
        (mockRepository.getValue as ReturnType<typeof vi.fn>).mockResolvedValue(
          undefined,
        );
      });

      When(
        "the system reads the day boundary setting",
        async (_ctx: TestContext) => {
          returnedValue = await service.getDayBoundary();
        },
      );

      Then('the returned value is "00:00"', (_ctx: TestContext) => {
        expect(returnedValue).toBe("00:00");
      });

      And("no healing write occurs", (_ctx: TestContext) => {
        expect(mockRepository.set).not.toHaveBeenCalled();
      });
    },
  );
});
