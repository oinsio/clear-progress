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

const API_TIMEOUT_MS = 30000;
const GAS_AUTH_ERROR_CODE = "UNAUTHORIZED";

export class ApiAuthError extends Error {
  constructor() {
    super("Authentication required: token is missing, expired, or invalid");
    this.name = "ApiAuthError";
  }
}

type GetAccessToken = () => string | null;

export class GasSyncAdapter implements SyncAdapter {
  private readonly url: string;
  private readonly getAccessToken: GetAccessToken;

  constructor(url: string, getAccessToken: GetAccessToken) {
    this.url = url;
    this.getAccessToken = getAccessToken;
  }

  private async request<TResponse>(body: object): Promise<TResponse> {
    const token = this.getAccessToken();
    if (!token) {
      throw new ApiAuthError();
    }

    const requestBody = { ...body, access_token: token };

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

      return parsed as TResponse;
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
    if (!isValidPingResponse(parsedResponse)) {
      throw new Error("Invalid response: not a valid ping response");
    }
    return parsedResponse;
  }

  async init(): Promise<InitResponse> {
    return this.request<InitResponse>({ action: "init" });
  }

  async pull(request: PullRequest): Promise<PullResponse> {
    return this.request<PullResponse>({ action: "pull", ...request });
  }

  async push(request: PushRequest): Promise<PushResponse> {
    return this.request<PushResponse>({ action: "push", ...request });
  }

  async uploadCover(request: UploadCoverRequest): Promise<UploadCoverResponse> {
    return this.request<UploadCoverResponse>({
      action: "upload_cover",
      ...request,
    });
  }

  async uploadCovers(
    request: UploadCoversRequest,
  ): Promise<UploadCoversResponse> {
    return this.request<UploadCoversResponse>({
      action: "upload_covers",
      ...request,
    });
  }

  async getCover(request: GetCoverRequest): Promise<GetCoverResponse> {
    return this.request<GetCoverResponse>({
      action: "get_cover",
      ...request,
    });
  }

  async deleteCover(request: DeleteCoverRequest): Promise<DeleteCoverResponse> {
    return this.request<DeleteCoverResponse>({
      action: "delete_cover",
      ...request,
    });
  }

  async purge(): Promise<PurgeResponse> {
    return this.request<PurgeResponse>({
      action: "purge",
      confirm: true,
    });
  }
}

function isValidPingResponse(data: unknown): data is PingResponse {
  if (typeof data !== "object" || data === null) return false;
  const record = data as Record<string, unknown>;
  return (
    typeof record.ok === "boolean" &&
    typeof record.app === "string" &&
    typeof record.version === "string" &&
    typeof record.initialized === "boolean"
  );
}
