// implements FR1-FR9 of add-startrek-locale
// Star Trek-specific helpers and content-rule constants for the locale BDD steps.
// Shared flatten/placeholder/forbidden-key rules live in locale_content.helpers.ts;
// this module re-exports them so startrek_locale.steps.ts has a single import source.
// Kept in a separate module so startrek_locale.steps.ts stays within the file-size cap.

export {
  ACCESSIBILITY_ONLY_KEYS,
  ACCESSIBILITY_ONLY_PREFIXES,
  extractPlaceholders,
  flattenLocale,
  isForbiddenKey,
  LOWERCASE_ADDRESS_REGEX,
  META_KEY_PREFIX,
  REPAIR_AND_CONFIG_KEYS,
  REPAIR_AND_CONFIG_PREFIXES,
  withoutMetaKeys,
} from "./locale_content.helpers";

// FR9: themed sync strings may exceed the base value by at most this many chars.
export const SYNC_LENGTH_BUDGET = 10;
export const SYNC_KEY_PREFIX = "sync.";

// FR8: a capitalized «Капитан…» form is only allowed at the very start of the
// string or immediately after sentence-ending punctuation (`.`/`!`/`?` + space).
// Any other capitalized «Капитан…» is a mid-sentence violation.
const CAPTAIN_ADDRESS_REGEX = /Капитан[а-яё]*/gu;
const SENTENCE_END_BEFORE_REGEX = /[.!?]\s$/u;

// FR8: returns true if the value uses a capitalized «Капитан…» mid-sentence,
// i.e. not at string start and not right after sentence-ending punctuation.
export function hasMidSentenceCapitalizedCaptain(value: string): boolean {
  for (const captainMatch of value.matchAll(CAPTAIN_ADDRESS_REGEX)) {
    const matchIndex = captainMatch.index ?? 0;
    if (matchIndex === 0) continue; // sentence-initial — allowed
    const precedingText = value.slice(0, matchIndex);
    if (SENTENCE_END_BEFORE_REGEX.test(precedingText)) continue; // new sentence
    return true;
  }
  return false;
}
