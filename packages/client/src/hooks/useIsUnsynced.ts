export function useIsUnsynced(entity: { syncStatus: string }): boolean {
  return entity.syncStatus !== "synced";
}
