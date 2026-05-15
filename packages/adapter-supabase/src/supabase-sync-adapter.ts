// implements FR1, FR6 of add-supabase-adapter
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
import type { ZodType } from "zod";

const API_TIMEOUT_MS = 30000;

type GetAccessToken = () => string | null;

export class ApiAuthError extends Error {
  constructor() {
    super("Authentication required: token is missing, expired, or invalid");
    this.name = "ApiAuthError";
  }
}

export class ApiValidationError extends Error {
  constructor(endpoint: string, cause: unknown) {
    super(`Invalid API response for "${endpoint}"`);
    this.name = "ApiValidationError";
    this.cause = cause;
  }
}

// implements FR1 of add-supabase-adapter
export class SupabaseSyncAdapter implements SyncAdapter {
  private readonly url: string;
  private readonly getAccessToken: GetAccessToken;

  constructor(url: string, getAccessToken: GetAccessToken) {
    this.url = url;
    this.getAccessToken = getAccessToken;
  }

  private async request<TResponse>(
    endpoint: string,
    body: object,
    schema: ZodType<TResponse>,
  ): Promise<TResponse> {
    const token = this.getAccessToken();
    if (!token) {
      throw new ApiAuthError();
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.url}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (response.status === 401) {
        throw new ApiAuthError();
      }

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const parsed = (await response.json()) as unknown;
      const result = schema.safeParse(parsed);
      if (!result.success) {
        throw new ApiValidationError(endpoint, result.error);
      }

      return result.data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // implements FR6 of add-supabase-adapter
  async ping(): Promise<PingResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.url}/ping`, {
        method: "GET",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const parsed = (await response.json()) as unknown;
      const result = PingResponseSchema.safeParse(parsed);
      if (!result.success) {
        throw new ApiValidationError("ping", result.error);
      }

      return result.data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async init(): Promise<InitResponse> {
    return this.request("init", {}, InitResponseSchema);
  }

  async pull(request: PullRequest): Promise<PullResponse> {
    return this.request("pull", request, PullResponseSchema);
  }

  async push(request: PushRequest): Promise<PushResponse> {
    return this.request("push", request, PushResponseSchema);
  }

  async uploadCover(request: UploadCoverRequest): Promise<UploadCoverResponse> {
    return this.request("upload-cover", request, UploadCoverResponseSchema);
  }

  async uploadCovers(
    request: UploadCoversRequest,
  ): Promise<UploadCoversResponse> {
    return this.request("upload-covers", request, UploadCoversResponseSchema);
  }

  async getCover(request: GetCoverRequest): Promise<GetCoverResponse> {
    return this.request("get-cover", request, GetCoverResponseSchema);
  }

  async deleteCover(request: DeleteCoverRequest): Promise<DeleteCoverResponse> {
    return this.request("delete-cover", request, DeleteCoverResponseSchema);
  }

  async purge(): Promise<PurgeResponse> {
    return this.request("purge", {}, PurgeResponseSchema);
  }
}
