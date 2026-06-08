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
  UploadFileRequest,
  UploadFileResponse,
  UploadFilesRequest,
  UploadFilesResponse,
} from "../protocol";

/** Implements FR4 of add-file-attachments */
export interface SyncAdapter {
  ping(): Promise<PingResponse>;
  init(): Promise<InitResponse>;
  pull(request: PullRequest): Promise<PullResponse>;
  push(request: PushRequest): Promise<PushResponse>;
  uploadFile(request: UploadFileRequest): Promise<UploadFileResponse>;
  uploadFiles(request: UploadFilesRequest): Promise<UploadFilesResponse>;
  getFile(request: GetFileRequest): Promise<GetFileResponse>;
  deleteFile(request: DeleteFileRequest): Promise<DeleteFileResponse>;
  purge(): Promise<PurgeResponse>;
}
