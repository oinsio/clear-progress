// implements spec-sync-protocol — pull scenarios (FR2, FR5, FR13)
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { SyncAdapter } from "@clear-progress/contract";
import { expect, type TestContext, vi } from "vitest";
import { STORAGE_KEYS, SYNC_META_KEYS } from "@/constants";
import {
  createMockRepositories,
  createMockSyncAdapter,
  createSyncService,
  makePullResponse,
  makeTask,
} from "@/test/helpers/bdd/syncProtocol/helpers";
import type { SyncProtocolTestContext } from "@/test/helpers/bdd/syncProtocol/types";
import type { ISOTimestamp } from "@/types/entities";

const feature = await loadFeature("../sync_pull.feature");

type Context = SyncProtocolTestContext & {
  repositories: ReturnType<typeof createMockRepositories>;
  pullError?: Error;
};

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let repositories: ReturnType<typeof createMockRepositories>;
  let syncAdapter: SyncAdapter;
  let pullError: Error | undefined;

  f.BeforeEachScenario(async () => {
    repositories = createMockRepositories();
    syncAdapter = createMockSyncAdapter();
    pullError = undefined;
    localStorage.clear();
  });

  // @spec-sync-protocol @FR2
  f.Scenario(
    "Incremental pull sends since_revision from sync_meta",
    ({ Given, When, Then }) => {
      Given("last_known_revision is 5", async (_ctx: TestContext) => {
        (
          repositories.syncMetaRepository.getValue as ReturnType<typeof vi.fn>
        ).mockResolvedValue(5);
      });

      When("pull is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.pull();
      });

      Then(
        "PullRequest contains since_revision 5",
        async (_ctx: TestContext) => {
          expect(syncAdapter.pull).toHaveBeenCalledWith(
            expect.objectContaining({ since_revision: 5 }),
          );
        },
      );
    },
  );

  // @spec-sync-protocol @FR2
  f.Scenario("Full pull with since_revision 0", ({ Given, When, Then }) => {
    Given("last_known_revision is 0", async (_ctx: TestContext) => {
      (
        repositories.syncMetaRepository.getValue as ReturnType<typeof vi.fn>
      ).mockResolvedValue(0);
    });

    When("pull is called", async (_ctx: TestContext) => {
      const service = createSyncService(syncAdapter, repositories);
      await service.pull();
    });

    Then("PullRequest contains since_revision 0", async (_ctx: TestContext) => {
      expect(syncAdapter.pull).toHaveBeenCalledWith(
        expect.objectContaining({ since_revision: 0 }),
      );
    });
  });

  // @spec-sync-protocol @FR5
  f.Scenario(
    "Pull updates last_known_revision from response",
    ({ Given, And, When, Then }) => {
      Given("last_known_revision is 5", async (_ctx: TestContext) => {
        (
          repositories.syncMetaRepository.getValue as ReturnType<typeof vi.fn>
        ).mockResolvedValue(5);
      });

      And(
        "server will respond to pull with current_revision 15",
        async (_ctx: TestContext) => {
          syncAdapter = createMockSyncAdapter({
            pull: vi
              .fn()
              .mockResolvedValue(makePullResponse({ current_revision: 15 })),
          });
        },
      );

      When("pull is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.pull();
      });

      Then("last_known_revision is set to 15", async (_ctx: TestContext) => {
        expect(repositories.syncMetaRepository.setValue).toHaveBeenCalledWith(
          SYNC_META_KEYS.LAST_KNOWN_REVISION,
          15,
        );
      });
    },
  );

  // @spec-sync-protocol @FR2
  f.Scenario(
    "Pull applies server records to all repositories",
    ({ Given, When, Then, And }) => {
      const serverTasks = [makeTask()];

      Given(
        "server will respond to pull with tasks and goals",
        async (_ctx: TestContext) => {
          syncAdapter = createMockSyncAdapter({
            pull: vi
              .fn()
              .mockResolvedValue(
                makePullResponse({ tasks: serverTasks, goals: [] }),
              ),
          });
        },
      );

      When("pull is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.pull();
      });

      Then(
        "applyServerRecords is called on task repository",
        async (_ctx: TestContext) => {
          expect(
            repositories.taskRepository.applyServerRecords,
          ).toHaveBeenCalledWith(serverTasks);
        },
      );

      And(
        "applyServerRecords is called on goal repository",
        async (_ctx: TestContext) => {
          expect(
            repositories.goalRepository.applyServerRecords,
          ).toHaveBeenCalledWith([]);
        },
      );
    },
  );

  // @spec-sync-protocol @FR2
  f.Scenario(
    "Pull applies server settings via bulkUpsert",
    ({ Given, When, Then }) => {
      const serverSettings = [
        {
          key: "default_box",
          value: "inbox",
          updated_at: "2026-04-10T00:00:00.000Z" as ISOTimestamp,
          needsSync: false,
        },
      ];

      Given(
        "server will respond to pull with settings",
        async (_ctx: TestContext) => {
          syncAdapter = createMockSyncAdapter({
            pull: vi
              .fn()
              .mockResolvedValue(
                makePullResponse({ settings: serverSettings }),
              ),
          });
        },
      );

      When("pull is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.pull();
      });

      Then("settings are applied via bulkUpsert", async (_ctx: TestContext) => {
        expect(repositories.settingsRepository.bulkUpsert).toHaveBeenCalledWith(
          serverSettings,
        );
      });
    },
  );

  // @spec-sync-protocol @FR13
  f.Scenario(
    "Pull sends settings_updated_at from localStorage",
    ({ Given, When, Then }) => {
      Given(
        'settings_updated_at in localStorage is "2026-06-01T10:00:00.000Z"',
        async (_ctx: TestContext) => {
          localStorage.setItem(
            STORAGE_KEYS.SETTINGS_UPDATED_AT,
            "2026-06-01T10:00:00.000Z",
          );
        },
      );

      When("pull is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.pull();
      });

      Then(
        'PullRequest contains settings_updated_at "2026-06-01T10:00:00.000Z"',
        async (_ctx: TestContext) => {
          expect(syncAdapter.pull).toHaveBeenCalledWith(
            expect.objectContaining({
              settings_updated_at: "2026-06-01T10:00:00.000Z",
            }),
          );
        },
      );
    },
  );

  // @spec-sync-protocol @FR13
  f.Scenario(
    "Pull omits settings_updated_at when not set",
    ({ Given, When, Then }) => {
      Given(
        "settings_updated_at is not set in localStorage",
        async (_ctx: TestContext) => {
          localStorage.removeItem(STORAGE_KEYS.SETTINGS_UPDATED_AT);
        },
      );

      When("pull is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.pull();
      });

      Then(
        "PullRequest does not contain settings_updated_at",
        async (_ctx: TestContext) => {
          expect(syncAdapter.pull).toHaveBeenCalledWith({
            since_revision: 0,
          });
        },
      );
    },
  );

  // @spec-sync-protocol @FR5
  f.Scenario(
    "Pull updates settings_updated_at to max from received settings",
    ({ Given, And, When, Then }) => {
      Given(
        "settings_updated_at is not set in localStorage",
        async (_ctx: TestContext) => {
          localStorage.removeItem(STORAGE_KEYS.SETTINGS_UPDATED_AT);
        },
      );

      And(
        'server will respond to pull with settings having updated_at "2026-04-10T00:00:00.000Z" and "2026-04-17T00:00:00.000Z"',
        async (_ctx: TestContext) => {
          syncAdapter = createMockSyncAdapter({
            pull: vi.fn().mockResolvedValue(
              makePullResponse({
                settings: [
                  {
                    key: "setting1",
                    value: "v1",
                    updated_at: "2026-04-10T00:00:00.000Z" as ISOTimestamp,
                  },
                  {
                    key: "setting2",
                    value: "v2",
                    updated_at: "2026-04-17T00:00:00.000Z" as ISOTimestamp,
                  },
                ],
              }),
            ),
          });
        },
      );

      When("pull is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.pull();
      });

      Then(
        'settings_updated_at in localStorage is "2026-04-17T00:00:00.000Z"',
        async (_ctx: TestContext) => {
          expect(localStorage.getItem(STORAGE_KEYS.SETTINGS_UPDATED_AT)).toBe(
            "2026-04-17T00:00:00.000Z",
          );
        },
      );
    },
  );

  // @spec-sync-protocol @FR2
  f.Scenario("Pull throws on failed response", ({ Given, When, Then }) => {
    Given(
      "server will respond to pull with ok false",
      async (_ctx: TestContext) => {
        syncAdapter = createMockSyncAdapter({
          pull: vi.fn().mockResolvedValue({ ok: false }),
        });
      },
    );

    When("pull is called", async (_ctx: TestContext) => {
      const service = createSyncService(syncAdapter, repositories);
      try {
        await service.pull();
      } catch (error) {
        pullError = error as Error;
      }
    });

    Then('pull throws "Pull failed"', async (_ctx: TestContext) => {
      expect(pullError).toBeDefined();
      expect(pullError?.message).toBe("Pull failed");
    });
  });

  // @spec-sync-protocol @FR5
  f.Scenario(
    "Settings updated_at tie-breaking when timestamps are equal",
    ({ Given, And, When, Then }) => {
      Given(
        'settings_updated_at in localStorage is "2026-04-10T00:00:00.000Z"',
        async (_ctx: TestContext) => {
          localStorage.setItem(
            STORAGE_KEYS.SETTINGS_UPDATED_AT,
            "2026-04-10T00:00:00.000Z",
          );
        },
      );

      And(
        'server will respond to pull with settings having updated_at "2026-04-10T00:00:00.000Z"',
        async (_ctx: TestContext) => {
          syncAdapter = createMockSyncAdapter({
            pull: vi.fn().mockResolvedValue(
              makePullResponse({
                settings: [
                  {
                    key: "setting1",
                    value: "v1",
                    updated_at: "2026-04-10T00:00:00.000Z" as ISOTimestamp,
                  },
                ],
              }),
            ),
          });
        },
      );

      When("pull is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.pull();
      });

      Then(
        'settings_updated_at in localStorage is "2026-04-10T00:00:00.000Z"',
        async (_ctx: TestContext) => {
          expect(localStorage.getItem(STORAGE_KEYS.SETTINGS_UPDATED_AT)).toBe(
            "2026-04-10T00:00:00.000Z",
          );
        },
      );
    },
  );

  // @spec-sync-protocol @FR5
  f.Scenario(
    "Settings updated_at not updated when pull returns no settings",
    ({ Given, And, When, Then }) => {
      Given(
        'settings_updated_at in localStorage is "2026-04-10T00:00:00.000Z"',
        async (_ctx: TestContext) => {
          localStorage.setItem(
            STORAGE_KEYS.SETTINGS_UPDATED_AT,
            "2026-04-10T00:00:00.000Z",
          );
        },
      );

      And(
        "server will respond to pull with empty settings array",
        async (_ctx: TestContext) => {
          syncAdapter = createMockSyncAdapter({
            pull: vi.fn().mockResolvedValue(makePullResponse({ settings: [] })),
          });
        },
      );

      When("pull is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.pull();
      });

      Then(
        'settings_updated_at in localStorage is "2026-04-10T00:00:00.000Z"',
        async (_ctx: TestContext) => {
          expect(localStorage.getItem(STORAGE_KEYS.SETTINGS_UPDATED_AT)).toBe(
            "2026-04-10T00:00:00.000Z",
          );
        },
      );
    },
  );

  // @spec-sync-protocol @FR2
  f.Scenario(
    "Pull dispatches sync_complete CustomEvent after applying records",
    ({ Given, When, Then }) => {
      const serverTasks = [makeTask()];
      let eventDispatched = false;

      Given(
        "server will respond to pull with tasks",
        async (_ctx: TestContext) => {
          syncAdapter = createMockSyncAdapter({
            pull: vi
              .fn()
              .mockResolvedValue(makePullResponse({ tasks: serverTasks })),
          });

          window.addEventListener("sync_complete", () => {
            eventDispatched = true;
          });
        },
      );

      When("pull is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.pull();
      });

      Then(
        "sync_complete CustomEvent is dispatched",
        async (_ctx: TestContext) => {
          expect(eventDispatched).toBe(true);
        },
      );
    },
  );
});
