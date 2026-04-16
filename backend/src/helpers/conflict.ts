import { CONFLICT_RESOLUTION } from './constants';

// Last-write-wins conflict resolution by updated_at

type ConflictResult = 'accept' | 'conflict';

export function resolveConflict(
  clientUpdatedAt: string,
  serverUpdatedAt: string
): ConflictResult {
  return new Date(clientUpdatedAt).getTime() >= new Date(serverUpdatedAt).getTime()
    ? CONFLICT_RESOLUTION.ACCEPT
    : CONFLICT_RESOLUTION.CONFLICT;
}