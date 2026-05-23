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
import type { ZodType } from "zod";

const API_TIMEOUT_MS = 30000;
const GAS_AUTH_ERROR_CODE = "UNAUTHORIZED";

type GetAccessToken = () => string | null;

export function createGasAdapter(
  url: string,
  getAccessToken: GetAccessToken,
): SyncAdapter {
  return new GasSyncAdapter(url, getAccessToken);
}

export class GasSyncAdapter implements SyncAdapter {
  private readonly url: string;
  private readonly getAccessToken: GetAccessToken;

  constructor(url: string, getAccessToken: GetAccessToken) {
    this.url = url;
    this.getAccessToken = getAccessToken;
  }

  private async request<TResponse>(
    body: object,
    schema: ZodType<TResponse>,
  ): Promise<TResponse> {
    const token = this.getAccessToken();
    if (!token) {
      throw new ApiAuthError();
    }

    const requestBody = { ...body, access_token: token };
    const action = (body as Record<string, unknown>).action as string;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const response = await fetch(this.url, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const parsed = (await response.json()) as Record<string, unknown>;
      if (parsed.error === GAS_AUTH_ERROR_CODE) {
        throw new ApiAuthError();
      }

      const result = schema.safeParse(parsed);
      if (!result.success) {
        throw new ApiValidationError(action, result.error);
      }

      return result.data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async ping(): Promise<PingResponse> {
    const response = await fetch(`${this.url}?action=ping`, {
      redirect: "follow",
    });
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    let parsedResponse: unknown;
    try {
      parsedResponse = await response.json();
    } catch {
      throw new Error("Invalid response: expected JSON");
    }
    const result = PingResponseSchema.safeParse(parsedResponse);
    if (!result.success) {
      throw new ApiValidationError("ping", result.error);
    }
    return result.data;
  }

  async init(): Promise<InitResponse> {
    return this.request({ action: "init" }, InitResponseSchema);
  }

  async pull(request: PullRequest): Promise<PullResponse> {
    return this.request({ action: "pull", ...request }, PullResponseSchema);
  }

  async push(request: PushRequest): Promise<PushResponse> {
    return this.request({ action: "push", ...request }, PushResponseSchema);
  }

  async uploadCover(request: UploadCoverRequest): Promise<UploadCoverResponse> {
    return this.request(
      { action: "upload_cover", ...request },
      UploadCoverResponseSchema,
    );
  }

  async uploadCovers(
    request: UploadCoversRequest,
  ): Promise<UploadCoversResponse> {
    return this.request(
      { action: "upload_covers", ...request },
      UploadCoversResponseSchema,
    );
  }

  async getCover(request: GetCoverRequest): Promise<GetCoverResponse> {
    return this.request(
      { action: "get_cover", ...request },
      GetCoverResponseSchema,
    );
  }

  async deleteCover(request: DeleteCoverRequest): Promise<DeleteCoverResponse> {
    return this.request(
      { action: "delete_cover", ...request },
      DeleteCoverResponseSchema,
    );
  }

  async purge(): Promise<PurgeResponse> {
    return this.request(
      { action: "purge", confirm: true },
      PurgeResponseSchema,
    );
  }
}
