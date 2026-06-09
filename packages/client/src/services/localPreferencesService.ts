// implements FR1-FR5, FR7, FR18, FR19 of localstorage-refactor

import type { ZodType } from "zod";

const LOG_PREFIX = "[LocalPreferences]";
const BOOLEAN_TRUE = "true";
const BOOLEAN_FALSE = "false";
const VALID_BOOLEAN_VALUES = [BOOLEAN_TRUE, BOOLEAN_FALSE] as const;

// --- Config types (discriminated union) ---

export type EnumConfig<T extends string> = {
  type: "enum";
  key: string;
  values: readonly T[];
  defaultValue: T;
};

export type BooleanConfig = {
  type: "boolean";
  key: string;
  defaultValue: boolean;
};

export type NumberConfig = {
  type: "number";
  key: string;
  defaultValue: number;
};

export type JsonConfig<T> = {
  type: "json";
  key: string;
  schema: ZodType<T>;
  defaultValue: T;
};

export type PreferenceConfig<T> =
  | EnumConfig<T & string>
  | BooleanConfig
  | NumberConfig
  | JsonConfig<T>;

// --- Self-healing helper ---

function selfHeal(key: string, reason: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // localStorage unavailable — nothing to clean up
  }
  console.warn(`${LOG_PREFIX} Corrupted "${key}": ${reason}, reset to default`);
}

// --- Parsers per config type ---

function parseEnum<T extends string>(
  rawValue: string,
  config: EnumConfig<T>,
): T | undefined {
  const validValues = config.values as readonly string[];
  if (validValues.includes(rawValue)) {
    return rawValue as T;
  }
  selfHeal(config.key, `"${rawValue}" is not in [${config.values.join(", ")}]`);
  return undefined;
}

function parseBoolean(
  rawValue: string,
  config: BooleanConfig,
): boolean | undefined {
  if ((VALID_BOOLEAN_VALUES as readonly string[]).includes(rawValue)) {
    return rawValue === BOOLEAN_TRUE;
  }
  selfHeal(config.key, `"${rawValue}" is not a valid boolean`);
  return undefined;
}

function parseNumber(
  rawValue: string,
  config: NumberConfig,
): number | undefined {
  const parsed = parseFloat(rawValue);
  if (!Number.isNaN(parsed)) {
    return parsed;
  }
  selfHeal(config.key, `"${rawValue}" is not a valid number`);
  return undefined;
}

function parseJson<T>(rawValue: string, config: JsonConfig<T>): T | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    selfHeal(config.key, "invalid JSON");
    return undefined;
  }
  const zodResult = config.schema.safeParse(parsed);
  if (zodResult.success) {
    return zodResult.data;
  }
  selfHeal(config.key, `Zod validation failed: ${zodResult.error.message}`);
  return undefined;
}

// --- Core functions ---

/** FR1: Read preference from localStorage with validation and self-healing. */
export function getPreference<T>(config: PreferenceConfig<T>): T {
  let rawValue: string | null;
  try {
    rawValue = localStorage.getItem(config.key);
  } catch {
    return config.defaultValue as T;
  }

  if (rawValue === null) {
    return config.defaultValue as T;
  }

  let parsedValue: unknown;
  switch (config.type) {
    case "enum":
      parsedValue = parseEnum(rawValue, config);
      break;
    case "boolean":
      parsedValue = parseBoolean(rawValue, config);
      break;
    case "number":
      parsedValue = parseNumber(rawValue, config);
      break;
    case "json":
      parsedValue = parseJson(rawValue, config);
      break;
  }

  return (parsedValue !== undefined ? parsedValue : config.defaultValue) as T;
}

/** FR2: Write preference to localStorage with optional custom serializer. */
export function setPreference(
  key: string,
  value: unknown,
  serialize: (value: unknown) => string = String,
): void {
  try {
    localStorage.setItem(key, serialize(value));
  } catch {
    // FR5: silently no-op when localStorage is unavailable
  }
}

/** FR3: Remove preference from localStorage. */
export function removePreference(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // FR5: silently no-op when localStorage is unavailable
  }
}

/** FR18: Read-only access to synced settings cached in localStorage. */
export const readCached = getPreference;

/** FR19: Update localStorage cache for synced settings after IndexedDB load. */
export const syncCache = setPreference;
