import { describe, it, expect } from "vitest";
import { getDaysInMonth } from "./dateHelpers";

describe("getDaysInMonth", () => {
  it("should return 31 for January", () => {
    expect(getDaysInMonth(1)).toBe(31);
  });

  it("should return 29 for February", () => {
    expect(getDaysInMonth(2)).toBe(29);
  });

  it("should return 31 for March", () => {
    expect(getDaysInMonth(3)).toBe(31);
  });

  it("should return 30 for April", () => {
    expect(getDaysInMonth(4)).toBe(30);
  });

  it("should return 31 for May", () => {
    expect(getDaysInMonth(5)).toBe(31);
  });

  it("should return 30 for June", () => {
    expect(getDaysInMonth(6)).toBe(30);
  });

  it("should return 31 for July", () => {
    expect(getDaysInMonth(7)).toBe(31);
  });

  it("should return 31 for August", () => {
    expect(getDaysInMonth(8)).toBe(31);
  });

  it("should return 30 for September", () => {
    expect(getDaysInMonth(9)).toBe(30);
  });

  it("should return 31 for October", () => {
    expect(getDaysInMonth(10)).toBe(31);
  });

  it("should return 30 for November", () => {
    expect(getDaysInMonth(11)).toBe(30);
  });

  it("should return 31 for December", () => {
    expect(getDaysInMonth(12)).toBe(31);
  });

  it("should return 31 for invalid month number (0)", () => {
    expect(getDaysInMonth(0)).toBe(31);
  });

  it("should return 31 for invalid month number (13)", () => {
    expect(getDaysInMonth(13)).toBe(31);
  });

  it("should return 31 for invalid month number (-1)", () => {
    expect(getDaysInMonth(-1)).toBe(31);
  });
});
