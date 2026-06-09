// implements FR6, FR7 of localstorage-refactor
import { CollapsedSectionsSchema } from "@clear-progress/contract";
import { useCallback } from "react";
import { STORAGE_KEYS } from "@/constants";
import { usePreference } from "@/hooks/usePreference";

const DEFAULT_COLLAPSED_SECTIONS: Record<string, boolean> = {};

export interface UseSectionCollapseReturn {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export function useSectionCollapse(
  sectionKey: string,
): UseSectionCollapseReturn {
  const [sections, setSections] = usePreference<Record<string, boolean>>({
    type: "json",
    key: STORAGE_KEYS.SECTION_COLLAPSE,
    schema: CollapsedSectionsSchema,
    defaultValue: DEFAULT_COLLAPSED_SECTIONS,
  });

  const isCollapsed = sections[sectionKey] ?? false;

  const toggleCollapse = useCallback(() => {
    setSections({ ...sections, [sectionKey]: !isCollapsed });
  }, [sections, setSections, sectionKey, isCollapsed]);

  return { isCollapsed, toggleCollapse };
}
