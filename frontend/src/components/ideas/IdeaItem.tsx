import type { Idea } from "@/types/entities";
import { useIsUnsynced } from "@/hooks/useIsUnsynced";
import { usePanelSide } from "@/hooks/usePanelSide";
import { cn } from "@/shared/lib/cn";
import React from "react";

interface IdeaItemProps {
  idea: Idea;
  nodeRef?: React.Ref<HTMLLIElement>;
  style?: React.CSSProperties;
  dragHandle?: React.ReactNode;
}

export function IdeaItem({ idea, nodeRef, style, dragHandle }: IdeaItemProps) {
  const isUnsynced = useIsUnsynced(idea);
  const { panelSide } = usePanelSide();

  return (
    <li
      ref={nodeRef}
      style={style}
      data-testid="idea-item"
      className={cn(
        panelSide === "left"
          ? "flex items-center border-b border-gray-100 bg-white border-l-2 transition-colors hover:bg-gray-50"
          : "flex items-center border-b border-gray-100 bg-white border-l-[4px] md:border-l-2 transition-colors hover:bg-gray-50",
        isUnsynced ? "border-l-amber-400" : "border-l-transparent",
      )}
    >
      {/* Drag handle (if provided) */}
      {dragHandle}

      {/* Main content */}
      <div className="flex flex-1 items-center gap-3 px-4 py-3 min-w-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 font-medium leading-snug break-words">
            {idea.name}
          </p>
        </div>
      </div>
    </li>
  );
}
