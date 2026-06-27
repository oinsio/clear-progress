/** Implements FR1, FR6, FR7, FR11, NFR-A1, NFR-A3, UX1, UX2 of settings-page-reordering */

import { ChevronDown, ChevronRight } from "lucide-react";
import type React from "react";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { STORAGE_KEYS } from "@/constants";

const DEFAULT_STORAGE_KEY_PREFIX = "settings-accordion";
const PANEL_ID_SUFFIX = "-panel";
const TOGGLE_KEYS = new Set(["Enter", " "]);

export interface SettingsAccordionSection {
  id: string;
  titleKey: string;
  icon: ReactNode;
  children: ReactNode;
}

export interface SettingsAccordionProps {
  sections: SettingsAccordionSection[];
  storageKeyPrefix?: string;
  initialExpandedSection?: string | null;
}

function buildStorageKey(prefix: string): string {
  return `${STORAGE_KEYS.SECTION_COLLAPSE}:${prefix}-expanded`;
}

function readPersistedSection(
  storageKey: string,
  validIds: Set<string>,
): string | null {
  const stored = localStorage.getItem(storageKey);
  if (stored && validIds.has(stored)) {
    return stored;
  }
  return null;
}

/** Implements FR11, FR12, FR13 of settings-page-reordering */
export function SettingsAccordion({
  sections,
  storageKeyPrefix = DEFAULT_STORAGE_KEY_PREFIX,
  initialExpandedSection,
}: SettingsAccordionProps) {
  const { t } = useTranslation();

  const storageKey = useMemo(
    () => buildStorageKey(storageKeyPrefix),
    [storageKeyPrefix],
  );

  const validSectionIds = useMemo(
    () => new Set(sections.map((section) => section.id)),
    [sections],
  );

  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(
    () => {
      if (initialExpandedSection !== undefined) return initialExpandedSection;
      return readPersistedSection(storageKey, validSectionIds);
    },
  );

  const handleToggle = useCallback(
    (sectionId: string) => {
      const nextId = sectionId === expandedSectionId ? null : sectionId;
      setExpandedSectionId(nextId);
      if (nextId === null) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, nextId);
      }
    },
    [expandedSectionId, storageKey],
  );

  const handleKeyDown = useCallback(
    (sectionId: string, event: React.KeyboardEvent) => {
      if (TOGGLE_KEYS.has(event.key)) {
        event.preventDefault();
        handleToggle(sectionId);
      }
    },
    [handleToggle],
  );

  return (
    <div data-testid="settings-accordion">
      {sections.map((section) => {
        const isExpanded = section.id === expandedSectionId;
        const panelId = `${section.id}${PANEL_ID_SUFFIX}`;

        return (
          <div
            key={section.id}
            className="border-b border-neutral-200 dark:border-neutral-700"
          >
            <div
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              aria-controls={panelId}
              data-testid={`accordion-header-${section.id}`}
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800"
              onClick={() => handleToggle(section.id)}
              onKeyDown={(event) => handleKeyDown(section.id, event)}
            >
              {isExpanded ? (
                <ChevronDown
                  className="h-4 w-4 shrink-0"
                  data-testid="chevron-down"
                />
              ) : (
                <ChevronRight
                  className="h-4 w-4 shrink-0"
                  data-testid="chevron-right"
                />
              )}
              <span className="shrink-0">{section.icon}</span>
              <span className="font-medium">{t(section.titleKey)}</span>
            </div>

            {isExpanded && (
              <div
                id={panelId}
                role="region"
                className="overflow-hidden transition-all duration-200 ease-in-out"
              >
                <div className="px-4 pb-4">{section.children}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
