export interface UploadCoverRequest {
  goal_id: string;
  filename: string;
  mime_type: string;
  data: string; // base64
  data_hash: string;
}

// implements FR2 of content-addressable-covers
export interface UploadCoverResponse {
  ok: boolean;
  data_hash: string;
  reused: boolean;
}

export interface UploadCoverBatchItem {
  local_id: string;
  goal_id: string;
  filename: string;
  mime_type: string;
  data: string; // base64
  data_hash: string;
}

export interface UploadCoversRequest {
  covers: UploadCoverBatchItem[];
}

export interface UploadCoverBatchResult {
  local_id: string;
  goal_id: string;
  data_hash?: string;
  reused?: boolean;
  error?: string;
}

export interface UploadCoversResponse {
  ok: boolean;
  results: UploadCoverBatchResult[];
}

// implements FR3 of content-addressable-covers
export interface GetCoverRequest {
  hashes: string[];
}

export interface GetCoverResult {
  hash: string;
  mime_type?: string;
  data?: string; // base64
  error?: string;
}

// implements FR3 of content-addressable-covers
export interface GetCoverResponse {
  ok: boolean;
  covers: GetCoverResult[];
}

// implements FR4 of content-addressable-covers
export interface DeleteCoverRequest {
  hash: string;
  goal_id: string;
}

export interface DeleteCoverResponse {
  ok: boolean;
  deleted: boolean;
  ref_count: number;
}
