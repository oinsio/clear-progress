// implements FR8 of add-supabase-ui
// implements FR4 of add-file-attachments
import type {
  DeleteFileRequest,
  DeleteFileResponse,
  GetFileRequest,
  GetFileResponse,
  InitResponse,
  PingResponse,
  PullRequest,
  PullResponse,
  PurgeResponse,
  PushRequest,
  PushResponse,
  SyncAdapter,
  UploadFileRequest,
  UploadFileResponse,
  UploadFilesRequest,
  UploadFilesResponse,
} from "@clear-progress/contract";
import {
  ApiAuthError,
  ApiValidationError,
  DeleteFileResponseSchema,
  GetFileResponseSchema,
  InitResponseSchema,
  PingResponseSchema,
  ProjectPausedError,
  PullResponseSchema,
  PurgeResponseSchema,
  PushResponseSchema,
  UploadFileResponseSchema,
  UploadFilesResponseSchema,
} from "@clear-progress/contract";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ZodType } from "zod";

const HTTP_STATUS_UNAUTHORIZED = 401;
const HTTP_STATUS_PROJECT_PAUSED = 540;

// implements FR8 of add-supabase-ui
export class SupabaseSyncAdapter implements SyncAdapter {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  private async invoke<TResponse>(
    functionName: string,
    body: object,
    schema: ZodType<TResponse>,
  ): Promise<TResponse> {
    const { data, error } = await this.client.functions.invoke(functionName, {
      body,
    });

    if (error) {
      if (this.isAuthError(error)) {
        throw new ApiAuthError();
      }
      // implements FR1 of fix-project-paused
      if (this.isProjectPaused(error)) {
        throw new ProjectPausedError();
      }
      const errorMessage =
        typeof error === "object" && "message" in error
          ? (error as { message: string }).message
          : String(error);
      throw new Error(errorMessage);
    }

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new ApiValidationError(functionName, result.error);
    }

    return result.data;
  }

  private isAuthError(error: unknown): boolean {
    if (typeof error !== "object") return false;
    const errorObj = error as Record<string, unknown>;
    if (errorObj.status === HTTP_STATUS_UNAUTHORIZED) return true;
    const context = errorObj.context;
    return (
      typeof context === "object" &&
      context !== null &&
      (context as Record<string, unknown>).status === HTTP_STATUS_UNAUTHORIZED
    );
  }

  // implements FR1 of fix-project-paused
  private isProjectPaused(error: unknown): boolean {
    if (typeof error !== "object" || error === null) return false;
    const context = (error as Record<string, unknown>).context;
    return (
      typeof context === "object" &&
      context !== null &&
      (context as Record<string, unknown>).status === HTTP_STATUS_PROJECT_PAUSED
    );
  }

  async ping(): Promise<PingResponse> {
    return this.invoke("ping", {}, PingResponseSchema);
  }

  async init(): Promise<InitResponse> {
    return this.invoke("init", {}, InitResponseSchema);
  }

  async pull(request: PullRequest): Promise<PullResponse> {
    return this.invoke("pull", request, PullResponseSchema);
  }

  async push(request: PushRequest): Promise<PushResponse> {
    return this.invoke("push", request, PushResponseSchema);
  }

  async uploadFile(request: UploadFileRequest): Promise<UploadFileResponse> {
    return this.invoke("upload-file", request, UploadFileResponseSchema);
  }

  async uploadFiles(request: UploadFilesRequest): Promise<UploadFilesResponse> {
    return this.invoke("upload-files", request, UploadFilesResponseSchema);
  }

  async getFile(request: GetFileRequest): Promise<GetFileResponse> {
    return this.invoke("get-file", request, GetFileResponseSchema);
  }

  async deleteFile(request: DeleteFileRequest): Promise<DeleteFileResponse> {
    return this.invoke("delete-file", request, DeleteFileResponseSchema);
  }

  async purge(): Promise<PurgeResponse> {
    return this.invoke("purge", {}, PurgeResponseSchema);
  }
}

// implements FR9 of add-supabase-ui
export function createSupabaseAdapter(
  supabaseClient: SupabaseClient,
): SyncAdapter {
  return new SupabaseSyncAdapter(supabaseClient);
}
