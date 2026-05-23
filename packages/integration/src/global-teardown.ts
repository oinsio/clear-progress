// implements D2 of add-supabase-integration-tests
import { deleteTestConfig } from "./config.js";
import {
  clearStartedEnvironment,
  getStartedEnvironment,
} from "./environment-store.js";

export default async function globalTeardown(): Promise<void> {
  const environment = getStartedEnvironment();
  if (environment) {
    await environment.down({ removeVolumes: true });
    clearStartedEnvironment();
  }
  deleteTestConfig();
}
