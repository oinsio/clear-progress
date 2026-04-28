import { beforeEach, describe, expect, it, vi } from "vitest";
import { TOKEN_EXPIRY_BUFFER_S } from "@/constants";
import { Temporal } from "@/lib/temporal";
import {
  getAccessToken,
  setAccessToken,
  shouldRefreshToken,
} from "./tokenManager";

describe("tokenManager", () => {
  beforeEach(() => {
    localStorage.clear();
    setAccessToken(null);
    vi.clearAllMocks();
  });

  describe("setAccessToken", () => {
    it("should set token and calculate both expiration times", () => {
      const now = Temporal.Now.instant().epochMilliseconds;
      const expiresIn = 3600;

      setAccessToken("test-token", expiresIn);

      expect(getAccessToken()).toBe("test-token");
      expect(localStorage.getItem("access_token")).toBe("test-token");

      const storedExpiresAt = Number(
        localStorage.getItem("access_token_expires_at"),
      );
      expect(storedExpiresAt).toBeGreaterThanOrEqual(now + expiresIn * 1000);
      expect(storedExpiresAt).toBeLessThanOrEqual(now + expiresIn * 1000 + 100);
    });

    it("should clear token when called with null", () => {
      setAccessToken("test-token", 3600);
      setAccessToken(null);

      expect(getAccessToken()).toBeNull();
      expect(localStorage.getItem("access_token")).toBeNull();
      expect(localStorage.getItem("access_token_expires_at")).toBeNull();
    });

    it("should store real expiration time in localStorage", () => {
      const now = Temporal.Now.instant().epochMilliseconds;
      const expiresIn = 3600;

      setAccessToken("test-token", expiresIn);

      const storedExpiresAt = Number(
        localStorage.getItem("access_token_expires_at"),
      );
      const expectedExpiresAt = now + expiresIn * 1000;

      expect(storedExpiresAt).toBeGreaterThanOrEqual(expectedExpiresAt);
      expect(storedExpiresAt).toBeLessThanOrEqual(expectedExpiresAt + 100);
    });
  });

  describe("getAccessToken", () => {
    it("should return token if not expired", () => {
      const expiresIn = 3600;
      setAccessToken("test-token", expiresIn);

      expect(getAccessToken()).toBe("test-token");
    });

    it("should return token even if in buffer zone (before real expiration)", () => {
      const now = Temporal.Now.instant().epochMilliseconds;
      const expiresIn = 100;

      setAccessToken("test-token", expiresIn);

      vi.spyOn(Temporal.Now, "instant").mockReturnValue({
        epochMilliseconds:
          now + (expiresIn - TOKEN_EXPIRY_BUFFER_S + 10) * 1000,
      } as Temporal.Instant);

      expect(getAccessToken()).toBe("test-token");
    });

    it("should return null if token expired", () => {
      const now = Temporal.Now.instant().epochMilliseconds;
      const expiresIn = 100;

      setAccessToken("test-token", expiresIn);

      vi.spyOn(Temporal.Now, "instant").mockReturnValue({
        epochMilliseconds: now + (expiresIn + 10) * 1000,
      } as Temporal.Instant);

      expect(getAccessToken()).toBeNull();
    });

    it("should return null if no token set", () => {
      expect(getAccessToken()).toBeNull();
    });
  });

  describe("shouldRefreshToken", () => {
    it("should return false if token not set", () => {
      expect(shouldRefreshToken()).toBe(false);
    });

    it("should return false if before refresh time", () => {
      const expiresIn = 3600;
      setAccessToken("test-token", expiresIn);

      expect(shouldRefreshToken()).toBe(false);
    });

    it("should return true if after refresh time but before expiration", () => {
      const now = Temporal.Now.instant().epochMilliseconds;
      const expiresIn = 100;

      setAccessToken("test-token", expiresIn);

      vi.spyOn(Temporal.Now, "instant").mockReturnValue({
        epochMilliseconds:
          now + (expiresIn - TOKEN_EXPIRY_BUFFER_S + 10) * 1000,
      } as Temporal.Instant);

      expect(shouldRefreshToken()).toBe(true);
      expect(getAccessToken()).toBe("test-token");
    });

    it("should return true if token expired", () => {
      const now = Temporal.Now.instant().epochMilliseconds;
      const expiresIn = 100;

      setAccessToken("test-token", expiresIn);

      vi.spyOn(Temporal.Now, "instant").mockReturnValue({
        epochMilliseconds: now + (expiresIn + 10) * 1000,
      } as Temporal.Instant);

      expect(shouldRefreshToken()).toBe(true);
    });
  });
});
