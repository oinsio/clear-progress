// implements FR5, FR6, FR7, D7 of configurable-sync-timing
import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_AUTO_SYNC_DELAY_SEC,
  DEFAULT_SYNC_INTERVAL_MIN,
  STORAGE_KEYS,
} from "@/constants";
import {
  getCachedAutoSyncDelay,
  getCachedSyncInterval,
} from "./syncTimingCache";

beforeEach(() => {
  localStorage.removeItem(STORAGE_KEYS.SYNC_INTERVAL);
  localStorage.removeItem(STORAGE_KEYS.AUTO_SYNC_DELAY);
});

describe("getCachedSyncInterval", () => {
  it("should return DEFAULT_SYNC_INTERVAL_MIN when localStorage is empty", () => {
    expect(getCachedSyncInterval()).toBe(DEFAULT_SYNC_INTERVAL_MIN);
  });

  it("should return cached value from localStorage", () => {
    localStorage.setItem(STORAGE_KEYS.SYNC_INTERVAL, "30");
    expect(getCachedSyncInterval()).toBe(30);
  });

  it("should return DEFAULT_SYNC_INTERVAL_MIN when localStorage throws", () => {
    const originalGetItem = localStorage.getItem.bind(localStorage);
    localStorage.getItem = () => {
      throw new Error("localStorage unavailable");
    };
    expect(getCachedSyncInterval()).toBe(DEFAULT_SYNC_INTERVAL_MIN);
    localStorage.getItem = originalGetItem;
  });

  it("should return null when localStorage has empty string cached (disabled)", () => {
    localStorage.setItem(STORAGE_KEYS.SYNC_INTERVAL, "");
    expect(getCachedSyncInterval()).toBeNull();
  });

  // FR7: a corrupted start-up cache must self-heal to the default instead of
  // feeding NaN/out-of-range timing to the sync engine.
  it("should return default and remove the entry for a non-numeric cached value", () => {
    localStorage.setItem(STORAGE_KEYS.SYNC_INTERVAL, "abc");
    expect(getCachedSyncInterval()).toBe(DEFAULT_SYNC_INTERVAL_MIN);
    expect(localStorage.getItem(STORAGE_KEYS.SYNC_INTERVAL)).toBeNull();
  });

  it("should return default and remove the entry for an out-of-range cached value", () => {
    localStorage.setItem(STORAGE_KEYS.SYNC_INTERVAL, "99999");
    expect(getCachedSyncInterval()).toBe(DEFAULT_SYNC_INTERVAL_MIN);
    expect(localStorage.getItem(STORAGE_KEYS.SYNC_INTERVAL)).toBeNull();
  });

  it("should return default for a non-integer cached value", () => {
    localStorage.setItem(STORAGE_KEYS.SYNC_INTERVAL, "2.5");
    expect(getCachedSyncInterval()).toBe(DEFAULT_SYNC_INTERVAL_MIN);
  });
});

describe("getCachedAutoSyncDelay", () => {
  it("should return DEFAULT_AUTO_SYNC_DELAY_SEC when localStorage is empty", () => {
    expect(getCachedAutoSyncDelay()).toBe(DEFAULT_AUTO_SYNC_DELAY_SEC);
  });

  it("should return cached value from localStorage", () => {
    localStorage.setItem(STORAGE_KEYS.AUTO_SYNC_DELAY, "60");
    expect(getCachedAutoSyncDelay()).toBe(60);
  });

  it("should return DEFAULT_AUTO_SYNC_DELAY_SEC when localStorage throws", () => {
    const originalGetItem = localStorage.getItem.bind(localStorage);
    localStorage.getItem = () => {
      throw new Error("localStorage unavailable");
    };
    expect(getCachedAutoSyncDelay()).toBe(DEFAULT_AUTO_SYNC_DELAY_SEC);
    localStorage.getItem = originalGetItem;
  });

  it('should return 0 when localStorage has empty string or "0" cached (immediate)', () => {
    localStorage.setItem(STORAGE_KEYS.AUTO_SYNC_DELAY, "");
    expect(getCachedAutoSyncDelay()).toBe(0);
    localStorage.setItem(STORAGE_KEYS.AUTO_SYNC_DELAY, "0");
    expect(getCachedAutoSyncDelay()).toBe(0);
  });

  // FR7: a corrupted start-up cache must self-heal to the default.
  it("should return default and remove the entry for a non-numeric cached value", () => {
    localStorage.setItem(STORAGE_KEYS.AUTO_SYNC_DELAY, "abc");
    expect(getCachedAutoSyncDelay()).toBe(DEFAULT_AUTO_SYNC_DELAY_SEC);
    expect(localStorage.getItem(STORAGE_KEYS.AUTO_SYNC_DELAY)).toBeNull();
  });

  it("should return default and remove the entry for an out-of-range cached value", () => {
    localStorage.setItem(STORAGE_KEYS.AUTO_SYNC_DELAY, "99999");
    expect(getCachedAutoSyncDelay()).toBe(DEFAULT_AUTO_SYNC_DELAY_SEC);
    expect(localStorage.getItem(STORAGE_KEYS.AUTO_SYNC_DELAY)).toBeNull();
  });

  it("should return default for a negative cached value", () => {
    localStorage.setItem(STORAGE_KEYS.AUTO_SYNC_DELAY, "-1");
    expect(getCachedAutoSyncDelay()).toBe(DEFAULT_AUTO_SYNC_DELAY_SEC);
  });
});
