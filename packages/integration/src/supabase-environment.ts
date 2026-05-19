// implements FR1, D2, D6 of add-supabase-integration-tests

import { dirname, join } from "path";
import {
  DockerComposeEnvironment,
  type StartedDockerComposeEnvironment,
  Wait,
} from "testcontainers";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const COMPOSE_FILE_DIR = join(__dirname, "..");
const COMPOSE_FILE_NAME = "docker-compose.yml";
const ENV_FILE_PATH = join(COMPOSE_FILE_DIR, ".env.test");

// docker compose v2 names containers as <project>-<service>-<index>
// parseComposeContainerName strips the /<project>_ prefix, leaving <service>-<index>
const KONG_CONTAINER_NAME = "kong-1";
const KONG_INTERNAL_PORT = 8000;
const STARTUP_TIMEOUT_MS = 120_000;

export async function startSupabaseEnvironment(): Promise<StartedDockerComposeEnvironment> {
  return (
    new DockerComposeEnvironment(COMPOSE_FILE_DIR, COMPOSE_FILE_NAME)
      .withEnvironmentFile(ENV_FILE_PATH)
      // Wait.forHttp would fail: Kong returns 404 on "/" (no route).
      // forHealthCheck() waits for docker's built-in healthcheck ("kong health") to pass.
      .withWaitStrategy(KONG_CONTAINER_NAME, Wait.forHealthCheck())
      .withStartupTimeout(STARTUP_TIMEOUT_MS)
      .up()
  );
}

export function getKongPort(
  environment: StartedDockerComposeEnvironment,
): number {
  return environment
    .getContainer(KONG_CONTAINER_NAME)
    .getMappedPort(KONG_INTERNAL_PORT);
}
