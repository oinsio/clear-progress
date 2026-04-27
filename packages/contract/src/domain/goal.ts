import type { GoalStatus } from "./common";

export interface WireGoal {
	id: string;
	name: string;
	description: string;
	cover_file_id: string;
	status: GoalStatus;
	sort_order: number;
	is_deleted: boolean;
	created_at: string;
	updated_at: string;
	version: number;
	revision: number;
}
