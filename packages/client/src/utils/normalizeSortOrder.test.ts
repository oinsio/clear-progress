import { describe, expect, it } from "vitest";
import { normalizeSortOrder } from "./normalizeSortOrder";

/**
 * Implements FR1 of fractional-sort-order
 *
 * When pulling data from the server, sort_order may come as a number
 * (INTEGER in DB) while the client uses string keys. This normalizer
 * converts numeric sort_order to string.
 */
describe("normalizeSortOrder", () => {
  it("should convert numeric sort_order to string", () => {
    const record = { id: "r1", sort_order: 5, name: "test" };

    const normalized = normalizeSortOrder(record);

    expect(normalized.sort_order).toBe("5");
    expect(typeof normalized.sort_order).toBe("string");
  });

  it("should leave string sort_order unchanged", () => {
    const record = { id: "r2", sort_order: "a0", name: "test" };

    const normalized = normalizeSortOrder(record);

    expect(normalized.sort_order).toBe("a0");
  });

  it("should preserve all other fields", () => {
    const record = {
      id: "r3",
      sort_order: 42,
      name: "preserved",
      is_deleted: false,
    };

    const normalized = normalizeSortOrder(record);

    expect(normalized.id).toBe("r3");
    expect(normalized.name).toBe("preserved");
    expect(normalized.is_deleted).toBe(false);
    expect(normalized.sort_order).toBe("42");
  });

  it("should convert zero sort_order to string", () => {
    const record = { id: "r4", sort_order: 0 };

    const normalized = normalizeSortOrder(record);

    expect(normalized.sort_order).toBe("0");
  });

  it("should convert negative sort_order to string", () => {
    const record = { id: "r5", sort_order: -1 };

    const normalized = normalizeSortOrder(record);

    expect(normalized.sort_order).toBe("-1");
  });
});
