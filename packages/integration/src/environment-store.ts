// implements D2 of add-supabase-integration-tests
// Shared module-level store so global-setup and global-teardown share the same
// DockerComposeEnvironment instance within the same Playwright process.
import type { StartedDockerComposeEnvironment } from "testcontainers";

let startedEnvironment: StartedDockerComposeEnvironment | null = null;

export function setStartedEnvironment(
  environment: StartedDockerComposeEnvironment,
): void {
  startedEnvironment = environment;
}

export function getStartedEnvironment(): StartedDockerComposeEnvironment | null {
  return startedEnvironment;
}

export function clearStartedEnvironment(): void {
  startedEnvironment = null;
}
