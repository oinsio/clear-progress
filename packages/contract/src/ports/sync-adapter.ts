import type {
	DeleteCoverResponse,
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
	getCover(fileIds: string[]): Promise<GetCoverResponse>;
	deleteCover(fileId: string, goalId: string): Promise<DeleteCoverResponse>;
	purge(): Promise<PurgeResponse>;
}
