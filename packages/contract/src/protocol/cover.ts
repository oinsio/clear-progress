/** Implements FR4 of add-file-attachments */
export interface UploadFileRequest {
  goal_id: string;
  filename: string;
  mime_type: string;
  data: string; // base64
  data_hash: string;
}

/** Implements FR4 of add-file-attachments */
export interface UploadFileResponse {
  ok: boolean;
  data_hash: string;
  reused: boolean;
}

/** Implements FR4 of add-file-attachments */
export interface UploadFileBatchItem {
  local_id: string;
  goal_id: string;
  filename: string;
  mime_type: string;
  data: string; // base64
  data_hash: string;
}

/** Implements FR4 of add-file-attachments */
export interface UploadFilesRequest {
  files: UploadFileBatchItem[];
}

/** Implements FR4 of add-file-attachments */
export interface UploadFileBatchResult {
  local_id: string;
  goal_id: string;
  data_hash?: string;
  reused?: boolean;
  error?: string;
}

/** Implements FR4 of add-file-attachments */
export interface UploadFilesResponse {
  ok: boolean;
  results: UploadFileBatchResult[];
}

/** Implements FR4 of add-file-attachments */
export interface GetFileRequest {
  hashes: string[];
}

/** Implements FR4 of add-file-attachments */
export interface GetFileResult {
  hash: string;
  mime_type?: string;
  data?: string; // base64
  error?: string;
}

/** Implements FR4 of add-file-attachments */
export interface GetFileResponse {
  ok: boolean;
  files: GetFileResult[];
}

/** Implements FR7 of add-file-attachments */
export interface DeleteFileRequest {
  hash: string;
}

/** Implements FR4 of add-file-attachments */
export interface DeleteFileResponse {
  ok: boolean;
  deleted: boolean;
  ref_count: number;
}
