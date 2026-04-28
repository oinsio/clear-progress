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
  UploadCoverRequest,
  UploadCoverResponse,
  UploadCoversRequest,
  UploadCoversResponse,
} from "../protocol";

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
