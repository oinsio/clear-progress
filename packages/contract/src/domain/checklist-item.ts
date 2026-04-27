export interface WireChecklistItem {
	id: string;
	task_id: string;
	name: string;
	is_completed: boolean;
	sort_order: number;
	is_deleted: boolean;
	created_at: string;
	updated_at: string;
	version: number;
	revision: number;
}
