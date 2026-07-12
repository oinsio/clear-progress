export type FlatMap = Record<string, string>; // "a.b.c" -> value

export interface LocaleData {
  code: string; // "en" | "ru" | "house" | ...
  baseLanguage: string; // from _meta
  flat: FlatMap; // without _meta
  baseKeys: Set<string>; // keys after plural suffix normalization
}

export interface ScanResult {
  literalKeys: Set<string>; // "task.cancel", "goal.status.in_progress"
  dynamicPrefixes: Set<string>; // "repeat.month", "goal.status." — from `...${}`
  literalKeysTestOnly: Set<string>; // keys found ONLY in test files
}

export type CheckKind = "undefined" | "unused" | "parity" | "override-orphans";

export interface CheckError {
  kind: CheckKind;
  key: string;
  detail: string; // human-readable explanation
}
