import {
  SUPABASE_SETTINGS_ENDPOINT,
  SUPABASE_SETTINGS_TIMEOUT_MS,
} from "@/constants";

interface SupabaseSettingsResponse {
  external: Record<string, boolean>;
}

/**
 * Implements FR8, D1 of supabase-email-auth.
 * Describes available authentication methods for a Supabase project.
 */
export interface SupabaseAuthMethods {
  oauthProviders: string[];
  isEmailEnabled: boolean;
}

const NON_OAUTH_PROVIDERS = new Set(["email", "phone"]);

/**
 * Implements FR4, FR5 of add-supabase-ui.
 * Implements FR8, D1 of supabase-email-auth.
 * Fetches enabled auth methods from Supabase /auth/v1/settings endpoint.
 */
export async function fetchSupabaseProviders(
  url: string,
  anonKey: string,
): Promise<SupabaseAuthMethods> {
  const fetchPromise = fetch(`${url}${SUPABASE_SETTINGS_ENDPOINT}`, {
    headers: { apikey: anonKey },
  });

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    setTimeout(
      () => reject(new Error("Supabase settings request timed out")),
      SUPABASE_SETTINGS_TIMEOUT_MS,
    );
  });

  const response = await Promise.race([fetchPromise, timeoutPromise]);

  if (!response.ok) {
    throw new Error(
      `Supabase settings request failed with status ${response.status}`,
    );
  }

  const settings = (await response.json()) as SupabaseSettingsResponse;

  const oauthProviders = Object.entries(settings.external)
    .filter(
      ([provider, isEnabled]) =>
        isEnabled === true && !NON_OAUTH_PROVIDERS.has(provider),
    )
    .map(([provider]) => provider);

  const isEmailEnabled = settings.external.email;

  return { oauthProviders, isEmailEnabled };
}
