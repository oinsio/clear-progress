export function getIdOrThrow(map: Map<string, string>, key: string): string {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(`Key "${key}" not found in test ID map`);
  }
  return value;
}
