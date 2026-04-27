import type { PullRequest, PullResponse } from "../protocol";
import type { PushRequest, PushResponse } from "../protocol";
import type { PingResponse, InitResponse } from "../protocol";
import type {
  UploadCoverRequest,
  UploadCoverResponse,
  UploadCoversRequest,
  UploadCoversResponse,
  GetCoverRequest,
  GetCoverResponse,
  DeleteCoverRequest,
  DeleteCoverResponse,
} from "../protocol";
import type { PurgeResponse } from "../protocol";

export interface SyncAdapter {
  ping(): Promise<PingResponse>;
  init(): Promise<InitResponse>;
  pull(request: PullRequest): Promise<PullResponse>;
  push(request: PushRequest): Promise<PushResponse>;
  uploadCover(request: UploadCoverRequest): Promise<UploadCoverResponse>;
  uploadCovers(request: UploadCoversRequest): Promise<UploadCoversResponse>;
  getCover(request: GetCoverRequest): Promise<GetCoverResponse>;
  deleteCover(request: DeleteCoverRequest): Promise<DeleteCoverResponse>;
  purge(): Promise<PurgeResponse>;
}
