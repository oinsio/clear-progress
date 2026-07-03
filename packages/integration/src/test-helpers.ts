// implements FR6 of add-supabase-integration-tests
// Barrel re-export — actual code lives in focused modules.
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
