import type {
	PushResultStatus,
	WireCategory,
	WireChecklistItem,
	WireContext,
	WireGoal,
	WireIdea,
	WireSetting,
	WireTask,
} from "../domain";

export interface PushRequest {
	tasks?: WireTask[];
	goals?: WireGoal[];
	contexts?: WireContext[];
	categories?: WireCategory[];
	checklist_items?: WireChecklistItem[];
	ideas?: WireIdea[];
	settings?: WireSetting[];
}

export interface PushItemResult {
	id: string;
	status: PushResultStatus;
	server_record?:
		| WireTask
		| WireGoal
		| WireContext
		| WireCategory
		| WireIdea
		| WireChecklistItem;
	reason?: string;
}

export interface PushSettingResult {
	key: string;
	status: PushResultStatus;
	server_record?: WireSetting;
	reason?: string;
}

export interface PushResponse {
	ok: boolean;
	revision?: number;
	results: {
		tasks?: PushItemResult[];
		goals?: PushItemResult[];
		contexts?: PushItemResult[];
		categories?: PushItemResult[];
		checklist_items?: PushItemResult[];
		ideas?: PushItemResult[];
		settings?: PushSettingResult[];
	};
	server_time: string;
}
