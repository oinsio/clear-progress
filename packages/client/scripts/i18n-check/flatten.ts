import type { FlatMap } from "./types";

const PLURAL_RE = /_(one|two|few|many|other|zero)$/;
const ORDINAL_RE = /_ordinal_(one|two|few|many|other|zero)$/;

export function flatten(obj: object, prefix = ""): FlatMap {
  const out: FlatMap = {};
  for (const [key, value] of Object.entries(obj)) {
    const flatKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object") {
      Object.assign(out, flatten(value, flatKey));
    } else {
      out[flatKey] = String(value);
    }
  }
  return out;
}

/** "repeat.everyNDays_few" -> "repeat.everyNDays";
 *  "repeat.yearlyDate_ordinal_two" -> "repeat.yearlyDate" */
export function toBaseKey(key: string): string {
  return key.replace(ORDINAL_RE, "").replace(PLURAL_RE, "");
}

export function toBaseKeySet(flat: FlatMap): Set<string> {
  return new Set(Object.keys(flat).map(toBaseKey));
}
