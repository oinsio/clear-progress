// implements FR1, D2, D3, D7 of add-supabase-integration-tests
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { writeTestConfig } from "./config.js";
import { setStartedEnvironment } from "./environment-store.js";
import {
  getKongPort,
  startSupabaseEnvironment,
} from "./supabase-environment.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ENV_FILE_PATH = join(__dirname, "..", ".env.test");
const PING_FUNCTION_PATH = "/functions/v1/ping";
const EDGE_FUNCTIONS_RETRY_INTERVAL_MS = 2000;
const EDGE_FUNCTIONS_MAX_RETRIES = 15;

function parseEnvFile(filePath: string): Record<string, string> {
  const lines = readFileSync(filePath, "utf-8").split("\n");
  return lines.reduce<Record<string, string>>((accumulator, line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) return accumulator;
    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex === -1) return accumulator;
    const key = trimmedLine.substring(0, separatorIndex).trim();
    const value = trimmedLine.substring(separatorIndex + 1).trim();
    return { ...accumulator, [key]: value };
  }, {});
}

async function waitForEdgeFunctions(
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<void> {
  let lastStatus = 0;
  let lastBody = "";
  for (let attempt = 1; attempt <= EDGE_FUNCTIONS_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${supabaseUrl}${PING_FUNCTION_PATH}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      });
      lastStatus = response.status;
      lastBody = await response.text();
      if (response.ok) {
        return;
      }
      console.log(
        `[global-setup] Edge Functions attempt ${attempt}: ${lastStatus} ${lastBody.substring(0, 200)}`,
      );
    } catch (error) {
      console.log(
        `[global-setup] Edge Functions attempt ${attempt}: ${String(error)}`,
      );
    }
    await new Promise((resolve) =>
      setTimeout(resolve, EDGE_FUNCTIONS_RETRY_INTERVAL_MS),
    );
  }
  throw new Error(
    `Edge Functions not ready after ${EDGE_FUNCTIONS_MAX_RETRIES} retries. Last: ${lastStatus} ${lastBody}`,
  );
}

export default async function globalSetup(): Promise<void> {
  const envVars = parseEnvFile(ENV_FILE_PATH);
  const anonKey = envVars["ANON_KEY"] ?? "";
  const serviceRoleKey = envVars["SERVICE_ROLE_KEY"] ?? "";

  const environment = await startSupabaseEnvironment();
  setStartedEnvironment(environment);

  const kongPort = getKongPort(environment);
  const supabaseUrl = `http://localhost:${kongPort}`;

  // Wait for Edge Functions to be ready (no healthcheck in docker-compose)
  // service_role key bypasses JWT verification — no user token needed
  await waitForEdgeFunctions(supabaseUrl, serviceRoleKey);

  writeTestConfig({
    supabaseUrl,
    anonKey,
    serviceRoleKey,
  });
}
