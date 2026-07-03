/**
 * Shape of the pull response that includes tasks, goals, and attachments.
 * Used to type-narrow pullFromServer results in attachment/purge tests.
 */
export interface RefCountPullResponse {
  ok: boolean;
  tasks: Array<{ id: string; name: string; is_deleted: boolean }>;
  goals: Array<{
    id: string;
    name: string;
    cover_hash: string;
    is_deleted: boolean;
  }>;
  attachments: Array<{
    id: string;
    entity_type: string;
    entity_id: string;
    data_hash: string;
    filename: string;
    mime_type: string;
    is_deleted: boolean;
  }>;
}

/**
 * Credentials needed to call Supabase Edge Functions directly from Node.js.
 */
export interface ServerCallCredentials {
  accessToken: string;
  supabaseUrl: string;
  anonKey: string;
}

/** Entity array keys returned by the pull endpoint. */
const PULL_ENTITY_KEYS = [
  "tasks",
  "goals",
  "ideas",
  "contexts",
  "categories",
  "checklist_items",
  "attachments",
  "settings",
] as const;

/** Shape of a single pull response page from the server. */
interface PullPageResponse {
  ok: boolean;
  has_more: boolean;
  current_revision: number;
  cursors?: Record<string, { revision: number; last_id: string }>;
  [key: string]: unknown;
}

/**
 * Calls the pull Edge Function, automatically paginating when has_more is true.
 * Aggregates entity arrays across all pages into a single response.
 * Implements FR1 of fix-pull-pagination.
 * Generic parameter T lets each test file narrow the response type.
 */
export async function pullFromServer<T = Record<string, unknown>>(
  credentials: ServerCallCredentials,
  sinceRevision: number = 0,
): Promise<T> {
  const aggregated: Record<string, unknown[]> = {};
  for (const key of PULL_ENTITY_KEYS) {
    aggregated[key] = [];
  }

  let currentSinceRevision = sinceRevision;
  let currentCursors:
    | Record<string, { revision: number; last_id: string }>
    | undefined;
  let lastPage: PullPageResponse | undefined;

  do {
    const requestBody: Record<string, unknown> = {
      since_revision: currentSinceRevision,
    };
    if (currentCursors) {
      requestBody.cursors = currentCursors;
    }

    const response = await fetch(
      `${credentials.supabaseUrl}/functions/v1/pull`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          apikey: credentials.anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );
    if (!response.ok) {
      throw new Error(
        `pull failed: ${response.status} ${await response.text()}`,
      );
    }

    const pageData = (await response.json()) as PullPageResponse;
    lastPage = pageData;

    for (const key of PULL_ENTITY_KEYS) {
      const pageEntities = pageData[key];
      if (Array.isArray(pageEntities)) {
        (aggregated[key] as unknown[]).push(...pageEntities);
      }
    }

    if (pageData.has_more) {
      currentSinceRevision = pageData.current_revision;
      currentCursors = pageData.cursors;
    }
  } while (lastPage?.has_more);

  return {
    ...lastPage,
    ...aggregated,
  } as T;
}

/**
 * Response shape from the push Edge Function.
 * Implements FR1 of fix-pull-pagination.
 */
export interface PushResponse {
  ok: boolean;
  results: Record<string, unknown[]>;
  revision?: number;
}

/**
 * Calls the push Edge Function to send records to the server.
 * Implements FR1 of fix-pull-pagination.
 */
export async function pushToServer(
  credentials: ServerCallCredentials,
  payload: Record<string, unknown[]>,
): Promise<PushResponse> {
  const response = await fetch(`${credentials.supabaseUrl}/functions/v1/push`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
      apikey: credentials.anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`push failed: ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as PushResponse;
}

/**
 * Calls the get-file Edge Function to retrieve file data by hash.
 * Implements FR4 of add-file-attachments.
 */
export async function getFileFromServer(
  credentials: ServerCallCredentials,
  hashes: string[],
): Promise<{
  ok: boolean;
  files: Array<{
    hash: string;
    mime_type?: string;
    data?: string;
    error?: string;
  }>;
}> {
  const response = await fetch(
    `${credentials.supabaseUrl}/functions/v1/get-file`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        apikey: credentials.anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ hashes }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `get-file failed: ${response.status} ${await response.text()}`,
    );
  }
  return (await response.json()) as {
    ok: boolean;
    files: Array<{
      hash: string;
      mime_type?: string;
      data?: string;
      error?: string;
    }>;
  };
}

/**
 * Calls the purge Edge Function to hard-delete is_deleted=true records
 * and clean up orphaned files.
 * Implements FR17 of add-file-attachments.
 */
export async function purgeOnServer(
  credentials: ServerCallCredentials,
): Promise<{
  ok: boolean;
  purged: Record<string, number>;
  purge_revision: number;
}> {
  const response = await fetch(
    `${credentials.supabaseUrl}/functions/v1/purge`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        apikey: credentials.anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );
  if (!response.ok) {
    throw new Error(
      `purge failed: ${response.status} ${await response.text()}`,
    );
  }
  return (await response.json()) as {
    ok: boolean;
    purged: Record<string, number>;
    purge_revision: number;
  };
}

// Re-export upload helpers from dedicated module
export type {
  UploadFileBatchResultItem,
  UploadFileResponse,
  UploadFilesResponse,
} from "./upload-api.js";
export { uploadFilesToServer, uploadFileToServer } from "./upload-api.js";

/**
 * Pulls data from server and finds the first non-deleted attachment
 * belonging to a task identified by name.
 * Returns the task and attachment records for further assertions.
 */
export async function findServerAttachmentForTask(
  credentials: ServerCallCredentials,
  taskName: string,
): Promise<{
  pullResponse: RefCountPullResponse;
  serverTask: RefCountPullResponse["tasks"][number];
  serverAttachment: RefCountPullResponse["attachments"][number];
}> {
  const pullResponse = await pullFromServer<RefCountPullResponse>(credentials);
  if (!pullResponse.ok) {
    throw new Error("pull response not ok");
  }

  const serverTask = pullResponse.tasks.find(
    (task) => task.name === taskName && !task.is_deleted,
  );
  if (!serverTask) {
    throw new Error(`Task "${taskName}" not found on server`);
  }

  const serverAttachment = pullResponse.attachments.find(
    (attachment) =>
      attachment.entity_id === serverTask.id && !attachment.is_deleted,
  );
  if (!serverAttachment) {
    throw new Error(`No attachment found for task "${taskName}" on server`);
  }

  return { pullResponse, serverTask, serverAttachment };
}
