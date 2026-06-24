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

/**
 * Calls the pull Edge Function and returns the full dataset (since_revision=0).
 * Generic parameter T lets each test file narrow the response type.
 */
export async function pullFromServer<T = Record<string, unknown>>(
  credentials: ServerCallCredentials,
): Promise<T> {
  const response = await fetch(`${credentials.supabaseUrl}/functions/v1/pull`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
      apikey: credentials.anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ since_revision: 0 }),
  });
  if (!response.ok) {
    throw new Error(`pull failed: ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as T;
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
