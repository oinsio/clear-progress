import { CONFLICT_RESOLUTION } from "./constants";

// Last-write-wins conflict resolution by updated_at

type ConflictResult = "accept" | "conflict";

export function resolveConflict(
  clientUpdatedAt: string,
  serverUpdatedAt: string,
): ConflictResult {
  const clientTime = new Date(clientUpdatedAt).getTime();
  const serverTime = new Date(serverUpdatedAt).getTime();

  if (Number.isNaN(clientTime) || Number.isNaN(serverTime)) {
    throw new Error(
      `Invalid timestamp format: client=${clientUpdatedAt}, server=${serverUpdatedAt}`,
    );
  }

  return clientTime >= serverTime
    ? CONFLICT_RESOLUTION.ACCEPT
    : CONFLICT_RESOLUTION.CONFLICT;
}
