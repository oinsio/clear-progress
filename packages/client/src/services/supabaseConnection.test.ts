import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import {
  SUPABASE_SETTINGS_ENDPOINT,
  SUPABASE_SETTINGS_TIMEOUT_MS,
} from "@/constants";
import { server } from "@/test/mocks/server";
import {
  fetchSupabaseProviders,
  type SupabaseAuthMethods,
} from "./supabaseConnection";

const SUPABASE_URL = "https://test-project.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-anon-key";

describe("fetchSupabaseProviders", () => {
  // implements FR4, FR5, NFR-P1 of add-supabase-ui
  // implements FR8, D1 of supabase-email-auth

  beforeEach(() => {
    server.resetHandlers();
  });

  it("should return OAuth providers and isEmailEnabled when email and OAuth are enabled", async () => {
    server.use(
      http.get(
        `${SUPABASE_URL}${SUPABASE_SETTINGS_ENDPOINT}`,
        ({ request }) => {
          expect(request.headers.get("apikey")).toBe(ANON_KEY);
          return HttpResponse.json({
            external: {
              google: true,
              github: true,
              gitlab: false,
              apple: false,
              email: true,
            },
          });
        },
      ),
    );

    const authMethods: SupabaseAuthMethods = await fetchSupabaseProviders(
      SUPABASE_URL,
      ANON_KEY,
    );

    expect(authMethods).toEqual({
      oauthProviders: ["google", "github"],
      isEmailEnabled: true,
    });
  });

  it("should return isEmailEnabled false when email is disabled", async () => {
    server.use(
      http.get(`${SUPABASE_URL}${SUPABASE_SETTINGS_ENDPOINT}`, () => {
        return HttpResponse.json({
          external: {
            google: true,
            email: false,
          },
        });
      }),
    );

    const authMethods = await fetchSupabaseProviders(SUPABASE_URL, ANON_KEY);

    expect(authMethods).toEqual({
      oauthProviders: ["google"],
      isEmailEnabled: false,
    });
  });

  it("should return only email enabled when no OAuth providers exist", async () => {
    server.use(
      http.get(`${SUPABASE_URL}${SUPABASE_SETTINGS_ENDPOINT}`, () => {
        return HttpResponse.json({
          external: {
            email: true,
            google: false,
            github: false,
          },
        });
      }),
    );

    const authMethods = await fetchSupabaseProviders(SUPABASE_URL, ANON_KEY);

    expect(authMethods).toEqual({
      oauthProviders: [],
      isEmailEnabled: true,
    });
  });

  it("should return empty providers and email disabled when nothing is enabled", async () => {
    server.use(
      http.get(`${SUPABASE_URL}${SUPABASE_SETTINGS_ENDPOINT}`, () => {
        return HttpResponse.json({
          external: {
            google: false,
            github: false,
            email: false,
          },
        });
      }),
    );

    const authMethods = await fetchSupabaseProviders(SUPABASE_URL, ANON_KEY);

    expect(authMethods).toEqual({
      oauthProviders: [],
      isEmailEnabled: false,
    });
  });

  it("should return isEmailEnabled false when email key is absent", async () => {
    server.use(
      http.get(`${SUPABASE_URL}${SUPABASE_SETTINGS_ENDPOINT}`, () => {
        return HttpResponse.json({
          external: {
            google: true,
          },
        });
      }),
    );

    const authMethods = await fetchSupabaseProviders(SUPABASE_URL, ANON_KEY);

    expect(authMethods).toEqual({
      oauthProviders: ["google"],
      isEmailEnabled: false,
    });
  });

  it("should throw on network error", async () => {
    server.use(
      http.get(`${SUPABASE_URL}${SUPABASE_SETTINGS_ENDPOINT}`, () => {
        return HttpResponse.error();
      }),
    );

    await expect(
      fetchSupabaseProviders(SUPABASE_URL, ANON_KEY),
    ).rejects.toThrow();
  });

  it("should throw with status code on non-OK HTTP response", async () => {
    server.use(
      http.get(`${SUPABASE_URL}${SUPABASE_SETTINGS_ENDPOINT}`, () => {
        return HttpResponse.json(
          { external: { google: true } },
          { status: 401 },
        );
      }),
    );

    await expect(
      fetchSupabaseProviders(SUPABASE_URL, ANON_KEY),
    ).rejects.toThrow("failed with status 401");
  });

  it(
    "should throw on timeout",
    async () => {
      server.use(
        http.get(`${SUPABASE_URL}${SUPABASE_SETTINGS_ENDPOINT}`, async () => {
          await new Promise((resolve) =>
            setTimeout(resolve, SUPABASE_SETTINGS_TIMEOUT_MS + 1000),
          );
          return HttpResponse.json({ external: {} });
        }),
      );

      await expect(
        fetchSupabaseProviders(SUPABASE_URL, ANON_KEY),
      ).rejects.toThrow("timed out");
    },
    SUPABASE_SETTINGS_TIMEOUT_MS + 3000,
  );

  it("should send apikey header with the provided anon key", async () => {
    let capturedApiKey: string | null = null;

    server.use(
      http.get(
        `${SUPABASE_URL}${SUPABASE_SETTINGS_ENDPOINT}`,
        ({ request }) => {
          capturedApiKey = request.headers.get("apikey");
          return HttpResponse.json({ external: { google: true } });
        },
      ),
    );

    await fetchSupabaseProviders(SUPABASE_URL, ANON_KEY);

    expect(capturedApiKey).toBe(ANON_KEY);
  });

  it("should exclude phone from OAuth providers", async () => {
    server.use(
      http.get(`${SUPABASE_URL}${SUPABASE_SETTINGS_ENDPOINT}`, () => {
        return HttpResponse.json({
          external: {
            google: true,
            phone: true,
            github: false,
          },
        });
      }),
    );

    const authMethods = await fetchSupabaseProviders(SUPABASE_URL, ANON_KEY);

    expect(authMethods).toEqual({
      oauthProviders: ["google"],
      isEmailEnabled: false,
    });
  });
});
