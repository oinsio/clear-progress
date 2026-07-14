// implements FR1-FR8 of rework-house-locale, FR1-FR9 of add-startrek-locale
// Shared pure helpers and content-rule constants for themed-locale BDD steps.
// Both house_locale.steps.ts and startrek_locale.helpers.ts build on this module
// so the identical flatten/placeholder/forbidden-key rules live in one place.

export const META_KEY_PREFIX = "_meta.";

// FR4: accessibility-only keys that must fall back to the base locale.
// Exception (allowed to be themed): deleted.restoreAriaLabel.
export const ACCESSIBILITY_ONLY_PREFIXES = ["alert.", "attachment.list."];
export const ACCESSIBILITY_ONLY_KEYS = [
  "attachment.lightbox.dialogLabel",
  "attachment.lightbox.close",
  "taskEdit.checkItemMark",
  "taskEdit.checkItemUnmark",
  "taskEdit.checkItemDelete",
  "taskEdit.dragChecklist",
  "taskEdit.checklistBadgeAriaLabel",
  "taskEdit.attachmentsBadgeAriaLabel",
  "settings.menuOrderDragHandle",
  "settings.menuOrderToggle",
  "settings.settingsAriaLabel",
  "settings.loginAriaLabel",
  "settings.avatarAlt",
  "sync.ariaLabel",
  "filter.closeSidebar",
];

// FR5: data-repair and configuration instructions that must stay literal.
export const REPAIR_AND_CONFIG_PREFIXES = [
  "sync.alert.",
  "settings.server.",
  "projectPausedDialog.",
  "auth.",
  "sidebar.",
];
export const REPAIR_AND_CONFIG_KEYS = [
  "repeat.ruleNotRecognized",
  "repeat.invalidRuleAlertTitle",
  "repeat.invalidRuleAlertMessage",
  "repeat.invalidRuleAlertFix",
];

const PLACEHOLDER_REGEX = /{{(\w+)}}/g;

// FR8: lowercase standalone «вы»/«ваш» forms are forbidden.
export const LOWERCASE_ADDRESS_REGEX =
  /(?<![а-яёА-ЯЁ])(вы|вас|вам|вами|ваш|ваша|ваше|ваши|вашу|вашего|вашей|ваших|вашем|вашим)(?![а-яё])/u;

export function flattenLocale(
  localeObject: Record<string, unknown>,
  prefix = "",
): Record<string, string> {
  const flatMap: Record<string, string> = {};
  for (const [key, value] of Object.entries(localeObject)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      Object.assign(
        flatMap,
        flattenLocale(value as Record<string, unknown>, fullKey),
      );
    } else {
      flatMap[fullKey] = String(value);
    }
  }
  return flatMap;
}

export function withoutMetaKeys(
  flatMap: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(flatMap).filter(([key]) => !key.startsWith(META_KEY_PREFIX)),
  );
}

export function extractPlaceholders(value: string): string[] {
  return [...value.matchAll(PLACEHOLDER_REGEX)]
    .map((placeholderMatch) => placeholderMatch[1])
    .sort();
}

export function isForbiddenKey(
  key: string,
  exactKeys: string[],
  prefixes: string[],
): boolean {
  return (
    exactKeys.includes(key) || prefixes.some((prefix) => key.startsWith(prefix))
  );
}
