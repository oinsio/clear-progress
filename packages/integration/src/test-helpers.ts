// implements FR6 of add-supabase-integration-tests
// Barrel re-export — actual code lives in focused modules.

export type { ConvergenceEntityKey } from "./convergence-helpers.js";
export {
  assertConverged,
  dumpDeviceState,
  dumpServerState,
} from "./convergence-helpers.js";
export { createIsolatedUser } from "./cross-tenant-helpers.js";
export {
  buildCategoryPayload,
  buildChecklistPayload,
  buildContextPayload,
  buildGoalPayload,
  buildTaskPayload,
  type TaskPayloadOptions,
} from "./cross-tenant-payloads.js";
export type { AuthenticatedContext } from "./page-lifecycle.js";
export {
  closeAuthenticatedPage,
  createAuthenticatedPage,
} from "./page-lifecycle.js";
export type {
  PushResponse,
  RefCountPullResponse,
  ServerCallCredentials,
  UploadFileBatchResultItem,
  UploadFileResponse,
  UploadFilesResponse,
} from "./server-api.js";
export {
  findServerAttachmentForTask,
  getFileFromServer,
  pullFromServer,
  purgeOnServer,
  pushToServer,
  uploadFilesToServer,
  uploadFileToServer,
} from "./server-api.js";
export { triggerSyncAndWait } from "./sync-helpers.js";
export {
  createMinimalPng,
  setupSingleDeviceTest,
  setupTwoDeviceTest,
} from "./test-setup.js";
