import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSupabaseClient,
  destroySupabaseClient,
  getSupabaseClient,
} from "./supabaseClientManager";

// implements FR11, D2 of add-supabase-ui

const mockSupabaseClient = { auth: {}, functions: {} };

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

describe("supabaseClientManager", () => {
  beforeEach(() => {
    destroySupabaseClient();
  });

  describe("getSupabaseClient", () => {
    it("should throw when client is not initialized", () => {
      expect(() => getSupabaseClient()).toThrow(
        "Supabase client not initialized",
      );
    });

    it("should return the client after creation", () => {
      createSupabaseClient("https://test.supabase.co", "test-anon-key");

      const client = getSupabaseClient();

      expect(client).toBe(mockSupabaseClient);
    });
  });

  describe("createSupabaseClient", () => {
    it("should create and return a Supabase client", () => {
      const client = createSupabaseClient(
        "https://test.supabase.co",
        "test-anon-key",
      );

      expect(client).toBe(mockSupabaseClient);
    });

    it("should pass url and anonKey to createClient", async () => {
      const { createClient } = await import("@supabase/supabase-js");

      createSupabaseClient("https://test.supabase.co", "test-anon-key");

      expect(createClient).toHaveBeenCalledWith(
        "https://test.supabase.co",
        "test-anon-key",
      );
    });

    it("should replace previous client on subsequent calls", () => {
      createSupabaseClient("https://first.supabase.co", "key-1");
      const secondClient = createSupabaseClient(
        "https://second.supabase.co",
        "key-2",
      );

      expect(getSupabaseClient()).toBe(secondClient);
    });
  });

  describe("destroySupabaseClient", () => {
    it("should clear the client so getSupabaseClient throws", () => {
      createSupabaseClient("https://test.supabase.co", "test-anon-key");

      destroySupabaseClient();

      expect(() => getSupabaseClient()).toThrow(
        "Supabase client not initialized",
      );
    });

    it("should not throw when called without prior creation", () => {
      expect(() => destroySupabaseClient()).not.toThrow();
    });
  });
});
