export interface PurgeResponse {
	ok: boolean;
	purged: {
		tasks: number;
		goals: number;
		contexts: number;
		categories: number;
		checklist_items: number;
		ideas: number;
	};
	purge_revision: number;
}
