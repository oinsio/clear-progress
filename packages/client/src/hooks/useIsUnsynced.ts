export function useIsUnsynced(entity: { needsSync: boolean }): boolean {
  return entity.needsSync;
}
