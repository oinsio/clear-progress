// implements FR8 of add-supabase-ui
import type {
  DeleteCoverRequest,
  DeleteCoverResponse,
  GetCoverRequest,
  GetCoverResponse,
  InitResponse,
  PingResponse,
  PullRequest,
  PullResponse,
  PurgeResponse,
  PushRequest,
  PushResponse,
  SyncAdapter,
  UploadCoverRequest,
  UploadCoverResponse,
  UploadCoversRequest,
  UploadCoversResponse,
} from "@clear-progress/contract";
import {
  ApiAuthError,
  ApiValidationError,
  DeleteCoverResponseSchema,
  GetCoverResponseSchema,
  InitResponseSchema,
  PingResponseSchema,
  PullResponseSchema,
  PurgeResponseSchema,
  PushResponseSchema,
  UploadCoverResponseSchema,
  UploadCoversResponseSchema,
} from "@clear-progress/contract";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ZodType } from "zod";

const HTTP_STATUS_UNAUTHORIZED = 401;

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
    // Get a fresh session token. getSession() returns cached data — the token
    // may be expired. If expired or close to expiry, force a refresh first.
    const { data: sessionData } = await this.client.auth.getSession();
    if (!sessionData?.session?.access_token) {
      throw new ApiAuthError();
    }

    let accessToken = sessionData.session.access_token;
    const expiresAt = sessionData.session.expires_at;
    const isExpiredOrExpiringSoon =
      expiresAt !== undefined && expiresAt - Math.floor(Date.now() / 1000) < 30;
    if (isExpiredOrExpiringSoon) {
      const { data: refreshData, error: refreshError } =
        await this.client.auth.refreshSession();
      if (refreshError || !refreshData.session?.access_token) {
        throw new ApiAuthError();
      }
      accessToken = refreshData.session.access_token;
    }

    // Explicitly pass the access token in headers to bypass the SDK's internal
    // token resolution which may fall back to the anon key.
    const { data, error } = await this.client.functions.invoke(functionName, {
      body,
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (error) {
      if (this.isAuthError(error)) {
        throw new ApiAuthError();
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

  async uploadCover(request: UploadCoverRequest): Promise<UploadCoverResponse> {
    return this.invoke("upload-cover", request, UploadCoverResponseSchema);
  }

  async uploadCovers(
    request: UploadCoversRequest,
  ): Promise<UploadCoversResponse> {
    return this.invoke("upload-covers", request, UploadCoversResponseSchema);
  }

  async getCover(request: GetCoverRequest): Promise<GetCoverResponse> {
    return this.invoke("get-cover", request, GetCoverResponseSchema);
  }

  async deleteCover(request: DeleteCoverRequest): Promise<DeleteCoverResponse> {
    return this.invoke("delete-cover", request, DeleteCoverResponseSchema);
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
