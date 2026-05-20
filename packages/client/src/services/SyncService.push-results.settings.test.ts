import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  asMock,
  createMockSyncAdapter,
  createService,
  makePushResponse,
  type SyncTestContext,
  setupSyncTestContext,
} from "./SyncService.test-helpers";

describe("SyncService — push results > settings", () => {
  let ctx: SyncTestContext;

  beforeEach(() => {
    ctx = setupSyncTestContext();
  });

  it("should clear needsSync on settings after accepted push response", async () => {
    const setting = {
      key: "accent_color",
      value: "green",
      updated_at: "",
      needsSync: true,
    };
    asMock(ctx.settingsRepository.getNeedingSync).mockResolvedValue([setting]);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi
        .fn()
        .mockResolvedValue(
          makePushResponse(
            { settings: [{ key: "accent_color", status: "accepted" }] },
            5,
          ),
        ),
    });
    const service = createService(ctx);

    await service.push();

    expect(ctx.settingsRepository.clearNeedsSyncByKey).toHaveBeenCalledWith([
      "accent_color",
    ]);
  });

  it("should clear needsSync on settings after created push response", async () => {
    const setting = {
      key: "default_box",
      value: "inbox",
      updated_at: "",
      needsSync: true,
    };
    asMock(ctx.settingsRepository.getNeedingSync).mockResolvedValue([setting]);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi
        .fn()
        .mockResolvedValue(
          makePushResponse(
            { settings: [{ key: "default_box", status: "created" }] },
            6,
          ),
        ),
    });
    const service = createService(ctx);

    await service.push();

    expect(ctx.settingsRepository.clearNeedsSyncByKey).toHaveBeenCalledWith([
      "default_box",
    ]);
  });

  it("should NOT clear needsSync on settings with conflict status", async () => {
    const setting = {
      key: "accent_color",
      value: "green",
      updated_at: "",
      needsSync: true,
    };
    asMock(ctx.settingsRepository.getNeedingSync).mockResolvedValue([setting]);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(
        makePushResponse({
          settings: [{ key: "accent_color", status: "conflict" }],
        }),
      ),
    });
    const service = createService(ctx);

    await service.push();

    expect(ctx.settingsRepository.clearNeedsSyncByKey).not.toHaveBeenCalled();
  });

  it("should not call apiClient.push when settings were cleared after previous sync", async () => {
    asMock(ctx.settingsRepository.getNeedingSync).mockResolvedValue([]);
    const service = createService(ctx);

    await service.push();

    expect(ctx.mockSyncAdapter.push).not.toHaveBeenCalled();
  });
});
