// implements FR1, D7 of add-supabase-integration-tests
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG_FILE_NAME = ".supabase-test-config.json";

export const CONFIG_FILE_PATH = join(__dirname, "..", CONFIG_FILE_NAME);

export interface SupabaseTestConfig {
  supabaseUrl: string;
  anonKey: string;
  serviceRoleKey: string;
}

export function readTestConfig(): SupabaseTestConfig {
  const rawContent = readFileSync(CONFIG_FILE_PATH, "utf-8");
  return JSON.parse(rawContent) as SupabaseTestConfig;
}

export function writeTestConfig(config: SupabaseTestConfig): void {
  writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export function deleteTestConfig(): void {
  if (existsSync(CONFIG_FILE_PATH)) {
    unlinkSync(CONFIG_FILE_PATH);
  }
}
