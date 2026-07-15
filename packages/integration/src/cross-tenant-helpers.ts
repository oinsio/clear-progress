// implements FR7 of add-composite-tenant-pk
import { readTestConfig } from "./config.js";
import type { ServerCallCredentials } from "./server-api.js";

/** Strong password used for all isolated test users. */
const TEST_USER_PASSWORD = "IntegrationTest-Passw0rd!";

/** GoTrue admin endpoint for creating confirmed users. */
const ADMIN_USERS_ENDPOINT = "/auth/v1/admin/users";

/** GoTrue token endpoint using the password grant. */
const PASSWORD_GRANT_ENDPOINT = "/auth/v1/token?grant_type=password";

/** Edge Function that initializes a user's sync_meta counters. */
const INIT_ENDPOINT = "/functions/v1/init";

const CONTENT_TYPE_JSON = "application/json";

interface PasswordGrantResponse {
  access_token?: string;
}

/**
 * Provisions a fresh, isolated user via the GoTrue admin API and returns
 * ready-to-use server credentials. Each call creates an independent tenant,
 * enabling cross-tenant integration tests (two users pushing the same UUID).
 *
 * Implements FR7 of add-composite-tenant-pk.
 */
export async function createIsolatedUser(
  emailPrefix: string,
): Promise<ServerCallCredentials> {
  const { supabaseUrl, anonKey, serviceRoleKey } = readTestConfig();

  const email = `${emailPrefix}-${Date.now()}@example.com`;

  // 1. Admin-create a confirmed user.
  const createUserResponse = await fetch(
    `${supabaseUrl}${ADMIN_USERS_ENDPOINT}`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": CONTENT_TYPE_JSON,
      },
      body: JSON.stringify({
        email,
        password: TEST_USER_PASSWORD,
        email_confirm: true,
      }),
    },
  );
  if (!createUserResponse.ok) {
    throw new Error(
      `admin create user failed: ${createUserResponse.status} ${await createUserResponse.text()}`,
    );
  }

  // 2. Sign in via password grant to obtain an access token.
  const tokenResponse = await fetch(
    `${supabaseUrl}${PASSWORD_GRANT_ENDPOINT}`,
    {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": CONTENT_TYPE_JSON,
      },
      body: JSON.stringify({ email, password: TEST_USER_PASSWORD }),
    },
  );
  if (!tokenResponse.ok) {
    throw new Error(
      `password grant failed: ${tokenResponse.status} ${await tokenResponse.text()}`,
    );
  }
  const { access_token: accessToken } =
    (await tokenResponse.json()) as PasswordGrantResponse;
  if (!accessToken) {
    throw new Error("password grant response missing access_token");
  }

  // 3. Initialize the user's sync counters (creates sync_meta rows).
  const initResponse = await fetch(`${supabaseUrl}${INIT_ENDPOINT}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
      "Content-Type": CONTENT_TYPE_JSON,
    },
    body: JSON.stringify({}),
  });
  if (!initResponse.ok) {
    throw new Error(
      `init failed: ${initResponse.status} ${await initResponse.text()}`,
    );
  }

  return { accessToken, supabaseUrl, anonKey };
}
