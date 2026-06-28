import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ISOTimestamp } from "@/types/entities";
import {
  createMockSyncAdapter,
  createService,
  makePullResponse,
  type SyncTestContext,
  setupSyncTestContext,
} from "./SyncService.test-helpers";

describe("SyncService — pull settings_updated_at", () => {
  let ctx: SyncTestContext;

  beforeEach(() => {
    ctx = setupSyncTestContext();
  });

  it("should send settings_updated_at from localStorage to apiClient.pull", async () => {
    localStorage.setItem("settings_updated_at", "2026-04-15T10:00:00.000Z");
    const service = createService(ctx);

    await service.pull();

    expect(ctx.mockSyncAdapter.pull).toHaveBeenCalledWith({
      since_revision: 0,
      settings_updated_at: "2026-04-15T10:00:00.000Z",
    });
  });

  it("should not send settings_updated_at when localStorage is empty", async () => {
    localStorage.removeItem("settings_updated_at");
    const service = createService(ctx);

    await service.pull();

    expect(ctx.mockSyncAdapter.pull).toHaveBeenCalledWith({
      since_revision: 0,
    });
  });

  it("should update settings_updated_at in localStorage after receiving settings", async () => {
    localStorage.removeItem("settings_updated_at");
    const serverSettings = [
      {
        key: "default_box",
        value: "inbox",
        updated_at: "2026-04-10T00:00:00.000Z" as ISOTimestamp,
        syncStatus: "synced" as const,
      },
      {
        key: "accent_color",
        value: "green",
        updated_at: "2026-04-16T00:00:00.000Z" as ISOTimestamp,
        syncStatus: "synced" as const,
      },
    ];
    ctx.mockSyncAdapter = createMockSyncAdapter({
      pull: vi
        .fn()
        .mockResolvedValue(makePullResponse({ settings: serverSettings })),
    });
    const service = createService(ctx);

    await service.pull();

    expect(localStorage.getItem("settings_updated_at")).toBe(
      "2026-04-16T00:00:00.000Z",
    );
  });

  it("should not update settings_updated_at when settings array is empty", async () => {
    localStorage.setItem("settings_updated_at", "2026-04-15T10:00:00.000Z");
    ctx.mockSyncAdapter = createMockSyncAdapter({
      pull: vi.fn().mockResolvedValue(makePullResponse({ settings: [] })),
    });
    const service = createService(ctx);

    await service.pull();

    expect(localStorage.getItem("settings_updated_at")).toBe(
      "2026-04-15T10:00:00.000Z",
    );
  });

  it("should update settings_updated_at to max updated_at from received settings", async () => {
    localStorage.setItem("settings_updated_at", "2026-04-10T00:00:00.000Z");
    const serverSettings = [
      {
        key: "setting1",
        value: "value1",
        updated_at: "2026-04-12T00:00:00.000Z" as ISOTimestamp,
        syncStatus: "synced" as const,
      },
      {
        key: "setting2",
        value: "value2",
        updated_at: "2026-04-17T00:00:00.000Z" as ISOTimestamp,
        syncStatus: "synced" as const,
      },
      {
        key: "setting3",
        value: "value3",
        updated_at: "2026-04-14T00:00:00.000Z" as ISOTimestamp,
        syncStatus: "synced" as const,
      },
    ];
    ctx.mockSyncAdapter = createMockSyncAdapter({
      pull: vi
        .fn()
        .mockResolvedValue(makePullResponse({ settings: serverSettings })),
    });
    const service = createService(ctx);

    await service.pull();

    expect(localStorage.getItem("settings_updated_at")).toBe(
      "2026-04-17T00:00:00.000Z",
    );
  });

  it("should keep settings_updated_at from localStorage when all server settings are older", async () => {
    localStorage.setItem("settings_updated_at", "2026-05-01T00:00:00.000Z");
    const serverSettings = [
      {
        key: "setting1",
        value: "value1",
        updated_at: "2026-04-10T00:00:00.000Z" as ISOTimestamp,
        syncStatus: "synced" as const,
      },
    ];
    ctx.mockSyncAdapter = createMockSyncAdapter({
      pull: vi
        .fn()
        .mockResolvedValue(makePullResponse({ settings: serverSettings })),
    });
    const service = createService(ctx);

    await service.pull();

    expect(localStorage.getItem("settings_updated_at")).toBe(
      "2026-05-01T00:00:00.000Z",
    );
  });

  it("should handle two settings with equal updated_at without error", async () => {
    localStorage.removeItem("settings_updated_at");
    const sharedTimestamp = "2026-04-15T10:00:00.000Z" as ISOTimestamp;
    const serverSettings = [
      {
        key: "s1",
        value: "a",
        updated_at: sharedTimestamp,
        syncStatus: "synced" as const,
      },
      {
        key: "s2",
        value: "b",
        updated_at: sharedTimestamp,
        syncStatus: "synced" as const,
      },
    ];
    ctx.mockSyncAdapter = createMockSyncAdapter({
      pull: vi
        .fn()
        .mockResolvedValue(makePullResponse({ settings: serverSettings })),
    });
    const service = createService(ctx);

    await service.pull();

    expect(localStorage.getItem("settings_updated_at")).toBe(sharedTimestamp);
  });

  it("should keep first timestamp when two settings represent the same instant with different precision", async () => {
    localStorage.removeItem("settings_updated_at");
    // Both represent the same instant, but with different string formats.
    // Temporal.Instant.compare returns 0 (equal), so the first value must be kept.
    const withMilliseconds = "2026-04-15T10:00:00.000Z" as ISOTimestamp;
    const withoutMilliseconds = "2026-04-15T10:00:00Z" as ISOTimestamp;
    const serverSettings = [
      {
        key: "s1",
        value: "a",
        updated_at: withMilliseconds,
        syncStatus: "synced" as const,
      },
      {
        key: "s2",
        value: "b",
        updated_at: withoutMilliseconds,
        syncStatus: "synced" as const,
      },
    ];
    ctx.mockSyncAdapter = createMockSyncAdapter({
      pull: vi
        .fn()
        .mockResolvedValue(makePullResponse({ settings: serverSettings })),
    });
    const service = createService(ctx);

    await service.pull();

    expect(localStorage.getItem("settings_updated_at")).toBe(withMilliseconds);
  });
});
