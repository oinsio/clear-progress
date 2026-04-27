export interface UploadCoverRequest {
	goal_id: string;
	filename: string;
	mime_type: string;
	data: string; // base64
	data_hash: string;
}

export interface UploadCoverResponse {
	ok: boolean;
	file_id: string;
	reused: boolean;
}

export interface UploadCoverBatchItem {
	local_id: string;
	goal_id: string;
	filename: string;
	mime_type: string;
	data: string; // base64
}

export interface UploadCoverBatchResult {
	local_id: string;
	goal_id: string;
	file_id?: string;
	reused?: boolean;
	error?: string;
}

export interface UploadCoversRequest {
	covers: UploadCoverBatchItem[];
}

export interface UploadCoversResponse {
	ok: boolean;
	results: UploadCoverBatchResult[];
}

export interface GetCoverResult {
	file_id: string;
	mime_type?: string;
	data?: string;
	error?: string;
}

export interface GetCoverResponse {
	ok: boolean;
	covers: GetCoverResult[];
}

export interface DeleteCoverResponse {
	ok: boolean;
	deleted: boolean;
	ref_count: number;
}
